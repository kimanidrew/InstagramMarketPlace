import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const { id } = await context.params;
  const campaign = await db().aiPromotionCampaign.findFirst({
    where: { id, userId: current.id },
    include: {
      connection: { select: { username: true, name: true, profileImageUrl: true } },
      post: { select: { productTitle: true, thumbnailUrl: true, mediaUrl: true } },
      scenes: { orderBy: { position: "asc" }, select: { id: true, position: true, title: true, status: true, startSeconds: true, durationSeconds: true, errorCode: true } },
      jobs: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, stage: true, attempts: true, errorCode: true, createdAt: true, updatedAt: true } },
      assets: { where: { type: { in: ["THUMBNAIL", "RENDERED_VIDEO"] } }, select: { id: true, type: true, mimeType: true, sizeBytes: true, width: true, height: true, durationSeconds: true, createdAt: true } },
    },
  });
  if (!campaign) return NextResponse.json({ error: "Promotion not found." }, { status: 404 });
  return NextResponse.json({
    campaign: {
      ...campaign,
      outputKey: undefined,
      assets: campaign.assets.map((asset) => ({ ...asset, sizeBytes: asset.sizeBytes === null ? null : asset.sizeBytes.toString() })),
      downloadUrl: campaign.status === "COMPLETED" && campaign.outputKey ? `/api/account/ai-promotions/${campaign.id}/download` : null,
    },
  });
}
