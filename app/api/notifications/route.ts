import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const all = url.searchParams.get("all") === "1";
  const parsed = Number(url.searchParams.get("limit") || 8);
  const limit = Math.min(50, Math.max(1, Number.isFinite(parsed) ? parsed : 8));
  const where = { userId: current.id };
  const [notifications, unreadCount] = await Promise.all([
    db().notification.findMany({ where, orderBy: { createdAt: "desc" }, ...(all ? {} : { take: limit }) }),
    db().notification.count({ where: { userId: current.id, readAt: null } }),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

export async function POST() {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db().notification.updateMany({
    where: { userId: current.id, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
