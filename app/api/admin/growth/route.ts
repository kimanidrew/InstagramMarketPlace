import { NextResponse } from "next/server";
import { admin } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  try { await admin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const body = await request.json();
  const id = String(body.id || "");
  const status = String(body.status || "");
  if (!id || !["APPROVED","REJECTED"].includes(status)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const prisma = db();
  const growth = await prisma.growthRequest.findUnique({ where: { id } });
  if (!growth) return NextResponse.json({ error: "Growth request not found." }, { status: 404 });
  if (growth.status !== "PENDING") return NextResponse.json({ error: "Request already reviewed." }, { status: 409 });

  if (status === "REJECTED") {
    await prisma.$transaction([
      prisma.growthRequest.update({ where: { id }, data: { status: "REJECTED", reviewedAt: new Date() } }),
      prisma.notification.create({
        data: {
          userId: growth.userId,
          type: "GROWTH_REQUEST_REJECTED",
          title: `${growth.type === "BOOST" ? "Boost" : growth.type === "VERIFIED" ? "Verified badge" : "Pro Seller"} request update`,
          message: `Your ${growth.type.toLowerCase()} request for @${(await prisma.instagramConnection.findUnique({where:{id:growth.connectionId},select:{username:true}}))?.username ?? "your shop"} was not approved.`,
          href: "/account/analytics",
        },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.growthRequest.update({ where: { id }, data: { status: "APPROVED", reviewedAt: now } });
    const connection = await tx.instagramConnection.findUnique({ where: { id: growth.connectionId }, select: { username: true } });
    await tx.notification.create({
      data: {
        userId: growth.userId,
        type: "GROWTH_REQUEST_APPROVED",
        title: `${growth.type === "BOOST" ? "Boost" : growth.type === "VERIFIED" ? "Verified badge" : "Pro Seller"} request approved`,
        message: `Your ${growth.type.toLowerCase()} request for @${connection?.username ?? "your shop"} has been approved.`,
        href: "/account/analytics",
      },
    });
    if (growth.type === "VERIFIED") {
      const until = new Date(now);
      until.setDate(until.getDate() + 365);
      await tx.instagramConnection.update({ where: { id: growth.connectionId }, data: { verifiedAt: now, verifiedUntil: until } });
    } else if (growth.type === "PRO") {
      const until = new Date(now);
      until.setDate(until.getDate() + 30);
      await tx.instagramConnection.update({ where: { id: growth.connectionId }, data: { proUntil: until } });
    } else if (growth.type === "BOOST" && growth.postId) {
      const until = new Date(now);
      until.setDate(until.getDate() + 7);
      await tx.instagramPost.update({ where: { id: growth.postId }, data: { boostUntil: until } });
    }
  });
  return NextResponse.json({ ok: true });
}
