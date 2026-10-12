"use client";

import { useState, type ReactNode } from "react";
import { CheckCircle2, ClipboardList, Clock3, Layers3, TrendingUp, XCircle } from "lucide-react";

type AdminTab = {
  id: string;
  label: string;
  count: number;
  content: ReactNode;
};

const icons: Record<string, typeof ClipboardList> = {
  overview: Layers3,
  pending: Clock3,
  approved: CheckCircle2,
  rejected: XCircle,
  growth: TrendingUp,
};

export default function AdminDashboardTabs({ tabs }: { tabs: AdminTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "overview");
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <section className="admin-tabs-shell">
      <div className="admin-tabs" role="tablist" aria-label="Admin dashboard sections">
        {tabs.map((tab) => {
          const Icon = icons[tab.id] ?? ClipboardList;
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              id={`admin-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`admin-panel-${tab.id}`}
              className={`admin-tab ${selected ? "active" : ""}`}
              onClick={() => setActive(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <b>{tab.count}</b>
            </button>
          );
        })}
      </div>
      <div
        className="admin-tab-panel"
        role="tabpanel"
        id={`admin-panel-${current.id}`}
        aria-labelledby={`admin-tab-${current.id}`}
      >
        {current.content}
      </div>
    </section>
  );
}
