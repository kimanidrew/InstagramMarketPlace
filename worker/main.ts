import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { uploadR2Object, safeAssetKey } from "../lib/ai-promotions/storage";
import { cinematicProviderEnabled } from "../lib/ai-promotions/policy";
import { RunwayTaskError, submitRunwayImageToVideo, waitForRunwayOutput } from "../lib/ai-promotions/providers/runway";

const execFileAsync = promisify(execFile);
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) throw new Error("DATABASE_URL or POSTGRES_URL must be configured for the AI promotion worker.");
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
const POLL_MS = Math.max(1000, Number(process.env.AI_PROMOTION_WORKER_POLL_MS || 2500));
const WORKER_ID = process.env.AI_PROMOTION_WORKER_ID || randomUUID();
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;

type SnapshotProduct = { id: string; title: string; caption?: string | null; imageUrl: string | null; mediaType?: string | null };
type CampaignSnapshot = { connection: { username: string; name?: string | null }; products: SnapshotProduct[] };

class PermanentJobError extends Error {
  constructor(message: string, readonly code: string) { super(message); }
}

function allowedSourceUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    return host === "instagram.com" || host.endsWith(".instagram.com") ||
      host === "cdninstagram.com" || host.endsWith(".cdninstagram.com") ||
      host === "fbcdn.net" || host.endsWith(".fbcdn.net");
  } catch { return false; }
}

async function downloadSource(urlValue: string) {
  if (!allowedSourceUrl(urlValue)) throw new PermanentJobError("The source media host is not allowed.", "INVALID_SOURCE_URL");
  const response = await fetch(urlValue, { signal: AbortSignal.timeout(25_000), redirect: "error", headers: { "user-agent": "SokoLink-PromotionWorker/1.0" } });
  if (!response.ok) throw new Error(`Source media download failed (${response.status}).`);
  const mime = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!mime.startsWith("image/") && !mime.startsWith("video/")) throw new PermanentJobError("The source file is not supported media.", "UNSUPPORTED_SOURCE_MEDIA");
  const maxBytes = mime.startsWith("image/") ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > maxBytes) throw new PermanentJobError("The source media is too large.", "SOURCE_MEDIA_TOO_LARGE");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > maxBytes) throw new PermanentJobError("The source media is too large.", "SOURCE_MEDIA_TOO_LARGE");
  return { buffer, mime };
}

function escapeFilterPath(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

async function renderVideo(input: {
  directory: string; sourcePath: string; outputPath: string; title: string; username: string;
  width: number; height: number; durationSeconds: number; sourceIsVideo: boolean;
}) {
  const titleFile = path.join(input.directory, "title.txt");
  const ctaFile = path.join(input.directory, "cta.txt");
  await writeFile(titleFile, input.title.replace(/[\r\n]/g, " ").slice(0, 100), "utf8");
  await writeFile(ctaFile, `Shop @${input.username} on SokoLink`.replace(/[\r\n]/g, " ").slice(0, 100), "utf8");
  const font = escapeFilterPath(process.env.AI_PROMOTION_FONT_FILE || "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf");
  const title = escapeFilterPath(titleFile);
  const cta = escapeFilterPath(ctaFile);
  const baseFilters = [
    `scale=${input.width}:${input.height}:force_original_aspect_ratio=increase`,
    `crop=${input.width}:${input.height}`,
    "fps=30",
    `drawtext=fontfile='${font}':textfile='${title}':fontcolor=white:fontsize=${Math.max(34, Math.round(input.width * 0.058))}:x=(w-text_w)/2:y=h*0.70:box=1:boxcolor=black@0.45:boxborderw=22`,
    `drawtext=fontfile='${font}':textfile='${cta}':fontcolor=white:fontsize=${Math.max(20, Math.round(input.width * 0.026))}:x=(w-text_w)/2:y=h*0.88:box=1:boxcolor=black@0.5:boxborderw=14`,
    "format=yuv420p",
  ];
  if (!input.sourceIsVideo) baseFilters.splice(2, 0, `zoompan=z='min(zoom+0.0008,1.12)':d=${input.durationSeconds * 30}:s=${input.width}x${input.height}:fps=30`);
  const args = input.sourceIsVideo
    ? ["-y", "-i", input.sourcePath, "-vf", baseFilters.join(","), "-t", String(input.durationSeconds), "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", input.outputPath]
    : ["-y", "-loop", "1", "-framerate", "30", "-i", input.sourcePath, "-vf", baseFilters.join(","), "-t", String(input.durationSeconds), "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", input.outputPath];
  await execFileAsync(process.env.AI_PROMOTION_FFMPEG_PATH || "ffmpeg", args, { timeout: Math.max(180_000, input.durationSeconds * 30_000), maxBuffer: 8 * 1024 * 1024 });
}

async function settleReservedCredit(campaignId: string, action: "CHARGE" | "RELEASE") {
  const campaign = await prisma.aiPromotionCampaign.findUnique({ where: { id: campaignId }, select: { userId: true } });
  if (!campaign) return;
  const key = `${action.toLowerCase()}:${campaignId}`;
  await prisma.$transaction(async (tx) => {
    const already = await tx.aiPromotionCreditLedger.findUnique({ where: { idempotencyKey: key } });
    if (already) return;
    const wallet = await tx.aiPromotionCreditWallet.findUnique({ where: { userId: campaign.userId } });
    if (!wallet || wallet.reservedCredits < 1) return;
    if (action === "CHARGE") {
      await tx.aiPromotionCreditWallet.update({ where: { id: wallet.id }, data: { reservedCredits: { decrement: 1 }, lifetimeConsumed: { increment: 1 } } });
    } else {
      await tx.aiPromotionCreditWallet.update({ where: { id: wallet.id }, data: { reservedCredits: { decrement: 1 }, availableCredits: { increment: 1 } } });
    }
    await tx.aiPromotionCreditLedger.create({
      data: { userId: campaign.userId, walletId: wallet.id, campaignId, entryType: action, amount: 1, idempotencyKey: key, description: action === "CHARGE" ? "Cinematic generation completed" : "Unused cinematic reservation released" },
    });
  });
}

async function completeMotionFallback(campaignId: string, jobId: string, message?: string) {
  await prisma.aiPromotionScene.updateMany({ where: { campaignId: campaignId, position: 1 }, data: { strategy: "MOTION", status: "GENERATING", errorCode: message ? "CINEMATIC_FALLBACK" : null } });
  await prisma.aiPromotionJob.update({ where: { id: jobId }, data: { stage: "rendering", provider: null, providerTaskId: null } });
}

async function reserveProviderBudget(campaignId: string, jobId: string, durationSeconds: number) {
  const operationKey = "runway:" + jobId;
  const existing = await prisma.aiPromotionProviderUsage.findUnique({ where: { operationKey } });
  if (existing) return existing.status !== "FALLBACK" && existing.status !== "FAILED";
  const model = process.env.RUNWAY_MODEL || "wan3";
  const defaultRate = model === "wan3" ? 0.20 : 0.12;
  const estimatedCost = Math.max(0, Number(process.env.AI_PROMOTION_CINEMATIC_ESTIMATED_COST_USD || (durationSeconds * defaultRate)));
  const dailyCap = Math.max(0, Number(process.env.AI_PROMOTION_DAILY_PROVIDER_BUDGET_USD || 10));
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const usage = await prisma.aiPromotionProviderUsage.aggregate({
    where: { createdAt: { gte: startOfDay }, status: { in: ["ESTIMATED", "COMPLETED"] } },
    _sum: { estimatedCostUsd: true },
  });
  const committedSpend = Number(usage._sum.estimatedCostUsd || 0);
  if (committedSpend + estimatedCost > dailyCap) return false;
  await prisma.aiPromotionProviderUsage.create({
    data: {
      campaignId, jobId, provider: "runway", model, operationKey,
      inputSeconds: durationSeconds, outputSeconds: durationSeconds,
      estimatedCostUsd: estimatedCost, status: "ESTIMATED",
    },
  });
  return true;
}

async function processJob(jobId: string) {
  const job = await prisma.aiPromotionJob.findUnique({ where: { id: jobId }, include: { campaign: true } });
  if (!job || job.status === "CANCELLED") return;
  const campaign = job.campaign;
  if (campaign.status === "CANCELLED") {
    await prisma.aiPromotionJob.update({ where: { id: job.id }, data: { status: "CANCELLED", leaseExpiresAt: null } });
    return;
  }
  const snapshot = campaign.sourceSnapshot as unknown as CampaignSnapshot | null;
  const product = snapshot?.products?.find((item) => item.imageUrl);
  if (!product?.imageUrl) throw new PermanentJobError("No eligible source image was found for this campaign.", "NO_SOURCE_IMAGE");

  await prisma.aiPromotionCampaign.update({ where: { id: campaign.id }, data: { status: "PLANNING", progress: 10 } });
  await prisma.aiPromotionJob.update({ where: { id: job.id }, data: { stage: "preparing" } });
  const directory = await mkdtemp(path.join(tmpdir(), "sokolink-ai-promo-"));
  let usedCinematic = false;
  let providerModel: string | null = null;
  let providerTaskId: string | null = job.providerTaskId;
  try {
    const source = await downloadSource(product.imageUrl);
    const sourceIsVideo = source.mime.startsWith("video/");
    const sourceExtension = source.mime === "image/png" ? "png" : source.mime === "image/webp" ? "webp" : source.mime === "video/mp4" ? "mp4" : "jpg";
    const sourcePath = path.join(directory, "source." + sourceExtension);
    await writeFile(sourcePath, source.buffer);
    const videoPath = path.join(directory, "provider.mp4");
    const outputPath = path.join(directory, "final.mp4");
    let renderSource = sourcePath;
    let renderSourceIsVideo = sourceIsVideo;
    const canUseCinematic = campaign.mode !== "MOTION" && cinematicProviderEnabled() && campaign.durationSeconds <= 30;

    if (canUseCinematic && !(await reserveProviderBudget(campaign.id, job.id, campaign.durationSeconds))) {
      await completeMotionFallback(campaign.id, job.id, "The cinematic daily budget limit was reached; motion rendering was used.");
    } else if (canUseCinematic) {
      try {
        await prisma.aiPromotionCampaign.update({ where: { id: campaign.id }, data: { status: "GENERATING", progress: 20 } });
        await prisma.aiPromotionJob.update({ where: { id: job.id }, data: { stage: "cinematic-generation", provider: "runway", providerTaskId } });
        let taskId = providerTaskId;
        if (!taskId) {
          const submitted = await submitRunwayImageToVideo({
            imageUrl: product.imageUrl,
            prompt: `${campaign.prompt}. Preserve the exact product appearance. Do not add text, logos, labels, or invented features. Premium commercial camera movement.`,
            durationSeconds: campaign.durationSeconds,
            width: campaign.width,
            height: campaign.height,
            idempotencyKey: job.idempotencyKey,
          });
          taskId = submitted.id;
          providerModel = submitted.model;
          providerTaskId = taskId;
          await prisma.aiPromotionJob.update({ where: { id: job.id }, data: { providerTaskId: taskId, provider: "runway", stage: "cinematic-generation" } });
        }
        await prisma.aiPromotionProviderUsage.updateMany({
          where: { operationKey: "runway:" + job.id },
          data: { providerRequestId: taskId, status: "ESTIMATED" },
        });
        const result = await waitForRunwayOutput(taskId, async () => {
          await prisma.aiPromotionJob.update({ where: { id: job.id }, data: { leaseExpiresAt: new Date(Date.now() + 2 * 60_000) } });
        });
        const videoUrl = new URL(result.outputUrl);
        if (videoUrl.protocol !== "https:") throw new PermanentJobError("Provider returned an unsafe video URL.", "INVALID_PROVIDER_OUTPUT");
        const providerResponse = await fetch(videoUrl, { signal: AbortSignal.timeout(45_000), redirect: "error" });
        if (!providerResponse.ok) throw new Error("Could not download the generated video.");
        const videoBytes = Buffer.from(await providerResponse.arrayBuffer());
        if (!videoBytes.byteLength || videoBytes.byteLength > MAX_VIDEO_BYTES) throw new PermanentJobError("Generated video output exceeds the allowed size.", "OUTPUT_TOO_LARGE");
        await writeFile(videoPath, videoBytes);
        renderSource = videoPath;
        renderSourceIsVideo = true;
        usedCinematic = true;
        const cost = Math.max(0, Number(process.env.AI_PROMOTION_CINEMATIC_ESTIMATED_COST_USD || 1.8));
        await prisma.aiPromotionProviderUsage.upsert({
          where: { operationKey: `runway:${job.id}` },
          create: { campaignId: campaign.id, jobId: job.id, provider: "runway", model: providerModel || process.env.RUNWAY_MODEL || "wan3", operationKey: `runway:${job.id}`, inputSeconds: campaign.durationSeconds, outputSeconds: campaign.durationSeconds, estimatedCostUsd: cost, status: "COMPLETED", providerRequestId: taskId },
          update: { status: "ESTIMATED", providerRequestId: taskId, estimatedCostUsd: cost },
        });
      } catch (error) {
        if (error instanceof RunwayTaskError && error.code === "PROVIDER_PENDING") throw error;
        console.warn("Cinematic generation failed; using motion fallback", { campaignId: campaign.id, code: error instanceof RunwayTaskError ? error.code : "PROVIDER_ERROR" });
        await prisma.aiPromotionProviderUsage.updateMany({ where: { operationKey: "runway:" + job.id }, data: { status: providerTaskId ? "ESTIMATED" : "FALLBACK" } });
        usedCinematic = false;
        providerTaskId = null;
        await completeMotionFallback(campaign.id, job.id, "Cinematic generation was unavailable; motion rendering was used.");
      }
    } else {
      await completeMotionFallback(campaign.id, job.id, campaign.mode === "MOTION" ? undefined : "Cinematic generation is not configured or this duration uses motion fallback.");
    }

    const beforeRender = await prisma.aiPromotionCampaign.findUnique({ where: { id: campaign.id }, select: { status: true } });
    if (beforeRender?.status === "CANCELLED") {
      await prisma.aiPromotionJob.update({ where: { id: job.id }, data: { status: "CANCELLED", leaseExpiresAt: null } });
      await settleReservedCredit(campaign.id, "RELEASE");
      return;
    }
    await prisma.aiPromotionCampaign.update({ where: { id: campaign.id }, data: { status: "RENDERING", progress: 70 } });
    await prisma.aiPromotionJob.update({ where: { id: job.id }, data: { stage: "rendering", leaseExpiresAt: new Date(Date.now() + 20 * 60_000) } });
    await renderVideo({
      directory, sourcePath: renderSource, outputPath, title: product.title || "Discover something special",
      username: snapshot?.connection?.username || campaign.connectionId, width: campaign.width,
      height: campaign.height, durationSeconds: campaign.durationSeconds, sourceIsVideo: renderSourceIsVideo,
    });
    const probe = await execFileAsync(process.env.AI_PROMOTION_FFPROBE_PATH || "ffprobe", [
      "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,codec_name",
      "-show_entries", "format=duration", "-of", "json", outputPath,
    ], { timeout: 20_000, maxBuffer: 1024 * 1024 });
    let probeData: { streams?: Array<{ width?: number; height?: number; codec_name?: string }>; format?: { duration?: string } };
    try { probeData = JSON.parse(probe.stdout) as typeof probeData; } catch { throw new PermanentJobError("The rendered video metadata could not be read.", "INVALID_RENDER_METADATA"); }
    const videoStream = probeData.streams?.[0];
    const actualDuration = Number(probeData.format?.duration || 0);
    if (!videoStream || videoStream.width !== campaign.width || videoStream.height !== campaign.height ||
        videoStream.codec_name !== "h264" || Math.abs(actualDuration - campaign.durationSeconds) > 1.5) {
      throw new PermanentJobError("The rendered video does not match its declared output specifications.", "OUTPUT_SPEC_MISMATCH");
    }
    const output = await readFile(outputPath);
    if (output.byteLength < 1000 || output.byteLength > MAX_VIDEO_BYTES) throw new PermanentJobError("The rendered video failed output-size validation.", "INVALID_RENDER_OUTPUT");
    const beforeUpload = await prisma.aiPromotionCampaign.findUnique({ where: { id: campaign.id }, select: { status: true } });
    if (beforeUpload?.status === "CANCELLED") {
      await prisma.aiPromotionJob.update({ where: { id: job.id }, data: { status: "CANCELLED", leaseExpiresAt: null } });
      await settleReservedCredit(campaign.id, "RELEASE");
      return;
    }
    const key = safeAssetKey(campaign.id, `promotion-${campaign.width}x${campaign.height}-${Date.now()}.mp4`);
    await uploadR2Object(key, output, "video/mp4");
    let thumbnailKey: string | null = null;
    let thumbnailBytes: Buffer | null = null;
    try {
      const thumbnailPath = path.join(directory, "thumbnail.jpg");
      await execFileAsync(process.env.AI_PROMOTION_FFMPEG_PATH || "ffmpeg", [
        "-y", "-ss", String(Math.min(2, Math.max(0, campaign.durationSeconds - 1))), "-i", outputPath,
        "-frames:v", "1", "-vf", "scale=480:-2", "-q:v", "3", thumbnailPath,
      ], { timeout: 30_000, maxBuffer: 1024 * 1024 });
      thumbnailBytes = await readFile(thumbnailPath);
      if (thumbnailBytes.byteLength > 0) {
        thumbnailKey = safeAssetKey(campaign.id, "thumbnail-" + Date.now() + ".jpg");
        await uploadR2Object(thumbnailKey, thumbnailBytes, "image/jpeg");
      }
    } catch (error) {
      console.warn("AI promotion thumbnail generation failed", { campaignId: campaign.id, error: error instanceof Error ? error.message : "unknown" });
    }
    const completed = await prisma.$transaction(async (tx) => {
      const updated = await tx.aiPromotionCampaign.updateMany({
        where: { id: campaign.id, status: { not: "CANCELLED" } },
        data: { status: "COMPLETED", progress: 100, outputKey: key, thumbnailKey, completedAt: new Date(), errorCode: null, errorMessage: null },
      });
      if (updated.count !== 1) {
        await tx.aiPromotionJob.update({ where: { id: job.id }, data: { status: "CANCELLED", stage: "cancelled", leaseExpiresAt: null } });
        return false;
      }
      await tx.aiPromotionAsset.create({
        data: { campaignId: campaign.id, type: "RENDERED_VIDEO", objectKey: key, mimeType: "video/mp4", sizeBytes: BigInt(output.byteLength), width: campaign.width, height: campaign.height, durationSeconds: campaign.durationSeconds, metadata: { mode: campaign.mode, renderedWithCinematic: usedCinematic } },
      });
      if (thumbnailKey && thumbnailBytes) await tx.aiPromotionAsset.create({
        data: { campaignId: campaign.id, type: "THUMBNAIL", objectKey: thumbnailKey, mimeType: "image/jpeg", sizeBytes: BigInt(thumbnailBytes.byteLength), width: 480, metadata: { generatedBy: "ffmpeg" } },
      });
      await tx.aiPromotionScene.updateMany({ where: { campaignId: campaign.id }, data: { status: "READY", errorCode: null } });
      await tx.aiPromotionJob.update({ where: { id: job.id }, data: { status: "SUCCEEDED", stage: "completed", leaseExpiresAt: null, errorCode: null, errorMessage: null } });
      return true;
    });
    if (!completed) {
      await settleReservedCredit(campaign.id, "RELEASE");
      return;
    }
    await settleReservedCredit(campaign.id, usedCinematic ? "CHARGE" : "RELEASE");
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(() => {});
  }
}

async function recoverExpiredJobs() {
  const now = new Date();
  await prisma.aiPromotionJob.updateMany({
    where: { status: "RUNNING", leaseExpiresAt: { lt: now } },
    data: { status: "RETRY_WAIT", nextAttemptAt: now, errorCode: "WORKER_LEASE_EXPIRED", leaseExpiresAt: null },
  });
}

async function claimJob() {
  const now = new Date();
  const candidate = await prisma.aiPromotionJob.findFirst({
    where: { status: { in: ["QUEUED", "RETRY_WAIT"] }, OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] },
    orderBy: { createdAt: "asc" },
    select: { id: true, attempts: true, maxAttempts: true },
  });
  if (!candidate) return null;
  const claimed = await prisma.aiPromotionJob.updateMany({
    where: { id: candidate.id, status: { in: ["QUEUED", "RETRY_WAIT"] } },
    data: { status: "RUNNING", attempts: { increment: 1 }, leaseExpiresAt: new Date(Date.now() + 20 * 60_000), errorCode: null, errorMessage: null },
  });
  return claimed.count === 1 ? candidate.id : null;
}

async function handleFailure(jobId: string, error: unknown) {
  const job = await prisma.aiPromotionJob.findUnique({ where: { id: jobId }, include: { campaign: true } });
  if (!job) return;
  if (job.campaign.status === "CANCELLED") {
    await prisma.aiPromotionJob.update({ where: { id: job.id }, data: { status: "CANCELLED", leaseExpiresAt: null } });
    await settleReservedCredit(job.campaignId, "RELEASE");
    return;
  }
  const code = error instanceof PermanentJobError ? error.code : error instanceof RunwayTaskError ? error.code : "WORKER_ERROR";
  const message = error instanceof Error ? error.message : "Unknown worker error";
  const retryable = !(error instanceof PermanentJobError) && (!(error instanceof RunwayTaskError) || error.retryable);
  if (retryable && job.attempts < job.maxAttempts) {
    const delayMs = Math.min(15 * 60_000, 15_000 * 2 ** Math.max(0, job.attempts - 1)) + Math.floor(Math.random() * 5000);
    const next = new Date(Date.now() + delayMs);
    await prisma.aiPromotionJob.update({ where: { id: job.id }, data: { status: "RETRY_WAIT", nextAttemptAt: next, leaseExpiresAt: null, errorCode: code, errorMessage: message.slice(0, 1000) } });
    await prisma.aiPromotionCampaign.update({ where: { id: job.campaignId }, data: { status: "QUEUED", errorCode: code, errorMessage: "Your promotion is temporarily delayed and will retry automatically." } });
    return;
  }
  await prisma.aiPromotionProviderUsage.updateMany({ where: { operationKey: "runway:" + job.id, status: "ESTIMATED", providerRequestId: null }, data: { status: "FAILED" } });
  await prisma.$transaction([
    prisma.aiPromotionJob.update({ where: { id: job.id }, data: { status: "FAILED", stage: "failed", leaseExpiresAt: null, errorCode: code, errorMessage: message.slice(0, 1000) } }),
    prisma.aiPromotionCampaign.update({ where: { id: job.campaignId }, data: { status: "FAILED", errorCode: code, errorMessage: "We couldn't finish this promotion. You can retry it from your campaign history." } }),
  ]);
  await settleReservedCredit(job.campaignId, "RELEASE");
}

async function main() {
  console.log("SokoLink AI Promotion worker started", { workerId: WORKER_ID, pollMs: POLL_MS });
  for (;;) {
    try {
      await recoverExpiredJobs();
      const jobId = await claimJob();
      if (!jobId) {
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
        continue;
      }
      try {
        await processJob(jobId);
      } catch (error) {
        console.error("AI promotion job failed", { jobId, error: error instanceof Error ? error.message : "unknown" });
        await handleFailure(jobId, error);
      }
    } catch (error) {
      console.error("AI promotion worker loop error", error instanceof Error ? error.message : "unknown");
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    }
  }
}

void main();
