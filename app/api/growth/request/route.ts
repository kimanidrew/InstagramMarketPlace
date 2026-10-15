import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await request.json();
  const offeringId = String(body.offeringId || "");
  const connectionId = String(body.connectionId || "");
  const postId = body.postId ? String(body.postId) : null;
  if (!offeringId || !connectionId) return NextResponse.json({ error: "Choose a growth plan and shop." }, { status: 400 });

  const prisma = db();
  const [connection, offering] = await Promise.all([
    prisma.instagramConnection.findFirst({ where: { id: connectionId, connectedByUserId: current.id }, select: { id: true, username: true } }),
    prisma.growthOffering.findFirst({ where: { id: offeringId, category: "GROWTH", active: true } }),
  ]);
  if (!connection) return NextResponse.json({ error: "Shop not found." }, { status: 404 });
  if (!offering) return NextResponse.json({ error: "That growth plan is no longer available. Refresh and try again." }, { status: 400 });

  const code = offering.code.toUpperCase();
  if (code === "BOOST") {
    if (!postId) return NextResponse.json({ error: "Choose a product to boost." }, { status: 400 });
    const post = await prisma.instagramPost.findFirst({ where: { id: postId, connectionId, isProduct: true } });
    if (!post) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const pending = await prisma.growthRequest.findFirst({
    where: { connectionId, postId: code === "BOOST" ? postId : null, type: code, status: "PENDING" },
  });
  if (pending) return NextResponse.json({ request: pending, message: "A request for this plan is already waiting for review." });

  const growth = await prisma.growthRequest.create({
    data: { userId: current.id, connectionId, postId: code === "BOOST" ? postId : null, type: code, amount: offering.price, offeringId: offering.id, durationDays: offering.durationDays, offeringName: offering.name, offeringFeatures: offering.features },
  });
  return NextResponse.json({ request: growth, message: "Your " + offering.name + " request has been sent for admin review." });
}
