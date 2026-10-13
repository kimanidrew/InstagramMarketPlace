import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required to reply." }, { status: 401 });

  let payload: { reviewId?: string; body?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid reply data." }, { status: 400 });
  }

  const reviewId = String(payload.reviewId || "").trim();
  const body = String(payload.body || "").trim();
  if (!reviewId || body.length < 1 || body.length > 1000) {
    return NextResponse.json({ error: "Write a reply between 1 and 1000 characters." }, { status: 400 });
  }

  const prisma = db();
  const review = await prisma.storeReview.findUnique({
    where: { id: reviewId },
    include: {
      user: { select: { id: true, name: true } },
      connection: { select: { id: true, username: true, profileImageUrl: true, connectedByUserId: true } },
    },
  });
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });

  const isStoreOwner = !!review.connection.connectedByUserId && review.connection.connectedByUserId === current.id;
  const reply = await prisma.storeReviewReply.create({
    data: {
      reviewId: review.id,
      userId: current.id,
      connectionId: isStoreOwner ? review.connection.id : null,
      body,
    },
    include: {
      user: { select: { id: true, name: true } },
      connection: { select: { id: true, username: true, profileImageUrl: true } },
    },
  });

  const href = "/store/" + encodeURIComponent(review.connection.username) + "?reviews=1";
  const notices = new Map<string, { userId: string; type: string; title: string; message: string; href: string }>();
  if (review.userId !== current.id) {
    notices.set(review.userId, {
      userId: review.userId,
      type: isStoreOwner ? "STORE_REVIEW_REPLY" : "STORE_REVIEW_COMMENT",
      title: isStoreOwner ? "The shop replied to your review" : "New reply to your review",
      message: (isStoreOwner ? "@" + review.connection.username : current.name || "A shopper") + (isStoreOwner ? " replied to your review." : " replied to your review for @" + review.connection.username + "."),
      href,
    });
  }
  const ownerId = review.connection.connectedByUserId;
  if (ownerId && ownerId !== current.id && ownerId !== review.userId) {
    notices.set(ownerId, {
      userId: ownerId,
      type: "STORE_REVIEW_REPLY",
      title: "New reply on a store review",
      message: (current.name || "A shopper") + " replied in the review conversation for @" + review.connection.username + ".",
      href,
    });
  }

  try {
    if (notices.size) await prisma.notification.createMany({ data: Array.from(notices.values()) });
  } catch (notificationError) {
    // Reply persistence is primary; notification failures should not make a saved reply look lost.
    console.error("Could not create store review reply notification", notificationError);
  }

  return NextResponse.json({ reply }, { status: 201 });
}
