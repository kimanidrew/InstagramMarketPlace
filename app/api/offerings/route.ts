import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const prisma = db();
  const [offerings, audienceSize] = await Promise.all([
    prisma.growthOffering.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.user.count({ where: { role: "USER" } }),
  ]);
  return NextResponse.json({
    audienceSize,
    offerings: offerings.map((item) => ({
      ...item,
      effectiveReach: item.category === "PROMOTION" ? (item.reachMode === "ALL_USERS" ? audienceSize : item.targetReach) : 0,
    })),
  });
}
