import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

const validTypes = new Set(["IMPRESSION", "VIEW", "CLICK"]);
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const connectionId = String(body.connectionId || "").slice(0, 128);
    const postId = body.postId ? String(body.postId).slice(0, 128) : null;
    const visitorId = String(body.visitorId || "").slice(0, 100);
    const type = String(body.type || "").toUpperCase();
    if (!connectionId || !visitorId || !/^[a-zA-Z0-9_-]{12,100}$/.test(visitorId) || !validTypes.has(type)) return NextResponse.json({ error: "Invalid analytics event." }, { status: 400 });
    const prisma = db();
    const connection = await prisma.instagramConnection.findUnique({ where: { id: connectionId }, select: { id: true } });
    if (!connection) return NextResponse.json({ ok: true });
    if (postId) {
      const post = await prisma.instagramPost.findFirst({ where: { id: postId, connectionId, isProduct: true }, select: { id: true } });
      if (!post) return NextResponse.json({ ok: true });
    }
    let campaign = null;
    {
      campaign = await prisma.promotionCampaign.findFirst({
        where: { connectionId, status: "ACTIVE", ...(postId ? { OR: [{ targetType: "STORE" }, { targetType: "PRODUCT", postId }] } : { targetType: "STORE" }) },
        orderBy: [{ targetType: "asc" }, { createdAt: "asc" }],
        select: { id: true, targetReach: true, deliveredReach: true },
      });
    }
    if (campaign && type === "IMPRESSION") {
      const existing = await prisma.analyticsEvent.findFirst({ where: { campaignId: campaign.id, visitorId, type: "IMPRESSION", ...(postId ? { postId } : {}) }, select: { id: true } });
      if (existing) return NextResponse.json({ ok: true, deduplicated: true });
    }
    await prisma.analyticsEvent.create({ data: { connectionId, postId, visitorId, type: type as "IMPRESSION" | "VIEW" | "CLICK", campaignId: campaign?.id || null } });
    if (campaign && type === "IMPRESSION") {
      const uniqueVisitors = await prisma.analyticsEvent.groupBy({ by: ["visitorId"], where: { campaignId: campaign.id, type: "IMPRESSION" }, _count: { visitorId: true } });
      const deliveredReach = uniqueVisitors.length;
      const status = deliveredReach >= campaign.targetReach ? "COMPLETED" : "ACTIVE";
      await prisma.promotionCampaign.update({ where: { id: campaign.id }, data: { deliveredReach, status, ...(status === "COMPLETED" ? { endsAt: new Date() } : {}) } });
      if (status === "COMPLETED") {
        const completed = await prisma.promotionCampaign.findUnique({ where: { id: campaign.id }, select: { targetType: true, postId: true } });
        if (completed?.targetType === "PRODUCT" && completed.postId) await prisma.instagramPost.update({ where: { id: completed.postId }, data: { boostUntil: new Date() } });
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to record analytics." }, { status: 500 });
  }
}
