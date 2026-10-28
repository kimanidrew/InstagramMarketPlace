import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import {
  ALLOWED_DURATIONS,
  DEFAULT_PROMOTION_PROMPT,
  FORMAT_DIMENSIONS,
  isPromotionFormat,
  isPromotionMode,
  isPromotionScope,
  validatePrompt,
} from "@/lib/ai-promotions/contracts";
import { cinematicProviderEnabled, maxActiveCampaigns, maxDailyCampaigns } from "@/lib/ai-promotions/policy";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get("limit") || 20);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, Math.floor(limitRaw))) : 20;
  const cursor = url.searchParams.get("cursor");
  const campaigns = await db().aiPromotionCampaign.findMany({
    where: { userId: current.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true, scope: true, mode: true, status: true, durationSeconds: true,
      width: true, height: true, prompt: true, progress: true, errorCode: true,
      createdAt: true, updatedAt: true, completedAt: true, outputKey: true, thumbnailKey: true,
      connection: { select: { username: true, name: true, profileImageUrl: true } },
      post: { select: { id: true, productTitle: true, thumbnailUrl: true, mediaUrl: true } },
    },
  });
  const hasMore = campaigns.length > limit;
  const items = campaigns.slice(0, limit).map(({ outputKey, ...campaign }) => ({
    ...campaign,
    hasOutput: Boolean(outputKey),
    thumbnailUrl: campaign.thumbnailKey ? "/api/account/ai-promotions/" + campaign.id + "/thumbnail" : null,
    downloadUrl: campaign.status === "COMPLETED" && outputKey ? `/api/account/ai-promotions/${campaign.id}/download` : null,
  }));
  return NextResponse.json({ campaigns: items, nextCursor: hasMore ? campaigns[limit - 1]?.id : null });
}

export async function POST(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request is required." }, { status: 400 });
  }

  const scope = body.scope ?? "PRODUCT";
  const mode = body.mode ?? "HYBRID";
  const duration = body.durationSeconds ?? 15;
  const format = body.format ?? "VERTICAL";
  const prompt = validatePrompt(body.prompt ?? DEFAULT_PROMOTION_PROMPT);
  const connectionId = typeof body.connectionId === "string" ? body.connectionId : "";
  const postId = typeof body.postId === "string" ? body.postId : null;

  if (!isPromotionScope(scope) || !isPromotionMode(mode) || !isPromotionFormat(format)) {
    return NextResponse.json({ error: "Choose a supported promotion scope, mode, and format." }, { status: 400 });
  }
  if (!ALLOWED_DURATIONS.includes(duration as (typeof ALLOWED_DURATIONS)[number])) {
    return NextResponse.json({ error: "Duration must be 10, 15, or 30 seconds." }, { status: 400 });
  }
  if (!prompt) return NextResponse.json({ error: "Enter a creative prompt of up to 1,600 characters." }, { status: 400 });
  if (!connectionId || (scope === "PRODUCT" && !postId) || (scope === "STORE" && postId)) {
    return NextResponse.json({ error: "Select a connected store and a valid promotion target." }, { status: 400 });
  }

  const prisma = db();
  const connection = await prisma.instagramConnection.findFirst({
    where: { id: connectionId, connectedByUserId: current.id },
    select: {
      id: true, username: true, name: true, biography: true, profileImageUrl: true,
      profileAccentColor: true,
      posts: {
        where: { isProduct: true, OR: [{ mediaUrl: { not: null } }, { thumbnailUrl: { not: null } }] },
        orderBy: { createdAt: "desc" },
        select: { id: true, productTitle: true, caption: true, category: true, mediaUrl: true, thumbnailUrl: true, mediaType: true, productSlug: true },
      },
    },
  });
  if (!connection) return NextResponse.json({ error: "That connected store could not be found in your account." }, { status: 404 });

  const selectedPost = scope === "PRODUCT" ? connection.posts.find((post) => post.id === postId) : null;
  if (scope === "PRODUCT" && !selectedPost) {
    return NextResponse.json({ error: "Choose an eligible product or service from the selected store." }, { status: 400 });
  }
  if (scope === "STORE" && connection.posts.length === 0) {
    return NextResponse.json({ error: "This store has no eligible product images to promote yet." }, { status: 400 });
  }

  const activeCount = await prisma.aiPromotionCampaign.count({
    where: { userId: current.id, status: { in: ["QUEUED", "PLANNING", "GENERATING", "RENDERING"] } },
  });
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dailyCount = await prisma.aiPromotionCampaign.count({ where: { userId: current.id, createdAt: { gte: dayStart } } });
  if (dailyCount >= maxDailyCampaigns()) {
    return NextResponse.json({ error: "You have reached today's promotion creation limit. Please try again tomorrow." }, { status: 429 });
  }
  if (activeCount >= maxActiveCampaigns()) {
    return NextResponse.json({ error: "You have reached the active promotion limit. Wait for a campaign to finish before creating another." }, { status: 429 });
  }

  const providerReady = cinematicProviderEnabled();
  let wallet = await prisma.aiPromotionCreditWallet.findUnique({ where: { userId: current.id } });
  if (!wallet) {
    const starterCredits = Math.max(0, Math.min(20, Number(process.env.AI_PROMOTION_STARTER_CREDITS || 1) || 0));
    try {
      wallet = await prisma.$transaction(async (tx) => {
        const created = await tx.aiPromotionCreditWallet.create({ data: { userId: current.id, availableCredits: starterCredits, lifetimeGranted: starterCredits } });
        if (starterCredits > 0) await tx.aiPromotionCreditLedger.create({
          data: { userId: current.id, walletId: created.id, entryType: "GRANT", amount: starterCredits,
            idempotencyKey: "starter-grant:" + current.id, description: "Initial AI Promotion Studio credits" },
        });
        return created;
      });
    } catch { wallet = await prisma.aiPromotionCreditWallet.findUnique({ where: { userId: current.id } }); }
  }
  const reserveCinematic = scope === "PRODUCT" && mode !== "MOTION" && providerReady && (wallet?.availableCredits || 0) > 0;
  if (scope === "PRODUCT" && mode === "CINEMATIC" && providerReady && !reserveCinematic) {
    return NextResponse.json({ error: "You do not have cinematic credits available. Choose Hybrid for motion fallback or add credits." }, { status: 402 });
  }

  const requestKey = request.headers.get("idempotency-key")?.trim().slice(0, 180) || randomUUID();
  const existingJob = await prisma.aiPromotionJob.findUnique({
    where: { idempotencyKey: requestKey },
    include: { campaign: { select: { id: true, status: true } } },
  });
  if (existingJob) {
    if (existingJob.campaign && existingJob.campaign.status !== "FAILED") {
      return NextResponse.json({ campaignId: existingJob.campaign.id, status: existingJob.campaign.status, deduplicated: true }, { status: 200 });
    }
    return NextResponse.json({ error: "This idempotency key was already used. Submit a new request key." }, { status: 409 });
  }

  const dimensions = FORMAT_DIMENSIONS[format];
  const snapshot = {
    connection: { id: connection.id, username: connection.username, name: connection.name, biography: connection.biography, profileImageUrl: connection.profileImageUrl, profileAccentColor: connection.profileAccentColor },
    products: (scope === "PRODUCT" && selectedPost ? [selectedPost] : connection.posts).map((post) => ({
      id: post.id, title: post.productTitle || "Shop favourite", caption: post.caption,
      category: post.category, imageUrl: post.thumbnailUrl || post.mediaUrl, mediaType: post.mediaType,
      slug: post.productSlug,
    })),
  };
  const durationSeconds = duration as number;
  const sceneDurations = durationSeconds === 10 ? [2, 3, 3, 2] : durationSeconds === 15 ? [3, 4, 4, 4] : [6, 8, 8, 8];
  const sceneDefinitions = [
    { title: "The hook", prompt: "Introduce the product with a premium visual hook." },
    { title: "Product details", prompt: "Highlight the real product and verified listing details." },
    { title: "Lifestyle moment", prompt: "Create an aspirational, truthful lifestyle moment without inventing product features." },
    { title: "Call to action", prompt: "Close with the exact shop identity and a clear call to action." },
  ].map((scene, index) => ({
    ...scene,
    position: index,
    startSeconds: sceneDurations.slice(0, index).reduce((sum, value) => sum + value, 0),
    durationSeconds: sceneDurations[index],
  }));

  try {
    const campaign = await prisma.$transaction(async (tx) => {
      const created = await tx.aiPromotionCampaign.create({
        data: {
          userId: current.id, connectionId: connection.id, postId: selectedPost?.id ?? null,
          scope, mode, status: "QUEUED", durationSeconds, width: dimensions.width,
          height: dimensions.height, frameRate: 30, prompt, sourceSnapshot: snapshot, storyboard: sceneDefinitions,
          progress: 0,
        },
      });
      const job = await tx.aiPromotionJob.create({
        data: { campaignId: created.id, status: "QUEUED", stage: "planning", idempotencyKey: requestKey, maxAttempts: 4 },
      });
      if (reserveCinematic && wallet) {
        const reserved = await tx.aiPromotionCreditWallet.updateMany({
          where: { id: wallet.id, availableCredits: { gt: 0 } },
          data: { availableCredits: { decrement: 1 }, reservedCredits: { increment: 1 } },
        });
        if (reserved.count !== 1) throw new Error("AI_PROMOTION_CREDITS_RACE");
        await tx.aiPromotionCreditLedger.create({
          data: { userId: current.id, walletId: wallet.id, entryType: "RESERVE", amount: 1,
            campaignId: created.id, idempotencyKey: "reserve:" + created.id,
            description: "Reserved one cinematic generation credit" },
        });
      }
      await tx.aiPromotionScene.createMany({
        data: sceneDefinitions.map((scene) => ({
          campaignId: created.id, jobId: job.id, position: scene.position,
          startSeconds: scene.startSeconds, durationSeconds: scene.durationSeconds,
          title: scene.title, prompt: prompt + "\n\nScene direction: " + scene.prompt,
          strategy: mode, status: "PENDING",
        })),
      });
      return created;
    });
    return NextResponse.json({ campaignId: campaign.id, status: campaign.status }, { status: 201 });
  } catch (error) {
    console.error("AI promotion campaign creation failed", { userId: current.id, error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "We could not create this promotion. Please try again." }, { status: 500 });
  }
}
