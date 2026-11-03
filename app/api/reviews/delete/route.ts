import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function DELETE(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { type, id } = await request.json();
  const prisma = db();

  if (type !== "store") return NextResponse.json({ error: "Product reviews are no longer supported." }, { status: 400 });

  const review = await prisma.storeReview.findUnique({ where: { id: String(id || "") } });
  if (!review || review.userId !== current.id) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  await prisma.storeReview.delete({ where: { id: review.id } });

  return NextResponse.json({ ok: true });
}
