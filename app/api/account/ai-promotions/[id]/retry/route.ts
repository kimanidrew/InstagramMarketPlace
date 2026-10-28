import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (!process.env.REPLICATE_API_TOKEN || !process.env.REPLICATE_MODEL_VERSION) return NextResponse.json({ error: "AI video generation is not configured. Add REPLICATE_API_TOKEN and REPLICATE_MODEL_VERSION first." }, { status: 503 });
  const { id } = await params;
  const prisma = db();
  const campaign = await prisma.aiPromotionCampaign.findFirst({ where: { id, userId: current.id }, include: { job: true } });
  if (!campaign) return NextResponse.json({ error: "Promotion not found." }, { status: 404 });
  if (campaign.status !== "FAILED") return NextResponse.json({ error: "Only failed promotions can be retried." }, { status: 409 });
  await prisma.$transaction([
    prisma.aiPromotionJob.update({ where: { campaignId: id }, data: { status: "QUEUED", providerPredictionId: null, nextRunAt: new Date(), lastError: null, finishedAt: null } }),
    prisma.aiPromotionCampaign.update({ where: { id }, data: { status: "QUEUED", errorMessage: null, providerOutputUrl: null, finalVideoUrl: null, completedAt: null } }),
  ]);
  return NextResponse.json({ ok: true });
}
