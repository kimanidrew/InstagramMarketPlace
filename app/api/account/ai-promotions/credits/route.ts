import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const prisma = db();
  const starterCredits = Math.max(0, Math.min(20, Number(process.env.AI_PROMOTION_STARTER_CREDITS || 2) || 0));
  const wallet = await prisma.$transaction(async (tx) => {
    const existing = await tx.aiPromotionCreditWallet.findUnique({ where: { userId: current.id } });
    if (existing) return existing;
    const created = await tx.aiPromotionCreditWallet.create({
      data: { userId: current.id, availableCredits: starterCredits, lifetimeGranted: starterCredits },
    });
    if (starterCredits > 0) {
      await tx.aiPromotionCreditLedger.create({
        data: {
          userId: current.id, walletId: created.id, entryType: "GRANT", amount: starterCredits,
          idempotencyKey: `starter-grant:${current.id}`, description: "Initial AI Promotion Studio credits",
        },
      });
    }
    return created;
  }).catch(async (error) => {
    // Concurrent first requests can race on the unique userId; re-read the winner.
    const existing = await prisma.aiPromotionCreditWallet.findUnique({ where: { userId: current.id } });
    if (existing) return existing;
    throw error;
  });
  return NextResponse.json({
    availableCredits: wallet.availableCredits,
    reservedCredits: wallet.reservedCredits,
    lifetimeConsumed: wallet.lifetimeConsumed,
    cinematicEnabled: process.env.AI_PROMOTION_CINEMATIC_ENABLED === "true",
  });
}
