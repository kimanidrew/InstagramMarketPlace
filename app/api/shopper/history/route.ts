import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { filterAvailableInstagramMedia } from "@/lib/instagram-media";

export async function GET() {
  const currentUser = await user();
  if (!currentUser) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const items = await db().recentlyViewedProduct.findMany({
    where: { userId: currentUser.id, post: { isProduct: true } },
    include: { post: { include: {
      connection: true, tags: true, likes: true,
      wishlistItems: { where: { userId: currentUser.id } },
    } } },
    orderBy: { lastViewedAt: "desc" },
    take: 200,
  });
  const products = await filterAvailableInstagramMedia(items.map((item) => ({
    ...item.post, historyViewedAt: item.lastViewedAt,
  })));
  return NextResponse.json({ products });
}

export async function DELETE(request: Request) {
  const currentUser = await user();
  if (!currentUser) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  let postId: string | undefined;
  try {
    const body = await request.json();
    postId = typeof body?.postId === "string" ? body.postId : undefined;
  } catch {
    // An empty body means clear the entire product history.
  }

  await db().recentlyViewedProduct.deleteMany({
    where: { userId: currentUser.id, ...(postId ? { postId } : {}) },
  });
  return NextResponse.json({ ok: true });
}
