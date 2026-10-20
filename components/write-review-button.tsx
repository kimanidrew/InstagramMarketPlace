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
      className="group inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#dededb] bg-white px-4 py-2.5 text-[11px] font-extrabold tracking-[-.01em] text-[#171717] shadow-sm transition duration-200 hover:border-black hover:bg-[#f7f7f4] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:translate-y-0"
      aria-label="Write a product review"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f2f2ef] transition group-hover:bg-[#e8e8e5]"><Pencil size={12} /></span> <span>Write a review</span>
    </button>
  );
}
