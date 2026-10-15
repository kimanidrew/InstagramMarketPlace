"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, SlidersHorizontal } from "lucide-react";
import { ProductMasonry } from "@/components/product-masonry";

export function ForYouFilters({ tags = [] }: { tags?: string[] }) {
  const [selectedTag, setSelectedTag] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollBy({
      left: direction === "left" ? -Math.max(element.clientWidth * 0.72, 220) : Math.max(element.clientWidth * 0.72, 220),
      behavior: "smooth",
    });
  };

  return (
    <div>
      <div className="mb-5 rounded-[24px] border border-black/5 bg-[#f7f7f4] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-[#555]">
            <SlidersHorizontal size={14} /> Filter by category
          </span>
          <span className="shrink-0 text-[11px] font-bold text-[#888]">
            {selectedTag ? "#" + selectedTag : "All listings"}
          </span>
        </div>
        <div className="relative">
          <button type="button" onClick={() => scroll("left")} aria-label="Scroll categories left" className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-sm backdrop-blur-sm transition hover:bg-[#eee]">
            <ArrowLeft size={14} />
          </button>
          <button type="button" onClick={() => scroll("right")} aria-label="Scroll categories right" className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-sm backdrop-blur-sm transition hover:bg-[#eee]">
            <ArrowRight size={14} />
          </button>
          <div ref={scrollRef} className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-10 py-1" role="group" aria-label="Product categories">
            <button type="button" onClick={() => setSelectedTag("")} className={"shrink-0 snap-start rounded-full border px-4 py-2 text-xs font-bold transition " + (!selectedTag ? "border-black bg-black text-white" : "border-black/10 bg-white text-[#555] hover:border-black/30 hover:bg-[#eee]")}>All</button>
            {tags.map((name) => {
              const active = selectedTag === name.toLowerCase();
              return (
                <button key={name} type="button" onClick={() => setSelectedTag(name.toLowerCase())} className={"shrink-0 snap-start rounded-full border px-4 py-2 text-xs font-bold transition " + (active ? "border-black bg-black text-white" : "border-black/10 bg-white text-[#555] hover:border-black/30 hover:bg-[#eee]")}>
                  #{name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <ProductMasonry personalized tag={selectedTag} />
    </div>
  );
}
