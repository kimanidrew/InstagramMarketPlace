import "server-only";
import { userFriendlyError } from "@/lib/user-friendly-errors";

const baseUrl = () => process.env.MPESA_ENVIRONMENT === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`M-Pesa is not configured: missing ${name}.`);
  return value;
};

export function normalizeMpesaPhone(raw: string) {
  const digits = raw.replace(/[^0-9]/g, "");
  const phone = digits.startsWith("0") ? "254" + digits.slice(1) : digits.startsWith("254") ? digits : digits.startsWith("7") || digits.startsWith("1") ? "254" + digits : "";
  if (!/^254[17]\d{8}$/.test(phone)) throw new Error("Enter a valid Kenyan M-Pesa number, e.g. 0712345678.");
  return phone;
}

async function accessToken() {
  const credentials = Buffer.from(env("MPESA_CONSUMER_KEY") + ":" + env("MPESA_CONSUMER_SECRET")).toString("base64");
  const response = await fetch(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }, cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body.access_token !== "string") throw new Error(userFriendlyError("Could not authenticate with M-Pesa. Check Daraja credentials and environment.", "mpesa"));
  return body.access_token as string;
}

export async function initiateMpesaStk(input: { phoneNumber: string; amountKes: number; accountReference: string; description: string }) {
  const shortcode = env("MPESA_SHORTCODE");
  const passkey = env("MPESA_PASSKEY");
  const callbackUrl = env("MPESA_CALLBACK_URL");
  if (!callbackUrl.startsWith("https://")) throw new Error(userFriendlyError("MPESA_CALLBACK_URL must be a public HTTPS URL.", "mpesa"));
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");
  const token = await accessToken();
  const response = await fetch(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store", signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline",
      Amount: Math.max(1, Math.round(input.amountKes)),
      PartyA: input.phoneNumber,
      PartyB: shortcode,
      PhoneNumber: input.phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: input.accountReference.slice(0, 12),
      TransactionDesc: input.description.slice(0, 13),
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || Number(body.ResponseCode) !== 0 || !body.CheckoutRequestID) {
    throw new Error(userFriendlyError(typeof body.CustomerMessage === "string" ? body.CustomerMessage : "M-Pesa could not start the payment. Check Daraja setup and try again.", "mpesa"));
  }
  return {
    merchantRequestId: String(body.MerchantRequestID || ""),
    checkoutRequestId: String(body.CheckoutRequestID),
    customerMessage: String(body.CustomerMessage || "Check your phone and enter your M-Pesa PIN."),
  };
}

export function isMpesaConfigured() {
  return Boolean(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET && process.env.MPESA_SHORTCODE && process.env.MPESA_PASSKEY && process.env.MPESA_CALLBACK_URL);
}
