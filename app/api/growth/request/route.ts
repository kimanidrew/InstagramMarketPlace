import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

const PRICES = { BOOST: 150, VERIFIED: 999, PRO: 499 };

export async function POST(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await request.json();
  const type = String(body.type || "").toUpperCase() as keyof typeof PRICES;
  const connectionId = String(body.connectionId || "");
  const postId = body.postId ? String(body.postId) : null;

  if (!(type in PRICES) || !connectionId) return NextResponse.json({ error: "Invalid growth request." }, { status: 400 });

  const prisma = db();
  const connection = await prisma.instagramConnection.findFirst({
    where: { id: connectionId, connectedByUserId: current.id },
  });
  if (!connection) return NextResponse.json({ error: "Shop not found." }, { status: 404 });

  if (type === "BOOST") {
    if (!postId) return NextResponse.json({ error: "Choose a product to boost." }, { status: 400 });
    const post = await prisma.instagramPost.findFirst({ where: { id: postId, connectionId, isProduct: true } });
    if (!post) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const pending = await prisma.growthRequest.findFirst({
    where: { connectionId, postId: type === "BOOST" ? postId : null, type, status: "PENDING" },
  });
  if (pending) return NextResponse.json({ request: pending, message: "A request is already waiting for review." });

  const growth = await prisma.growthRequest.create({
    data: { userId: current.id, connectionId, postId, type, amount: PRICES[type] },
  });
  return NextResponse.json({ request: growth });
}
