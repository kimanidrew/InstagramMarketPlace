import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

function validVisitorId(value: string) {
  return /^[a-zA-Z0-9_-]{12,100}$/.test(value);
}

export async function GET(request: Request) {
  const visitorId = new URL(request.url).searchParams.get("visitorId") || "";
  if (!validVisitorId(visitorId)) return NextResponse.json({ stores: [] });

  try {
    const events = await db().analyticsEvent.findMany({
      where: { visitorId, type: "VIEW", postId: null },
      orderBy: { createdAt: "desc" },
      distinct: ["connectionId"],
      take: 200,
      select: {
        createdAt: true,
        connection: {
          select: {
            id: true,
            username: true,
            profileImageUrl: true,
            posts: {
              where: { isProduct: true, mediaUrl: { not: null } },
              select: { id: true },
            },
          },
        },
      },
    });
    const stores = events
      .map((event) => ({ ...event.connection, historyViewedAt: event.createdAt }))
      .filter((store) => store.posts.length > 0)
      .map(({ posts, ...store }) => ({ ...store, listingCount: posts.length }));
    return NextResponse.json({ stores });
  } catch {
    return NextResponse.json({ stores: [] });
  }
}

export async function DELETE(request: Request) {
  const visitorId = new URL(request.url).searchParams.get("visitorId") || "";
  if (!validVisitorId(visitorId)) return NextResponse.json({ error: "Invalid visitor." }, { status: 400 });
  const connectionId = new URL(request.url).searchParams.get("connectionId") || undefined;
  try {
    await db().analyticsEvent.deleteMany({
      where: { visitorId, type: "VIEW", postId: null, ...(connectionId ? { connectionId } : {}) },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to clear store history." }, { status: 500 });
  }
}
