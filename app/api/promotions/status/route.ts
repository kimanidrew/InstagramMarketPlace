import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function GET(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("campaignId") || "";
  const campaign = await db().promotionCampaign.findFirst({ where: { id, userId: current.id }, include: { payment: { select: { status: true, receiptNumber: true, resultDescription: true } } } });
  if (!campaign) return NextResponse.json({ error: "Promotion not found." }, { status: 404 });
  return NextResponse.json({ status: campaign.status, deliveredReach: campaign.deliveredReach, targetReach: campaign.targetReach, paymentStatus: campaign.payment?.status || null, receiptNumber: campaign.payment?.receiptNumber || null, message: campaign.payment?.resultDescription || null });
}
