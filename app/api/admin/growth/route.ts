import { NextResponse } from "next/server";
import { admin } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  try { await admin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const body = await request.json();
  const id = String(body.id || "");
  const status = String(body.status || "");
  if (!id || !["APPROVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const prisma = db();
  const growth = await prisma.growthRequest.findUnique({ where: { id }, include: { offering: true, connection: { select: { username: true } } } });
  if (!growth) return NextResponse.json({ error: "Growth request not found." }, { status: 404 });
  if (growth.status !== "PENDING") return NextResponse.json({ error: "Request already reviewed." }, { status: 409 });

  const code = growth.type.toUpperCase();
  const label = growth.offering?.name || (code === "VERIFIED" ? "Verified Shop" : code === "PRO" ? "Pro Seller" : code === "BOOST" ? "Product Boost" : growth.type);
  const username = growth.connection.username;
  if (status === "REJECTED") {
    await prisma.$transaction([
      prisma.growthRequest.update({ where: { id }, data: { status: "REJECTED", reviewedAt: new Date() } }),
      prisma.notification.create({ data: {
        userId: growth.userId,
        type: "GROWTH_REQUEST_REJECTED",
        title: label + " request update",
        message: "Your " + label + " request for @" + username + " was not approved.",
        href: "/account/analytics",
      } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const now = new Date();
  const durationDays = growth.durationDays || growth.offering?.durationDays || (code === "VERIFIED" ? 365 : code === "PRO" ? 30 : 7);
  await prisma.$transaction(async (tx) => {
    await tx.growthRequest.update({ where: { id }, data: { status: "APPROVED", reviewedAt: now } });
    await tx.notification.create({ data: {
      userId: growth.userId,
      type: "GROWTH_REQUEST_APPROVED",
      title: label + " request approved",
      message: "Your " + label + " request for @" + username + " has been approved.",
      href: "/account/analytics",
    } });
    if (code === "VERIFIED") {
      const until = new Date(now);
      until.setDate(until.getDate() + durationDays);
      await tx.instagramConnection.update({ where: { id: growth.connectionId }, data: { verifiedAt: now, verifiedUntil: until } });
    } else if (code === "PRO") {
      const until = new Date(now);
      until.setDate(until.getDate() + durationDays);
      await tx.instagramConnection.update({ where: { id: growth.connectionId }, data: { proUntil: until } });
    } else if (code === "BOOST" && growth.postId) {
      const until = new Date(now);
      until.setDate(until.getDate() + durationDays);
      await tx.instagramPost.update({ where: { id: growth.postId }, data: { boostUntil: until } });
    }
  });
  return NextResponse.json({ ok: true });
}
