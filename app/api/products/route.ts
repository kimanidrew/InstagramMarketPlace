import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { filterAvailableInstagramMedia } from "@/lib/instagram-media";
import { user } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("q")?.trim();
  const tag = searchParams.get("tag")?.trim().toLowerCase();
  const page = Math.max(0, Number(searchParams.get("page") || 0));
  const limit = Math.min(24, Math.max(1, Number(searchParams.get("limit") || 12)));
  const currentUser = await user();
  const personalized = searchParams.get("personalized") === "1";

  if (personalized) {
    const now = new Date();
    const where: any = { isProduct: true };
    if (text) where.OR = [
      { productTitle: { contains: text, mode: "insensitive" } },
      { caption: { contains: text, mode: "insensitive" } },
      { connection: { username: { contains: text, mode: "insensitive" } } },
    ];
    if (tag) where.tags = { some: { name: tag } };

    const [liked, saved, recent, activeStoreCampaigns, rawPosts] = await Promise.all([
      currentUser ? db().instagramPost.findMany({ where: { isProduct: true, likes: { some: { userId: currentUser.id } } }, include: { tags: true }, orderBy: { timestamp: "desc" }, take: 80 }) : Promise.resolve([]),
      currentUser ? db().instagramPost.findMany({ where: { isProduct: true, wishlistItems: { some: { userId: currentUser.id } } }, include: { tags: true }, orderBy: { timestamp: "desc" }, take: 80 }) : Promise.resolve([]),
      currentUser ? db().recentlyViewedProduct.findMany({ where: { userId: currentUser.id, post: { isProduct: true } }, include: { post: { include: { tags: true } } }, orderBy: { lastViewedAt: "desc" }, take: 40 }) : Promise.resolve([]),
      db().promotionCampaign.findMany({ where: { status: "ACTIVE", targetType: "STORE" }, select: { connectionId: true } }),
      db().instagramPost.findMany({
        where,
        include: { connection: true, tags: true, likes: true, wishlistItems: currentUser ? { where: { userId: currentUser.id } } : true, _count: { select: { likes: true, wishlistItems: true } } },
        orderBy: [{ boostUntil: "desc" }, { timestamp: "desc" }, { id: "desc" }],
        take: 600,
      }),
    ]);
    const tagScores = new Map<string, number>();
    const addTags = (items: any[], weight: number) => items.forEach((item: any) => (item.tags || []).forEach((t: any) => {
      const name = String(t.name || "").toLowerCase();
      if (name) tagScores.set(name, (tagScores.get(name) || 0) + weight);
    }));
    addTags(liked as any[], 3);
    addTags(saved as any[], 5);
    addTags((recent as any[]).map((item: any) => item.post), 2);
    const promotedStoreIds = new Set(activeStoreCampaigns.map((campaign: any) => campaign.connectionId));
    const available = await filterAvailableInstagramMedia(rawPosts);
    const ranked = available.map((post: any) => {
      const isBoosted = Boolean(post.boostUntil && new Date(post.boostUntil) > now);
      const isStorePromoted = promotedStoreIds.has(post.connectionId);
      const preference = (post.tags || []).reduce((score: number, t: any) => score + (tagScores.get(String(t.name || "").toLowerCase()) || 0), 0);
      const engagement = Number(post._count?.likes || 0) + Number(post._count?.wishlistItems || 0);
      const ageHours = Math.max(0, (now.getTime() - new Date(post.timestamp || post.createdAt || now).getTime()) / 3600000);
      return { ...post, _personalRank: (isBoosted ? 100000 : 0) + (isStorePromoted ? 20000 : 0) + preference * 100 + Math.min(engagement, 100) * 0.5 - Math.min(ageHours / 24, 60) * 0.1 };
    }).sort((a: any, b: any) => b._personalRank - a._personalRank || String(b.id).localeCompare(String(a.id)));
    const hasMore = ranked.length > page * limit + limit;
    const products = ranked.slice(page * limit, page * limit + limit).map((post: any) => ({
      ...post,
      likedByCurrentUser: currentUser ? post.likes.some((like: any) => like.userId === currentUser.id) : false,
      wishlistedByCurrentUser: currentUser ? post.wishlistItems.some((item: any) => item.userId === currentUser.id) : false,
    }));
    return NextResponse.json({ products, hasMore, page });
  }

  const where: any = { isProduct: true };

  if (text) {
    where.OR = [
      { productTitle: { contains: text, mode: "insensitive" } },
      { caption: { contains: text, mode: "insensitive" } },
      { connection: { username: { contains: text, mode: "insensitive" } } },
    ];
  }

  if (tag) {
    where.tags = { some: { name: tag } };
  }

  const now = new Date();
  const pageStart = page * limit;
  const targetCount = pageStart + limit + 1;
  const visiblePosts: any[] = [];

  // Fetch enough eligible listings to cover the requested page plus one extra
  // item. The extra item tells the client whether another page exists.
  // Scan both boost buckets independently so regular listings are not skipped
  // when a bucket contains media that is no longer available on Instagram.
  const batches: any[] = [
    { boostUntil: { gt: now } },
    { OR: [{ boostUntil: null }, { boostUntil: { lte: now } }] },
  ];

  for (const boostFilter of batches) {
    let rawSkip = 0;
    while (visiblePosts.length < targetCount) {
      const batch = await db().instagramPost.findMany({
        where: { AND: [where, boostFilter] },
        include: {
          connection: true,
          tags: true,
          likes: true,
          wishlistItems: currentUser ? { where: { userId: currentUser.id } } : true,
        },
        orderBy: [{ boostUntil: "desc" }, { timestamp: "desc" }, { id: "desc" }],
        skip: rawSkip,
        take: limit,
      });
      if (!batch.length) break;
      const availableBatch = await filterAvailableInstagramMedia(batch);
      visiblePosts.push(...availableBatch);
      rawSkip += batch.length;
      if (batch.length < limit) break;
    }
    if (visiblePosts.length >= targetCount) break;
  }

  // Keep ordering deterministic across pages. Personal tag ranking is not
  // applied here because this endpoint does not load a preferredTags map.
  const rankedPosts = visiblePosts.sort((a: any, b: any) => {
    const aBoosted = !!a.boostUntil && new Date(a.boostUntil) > now;
    const bBoosted = !!b.boostUntil && new Date(b.boostUntil) > now;
    if (aBoosted !== bBoosted) return aBoosted ? -1 : 1;
    const timeDifference =
      new Date(b.timestamp || b.createdAt).getTime() -
      new Date(a.timestamp || a.createdAt).getTime();
    return timeDifference || String(b.id).localeCompare(String(a.id));
  });
  const hasMore = rankedPosts.length > pageStart + limit;
  const availableProducts = rankedPosts.slice(pageStart, pageStart + limit);
  const products = availableProducts.map((post: any) => ({
    ...post,
    likedByCurrentUser: currentUser ? post.likes.some((like: any) => like.userId === currentUser.id) : false,
    wishlistedByCurrentUser: currentUser ? post.wishlistItems.some((item: any) => item.userId === currentUser.id) : false,
  }));

  return NextResponse.json({
    products,
    hasMore,
    page,
  });
}
