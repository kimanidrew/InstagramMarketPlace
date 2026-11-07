import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { sync } from "@/lib/instagram";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Please sign in to sync this shop." }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { connectionId?: string };
  if (!body.connectionId) return NextResponse.json({ error: "Choose a shop to sync." }, { status: 400 });

  const connection = await db().instagramConnection.findUnique({
    where: { id: body.connectionId },
    select: { id: true, connectedByUserId: true, lastManualSyncAt: true, status: true },
  });
  if (!connection) return NextResponse.json({ error: "Shop not found." }, { status: 404 });
  if (current.role !== "ADMIN" && connection.connectedByUserId !== current.id) {
    return NextResponse.json({ error: "You do not have permission to sync this shop." }, { status: 403 });
  }
  if (connection.status === "NEEDS_RECONNECT") {
    return NextResponse.json({ error: "Reconnect Instagram before syncing this shop." }, { status: 409 });
  }

  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  const claimed = await db().instagramConnection.updateMany({
    where: { id: connection.id, OR: [{ lastManualSyncAt: null }, { lastManualSyncAt: { lte: cutoff } }] },
    data: { lastManualSyncAt: new Date() },
  });
  if (!claimed.count) {
    return NextResponse.json({ error: "You can sync this shop again 15 minutes after the previous manual sync." }, { status: 429 });
  }

  try {
    const products = await sync(connection.id);
    return NextResponse.json({ ok: true, products });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Instagram sync failed." }, { status: 502 });
  }
}
