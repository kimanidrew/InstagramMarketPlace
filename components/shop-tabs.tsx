"use client";

import { useState, type ReactNode } from "react";
import { Compass, Sparkles, TrendingUp, SlidersHorizontal } from "lucide-react";

type ShopTab = "discover" | "trending" | "featured";

export function ShopTabs({
  discover,
  trending,
  featured,
  tags = [],
  initialTag = "",
}: {
  discover: ReactNode | ((tag: string) => ReactNode);
  trending: ReactNode | ((tag: string) => ReactNode);
  featured: ReactNode | ((tag: string) => ReactNode);
  tags?: string[];
  initialTag?: string;
}) {
  const [active, setActive] = useState<ShopTab>("discover");
  const [selectedTag, setSelectedTag] = useState(initialTag);

  const tabs = [
    { id: "discover" as const, label: "Discover", icon: Compass, copy: "Fresh finds & stores" },
    { id: "trending" as const, label: "Trending", icon: TrendingUp, copy: "Loved by shoppers" },
    { id: "featured" as const, label: "Featured", icon: Sparkles, copy: "Growth-powered picks" },
  ];

  return (
    <div className="shop-tabs-wrap mt-10">
      <div className="shop-tabs" role="tablist" aria-label="Shop discovery">
        {tabs.map(({ id, label, icon: Icon, copy }) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={"shop-tab-panel-" + id}
              className={"shop-tab " + (selected ? "shop-tab-active" : "")}
              onClick={() => setActive(id)}
            >
              <span className="shop-tab-icon"><Icon size={16} /></span>
              <span className="shop-tab-copy">
                <b>{label}</b>
                <small>{copy}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="shop-filter-panel">
        <div className="shop-filter-heading">
          <div>
            <span className="shop-filter-label"><SlidersHorizontal size={14} /> Filter by category</span>
            <span className="shop-filter-help">Refine what you see without leaving this tab.</span>
          </div>
          <span className="shop-filter-count">{selectedTag ? "#" + selectedTag : "All listings"}</span>
        </div>
        <div className="shop-filter-chips" role="group" aria-label="Product categories">
          <button type="button" className={"chip " + (!selectedTag ? "chip-active" : "")} onClick={() => setSelectedTag("")}>All</button>
          {tags.map((name) => (
            <button
              key={name}
              type="button"
              className={"chip " + (selectedTag === name.toLowerCase() ? "chip-active" : "")}
              onClick={() => setSelectedTag(name.toLowerCase())}
            >
              #{name}
            </button>
          ))}
        </div>
      </div>

      <div className="shop-tab-panel" role="tabpanel" id={"shop-tab-panel-" + active}>
        {active === "discover"
          ? typeof discover === "function" ? discover(selectedTag) : discover
          : active === "trending"
            ? typeof trending === "function" ? trending(selectedTag) : trending
            : typeof featured === "function" ? featured(selectedTag) : featured}
      </div>
    </div>
  );
}
