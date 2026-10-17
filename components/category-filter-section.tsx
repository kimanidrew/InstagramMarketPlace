"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { CategoryFilterRail, type CategoryFilterItem } from "@/components/category-filter-rail";

type CategoryFilterSectionProps = {
  eyebrow: string;
  title: string;
  items: CategoryFilterItem[];
  selectedValue: string;
  onSelect: (value: string) => void;
  ariaLabel: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  actionHref?: string;
  actionLabel?: string;
  variant?: "default" | "for-you";
};

export function CategoryFilterSection({
  eyebrow, title, items, selectedValue, onSelect, ariaLabel,
  searchValue, onSearchChange, searchPlaceholder = "Search", searchLabel = "Search",
  actionHref, actionLabel, variant = "default",
}: CategoryFilterSectionProps) {
  const [headerHidden, setHeaderHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => setHeaderHidden(!!document.querySelector(".site-header")?.classList.contains("is-hidden"));
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className={`store-directory-tools${headerHidden ? " is-header-hidden" : ""}${variant === "for-you" ? " for-you-category-filter-section" : ""}`} aria-label={ariaLabel}>
      <div className="store-directory-filter-bar">
        <div className="store-directory-tools-top">
          <div>
            <span className="store-directory-eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
          </div>
          {onSearchChange ? (
            <label className="store-directory-search">
              <Search size={17} />
              <input value={searchValue ?? ""} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} aria-label={searchLabel} />
              {searchValue && <button type="button" onClick={() => onSearchChange("")} aria-label="Clear search">×</button>}
            </label>
          ) : actionLabel ? (
            actionHref ? (
              <Link href={actionHref} className="store-directory-filter-action">
                {actionLabel}<ArrowUpRight size={15} />
              </Link>
            ) : (
              <span className={`store-directory-filter-action${variant === "for-you" ? " for-you-discovery-sticker" : ""}`}>
                {actionLabel}
              </span>
            )
          ) : null}
        </div>
        <CategoryFilterRail ariaLabel={ariaLabel} selectedValue={selectedValue} onSelect={onSelect} items={items} />
      </div>
    </section>
  );
}
