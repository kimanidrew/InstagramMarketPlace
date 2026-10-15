import { NextResponse } from "next/server";
import { admin } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function normalize(body: any) {
  const category = String(body.category || "").toUpperCase();
  const targetTypeRaw = String(body.targetType || "").toUpperCase();
  const reachMode = String(body.reachMode || "FIXED").toUpperCase();
  const code = String(body.code || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const name = String(body.name || "").trim();
  const price = Number(body.price);
  const targetReach = Number(body.targetReach || 0);
  const durationDays = Number(body.durationDays);
  const sortOrder = Number(body.sortOrder || 0);
  const features = Array.isArray(body.features)
    ? body.features.map((value: unknown) => String(value).trim()).filter(Boolean).slice(0, 20)
    : String(body.features || "").split("\n").map((value: string) => value.trim()).filter(Boolean).slice(0, 20);
  if (!code || !name || !["PROMOTION", "GROWTH"].includes(category)) throw new Error("Enter a name, code and valid offering category.");
  if (!Number.isInteger(price) || price < 0 || !Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650) throw new Error("Price must be zero or more and duration must be between 1 and 3,650 days.");
  if (!Number.isInteger(targetReach) || targetReach < 0 || !Number.isInteger(sortOrder)) throw new Error("Reach and display order must be whole numbers.");
  if (!["FIXED", "ALL_USERS"].includes(reachMode)) throw new Error("Choose a valid audience reach mode.");
  const targetType = category === "PROMOTION" ? targetTypeRaw : "";
  if (category === "PROMOTION" && !["STORE", "PRODUCT"].includes(targetType)) throw new Error("Promotion offerings must target a store or a product.");
  if (category === "PROMOTION" && reachMode === "FIXED" && targetReach < 1) throw new Error("Fixed reach must be at least one user.");
  return {
    code, name, category: category as "PROMOTION" | "GROWTH",
    targetType: targetType ? targetType as "STORE" | "PRODUCT" : null,
    description: String(body.description || "").trim(),
    price, targetReach: reachMode === "ALL_USERS" ? 0 : targetReach,
    reachMode, durationDays, features,
    active: body.active !== false && body.active !== "false",
    sortOrder,
  };
}

export async function GET() {
  try { await admin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const prisma = db();
  const [offerings, audienceSize, campaigns, requests] = await Promise.all([
    prisma.growthOffering.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.promotionCampaign.count(),
    prisma.growthRequest.count(),
  ]);
  return NextResponse.json({ offerings, audienceSize, campaigns, requests });
}

export async function POST(request: Request) {
  try { await admin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  try {
    const data = normalize(await request.json());
    const created = await db().growthOffering.create({ data });
    return NextResponse.json({ offering: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.code === "P2002" ? "That offering code is already in use." : error instanceof Error ? error.message : "Unable to create offering." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try { await admin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "Offering id is required." }, { status: 400 });
    const data = normalize(body);
    const offering = await db().growthOffering.update({ where: { id }, data });
    return NextResponse.json({ offering });
  } catch (error: any) {
    return NextResponse.json({ error: error?.code === "P2002" ? "That offering code is already in use." : error instanceof Error ? error.message : "Unable to update offering." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try { await admin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Offering id is required." }, { status: 400 });
  try {
    await db().growthOffering.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete offering." }, { status: 400 });
  }
}
