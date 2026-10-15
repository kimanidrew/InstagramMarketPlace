import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tags = await db().productTag.groupBy({
      by: ["name"],
      where: {
        type: "PRODUCT",
        post: { isProduct: true },
        NOT: { name: { equals: "#blessup", mode: "insensitive" } },
      },
      _count: { postId: true },
      orderBy: { _count: { postId: "desc" } },
      take: 8,
    });

    return NextResponse.json({
      tags: tags
        .filter((tag) => tag.name.trim())
        .map((tag) => ({ name: tag.name, productCount: tag._count.postId })),
    });
  } catch (error) {
    console.error("Unable to load trending product tags:", error);
    return NextResponse.json({ tags: [] }, { status: 200 });
  }
}
