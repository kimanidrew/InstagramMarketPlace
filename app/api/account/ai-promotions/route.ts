import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const DEFAULT_PROMPT = "Create a stylish, premium promotion that highlights the product clearly and ends with a strong call to action.";
const allowedDurations = [5, 10, 15] as const;
const formats = { VERTICAL: "9:16", SQUARE: "1:1", LANDSCAPE: "16:9" } as const;

export async function GET() {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const campaigns = await db().aiPromotionCampaign.findMany({
    where: { userId: current.id },
    include: { connection: { select: { username: true } }, post: { select: { productTitle: true, thumbnailUrl: true, mediaUrl: true } } },
    orderBy: { createdAt: "desc" }, take: 30,
  });
  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (!process.env.REPLICATE_API_TOKEN || !process.env.REPLICATE_MODEL_VERSION) {
    return NextResponse.json({ error: "AI video generation is not configured yet. Add REPLICATE_API_TOKEN and REPLICATE_MODEL_VERSION to your deployment environment, then try again." }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const connectionId = typeof body.connectionId === "string" ? body.connectionId : "";
  const scope = body.scope === "STORE" ? "STORE" : "PRODUCT";
  const mode = body.mode === "MOTION" ? "MOTION" : "HYBRID";
  const postId = typeof body.postId === "string" ? body.postId : null;
  const durationSeconds = Number(body.durationSeconds);
  const format = body.format === "SQUARE" || body.format === "LANDSCAPE" ? body.format : "VERTICAL";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : DEFAULT_PROMPT;
  const titleInput = typeof body.title === "string" ? body.title.trim().slice(0, 90) : "";
  if (!connectionId || !allowedDurations.includes(durationSeconds as typeof allowedDurations[number])) return NextResponse.json({ error: "Choose a shop and a supported duration." }, { status: 400 });
  if (prompt.length < 10 || prompt.length > 1200) return NextResponse.json({ error: "The prompt must be between 10 and 1,200 characters." }, { status: 400 });
  const prisma = db();
  const connection = await prisma.instagramConnection.findFirst({ where: { id: connectionId, connectedByUserId: current.id }, select: { id: true, username: true, posts: { where: { isProduct: true, OR: [{ mediaUrl: { not: null } }, { thumbnailUrl: { not: null } }] }, select: { id: true, productTitle: true, category: true, mediaUrl: true, thumbnailUrl: true } } } });
  if (!connection) return NextResponse.json({ error: "That shop was not found in your account." }, { status: 404 });
  let post: { id: string; productTitle: string | null; category: string | null; mediaUrl: string | null; thumbnailUrl: string | null } | null = null;
  if (scope === "PRODUCT") {
    if (!postId) return NextResponse.json({ error: "Choose a product or service to promote." }, { status: 400 });
    post = connection.posts.find(p => p.id === postId) || null;
    if (!post) return NextResponse.json({ error: "That listing does not belong to the selected shop or has no media." }, { status: 400 });
  }
  const title = titleInput || (scope === "PRODUCT" ? post?.productTitle || post?.category || "Product promotion" : `@${connection.username} shop promotion`);
  const campaign = await prisma.aiPromotionCampaign.create({
    data: {
      userId: current.id, connectionId: connection.id, postId: post?.id || null,
      title, scope, mode, prompt, durationSeconds, format, aspectRatio: formats[format],
      status: "QUEUED", provider: "REPLICATE",
      job: { create: { status: "QUEUED", nextRunAt: new Date() } },
    },
    select: { id: true, status: true },
  });
  return NextResponse.json({ campaign }, { status: 201 });
}
