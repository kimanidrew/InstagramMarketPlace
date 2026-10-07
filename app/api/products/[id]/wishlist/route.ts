import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await user();
  if (!u) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { id } = await params;
  const p = db();
  const post = await p.instagramPost.findUnique({ where: { id }, select: { id: true, isProduct: true } });
  if (!post?.isProduct) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const old = await p.wishlistItem.findUnique({ where: { userId_postId: { userId: u.id, postId: id } } });
  if (old) await p.wishlistItem.delete({ where: { id: old.id } });
  else await p.wishlistItem.create({ data: { userId: u.id, postId: id } });

  return NextResponse.json({
    wishlisted: !old,
    wishlistCount: await p.wishlistItem.count({ where: { postId: id } }),
  });
}
