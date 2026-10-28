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
    select: { outputKey: true },
  });
  if (!campaign?.outputKey) return NextResponse.json({ error: "A completed video was not found for this promotion." }, { status: 404 });
  try {
    const { url } = createR2SignedUrl(campaign.outputKey, "GET", 600);
    return NextResponse.redirect(url, { status: 302 });
  } catch {
    return NextResponse.json({ error: "Video downloads are not configured yet." }, { status: 503 });
  }
}
