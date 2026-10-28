import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const { id } = await context.params;
  const prisma = db();
  const campaign = await prisma.aiPromotionCampaign.findFirst({ where: { id, userId: current.id }, include: { scenes: true } });
  if (!campaign) return NextResponse.json({ error: "Promotion not found." }, { status: 404 });
  if (!["FAILED", "CANCELLED"].includes(campaign.status)) {
    return NextResponse.json({ error: "Only failed or cancelled promotions can be retried." }, { status: 409 });
  }
  const activeCount = await prisma.aiPromotionCampaign.count({
    where: { userId: current.id, status: { in: ["QUEUED", "PLANNING", "GENERATING", "RENDERING"] } },
  });
  if (activeCount >= Math.max(1, Number(process.env.AI_PROMOTION_MAX_ACTIVE_PER_SELLER || 3))) {
    return NextResponse.json({ error: "You have reached the active promotion limit." }, { status: 429 });
  }
  await prisma.$transaction(async (tx) => {
    await tx.aiPromotionCampaign.update({ where: { id }, data: { status: "QUEUED", progress: 0, errorCode: null, errorMessage: null, outputKey: null, thumbnailKey: null, completedAt: null } });
    await tx.aiPromotionScene.updateMany({ where: { campaignId: id }, data: { status: "PENDING", outputAssetKey: null, provider: null, providerTaskId: null, errorCode: null } });
    await tx.aiPromotionJob.create({
      data: { campaignId: id, status: "QUEUED", stage: "planning", idempotencyKey: `retry:${id}:${randomUUID()}`, maxAttempts: 4 },
    });
  });
  return NextResponse.json({ ok: true, status: "QUEUED" }, { status: 202 });
}
