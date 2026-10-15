import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function DELETE(request: Request) {
  const currentUser = await user();
  if (!currentUser) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  let postId: string | undefined;
  try {
    const body = await request.json();
    postId = typeof body?.postId === "string" ? body.postId : undefined;
  } catch {
    // An empty body means clear the entire product history.
  }

  await db().recentlyViewedProduct.deleteMany({
    where: { userId: currentUser.id, ...(postId ? { postId } : {}) },
  });
  return NextResponse.json({ ok: true });
}
