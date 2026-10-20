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
      className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-3 py-2 text-[11px] font-bold text-[#171717] transition hover:border-black hover:bg-[#f7f7f4]"
      aria-label="Write a product review"
    >
      <Pencil size={13} /> Write a review
    </button>
  );
}
