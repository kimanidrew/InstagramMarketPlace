import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { isMpesaConfigured, initiateMpesaStk, normalizeMpesaPhone } from "@/lib/mpesa";
import { quoteAiPromotionPrice } from "@/lib/ai-promotion-pricing";
import { refreshPaidPromotion } from "@/lib/ai-promotion-payment";
import { userFriendlyError } from "@/lib/user-friendly-errors";
export const runtime = "nodejs";

async function syncProject(project: any) {
  if (project.status === "PROCESSING" && project.providerJobId && !project.assets?.length) await refreshPaidPromotion(project.id);
  return db().aiPromotionProject.findUnique({ where: { id: project.id }, include: {
    connection: { select: { username: true } }, post: { select: { productTitle: true } },
    assets: { where: { type: "VIDEO" }, take: 1, select: { id: true, storageKey: true } },
    payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, amountKes: true, phoneNumber: true, receiptNumber: true, resultDescription: true } },
  } });
}
export async function GET(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Sign in to view projects." }, { status: 401 });
  const url = new URL(request.url);
  if (url.searchParams.get("quote") === "1") {
    try { return NextResponse.json({ quote: await quoteAiPromotionPrice(Number(url.searchParams.get("durationSeconds")), url.searchParams.get("generateAudio") === "true") }); }
    catch (e) { return NextResponse.json({ error: userFriendlyError(e) }, { status: 400 }); }
  }
  const list = await db().aiPromotionProject.findMany({ where: { userId: current.id, status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" }, take: 30, include: {
    connection: { select: { username: true } }, post: { select: { productTitle: true } },
    assets: { where: { type: "VIDEO" }, take: 1, select: { id: true, storageKey: true } },
    payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, amountKes: true, phoneNumber: true, receiptNumber: true, resultDescription: true } },
  } });
  const projects = await Promise.all(list.map(syncProject));
  return NextResponse.json({ projects: projects.filter(Boolean).map((p: any) => ({
    id: p.id, title: p.title, shop: p.connection.username, product: p.post?.productTitle || null, scope: p.scope, mode: p.mode,
    duration: p.durationSeconds, status: p.status, createdAt: p.createdAt, videoReady: p.assets.length > 0,
    videoUrl: p.assets.find((a: any) => a.type === "VIDEO")?.storageKey || null, errorMessage: p.errorMessage || null,
    payment: p.payments?.[0] ? { status: p.payments[0].status, amountKes: p.payments[0].amountKes, phoneNumber: p.payments[0].phoneNumber, receiptNumber: p.payments[0].receiptNumber, message: p.payments[0].resultDescription } : null,
  })) });
}
export async function POST(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Sign in before creating a promotion." }, { status: 401 });
  if (!isMpesaConfigured()) return NextResponse.json({ error: "M-Pesa payments are not configured yet. Please contact support." }, { status: 503 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const connectionId = typeof b.connectionId === "string" ? b.connectionId : "";
  const scope = b.scope === "STORE" ? "STORE" : b.scope === "PRODUCT" ? "PRODUCT" : null;
  const mode = ["AI", "MOTION", "HYBRID"].includes(String(b.mode)) ? String(b.mode) as "AI" | "MOTION" | "HYBRID" : null;
  const durationSeconds = Number(b.durationSeconds);
  const postId = typeof b.postId === "string" && b.postId ? b.postId : null;
  const prompt = typeof b.prompt === "string" ? b.prompt.trim() : "";
  const generateAudio = b.generateAudio === true;
  const idempotencyKey = typeof b.idempotencyKey === "string" && /^[a-zA-Z0-9_-]{16,120}$/.test(b.idempotencyKey) ? b.idempotencyKey : "";
  if (!idempotencyKey) return NextResponse.json({ error: "Refresh the form and try again; a request key is missing." }, { status: 400 });
  if (!connectionId || !scope || !mode || ![10, 15].includes(durationSeconds) || prompt.length < 12 || prompt.length > 1200 || (scope === "PRODUCT" && !postId)) return NextResponse.json({ error: "Choose a shop, product, valid duration and a 12–1,200 character prompt." }, { status: 400 });
  let phoneNumber: string;
  try { phoneNumber = normalizeMpesaPhone(typeof b.phoneNumber === "string" ? b.phoneNumber : ""); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Enter a valid M-Pesa phone number." }, { status: 400 }); }
  const p = db();
  const pendingPayment = await p.aiPromotionPayment.findFirst({
    where: { userId: current.id, status: { in: ["INITIATED", "PENDING"] } },
    orderBy: { createdAt: "desc" },
    include: { project: { select: { id: true, title: true, status: true } } },
  });
  if (pendingPayment) return NextResponse.json({
    project: pendingPayment.project,
    payment: { status: pendingPayment.status, amountKes: pendingPayment.amountKes },
    reused: true,
    message: "You already have an M-Pesa payment awaiting confirmation. Approve or cancel that prompt before starting another video.",
  }, { status: 200 });
  const existing = await p.aiPromotionProject.findUnique({ where: { userId_idempotencyKey: { userId: current.id, idempotencyKey } }, include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  if (existing) return NextResponse.json({ project: { id: existing.id, title: existing.title, status: existing.status }, payment: existing.payments[0] ? { status: existing.payments[0].status, amountKes: existing.payments[0].amountKes } : null, reused: true });
  const shop = await p.instagramConnection.findFirst({ where: { id: connectionId, connectedByUserId: current.id }, select: { id: true, username: true, profileImageUrl: true } });
  if (!shop) return NextResponse.json({ error: "That shop is not connected to your account." }, { status: 404 });
  const product = scope === "PRODUCT" ? await p.instagramPost.findFirst({ where: { id: postId!, connectionId, isProduct: true, OR: [{ mediaUrl: { not: null } }, { thumbnailUrl: { not: null } }] }, select: { id: true, productTitle: true, mediaUrl: true, thumbnailUrl: true, mediaType: true } }) : null;
  if (scope === "PRODUCT" && !product) return NextResponse.json({ error: "Selected product is not an eligible listing with media." }, { status: 404 });
  let imageUrl = scope === "PRODUCT" ? product?.thumbnailUrl || (product?.mediaType === "IMAGE" ? product.mediaUrl : null) : shop.profileImageUrl;
  if (scope === "STORE" && !imageUrl) {
    const featured = await p.instagramPost.findFirst({ where: { connectionId, isProduct: true, OR: [{ thumbnailUrl: { not: null } }, { mediaType: "IMAGE", mediaUrl: { not: null } }] }, orderBy: { timestamp: "desc" }, select: { thumbnailUrl: true, mediaUrl: true, mediaType: true } });
    imageUrl = featured?.thumbnailUrl || (featured?.mediaType === "IMAGE" ? featured.mediaUrl : null);
  }
  if (!imageUrl || !imageUrl.startsWith("https://")) return NextResponse.json({ error: "Choose a product or shop with a public HTTPS image before paying." }, { status: 400 });
  let quote;
  try { quote = await quoteAiPromotionPrice(durationSeconds, generateAudio); }
  catch (e) { return NextResponse.json({ error: userFriendlyError(e) }, { status: 400 }); }
  if (!Number.isInteger(b.expectedAmountKes) || Number(b.expectedAmountKes) !== quote.amountKes) return NextResponse.json({ error: "The price changed since the preview. Review the updated amount before paying.", quote }, { status: 409 });
  const title = (scope === "STORE" ? "Shop promotion" : product?.productTitle || "Product promotion") + " · @" + shop.username;
  let project;
  try {
    project = await p.aiPromotionProject.create({ data: { userId: current.id, connectionId, postId: scope === "PRODUCT" ? postId : null, title, scope, mode, durationSeconds, prompt, generateAudio, status: "PENDING_PAYMENT", idempotencyKey, provider: "fal.ai/kling-video-v3-pro" }, select: { id: true, title: true, status: true, createdAt: true } });
  } catch (e: any) {
    if (e?.code === "P2002") {
      const dupe = await p.aiPromotionProject.findUnique({ where: { userId_idempotencyKey: { userId: current.id, idempotencyKey } }, include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } } });
      if (dupe) return NextResponse.json({ project: { id: dupe.id, title: dupe.title, status: dupe.status }, payment: dupe.payments[0] ? { status: dupe.payments[0].status, amountKes: dupe.payments[0].amountKes } : null, reused: true });
    }
    throw e;
  }
  const payment = await p.aiPromotionPayment.create({ data: { userId: current.id, projectId: project.id, idempotencyKey, providerCostUsd: quote.providerCostUsd, amountKes: quote.amountKes, phoneNumber, status: "INITIATED", priceSnapshot: { ...quote, phoneNumber, version: 1 } } });
  try {
    const stk = await initiateMpesaStk({ phoneNumber, amountKes: quote.amountKes, accountReference: project.id, description: "SokoLink AI video" });
    await p.aiPromotionPayment.update({ where: { id: payment.id }, data: { status: "PENDING", merchantRequestId: stk.merchantRequestId, checkoutRequestId: stk.checkoutRequestId } });
    return NextResponse.json({ project, payment: { id: payment.id, status: "PENDING", amountKes: quote.amountKes, currency: "KES", customerMessage: stk.customerMessage }, message: `M-Pesa prompt sent for KSh ${quote.amountKes.toLocaleString("en-KE")}. Approve it on your phone; video generation starts only after payment is confirmed.` }, { status: 202 });
  } catch (e) {
    const message = userFriendlyError(e, "mpesa");
    await p.aiPromotionPayment.update({ where: { id: payment.id }, data: { status: "FAILED", resultDescription: message } });
    await p.aiPromotionProject.update({ where: { id: project.id }, data: { status: "FAILED", errorCode: "PAYMENT_INITIATION_FAILED", errorMessage: message } });
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
