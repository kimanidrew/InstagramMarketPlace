import { NextResponse } from "next/server";
import { admin } from "@/lib/auth";
import { getAiPromotionPricingConfig } from "@/lib/ai-promotion-pricing";
import { db } from "@/lib/prisma";
export const runtime = "nodejs";
export async function GET() {
  try { await admin(); } catch { return NextResponse.json({ error: "Admin access required." }, { status: 403 }); }
  const [config, pendingRefunds] = await Promise.all([
    getAiPromotionPricingConfig(),
    db().aiPromotionPayment.findMany({ where: { status: "REFUND_PENDING" }, orderBy: { updatedAt: "asc" }, take: 100, include: { project: { select: { title: true } }, user: { select: { email: true } } } }),
  ]);
  return NextResponse.json({ config, pendingRefunds: pendingRefunds.map(p => ({ id: p.id, amountKes: p.amountKes, phoneNumber: p.phoneNumber, title: p.project.title, email: p.user.email, reason: p.resultDescription, createdAt: p.updatedAt })) });
}
export async function PUT(request: Request) {
  let actor; try { actor = await admin(); } catch { return NextResponse.json({ error: "Admin access required." }, { status: 403 }); }
  let b: Record<string, unknown>; try { b = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const num = (k: string, min: number, max: number, integer = false) => {
    const v = b[k]; if (v === null && k.startsWith("override")) return null;
    if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) throw new Error("Invalid value: " + k);
    return v;
  };
  try {
    const data = {
      usdKesRate: num("usdKesRate", 50, 300), marginPercent: num("marginPercent", 0, 500),
      fixedFeeKes: num("fixedFeeKes", 0, 10000, true), minPriceKes: num("minPriceKes", 1, 1000000, true),
      override10SilentKes: num("override10SilentKes", 1, 1000000, true), override10AudioKes: num("override10AudioKes", 1, 1000000, true),
      override15SilentKes: num("override15SilentKes", 1, 1000000, true), override15AudioKes: num("override15AudioKes", 1, 1000000, true),
      enabled: b.enabled === true, updatedBy: actor.id,
    };
    const config = await db().aiPromotionPricingConfig.upsert({ where: { id: "default" }, create: { id: "default", ...data }, update: data });
    return NextResponse.json({ config });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid settings." }, { status: 400 }); }
}