import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const current = await user();
  const postId = new URL(request.url).searchParams.get("postId") || "";
  if (!postId) return NextResponse.json({ error: "Listing is required." }, { status: 400 });
  const comments = await db().postComment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true } },
      likes: { select: { userId: true } },
    },
  });
  return NextResponse.json({
    comments: comments.map(({ likes, ...comment }) => ({
      ...comment,
      likeCount: likes.length,
      likedByMe: !!current && likes.some((like) => like.userId === current.id),
    })),
  });
}

export async function POST(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Please sign in to comment." }, { status: 401 });
  let payload: { postId?: string; parentId?: string | null; body?: string };
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid comment data." }, { status: 400 }); }
  const postId = String(payload.postId || "").trim();
  const parentId = String(payload.parentId || "").trim() || null;
  const body = String(payload.body || "").trim();
  if (!postId || body.length < 1 || body.length > 1000) return NextResponse.json({ error: "Write a comment between 1 and 1000 characters." }, { status: 400 });
  const prisma = db();
  const post = await prisma.instagramPost.findUnique({ where: { id: postId }, select: { id: true, isProduct: true } });
  if (!post?.isProduct) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  if (parentId) {
    const parent = await prisma.postComment.findUnique({ where: { id: parentId }, select: { id: true, postId: true, parentId: true } });
    if (!parent || parent.postId !== postId || parent.parentId) return NextResponse.json({ error: "You can only reply to a top-level comment on this listing." }, { status: 400 });
  }
  const comment = await prisma.postComment.create({
    data: { postId, userId: current.id, parentId, body },
    include: { user: { select: { id: true, name: true } }, likes: { select: { userId: true } } },
  });
  return NextResponse.json({ comment: { ...comment, likeCount: 0, likedByMe: false } }, { status: 201 });
}
