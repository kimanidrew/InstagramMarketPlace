"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ProductMasonry } from "@/components/product-masonry";

export function ForYouFilters({ tags = [] }: { tags?: string[] }) {
  const [selectedTag, setSelectedTag] = useState("");
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [headerHidden, setHeaderHidden] = useState(false);
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
    const handleScroll = () => {
      const header = document.querySelector(".site-header");
      setHeaderHidden(!!header?.classList.contains("is-hidden"));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScrollEdges);
      window.removeEventListener("scroll", handleScroll);
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
      <div className="for-you-filter-sticky" style={{ top: headerHidden ? 0 : 74 }}>
        <div className="for-you-filter-bar">
          <div className="for-you-filter-heading">
            <span className="inline-flex min-w-0 items-center gap-2.5 text-xs font-black tracking-[-.025em] text-[#242033] sm:text-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#eeeaff] to-[#f9eaff] text-[#6651d9] ring-1 ring-[#e5ddff] sm:h-9 sm:w-9">
                <SlidersHorizontal size={16} strokeWidth={2.3} />
              </span>
              <span className="flex flex-col">
                <span>Find your kind of thing</span>
                <span className="mt-0.5 text-[10px] font-medium tracking-normal text-[#88839b] sm:text-[11px]">Filter by category</span>
              </span>
            </span>
            <Link href="/categories" className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e5dfff] bg-white px-3 py-2 text-[10px] font-extrabold text-[#5b49c9] shadow-[0_3px_12px_rgba(91,73,201,.07)] transition hover:-translate-y-0.5 hover:border-[#c9bdff] hover:bg-[#f8f6ff] sm:px-3.5 sm:text-xs">
              All categories
              <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
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
                    {name}
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
