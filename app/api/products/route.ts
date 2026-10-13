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
        where: { ...where, ...boostFilter },
        include: {
          connection: true,
          tags: true,
          likes: true,
          wishlistItems: currentUser ? { where: { userId: currentUser.id } } : true,
        },
        orderBy: [{ boostUntil: "desc" }, { timestamp: "desc" }, { id: "desc" }],
        skip: rawSkip,
        take: Math.min(limit, targetCount - visiblePosts.length + limit),
      });
      if (!batch.length) break;
      const availableBatch = await filterAvailableInstagramMedia(batch);
      visiblePosts.push(...availableBatch);
      rawSkip += batch.length;
      if (batch.length < Math.min(limit, targetCount - (visiblePosts.length - availableBatch.length) + limit)) break;
    }
    if (visiblePosts.length >= targetCount) break;
  }

  const rankedPosts = visiblePosts.sort((a: any, b: any) => {
    const aBoosted = !!a.boostUntil && new Date(a.boostUntil) > now;
    const bBoosted = !!b.boostUntil && new Date(b.boostUntil) > now;
    if (aBoosted !== bBoosted) return aBoosted ? -1 : 1;
    const score = (post: any) => post.tags?.reduce((sum: number, item: any) => sum + (preferredTags.get(String(item.name).toLowerCase()) || 0), 0) || 0;
    const personal = score(b) - score(a);
    if (personal) return personal;
    return new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime();
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
