import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const visitorId = String(searchParams.get("visitorId") || "").slice(0, 100);
  const sinceValue = Number(searchParams.get("since") || 0);

  if (!/^[a-zA-Z0-9_-]{12,100}$/.test(visitorId) || !Number.isFinite(sinceValue) || sinceValue <= 0) {
    return NextResponse.json({ error: "Invalid visitor or cycle start." }, { status: 400 });
  }

  try {
    const events = await db().analyticsEvent.findMany({
      where: {
        visitorId,
        type: "VIEW",
        createdAt: { gte: new Date(sinceValue) },
      },
      select: { connectionId: true, postId: true },
    });

    const storeConnectionIds = [...new Set(events.filter((event) => !event.postId).map((event) => event.connectionId))];
    const productPostIds = [...new Set(events.filter((event) => event.postId).map((event) => event.postId as string))];

    return NextResponse.json({ storeConnectionIds, productPostIds }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ error: "Unable to load promotion view history." }, { status: 500 });
  }
}
