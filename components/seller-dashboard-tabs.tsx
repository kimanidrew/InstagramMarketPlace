"use client";

import { useState } from "react";
import { Activity, Sparkles } from "lucide-react";
import Link from "next/link";
import { SellerAnalytics } from "@/components/seller-analytics";
import { SellerGrowth } from "@/components/seller-growth";

type AnalyticsConnection = {
  id: string;
  username: string;
  name: string | null;
  profileImageUrl: string | null;
  posts: Array<{ id: string; title: string; slug: string | null; image: string | null; mediaType: string }>;
};
type GrowthConnection = {
  id: string;
  username: string;
  name: string | null;
  profileImageUrl: string | null;
  verifiedAt: string | null;
  proUntil: string | null;
  posts: Array<{ id: string; productTitle: string | null; mediaUrl: string | null; thumbnailUrl: string | null; mediaType: string | null; permalink: string | null }>;
};

export function SellerDashboardTabs({ analyticsConnections, growthConnections, initialShopId, initialPostId, initialTab }: {
  analyticsConnections: AnalyticsConnection[];
  growthConnections: GrowthConnection[];
  initialShopId: string;
  initialPostId: string;
  initialTab?: string;
}) {
  const activeTab = initialTab === "store-growth" || initialTab === "product-promotion" || initialTab === "growth" ? "growth" : "analytics";
  const growthTab = initialTab === "product-promotion" ? "promotion" : "store";

  return <section className="seller-dashboard-tabs">
    <div className="seller-dashboard-tab-list" role="tablist" aria-label="Shop dashboard sections">
      <Link href="/account/analytics?tab=analytics" role="tab" id="shop-analytics-tab" aria-selected={activeTab === "analytics"} aria-controls="shop-analytics-panel" className={activeTab === "analytics" ? "active" : ""}>
        <Activity size={16}/> Analytics
      </button>
      <Link href="/account/analytics?tab=store-growth" role="tab" id="shop-growth-tab" aria-selected={activeTab === "growth"} aria-controls="shop-growth-panel" className={activeTab === "growth" ? "active" : ""}>
        <Sparkles size={16}/> Seller Growth Studio
      </button>
    </div>
    {activeTab === "analytics" ? <div id="shop-analytics-panel" role="tabpanel" aria-labelledby="shop-analytics-tab">
      {analyticsConnections.length ? <SellerAnalytics connections={analyticsConnections} initialShopId={initialShopId} initialPostId={initialPostId}/> : <section className="seller-analytics-empty"><Sparkles size={28}/><h2>Connect a shop to see analytics</h2><p>Once your Instagram Business account is connected, this dashboard will record marketplace impressions, product views and clicks.</p><Link href="/account/setup">Connect Instagram <span aria-hidden="true">→</span></Link></section>}
    </div> : <div id="shop-growth-panel" role="tabpanel" aria-labelledby="shop-growth-tab">
      {growthConnections.length ? <SellerGrowth connections={growthConnections} initialTab={growthTab}/> : <section className="seller-analytics-empty"><Sparkles size={28}/><h2>Start with your first shop</h2><p>Connect an Instagram Business account to unlock product boosts, shop verification, and Pro Seller tools.</p><Link href="/account/setup">Connect Instagram <span aria-hidden="true">→</span></Link></section>}
    </div>}
  </section>;
}
