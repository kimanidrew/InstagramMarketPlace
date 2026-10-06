import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await request.json();
  const type = body.type === "store" ? "store" : "product";
  const targetId = String(body.targetId || "");
  const rating = Number(body.rating);
  const reviewBody = String(body.body || "").trim();

  if (!targetId || !Number.isInteger(rating) || rating < 1 || rating > 5 || reviewBody.length < 3 || reviewBody.length > 1000) {
    return NextResponse.json({ error: "Please provide a 1–5 star rating and a review between 3 and 1000 characters." }, { status: 400 });
  }

  const prisma = db();

  if (type === "store") {
    const store = await prisma.instagramConnection.findUnique({ where: { id: targetId } });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const review = await prisma.storeReview.upsert({
      where: { userId_connectionId: { userId: current.id, connectionId: targetId } },
      create: { userId: current.id, connectionId: targetId, rating, body: reviewBody },
      update: { rating, body: reviewBody },
      include: { user: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ review });
  }

  const product = await prisma.instagramPost.findUnique({ where: { id: targetId } });
  if (!product || !product.isProduct) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const review = await prisma.productReview.upsert({
    where: { userId_postId: { userId: current.id, postId: targetId } },
    create: { userId: current.id, postId: targetId, rating, body: reviewBody },
    update: { rating, body: reviewBody },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ review });
}
