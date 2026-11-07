import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Please sign in to update this price." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({})) as { amount?: unknown; currency?: unknown };
  const post = await db().instagramPost.findUnique({
    where: { id },
    select: { id: true, connection: { select: { connectedByUserId: true } } },
  });
  if (!post) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  if (current.role !== "ADMIN" && post.connection.connectedByUserId !== current.id) {
    return NextResponse.json({ error: "Only this shop owner can edit the price." }, { status: 403 });
  }

  if (body.amount === null || body.amount === "") {
    await db().instagramPost.update({ where: { id }, data: { priceAmount: null, priceCurrency: null, priceSource: "NONE" } });
    return NextResponse.json({ ok: true });
  }

  const amount = Number(body.amount);
  const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : "KES";
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000 || !["KES", "USD"].includes(currency)) {
    return NextResponse.json({ error: "Enter a valid amount and choose KES or USD." }, { status: 400 });
  }
  await db().instagramPost.update({
    where: { id },
    data: { priceAmount: amount, priceCurrency: currency, priceSource: "MANUAL" },
  });
  return NextResponse.json({ ok: true });
}
