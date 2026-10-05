import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { sync } from "@/lib/instagram";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await db().instagramConnection.findMany({
    select: { id: true, username: true },
    orderBy: { updatedAt: "asc" },
  });

  const results: Array<{
    username: string;
    ok: boolean;
    products?: number;
    error?: string;
  }> = [];

  for (const connection of connections) {
    try {
      const products = await sync(connection.id);
      results.push({ username: connection.username, ok: true, products });
    } catch (error) {
      results.push({
        username: connection.username,
        ok: false,
        error: error instanceof Error ? error.message : "Sync failed",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    checked: connections.length,
    results,
  });
}
