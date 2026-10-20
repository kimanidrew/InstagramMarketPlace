"use client";

import { useState } from "react";
import { ArrowUpRight, MessageCircle } from "lucide-react";

export function ProductInquiryButton({
  username,
  productTitle,
  postUrl,
}: {
  username: string;
  productTitle: string;
  postUrl: string;
}) {
  const [notice, setNotice] = useState("");

  const message = `Hi @${username}! 👋

I'm interested in "${productTitle}" that I saw on SokoLink.

Could you please share more details, including the price and availability?

Instagram post: ${postUrl}

Thank you! 😊`;

  async function inquire() {
    const handle = username.replace(/^@/, "");
    const url = `https://ig.me/m/${encodeURIComponent(handle)}?text=${encodeURIComponent(message)}`;

    // Open synchronously from the click so the browser doesn't block the new tab.
    const dmTab = window.open("about:blank", "_blank");

    try {
      await navigator.clipboard.writeText(message);
      setNotice("Inquiry copied! Paste it into the Instagram DM.");
    } catch {
      setNotice("Opening Instagram DM. Copy the inquiry text if needed.");
    }

    if (dmTab) {
      dmTab.location.href = url;
    } else {
      // If the browser blocks new tabs, keep the user moving to the DM.
      window.location.assign(url);
    }

    window.setTimeout(() => setNotice(""), 5000);
  }

  return (
    <>
      <button
        type="button"
        onClick={inquire}
        className="product-inquire-button mt-0 flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#171717] bg-[#171717] px-3 py-3.5 text-center text-xs font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-black hover:bg-black hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:px-4 sm:py-4"
        title="Message the seller about this item"
      >
        <MessageCircle size={14} />
        Ask the seller
        <ArrowUpRight size={14} />
      </button>
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl bg-[#171717] px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
        >
          {notice}
        </div>
      )}
    </>
  );
}
