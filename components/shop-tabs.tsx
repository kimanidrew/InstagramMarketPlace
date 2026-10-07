"use client";

import { useState, type ReactNode } from "react";
import { Compass, Sparkles, TrendingUp } from "lucide-react";

type ShopTab = "discover" | "trending" | "featured";

export function ShopTabs({
  discover,
  trending,
  featured,
}: {
  discover: ReactNode;
  trending: ReactNode;
  featured: ReactNode;
}) {
  const [active, setActive] = useState<ShopTab>("discover");

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

      <div className="shop-tab-panel" role="tabpanel" id={"shop-tab-panel-" + active}>
        {active === "discover" ? discover : active === "trending" ? trending : featured}
      </div>
    </div>
  );
}
