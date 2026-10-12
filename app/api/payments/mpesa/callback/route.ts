import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const callback = payload?.Body?.stkCallback;
    if (!callback?.CheckoutRequestID) return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    const prisma = db();
    const payment = await prisma.promotionPayment.findUnique({ where: { checkoutRequestId: String(callback.CheckoutRequestID) }, include: { campaign: { include: { post: true } } } });
    if (!payment || payment.status === "PAID") return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    if (Number(callback.ResultCode) !== 0) {
      await prisma.promotionPayment.update({ where: { id: payment.id }, data: { status: "FAILED", resultCode: String(callback.ResultCode), resultDescription: String(callback.ResultDesc || "Payment was not completed.") } });
      await prisma.promotionCampaign.update({ where: { id: payment.campaignId }, data: { status: "FAILED" } });
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Recorded" });
    }
    const items = Array.isArray(callback.CallbackMetadata?.Item) ? callback.CallbackMetadata.Item as Array<{ Name?: string; Value?: string | number }> : [];
    const get = (name: string) => items.find(item => item.Name === name)?.Value;
    const paidAmount = Number(get("Amount"));
    const receipt = String(get("MpesaReceiptNumber") || "");
    const phone = String(get("PhoneNumber") || "");
    if (paidAmount !== payment.amount || !receipt || (phone && phone !== payment.phoneNumber)) {
      await prisma.promotionPayment.update({ where: { id: payment.id }, data: { status: "FAILED", resultCode: "VALIDATION_FAILED", resultDescription: "Payment callback did not match the expected amount or phone number." } });
      await prisma.promotionCampaign.update({ where: { id: payment.campaignId }, data: { status: "FAILED" } });
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Validation failed" });
    }
    await prisma.$transaction(async tx => {
      await tx.promotionPayment.update({ where: { id: payment.id }, data: { status: "PAID", receiptNumber: receipt, resultCode: "0", resultDescription: "Payment confirmed", paidAt: new Date() } });
      await tx.promotionCampaign.update({ where: { id: payment.campaignId }, data: { status: payment.campaign.targetReach <= payment.campaign.deliveredReach ? "COMPLETED" : "ACTIVE", startsAt: new Date(), ...(payment.campaign.targetReach <= payment.campaign.deliveredReach ? { endsAt: new Date() } : {}) } });
      if (payment.campaign.targetType === "PRODUCT" && payment.campaign.postId) {
        await tx.instagramPost.update({ where: { id: payment.campaign.postId }, data: { boostUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
      }
    });
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Payment confirmed" });
  } catch {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
