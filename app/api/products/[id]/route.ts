import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Please sign in to edit this listing." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as null | { title?: unknown; description?: unknown; category?: unknown; subcategory?: unknown; amount?: unknown; currency?: unknown };
  if (!body) return NextResponse.json({ error: "Please check the details and try again." }, { status: 400 });

  const listing = await db().instagramPost.findUnique({ where: { id }, select: { id: true, isProduct: true, connection: { select: { connectedByUserId: true } } } });
  if (!listing || !listing.isProduct) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  if (current.role !== "ADMIN" && listing.connection.connectedByUserId !== current.id) return NextResponse.json({ error: "Only the shop owner can edit this listing." }, { status: 403 });

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const subcategory = typeof body.subcategory === "string" ? body.subcategory.trim() : "";
  if (title.length < 2 || title.length > 120 || description.length > 2000 || category.length > 60 || subcategory.length > 60) {
    return NextResponse.json({ error: "Please use a name of 2–120 characters and keep the other fields within their limits." }, { status: 400 });
  }

  let priceAmount: number | null = null;
  let priceCurrency: string | null = null;
  if (body.amount !== null && body.amount !== undefined && body.amount !== "") {
    priceAmount = Number(body.amount);
    priceCurrency = typeof body.currency === "string" ? body.currency.toUpperCase() : "KES";
    if (!Number.isFinite(priceAmount) || priceAmount <= 0 || priceAmount > 10000000 || !["KES", "USD"].includes(priceCurrency)) {
      return NextResponse.json({ error: "Enter a valid price and choose KES or USD." }, { status: 400 });
    }
  }

  await db().instagramPost.update({ where: { id }, data: {
    productTitle: title,
    caption: description || null,
    category: category || null,
    subcategory: subcategory || null,
    priceAmount,
    priceCurrency,
    priceSource: priceAmount === null ? "NONE" : "MANUAL",
  } });
  return NextResponse.json({ ok: true });
}
