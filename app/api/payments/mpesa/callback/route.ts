import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
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
    const key = process.env.MPESA_CONSUMER_KEY || "";
    const secret = process.env.MPESA_CONSUMER_SECRET || "";
    const shortcode = process.env.MPESA_SHORTCODE || "";
    const passkey = process.env.MPESA_PASSKEY || "";
    const base = process.env.MPESA_ENVIRONMENT === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
    if (!key || !secret || !shortcode || !passkey) return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    const authResponse = await fetch(base + "/oauth/v1/generate?grant_type=client_credentials", { headers: { Authorization: "Basic " + Buffer.from(key + ":" + secret).toString("base64") }, cache: "no-store" });
    const authData = await authResponse.json();
    if (!authResponse.ok || !authData.access_token) return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");
    const queryResponse = await fetch(base + "/mpesa/stkpushquery/v1/query", {
      method: "POST",
      headers: { Authorization: "Bearer " + authData.access_token, "Content-Type": "application/json" },
      body: JSON.stringify({ BusinessShortCode: shortcode, Password: password, Timestamp: timestamp, CheckoutRequestID: String(callback.CheckoutRequestID) }),
      cache: "no-store",
    });
    const queryData = await queryResponse.json();
    if (!queryResponse.ok || String(queryData.ResponseCode) !== "0" || String(queryData.ResultCode) !== "0") return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
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
        await tx.instagramPost.update({ where: { id: payment.campaign.postId }, data: { boostUntil: payment.campaign.endsAt || new Date(Date.now() + payment.campaign.durationDays * 24 * 60 * 60 * 1000) } });
      }
    });
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Payment confirmed" });
  } catch {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
