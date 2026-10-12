import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const prisma = db();
  const connections = await prisma.instagramConnection.findMany({
    where: { connectedByUserId: current.id },
    include: {
      posts: {
        where: { isProduct: true },
        select: { id: true, productTitle: true, productSlug: true, mediaUrl: true, thumbnailUrl: true, mediaType: true, instagramLikeCount: true, likes: { select: { id: true } }, boostUntil: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const ids = connections.map(c => c.id);
  const postIds = connections.flatMap(c => c.posts.map(p => p.id));
  if (!ids.length) return NextResponse.json({ shops: [], summary: { impressions: 0, views: 0, clicks: 0, likes: 0, reach: 0 }, daily: [], campaigns: [] });

  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);
  const [events, campaigns] = await Promise.all([
    prisma.analyticsEvent.findMany({ where: { connectionId: { in: ids }, createdAt: { gte: since } }, select: { connectionId: true, postId: true, campaignId: true, visitorId: true, type: true, createdAt: true } }),
    prisma.promotionCampaign.findMany({ where: { userId: current.id }, include: { connection: { select: { username: true, profileImageUrl: true } }, post: { select: { productTitle: true, thumbnailUrl: true, mediaUrl: true } }, payment: { select: { status: true, receiptNumber: true, amount: true, phoneNumber: true } } }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  const likes = await prisma.productLike.count({ where: { postId: { in: postIds } } });
  const unique = (items: typeof events) => new Set(items.map(e => e.visitorId)).size;
  const impressions = events.filter(e => e.type === "IMPRESSION").length;
  const views = events.filter(e => e.type === "VIEW").length;
  const clicks = events.filter(e => e.type === "CLICK").length;
  const daily = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(since);
    date.setDate(since.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    const day = events.filter(e => e.createdAt.toISOString().slice(0, 10) === key);
    return { date: key, label: date.toLocaleDateString("en-KE", { day: "numeric", month: "short" }), impressions: day.filter(e => e.type === "IMPRESSION").length, views: day.filter(e => e.type === "VIEW").length, clicks: day.filter(e => e.type === "CLICK").length };
  });
  const shops = connections.map(c => {
    const shopEvents = events.filter(e => e.connectionId === c.id);
    return { id: c.id, username: c.username, name: c.name, profileImageUrl: c.profileImageUrl, productCount: c.posts.length, impressions: shopEvents.filter(e => e.type === "IMPRESSION").length, views: shopEvents.filter(e => e.type === "VIEW").length, clicks: shopEvents.filter(e => e.type === "CLICK").length, reach: unique(shopEvents), likes: c.posts.reduce((n, p) => n + p.likes.length, 0), products: c.posts.map(p => ({ id: p.id, title: p.productTitle || "Untitled product", slug: p.productSlug, image: p.thumbnailUrl || p.mediaUrl, mediaType: p.mediaType, likes: p.likes.length, instagramLikes: p.instagramLikeCount, impressions: shopEvents.filter(e => e.postId === p.id && e.type === "IMPRESSION").length, views: shopEvents.filter(e => e.postId === p.id && e.type === "VIEW").length, clicks: shopEvents.filter(e => e.postId === p.id && e.type === "CLICK").length, boosted: !!p.boostUntil && p.boostUntil > new Date() })) };
  });
  const paidEvents = events.filter(e => e.campaignId);
  const paidUnique = unique(paidEvents);
  return NextResponse.json({
    shops,
    summary: { impressions, views, clicks, likes, reach: unique(events), paidImpressions: paidEvents.filter(e => e.type === "IMPRESSION").length, paidReach: paidUnique },
    daily,
    campaigns: campaigns.map(c => ({ id: c.id, targetType: c.targetType, targetReach: c.targetReach, deliveredReach: c.deliveredReach, amount: c.amount, status: c.status, createdAt: c.createdAt.toISOString(), startsAt: c.startsAt?.toISOString() || null, endsAt: c.endsAt?.toISOString() || null, username: c.connection.username, profileImageUrl: c.connection.profileImageUrl, productTitle: c.post?.productTitle || null, image: c.post?.thumbnailUrl || c.post?.mediaUrl || null, paymentStatus: c.payment?.status || null, receiptNumber: c.payment?.receiptNumber || null, phoneNumber: c.payment?.phoneNumber || null })),
  });
}
