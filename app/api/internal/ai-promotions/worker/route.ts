import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ReplicatePrediction = { id: string; status: string; output?: unknown; error?: string | null };
const aspectRatio: Record<string, string> = { VERTICAL: "9:16", SQUARE: "1:1", LANDSCAPE: "16:9" };

function outputUrl(output: unknown): string | null {
  if (typeof output === "string" && /^https:\/\//i.test(output)) return output;
  if (Array.isArray(output)) return output.find((item): item is string => typeof item === "string" && /^https:\/\//i.test(item)) || null;
  if (output && typeof output === "object") {
    const values = Object.values(output as Record<string, unknown>);
    return values.find((item): item is string => typeof item === "string" && /^https:\/\//i.test(item)) || null;
  }
  return null;
}

export async function POST(request: Request) {
  const secret = process.env.AI_PROMOTION_WORKER_SECRET || process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = process.env.REPLICATE_API_TOKEN;
  const version = process.env.REPLICATE_MODEL_VERSION;
  if (!token || !version) return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN or REPLICATE_MODEL_VERSION" }, { status: 503 });

  const prisma = db();
  const job = await prisma.aiPromotionJob.findFirst({
    where: { status: { in: ["QUEUED", "RUNNING"] }, nextRunAt: { lte: new Date() } },
    include: { campaign: { include: { post: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (!job) return NextResponse.json({ processed: false, message: "No due AI promotion jobs." });

  try {
    let prediction: ReplicatePrediction;
    if (job.providerPredictionId) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(job.providerPredictionId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Replicate status request failed (${response.status}).`);
      prediction = await response.json() as ReplicatePrediction;
    } else {
      const image = job.campaign.post?.thumbnailUrl || job.campaign.post?.mediaUrl;
      if (job.campaign.scope === "PRODUCT" && (!image || !/^https:\/\//i.test(image))) throw new Error("This product needs a publicly reachable HTTPS image URL before video generation.");
      const input: Record<string, unknown> = {
        prompt: job.campaign.prompt,
        duration: job.campaign.durationSeconds,
        aspect_ratio: aspectRatio[job.campaign.format] || "9:16",
      };
      if (image && job.campaign.mode === "HYBRID") input.image = image;
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ version, input }), cache: "no-store", signal: AbortSignal.timeout(25000),
      });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 500);
        throw new Error(`Replicate could not start this model (${response.status}): ${detail}`);
      }
      prediction = await response.json() as ReplicatePrediction;
      if (!prediction.id) throw new Error("The provider returned no prediction ID.");
    }

    if (prediction.status === "succeeded") {
      const url = outputUrl(prediction.output);
      if (!url) throw new Error("The video provider completed without a recognizable HTTPS output URL.");
      await prisma.$transaction([
        prisma.aiPromotionJob.update({ where: { id: job.id }, data: { status: "SUCCEEDED", providerPredictionId: prediction.id || job.providerPredictionId, finishedAt: new Date(), lastError: null } }),
        prisma.aiPromotionCampaign.update({ where: { id: job.campaignId }, data: { status: "COMPLETED", providerOutputUrl: url, finalVideoUrl: url, completedAt: new Date(), errorMessage: null } }),
      ]);
      return NextResponse.json({ processed: true, status: "COMPLETED", campaignId: job.campaignId });
    }
    if (prediction.status === "failed" || prediction.status === "canceled") {
      const message = prediction.error || `Video provider status: ${prediction.status}`;
      await prisma.$transaction([
        prisma.aiPromotionJob.update({ where: { id: job.id }, data: { status: "FAILED", providerPredictionId: prediction.id || job.providerPredictionId, lastError: message, finishedAt: new Date() } }),
        prisma.aiPromotionCampaign.update({ where: { id: job.campaignId }, data: { status: "FAILED", errorMessage: message } }),
      ]);
      return NextResponse.json({ processed: true, status: "FAILED", campaignId: job.campaignId });
    }
    await prisma.$transaction([
      prisma.aiPromotionJob.update({ where: { id: job.id }, data: { status: "RUNNING", providerPredictionId: prediction.id || job.providerPredictionId, attemptCount: { increment: 1 }, nextRunAt: new Date(Date.now() + 30000), lastError: null, startedAt: job.startedAt || new Date() } }),
      prisma.aiPromotionCampaign.update({ where: { id: job.campaignId }, data: { status: "GENERATING", errorMessage: null } }),
    ]);
    return NextResponse.json({ processed: true, status: prediction.status, campaignId: job.campaignId });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 900) : "Unknown provider error";
    await prisma.$transaction([
      prisma.aiPromotionJob.update({ where: { id: job.id }, data: { status: "FAILED", lastError: message, finishedAt: new Date() } }),
      prisma.aiPromotionCampaign.update({ where: { id: job.campaignId }, data: { status: "FAILED", errorMessage: message } }),
    ]);
    return NextResponse.json({ processed: true, status: "FAILED", campaignId: job.campaignId, error: message }, { status: 200 });
  }
}

// Vercel Cron invokes routes with GET; external schedulers may use POST.
export async function GET(request: Request) {
  return POST(new Request(request.url, { method: "POST", headers: request.headers }));
}
