import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Please sign in to like comments." }, { status: 401 });
  let payload: { commentId?: string };
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const commentId = String(payload.commentId || "").trim();
  if (!commentId) return NextResponse.json({ error: "Comment is required." }, { status: 400 });
  const prisma = db();
  const comment = await prisma.postComment.findUnique({ where: { id: commentId }, select: { id: true } });
  if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  const existing = await prisma.postCommentLike.findUnique({ where: { commentId_userId: { commentId, userId: current.id } } });
  if (existing) {
    await prisma.postCommentLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false, likeCount: await prisma.postCommentLike.count({ where: { commentId } }) });
  }
  await prisma.postCommentLike.create({ data: { commentId, userId: current.id } });
  return NextResponse.json({ liked: true, likeCount: await prisma.postCommentLike.count({ where: { commentId } }) });
}
