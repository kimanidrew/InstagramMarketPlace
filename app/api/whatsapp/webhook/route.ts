import { NextResponse } from "next/server";
import { handleWhatsAppMessage, verifyWhatsAppSignature, type WhatsAppIncomingMessage } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && expectedToken && token === expectedToken && challenge) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyWhatsAppSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: {
    entry?: Array<{
      changes?: Array<{
        value?: {
          contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
          messages?: WhatsAppIncomingMessage[];
        };
      }>;
    }>;
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  try {
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        for (const message of value?.messages || []) {
          const contact = value?.contacts?.find((item) => item.wa_id === message.from);
          await handleWhatsAppMessage(message, contact?.profile?.name);
        }
      }
    }
    // Status-only webhook events are intentionally acknowledged without processing.
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("SokoLink WhatsApp webhook processing failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Message processing failed; Meta may retry this event." }, { status: 500 });
  }
}
