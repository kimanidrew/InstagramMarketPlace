import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const { id } = await context.params;
  const prisma = db();
  const campaign = await prisma.aiPromotionCampaign.findFirst({ where: { id, userId: current.id } });
  if (!campaign) return NextResponse.json({ error: "Promotion not found." }, { status: 404 });
  if (!["DRAFT", "QUEUED", "PLANNING", "GENERATING", "RENDERING"].includes(campaign.status)) {
    return NextResponse.json({ error: "This promotion can no longer be cancelled." }, { status: 409 });
  }
  let cancelled = false;
  await prisma.$transaction(async (tx) => {
    const changed = await tx.aiPromotionCampaign.updateMany({
      where: { id, userId: current.id, status: { in: ["DRAFT", "QUEUED", "PLANNING", "GENERATING", "RENDERING"] } },
      data: { status: "CANCELLED", errorCode: null, errorMessage: null },
    });
    if (changed.count !== 1) return;
    cancelled = true;
    await tx.aiPromotionJob.updateMany({ where: { campaignId: id, status: { in: ["QUEUED", "RUNNING", "RETRY_WAIT"] } }, data: { status: "CANCELLED", errorCode: "CANCELLED_BY_SELLER", leaseExpiresAt: null } });
    const reservationKey = "reserve:" + id;
    const releaseKey = "release:" + id;
    const [reservation, release, charge] = await Promise.all([
      tx.aiPromotionCreditLedger.findUnique({ where: { idempotencyKey: reservationKey } }),
      tx.aiPromotionCreditLedger.findUnique({ where: { idempotencyKey: releaseKey } }),
      tx.aiPromotionCreditLedger.findUnique({ where: { idempotencyKey: "charge:" + id } }),
    ]);
    if (reservation && !release && !charge) {
      const wallet = await tx.aiPromotionCreditWallet.findUnique({ where: { userId: current.id } });
      if (wallet && wallet.reservedCredits > 0) {
        await tx.aiPromotionCreditWallet.update({ where: { id: wallet.id }, data: { reservedCredits: { decrement: 1 }, availableCredits: { increment: 1 } } });
        await tx.aiPromotionCreditLedger.create({
          data: { userId: current.id, walletId: wallet.id, campaignId: id, entryType: "RELEASE", amount: 1, idempotencyKey: releaseKey, description: "Cinematic credit released after seller cancellation" },
        });
      }
    }
  });
  if (!cancelled) return NextResponse.json({ error: "This promotion can no longer be cancelled." }, { status: 409 });
  return NextResponse.json({ ok: true, status: "CANCELLED" });
}
