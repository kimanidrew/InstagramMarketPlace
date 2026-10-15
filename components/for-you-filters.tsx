"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, SlidersHorizontal } from "lucide-react";
import { ProductMasonry } from "@/components/product-masonry";

export function ForYouFilters({ tags = [] }: { tags?: string[] }) {
  const [selectedTag, setSelectedTag] = useState("");
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateScrollEdges = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth);
    setAtStart(element.scrollLeft <= 2);
    setAtEnd(maxScroll <= 2 || element.scrollLeft >= maxScroll - 2);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    updateScrollEdges();
    const observer = new ResizeObserver(updateScrollEdges);
    observer.observe(element);
    window.addEventListener("resize", updateScrollEdges);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScrollEdges);
    };
  }, [updateScrollEdges, tags.length]);

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
      <div className="for-you-filter-sticky">
        <div className="for-you-filter-bar">
          <div className="for-you-filter-heading">
            <span className="inline-flex min-w-0 items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-[#252525] sm:text-sm">
              <SlidersHorizontal size={16} /> Filter by category
            </span>
            <span className="shrink-0 text-[11px] font-extrabold text-[#555] sm:text-xs">
              {selectedTag ? "#" + selectedTag : "All listings"}
            </span>
          </div>
          <div className="for-you-filter-scroller">
            {!atStart && <button type="button" onClick={() => scroll("left")} aria-label="Scroll categories left" className="for-you-filter-scroll-button left-2">
              <ArrowLeft size={16} />
            </button>}
            {!atEnd && <button type="button" onClick={() => scroll("right")} aria-label="Scroll categories right" className="for-you-filter-scroll-button right-2">
              <ArrowRight size={16} />
            </button>}
            <div ref={scrollRef} onScroll={updateScrollEdges} className="for-you-filter-tags hide-scrollbar" role="group" aria-label="Product categories">
              <button type="button" onClick={() => setSelectedTag("")} className={"for-you-filter-chip " + (!selectedTag ? "is-active" : "")}>All</button>
              {tags.map((name) => {
                const active = selectedTag === name.toLowerCase();
                return (
                  <button key={name} type="button" onClick={() => setSelectedTag(name.toLowerCase())} className={"for-you-filter-chip " + (active ? "is-active" : "")}>
                    #{name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <ProductMasonry personalized tag={selectedTag} />
    </div>
  );
}
