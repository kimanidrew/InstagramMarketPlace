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
  await prisma.$transaction([
    prisma.aiPromotionCampaign.update({ where: { id }, data: { status: "CANCELLED", errorCode: null, errorMessage: null } }),
    prisma.aiPromotionJob.updateMany({ where: { campaignId: id, status: { in: ["QUEUED", "RUNNING", "RETRY_WAIT"] } }, data: { status: "CANCELLED", errorCode: "CANCELLED_BY_SELLER" } }),
  ]);
  return NextResponse.json({ ok: true, status: "CANCELLED" });
}
