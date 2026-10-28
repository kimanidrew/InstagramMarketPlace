import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { createR2SignedUrl } from "@/lib/ai-promotions/storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const { id } = await context.params;
  const campaign = await db().aiPromotionCampaign.findFirst({
    where: { id, userId: current.id, status: "COMPLETED" },
    select: { thumbnailKey: true },
  });
  if (!campaign?.thumbnailKey) return NextResponse.json({ error: "Promotion thumbnail not found." }, { status: 404 });
  try {
    return NextResponse.redirect(createR2SignedUrl(campaign.thumbnailKey, "GET", 600).url, { status: 302 });
  } catch {
    return NextResponse.json({ error: "Media storage is not configured yet." }, { status: 503 });
  }
}
