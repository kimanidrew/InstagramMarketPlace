"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Tag } from "lucide-react";

type StoreCategory = { label: string; slug: string };

export function StoreCategoryTabs({
  username,
  categories,
  activeCategory,
}: {
  username: string;
  categories: StoreCategory[];
  activeCategory: string;
}) {
  const pathname = usePathname();
  const tabs = [{ label: "All", slug: "all" }, ...categories];
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.slug === activeCategory));

  return (
    <nav
      className="store-category-tabs"
      aria-label="Shop categories"
      style={{ "--store-tab-count": tabs.length, "--store-tab-index": activeIndex } as React.CSSProperties}
    >
      <div className="store-category-tabs-track">
        {tabs.map((tab, index) => {
          const active = index === activeIndex;
          const href = tab.slug === "all"
            ? pathname
            : `${pathname}?category=${encodeURIComponent(tab.slug)}`;
          const Icon = tab.slug === "all" ? LayoutGrid : Tag;
          return (
            <Link
              key={tab.slug}
              href={href}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={`store-category-tab${active ? " is-active" : ""}`}
            >
              <Icon size={15} strokeWidth={active ? 2.6 : 2.1} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <span className="store-category-tab-indicator" aria-hidden="true" />
      </div>
    </nav>
  );
}
