import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  const currentUser = await user();
  if (!currentUser) return NextResponse.redirect(new URL("/login", request.url));

  const form = await request.formData();
  const connectionId = String(form.get("connectionId") || "").trim();
  if (!connectionId) {
    return NextResponse.redirect(new URL("/account?storeTerminationError=invalid", request.url));
  }

  const database = db();
  const connection = await database.instagramConnection.findFirst({
    where: { id: connectionId, connectedByUserId: currentUser.id },
    select: { id: true, username: true },
  });

  if (!connection) {
    return NextResponse.redirect(new URL("/account?storeTerminationError=notfound", request.url));
  }

  await database.$transaction(async (tx) => {
    await tx.instagramConnection.delete({
      where: { id: connection.id },
    });
    await tx.storeRequest.deleteMany({
      where: {
        userId: currentUser.id,
        username: { equals: connection.username, mode: "insensitive" },
      },
    });
  });

  return NextResponse.redirect(new URL("/account?storeTerminated=1", request.url));
}
