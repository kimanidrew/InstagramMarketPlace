import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { getPromotionVideoResult, getPromotionVideoStatus, submitPromotionVideo } from "@/lib/ai-promotion-provider";
export const runtime = "nodejs";

async function syncVideo(project: any) {
  if (project.status !== "PROCESSING" || !project.providerJobId || project.assets?.some((a: any) => a.type === "VIDEO")) return project;
  const p = db();
  try {
    const status = await getPromotionVideoStatus(project.providerJobId);
    const state = String(status.status || "").toUpperCase();
    if (state === "COMPLETED" || state === "SUCCEEDED") {
      const result = await getPromotionVideoResult(project.providerJobId);
      const video = result.video as { url?: string; content_type?: string; file_size?: number; file_name?: string } | undefined;
      if (!video?.url || !video.url.startsWith("https://")) throw new Error("The video provider completed without a valid video URL.");
      await p.aiPromotionAsset.create({ data: { projectId: project.id, type: "VIDEO", storageKey: video.url, contentType: video.content_type || "video/mp4", durationMs: project.durationSeconds * 1000, byteSize: Number.isInteger(video.file_size) ? BigInt(video.file_size!) : undefined, metadata: { provider: "fal.ai", fileName: video.file_name || null, urlExpires: "Provider-hosted URL; configure durable object storage for long-term retention." } } });
      await p.aiPromotionProject.update({ where: { id: project.id }, data: { status: "READY", completedAt: new Date(), errorCode: null, errorMessage: null } });
      await p.aiPromotionJob.updateMany({ where: { projectId: project.id }, data: { status: "SUCCEEDED", lockedAt: null, workerId: null, lastError: null } });
    } else if (state === "FAILED" || state === "ERROR") {
      const error = "The AI video provider could not generate this video. Please try again.";
      await p.aiPromotionProject.update({ where: { id: project.id }, data: { status: "FAILED", errorCode: "PROVIDER_FAILED", errorMessage: error } });
      await p.aiPromotionJob.updateMany({ where: { projectId: project.id }, data: { status: "FAILED", lockedAt: null, workerId: null, lastError: error } });
    }
  } catch (error) {
    console.error("Promotion status check failed", project.id, error);
  }
  return p.aiPromotionProject.findFirst({ where: { id: project.id }, include: { connection: { select: { username: true } }, post: { select: { productTitle: true } }, assets: { where: { type: "VIDEO" }, take: 1, select: { id: true, storageKey: true } } } });
}

export async function GET() {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Sign in to view projects." }, { status: 401 });
  const projects = await db().aiPromotionProject.findMany({ where: { userId: current.id }, orderBy: { createdAt: "desc" }, take: 30, include: { connection: { select: { username: true } }, post: { select: { productTitle: true } }, assets: { where: { type: "VIDEO" }, take: 1, select: { id: true, storageKey: true } } } });
  const refreshed = await Promise.all(projects.map((p) => syncVideo(p)));
  return NextResponse.json({ projects: refreshed.filter(Boolean).map((p: any) => ({ id: p.id, title: p.title, shop: p.connection.username, product: p.post?.productTitle || null, scope: p.scope, mode: p.mode, duration: p.durationSeconds, status: p.status, createdAt: p.createdAt, videoReady: p.assets.length > 0, videoUrl: p.assets.find((a: any) => a.type === "VIDEO")?.storageKey || null, errorMessage: p.errorMessage || null })) });
}

export async function POST(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Sign in before creating a promotion." }, { status: 401 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const connectionId = typeof b.connectionId === "string" ? b.connectionId : "";
  const scope = b.scope === "STORE" ? "STORE" : b.scope === "PRODUCT" ? "PRODUCT" : null;
  const mode = ["AI", "MOTION", "HYBRID"].includes(String(b.mode)) ? String(b.mode) as "AI" | "MOTION" | "HYBRID" : null;
  const durationSeconds = Number(b.durationSeconds);
  const postId = typeof b.postId === "string" && b.postId ? b.postId : null;
  const prompt = typeof b.prompt === "string" ? b.prompt.trim() : "";
  const idempotencyKey = typeof b.idempotencyKey === "string" && b.idempotencyKey.length <= 120 ? b.idempotencyKey : randomUUID();
  if (!connectionId || !scope || !mode || ![10, 15].includes(durationSeconds) || prompt.length < 12 || prompt.length > 1200) return NextResponse.json({ error: "Choose a shop, valid scope/mode/duration, and a 12–1,200 character prompt." }, { status: 400 });
  if (scope === "PRODUCT" && !postId) return NextResponse.json({ error: "Choose a product." }, { status: 400 });
  const p = db();
  const c = await p.instagramConnection.findFirst({ where: { id: connectionId, connectedByUserId: current.id }, select: { id: true, username: true, profileImageUrl: true } });
  if (!c) return NextResponse.json({ error: "That shop is not connected to your account." }, { status: 404 });
  let selectedProduct: { id: string; productTitle: string | null; mediaUrl: string | null; thumbnailUrl: string | null; caption: string | null; mediaType: string } | null = null;
  if (scope === "PRODUCT") {
    selectedProduct = await p.instagramPost.findFirst({ where: { id: postId!, connectionId, isProduct: true, OR: [{ mediaUrl: { not: null } }, { thumbnailUrl: { not: null } }] }, select: { id: true, productTitle: true, mediaUrl: true, thumbnailUrl: true, caption: true, mediaType: true } });
    if (!selectedProduct) return NextResponse.json({ error: "Selected product is not an eligible listing with media." }, { status: 404 });
  }
  const old = await p.aiPromotionProject.findUnique({ where: { userId_idempotencyKey: { userId: current.id, idempotencyKey } }, select: { id: true, title: true, status: true, createdAt: true } });
  if (old) return NextResponse.json({ project: old, reused: true });
  const title = (scope === "STORE" ? "Shop promotion" : selectedProduct?.productTitle || "Product promotion") + " · @" + c.username;
  const project = await p.aiPromotionProject.create({ data: { userId: current.id, connectionId, postId: scope === "PRODUCT" ? postId : null, title, scope, mode, durationSeconds, prompt, status: "PROCESSING", idempotencyKey, provider: "fal.ai/kling-video-v3-pro", jobs: { create: { status: "PROCESSING", maxAttempts: 3, attempts: 1, workerId: "fal-submit" } } }, select: { id: true, title: true, status: true, createdAt: true } });
  try {
    let imageUrl = scope === "PRODUCT" ? selectedProduct?.thumbnailUrl || (selectedProduct?.mediaType === "IMAGE" ? selectedProduct.mediaUrl : null) : c.profileImageUrl;
    if (scope === "STORE" && !imageUrl) {
      const featured = await p.instagramPost.findFirst({ where: { connectionId, isProduct: true, OR: [{ thumbnailUrl: { not: null } }, { mediaType: "IMAGE", mediaUrl: { not: null } }] }, orderBy: { timestamp: "desc" }, select: { thumbnailUrl: true, mediaUrl: true, mediaType: true } });
      imageUrl = featured?.thumbnailUrl || (featured?.mediaType === "IMAGE" ? featured.mediaUrl : null);
    }
    if (!imageUrl) throw new Error("This shop needs a public profile image, or choose a product with a public image.");
    const submitted = await submitPromotionVideo({ imageUrl, prompt, durationSeconds, title, shopUsername: c.username, productTitle: selectedProduct?.productTitle });
    await p.aiPromotionProject.update({ where: { id: project.id }, data: { provider: submitted.provider, providerJobId: submitted.requestId } });
    await p.aiPromotionJob.updateMany({ where: { projectId: project.id }, data: { workerId: submitted.provider, lastError: null } });
    return NextResponse.json({ project: { ...project, status: "PROCESSING" }, message: "Video generation has started." }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 350) : "Could not start video generation.";
    await p.aiPromotionProject.update({ where: { id: project.id }, data: { status: "FAILED", errorCode: "SUBMIT_FAILED", errorMessage: message } });
    await p.aiPromotionJob.updateMany({ where: { projectId: project.id }, data: { status: "FAILED", lastError: message, lockedAt: null, workerId: null } });
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
