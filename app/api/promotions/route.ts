import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

const REACH_PRICES: Record<number, number> = { 500: 100, 1000: 180, 2500: 400, 5000: 750, 10000: 1300 };
const env = () => ({
  key: process.env.MPESA_CONSUMER_KEY || "",
  secret: process.env.MPESA_CONSUMER_SECRET || "",
  shortcode: process.env.MPESA_SHORTCODE || "",
  passkey: process.env.MPESA_PASSKEY || "",
  callback: process.env.MPESA_CALLBACK_URL || "",
  base: process.env.MPESA_ENVIRONMENT === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke",
});
function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^0[17]\d{8}$/.test(digits)) return "254" + digits.slice(1);
  if (/^[17]\d{8}$/.test(digits)) return "254" + digits;
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  return "";
}
async function accessToken(base: string, key: string, secret: string) {
  const response = await fetch(base + "/oauth/v1/generate?grant_type=client_credentials", { headers: { Authorization: "Basic " + Buffer.from(key + ":" + secret).toString("base64") }, cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error("M-Pesa authentication failed. Check your Daraja API credentials.");
  return data.access_token as string;
}
export async function POST(request: Request) {
  const current = await user();
  if (!current) return NextResponse.json({ error: "Please sign in before paying for promotion." }, { status: 401 });
  const cfg = env();
  if (!cfg.key || !cfg.secret || !cfg.shortcode || !cfg.passkey || !cfg.callback || !cfg.callback.startsWith("https://")) {
    return NextResponse.json({ error: "M-Pesa is not configured yet. The marketplace owner must add the Daraja API credentials and public HTTPS callback URL." }, { status: 503 });
  }
  try {
    const body = await request.json();
    const connectionId = String(body.connectionId || "");
    const targetType = String(body.targetType || "").toUpperCase();
    const postId = body.postId ? String(body.postId) : null;
    const targetReach = Number(body.targetReach);
    const phoneNumber = normalizePhone(String(body.phoneNumber || ""));
    const amount = REACH_PRICES[targetReach];
    if (!connectionId || !["STORE", "PRODUCT"].includes(targetType) || !amount || !phoneNumber) return NextResponse.json({ error: "Choose a shop or product, a supported reach package, and a valid Kenyan M-Pesa number." }, { status: 400 });
    if (targetType === "PRODUCT" && !postId) return NextResponse.json({ error: "Choose a product to promote." }, { status: 400 });
    const prisma = db();
    const connection = await prisma.instagramConnection.findFirst({ where: { id: connectionId, connectedByUserId: current.id }, select: { id: true, username: true } });
    if (!connection) return NextResponse.json({ error: "That shop is not connected to your account." }, { status: 404 });
    if (targetType === "PRODUCT") {
      const post = await prisma.instagramPost.findFirst({ where: { id: postId!, connectionId, isProduct: true }, select: { id: true } });
      if (!post) return NextResponse.json({ error: "That product was not found in this shop." }, { status: 404 });
    }
    const campaign = await prisma.promotionCampaign.create({ data: { userId: current.id, connectionId, postId: targetType === "PRODUCT" ? postId : null, targetType: targetType as "STORE" | "PRODUCT", targetReach, amount, status: "PENDING_PAYMENT" } });
    const payment = await prisma.promotionPayment.create({ data: { campaignId: campaign.id, phoneNumber, amount, status: "INITIATED" } });
    try {
      const token = await accessToken(cfg.base, cfg.key, cfg.secret);
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
      const password = Buffer.from(cfg.shortcode + cfg.passkey + timestamp).toString("base64");
      const response = await fetch(cfg.base + "/mpesa/stkpush/v1/processrequest", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          BusinessShortCode: cfg.shortcode, Password: password, Timestamp: timestamp, TransactionType: "CustomerPayBillOnline",
          Amount: amount, PartyA: phoneNumber, PartyB: cfg.shortcode, PhoneNumber: phoneNumber,
          CallBackURL: cfg.callback, AccountReference: ("IM-" + campaign.id).slice(0, 12),
          TransactionDesc: "Marketplace promotion " + targetReach + " reach",
        }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || data.ResponseCode !== "0" || !data.CheckoutRequestID) throw new Error(data.errorMessage || data.ResponseDescription || "M-Pesa could not start the payment prompt.");
      await prisma.promotionPayment.update({ where: { id: payment.id }, data: { status: "PENDING", merchantRequestId: data.MerchantRequestID || null, checkoutRequestId: data.CheckoutRequestID } });
      return NextResponse.json({ ok: true, campaignId: campaign.id, checkoutRequestId: data.CheckoutRequestID, message: "M-Pesa prompt sent. Enter your PIN on your phone to complete payment." });
    } catch (error) {
      await prisma.promotionPayment.update({ where: { id: payment.id }, data: { status: "FAILED", resultDescription: error instanceof Error ? error.message : "Payment initiation failed." } });
      await prisma.promotionCampaign.update({ where: { id: campaign.id }, data: { status: "FAILED" } });
      return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start M-Pesa payment." }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Unable to create promotion. Please try again." }, { status: 500 });
  }
}
