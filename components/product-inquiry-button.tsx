"use client";

import { Check, Copy, Instagram, MessageCircle } from "lucide-react";
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
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Opening Instagram is still useful if clipboard access is unavailable.
    }

    window.open(
      "https://ig.me/m/" + encodeURIComponent(username),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <button
      type="button"
      onClick={inquire}
      className="product-inquire-button mt-0 flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-black bg-black px-3 py-3.5 text-center text-xs font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#222] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:gap-2 sm:px-4 sm:py-4"
      title="Open Instagram and send the prepared inquiry"
    >
      {copied ? <Check size={14} /> : <MessageCircle size={14} />}
      {copied ? "Message copied — paste in Instagram" : "Inquire on Instagram"}
      <Instagram size={14} />
    </button>
  );
}
