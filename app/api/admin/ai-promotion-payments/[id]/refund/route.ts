import { NextResponse } from "next/server";
import { admin } from "@/lib/auth";
import { db } from "@/lib/prisma";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  let actor; try { actor = await admin(); } catch { return NextResponse.json({ error: "Admin access required." }, { status: 403 }); }
  const { id } = await context.params;
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const reference = typeof body.refundReference === "string" ? body.refundReference.trim().slice(0, 100) : "";
  if (!reference) return NextResponse.json({ error: "Enter the M-Pesa refund reference after issuing the refund manually." }, { status: 400 });
  const changed = await db().aiPromotionPayment.updateMany({ where: { id, status: "REFUND_PENDING" }, data: { status: "REFUNDED", refundReference: reference, refundedAt: new Date(), resultDescription: "Refund recorded by admin " + actor.id } });
  if (!changed.count) return NextResponse.json({ error: "Payment is not awaiting refund or was already updated." }, { status: 409 });
  return NextResponse.json({ success: true });
}