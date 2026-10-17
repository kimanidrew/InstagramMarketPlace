"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export type CategoryFilterItem = { label: string; value: string; count?: number };

type CategoryFilterRailProps = {
  items: CategoryFilterItem[];
  selectedValue: string;
  onSelect: (value: string) => void;
  ariaLabel: string;
};

export function CategoryFilterRail({ items, selectedValue, onSelect, ariaLabel }: CategoryFilterRailProps) {
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateScrollEdges = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth);
    const left = Math.max(0, element.scrollLeft);
    const firstItem = element.firstElementChild as HTMLElement | null;
    const lastItem = element.lastElementChild as HTMLElement | null;
    const viewport = element.getBoundingClientRect();
    const firstAtStart = !firstItem || firstItem.getBoundingClientRect().left >= viewport.left - 4;
    const lastAtEnd = !lastItem || lastItem.getBoundingClientRect().right <= viewport.right + 4;
    setAtStart(left <= 4 || firstAtStart);
    setAtEnd(maxScroll <= 4 || left >= maxScroll - 4 || lastAtEnd);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollLeft = 0;
    const updateAfterLayout = () => updateScrollEdges();
    updateAfterLayout();
    const frame = window.requestAnimationFrame(updateAfterLayout);
    const observer = new ResizeObserver(updateAfterLayout);
    observer.observe(element);
    if (element.parentElement) observer.observe(element.parentElement);
    window.addEventListener("resize", updateAfterLayout);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", updateAfterLayout);
    };
  }, [items.length, updateScrollEdges]);

  const scroll = (direction: "left" | "right") => {
    const element = scrollRef.current;
    if (!element) return;
    const amount = Math.max(element.clientWidth * 0.72, 220);
    element.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div data-at-start={atStart} data-at-end={atEnd} className={`store-directory-category-scroller${atStart ? " is-at-start" : ""}`}>
      {!atStart && <span className="store-directory-category-fade store-directory-category-fade-left" aria-hidden="true" />}
      {!atEnd && <span className="store-directory-category-fade store-directory-category-fade-right" aria-hidden="true" />}
      {!atStart && <button type="button" onClick={() => scroll("left")} aria-label="Scroll categories left" className="for-you-filter-scroll-button left-2"><ArrowLeft size={16} /></button>}
      {!atEnd && <button type="button" onClick={() => scroll("right")} aria-label="Scroll categories right" className="for-you-filter-scroll-button right-2"><ArrowRight size={16} /></button>}
      <div ref={scrollRef} onScroll={updateScrollEdges} className="store-directory-category-row hide-scrollbar" role="group" aria-label={ariaLabel}>
        {items.map((item) => (
          <button key={item.value} type="button" onClick={() => onSelect(item.value)} className={"store-directory-category" + (selectedValue === item.value ? " is-active" : "")} aria-pressed={selectedValue === item.value}>
            {item.label}
            {item.count !== undefined && <span>{item.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
