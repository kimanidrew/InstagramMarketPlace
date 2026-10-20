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
      className="group inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-black bg-black px-4 py-2 text-[11px] font-extrabold tracking-[-.01em] text-white shadow-[0_3px_0_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#292929] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:translate-y-0"
      aria-label="Write a product review"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 transition group-hover:bg-white/25"><Pencil size={12} /></span> <span>Write a review</span>
    </button>
  );
}
