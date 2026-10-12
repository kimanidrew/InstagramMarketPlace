import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function DELETE() {
  const currentUser = await user();
  if (!currentUser) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  await db().recentlyViewedProduct.deleteMany({ where: { userId: currentUser.id } });
  return NextResponse.json({ ok: true });
}
