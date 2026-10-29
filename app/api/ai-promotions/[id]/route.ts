import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { userFriendlyError } from "@/lib/user-friendly-errors";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const current = await user();
  if (!current) return NextResponse.json({ error: userFriendlyError("Sign in required.", "auth") }, { status: 401 });
  const { id } = await context.params;
  const project = await db().aiPromotionProject.findFirst({
    where: { id, userId: current.id },
    include: {
      connection: { select: { username: true } },
      post: { select: { productTitle: true } },
      assets: { select: { id: true, type: true, storageKey: true, contentType: true, width: true, height: true, durationMs: true, createdAt: true } },
      jobs: { orderBy: { createdAt: "desc" }, take: 5, select: { status: true, attempts: true, lastError: true, createdAt: true, updatedAt: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, amountKes: true, receiptNumber: true, resultDescription: true } },
    },
  });
  if (!project) return NextResponse.json({ error: "We couldn't find that promotion. It may have been deleted." }, { status: 404 });
  const video = project.assets.find((asset) => asset.type === "VIDEO");
  return NextResponse.json({ project: { ...project, videoUrl: video?.storageKey || null, videoReady: Boolean(video) } });
}

export async function DELETE(_request: Request, context: Context) {
  const current = await user();
  if (!current) return NextResponse.json({ error: userFriendlyError("Sign in required.", "auth") }, { status: 401 });
  const { id } = await context.params;
  const project = await db().aiPromotionProject.findFirst({
    where: { id, userId: current.id },
    select: { id: true, payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } } },
  });
  if (!project) return NextResponse.json({ error: "This promotion was not found or has already been removed." }, { status: 404 });
  const paymentStatus = project.payments[0]?.status;
  if (paymentStatus === "INITIATED" || paymentStatus === "PENDING") {
    return NextResponse.json({ error: "This promotion has a payment awaiting confirmation. Complete or cancel the payment before deleting it." }, { status: 409 });
  }
  if (paymentStatus === "REFUND_PENDING") {
    return NextResponse.json({ error: "This promotion is awaiting a refund review, so it cannot be deleted yet. Please contact support for help." }, { status: 409 });
  }
  try {
    await db().aiPromotionProject.delete({ where: { id: project.id } });
    return NextResponse.json({ ok: true, id: project.id });
  } catch (error) {
    console.error("Could not delete AI promotion project", error);
    return NextResponse.json({ error: "We couldn't delete this promotion right now. Please try again." }, { status: 500 });
  }
}
