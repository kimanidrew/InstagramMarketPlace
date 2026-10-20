import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/prisma";

type WhatsAppIncomingMessage = {
  id: string;
  from: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: {
    button_reply?: { title?: string; id?: string };
    list_reply?: { title?: string; id?: string };
  };
};

type Listing = {
  id: string;
  productTitle: string | null;
  caption: string | null;
  mediaType: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  mediaItems?: unknown;
  productSlug: string | null;
  category: string | null;
  subcategory: string | null;
  listingType: "PRODUCT" | "SERVICE";
  connection: { username: string };
  tags: { name: string }[];
};

const graphVersion = () => (process.env.WHATSAPP_GRAPH_API_VERSION || "v24.0").replace(/^v?/, "v");
const siteUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://instagram-market-place.vercel.app";
  return configuredUrl.endsWith("/") ? configuredUrl.slice(0, -1) : configuredUrl;
};

export function verifyWhatsAppSignature(rawBody: string, signature: string | null) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !signature?.startsWith("sha256=")) return false;
  const received = Buffer.from(signature.slice(7), "hex");
  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function apiConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) throw new Error("WhatsApp Cloud API credentials are not configured.");
  return { accessToken, phoneNumberId };
}

async function callWhatsApp(payload: Record<string, unknown>) {
  const { accessToken, phoneNumberId } = apiConfig();
  const response = await fetch(`https://graph.facebook.com/${graphVersion()}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Do not log credentials or echo the access token to callers.
    console.error("WhatsApp Cloud API request failed", response.status, JSON.stringify(result).slice(0, 1200));
    throw new Error(`WhatsApp Cloud API returned HTTP ${response.status}.`);
  }
  return result as { messages?: Array<{ id?: string }> };
}

async function recordOutbound(waId: string, messageId: string | undefined, type: string, body: string) {
  if (!messageId) return;
  const conversation = await db().whatsAppConversation.findUnique({ where: { waId }, select: { id: true } });
  if (!conversation) return;
  await db().whatsAppMessage.upsert({
    where: { waMessageId: messageId },
    create: { waMessageId: messageId, conversationId: conversation.id, direction: "OUTBOUND", type, body, status: "SENT" },
    update: { status: "SENT" },
  });
}

export async function sendWhatsAppText(to: string, body: string) {
  const result = await callWhatsApp({
    to,
    type: "text",
    text: { preview_url: true, body: body.slice(0, 4096) },
  });
  await recordOutbound(to, result.messages?.[0]?.id, "text", body);
}

async function sendWhatsAppImage(to: string, imageUrl: string, caption: string) {
  const result = await callWhatsApp({
    to,
    type: "image",
    image: { link: imageUrl, caption: caption.slice(0, 1024) },
  });
  await recordOutbound(to, result.messages?.[0]?.id, "image", caption);
}

function messageText(message: WhatsAppIncomingMessage) {
  if (message.type === "text") return message.text?.body?.trim() || "";
  return (
    message.interactive?.button_reply?.title ||
    message.interactive?.list_reply?.title ||
    message.button?.text ||
    ""
  ).trim();
}

function isGreeting(text: string) {
  return /^(hi|hello|hey|habari|niaje|sasa|start|menu|help|hey there|good morning|good afternoon|good evening)[!.\s]*$/i.test(text);
}

function searchTerms(query: string) {
  const ignored = new Set(["find", "show", "me", "please", "i", "want", "need", "looking", "for", "a", "an", "the", "some", "any", "buy", "get", "search", "product", "products", "service", "services", "in", "at", "near", "around", "under", "below", "less", "than", "ksh", "kes", "sh", "price", "with", "and", "or", "on", "from", "sok olink"]);
  return Array.from(new Set(query.toLowerCase().normalize("NFKC").match(/[\p{L}\p{N}]+/gu) || []))
    .filter((term) => term.length > 1 && !ignored.has(term))
    .slice(0, 8);
}

type SearchIntent = { terms: string[]; listingType: "PRODUCT" | "SERVICE" | "ANY" };

async function interpretSearch(query: string): Promise<SearchIntent> {
  const fallbackType = /\b(service|services|hire|book|plumber|electrician|cleaner|photographer|salon|repair|tutor|delivery)\b/i.test(query)
    ? "SERVICE"
    : "ANY";
  const fallback = { terms: searchTerms(query), listingType: fallbackType as SearchIntent["listingType"] };
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Extract a shopping search from the user message. Return a JSON object with a terms array of strings and listingType set to PRODUCT, SERVICE, or ANY. Include useful item, category, service, brand, and location words that could occur in listing captions or categories. Remove greetings, filler, currency or budget numbers, and generic shopping words. Use SERVICE only when clearly looking for a service/provider, PRODUCT only for a physical product, otherwise ANY. Never invent details.",
          },
          { role: "user", content: query.slice(0, 1000) },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return fallback;
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallback;
    const parsed = JSON.parse(content) as { terms?: unknown; listingType?: unknown };
    const terms = Array.isArray(parsed.terms)
      ? Array.from(new Set(parsed.terms.filter((term): term is string => typeof term === "string")
          .map((term) => term.toLowerCase().trim())
          .filter((term) => term.length > 1 && term.length <= 40 && /[\p{L}]/u.test(term)))
        ).slice(0, 8)
      : [];
    const listingType = parsed.listingType === "PRODUCT" || parsed.listingType === "SERVICE" || parsed.listingType === "ANY"
      ? parsed.listingType
      : "ANY";
    return { terms: terms.length ? terms : fallback.terms, listingType };
  } catch {
    // Search remains available when the AI key is absent, rate-limited, or temporarily unavailable.
    return fallback;
  }
}

function listingScore(listing: Listing, terms: string[]) {
  const title = (listing.productTitle || "").toLowerCase();
  const category = `${listing.category || ""} ${listing.subcategory || ""}`.toLowerCase();
  const username = listing.connection.username.toLowerCase();
  const caption = (listing.caption || "").toLowerCase();
  const tags = listing.tags.map((tag) => tag.name.toLowerCase()).join(" ");
  return terms.reduce((score, term) => {
    if (title.includes(term)) return score + 8;
    if (category.includes(term)) return score + 6;
    if (tags.includes(term)) return score + 5;
    if (username.includes(term)) return score + 4;
    if (caption.includes(term)) return score + 1;
    return score;
  }, 0);
}

async function findListings(query: string): Promise<Listing[]> {
  const intent = await interpretSearch(query);
  const terms = intent.terms;
  if (!terms.length) return [];
  const orConditions = terms.flatMap((term) => [
    { productTitle: { contains: term, mode: "insensitive" as const } },
    { caption: { contains: term, mode: "insensitive" as const } },
    { category: { contains: term, mode: "insensitive" as const } },
    { subcategory: { contains: term, mode: "insensitive" as const } },
    { connection: { username: { contains: term, mode: "insensitive" as const } } },
    { tags: { some: { name: { contains: term, mode: "insensitive" as const } } } },
  ]);
  const raw = await db().instagramPost.findMany({
    where: {
      isProduct: true,
      ...(intent.listingType === "ANY" ? {} : { listingType: intent.listingType }),
      OR: orConditions,
    },
    include: { connection: { select: { username: true } }, tags: { select: { name: true } } },
    orderBy: [{ timestamp: "desc" }, { createdAt: "desc" }],
    take: 40,
  }) as unknown as Listing[];

  return raw
    .map((listing) => ({ listing, score: listingScore(listing, terms) }))
    .filter((item) => item.score > 0 && item.listing.productSlug)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.listing);
}

function listingUrl(listing: Listing) {
  const path = listing.listingType === "SERVICE" ? "service" : "product";
  return `${siteUrl()}/${path}/${encodeURIComponent(listing.productSlug || listing.id)}`;
}

function imageForListing(listing: Listing) {
  const isVideo = String(listing.mediaType || "").toUpperCase() === "VIDEO";
  const mediaItems = Array.isArray(listing.mediaItems)
    ? listing.mediaItems as Array<{ mediaType?: string; mediaUrl?: string | null; thumbnailUrl?: string | null }>
    : [];
  const candidates = [
    isVideo ? listing.thumbnailUrl : listing.mediaUrl,
    listing.thumbnailUrl,
    ...mediaItems.flatMap((item) => {
      const itemIsVideo = String(item.mediaType || "").toUpperCase() === "VIDEO";
      return [itemIsVideo ? item.thumbnailUrl : item.mediaUrl, item.thumbnailUrl];
    }),
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "https:") return parsed.toString();
    } catch {
      // Skip malformed or non-absolute media URLs and try the next image.
    }
  }
  return null;
}

function listingCaption(listing: Listing) {
  const kind = listing.listingType === "SERVICE" ? "Service" : "Product";
  const category = [listing.category, listing.subcategory].filter(Boolean).join(" · ");
  const details = [
    `🛍️ ${listing.productTitle || kind}`,
    `Shop: @${listing.connection.username}`,
    category ? `Category: ${category}` : "",
    "Price: Please check with the seller for current pricing.",
    `View listing: ${listingUrl(listing)}`,
  ].filter(Boolean);
  return details.join("\n");
}

async function processListingSearch(to: string, query: string) {
  const listings = await findListings(query);
  if (!listings.length) {
    await sendWhatsAppText(
      to,
      "I couldn't find a close match yet. Try a shorter search such as “dresses”, “cakes”, “plumber Nairobi” or a shop username. You can search for both products and services."
    );
    return;
  }

  await sendWhatsAppText(to, `I found ${listings.length} SokoLink listing${listings.length === 1 ? "" : "s"} for “${query.slice(0, 100)}”. Here they are:`);

  for (const listing of listings) {
    const caption = listingCaption(listing);
    const imageUrl = imageForListing(listing);
    if (imageUrl) {
      try {
        await sendWhatsAppImage(to, imageUrl, caption);
        continue;
      } catch {
        // If Meta cannot retrieve a listing image, the customer still gets its link and details.
      }
    }
    await sendWhatsAppText(to, caption);
  }

  await sendWhatsAppText(to, "Reply with a shop username or send another search to see more options. SokoLink doesn't hold stock; please confirm availability and price with the seller.");
}

export async function handleWhatsAppMessage(
  message: WhatsAppIncomingMessage,
  profileName?: string,
) {
  if (!message.id || !message.from) return;
  const prisma = db();
  const existing = await prisma.whatsAppMessage.findUnique({
    where: { waMessageId: message.id },
    select: { status: true, createdAt: true },
  });
  if (existing?.status === "PROCESSED") return;
  if (existing?.status === "PROCESSING" && Date.now() - existing.createdAt.getTime() < 120000) return;

  const conversation = await prisma.whatsAppConversation.upsert({
    where: { waId: message.from },
    create: { waId: message.from, profileName, lastMessageAt: new Date() },
    update: { ...(profileName ? { profileName } : {}), lastMessageAt: new Date() },
  });
  const body = messageText(message);
  await prisma.whatsAppMessage.upsert({
    where: { waMessageId: message.id },
    create: {
      waMessageId: message.id,
      conversationId: conversation.id,
      direction: "INBOUND",
      type: message.type || "unknown",
      body: body || null,
      status: "PROCESSING",
    },
    update: { status: "PROCESSING", body: body || null },
  });

  try {
    if (!body || isGreeting(body)) {
      await sendWhatsAppText(
        message.from,
        "Hi! 👋 Welcome to SokoLink. I can help you discover products and services from shops on SokoLink.\n\nTry: “red dress”, “birthday cake”, “plumber in Nairobi”, or a shop username.\n\nI'll send matching listings with images when available, plus a link to each listing."
      );
    } else {
      await processListingSearch(message.from, body);
    }
    await prisma.whatsAppMessage.update({
      where: { waMessageId: message.id },
      data: { status: "PROCESSED" },
    });
  } catch (error) {
    await prisma.whatsAppMessage.update({
      where: { waMessageId: message.id },
      data: { status: "FAILED" },
    }).catch(() => undefined);
    throw error;
  }
}

export type { WhatsAppIncomingMessage };
