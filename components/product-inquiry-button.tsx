"use client";

import { ArrowUpRight, Check, Instagram, MessageCircle } from "lucide-react";
import { useState } from "react";

export function ProductInquiryButton({
  username,
  productTitle,
  postUrl,
}: {
  username: string;
  productTitle: string;
  postUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const message = `Hi @${username}! 👋

I'm interested in "${productTitle}" that I saw on Instagram Market.

Could you please share more details, including the price and availability?

Instagram post: ${postUrl}

Thank you! 😊`;

  async function inquire() {
    // Open Instagram directly from the click before awaiting clipboard access,
    // so browser popup blockers do not prevent the shop DM from opening.
    window.open(
      "https://ig.me/m/" + encodeURIComponent(username.replace(/^@/, "")),
      "_blank",
      "noopener,noreferrer",
    );

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access may be unavailable; the Instagram DM still opens.
    }
  }

  return (
    <button
      type="button"
      onClick={inquire}
      className="product-inquire-button mt-0 flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#171717] bg-[#171717] px-3 py-3.5 text-center text-xs font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-black hover:bg-black hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:px-4 sm:py-4"
      title="Message the seller about this item"
    >
      {copied ? <Check size={14} /> : <MessageCircle size={14} />}
      {copied ? "Message copied" : "Ask the seller"}
      {copied ? <Check size={14} /> : <ArrowUpRight size={14} />}
    </button>
  );
}
