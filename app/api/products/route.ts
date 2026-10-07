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

  // Media availability is checked after the database query. Fetch raw pages until
  // we have a full visible batch; otherwise unavailable Instagram media can create
  // large gaps in the masonry list and make valid products appear to be missing.
  const pageStart = page * limit;
  let rawSkip = pageStart;
  let hasMore = true;
  const visiblePosts: any[] = [];

  while (visiblePosts.length < limit && hasMore) {
    const batch = await db().instagramPost.findMany({
      where,
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

    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    const availableBatch = await filterAvailableInstagramMedia(batch);
    visiblePosts.push(...availableBatch);
    rawSkip += batch.length;
    hasMore = batch.length === limit;
  }

  const availableProducts = visiblePosts.slice(0, limit);
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
