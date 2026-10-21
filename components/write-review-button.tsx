"use client";

import { Pencil } from "lucide-react";

export function WriteReviewButton() {
  function openReviewComposer() {
    window.dispatchEvent(new Event("open-review-composer"));
    document.getElementById("product-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={openReviewComposer}
      className="group inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[#dededb] bg-white px-4 py-3 text-base font-extrabold tracking-[-.01em] text-[#171717] transition-colors duration-200 hover:border-[#bdbdb8] hover:bg-[#fafaf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:bg-[#f4f4f1]"
      aria-label="Leave a review"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e8e8e5] bg-[#f8f8f6] transition-colors group-hover:border-[#d8d8d3] group-hover:bg-white">
        <Pencil size={13} strokeWidth={1.8} />
      </span>
      <span className="text-base font-extrabold">Leave a review</span>
    </button>
  );
}
