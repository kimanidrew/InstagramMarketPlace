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
      className="mt-0 flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-black px-3 py-3 text-center text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#222] sm:gap-2 sm:px-4"
      title="Open Instagram and send the prepared inquiry"
    >
      {copied ? <Check size={14} /> : <MessageCircle size={14} />}
      {copied ? "Message copied — paste in Instagram" : "Inquire on Instagram"}
      <Instagram size={14} />
    </button>
  );
}
