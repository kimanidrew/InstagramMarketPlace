import { NextResponse } from "next/server";
import { admin } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    await admin();

    const body = await request.json();
    const requestId = String(body?.requestId || "");

    if (!requestId) {
      return NextResponse.json({ error: "Store request is required." }, { status: 400 });
    }

    const prisma = db();
    const storeRequest = await prisma.storeRequest.findUnique({
      where: { id: requestId },
      select: { id: true, username: true, userId: true },
    });

    if (!storeRequest) {
      return NextResponse.json({ error: "Store request not found." }, { status: 404 });
    }

    const connection = await prisma.instagramConnection.findUnique({
      where: { username: storeRequest.username },
      select: { id: true, connectedByUserId: true },
    });

    await prisma.$transaction(async (tx) => {
      if (connection && connection.connectedByUserId === storeRequest.userId) {
        await tx.instagramConnection.delete({ where: { id: connection.id } });
      }

      await tx.storeRequest.delete({ where: { id: storeRequest.id } });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to remove this store." }, { status: 500 });
  }
}
