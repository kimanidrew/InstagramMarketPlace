"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowUpRight, CheckCircle2, ChevronDown, Eye, Heart, MousePointer2, Radio, ShieldCheck, Sparkles, Store, TrendingUp, Users, Wallet, Zap } from "lucide-react";

type Product = { id: string; title: string; slug: string | null; image: string | null; mediaType: string };
type Connection = { id: string; username: string; name: string | null; profileImageUrl: string | null; posts: Product[] };
type Daily = { date: string; label: string; impressions: number; views: number; clicks: number };
type ShopAnalytics = { id: string; username: string; name: string | null; profileImageUrl: string | null; productCount: number; impressions: number; views: number; clicks: number; reach: number; likes: number; products: Array<{ id: string; title: string; slug: string | null; image: string | null; mediaType: string; likes: number; instagramLikes: number; impressions: number; views: number; clicks: number; boosted: boolean }> };
type Campaign = { id: string; targetType: "PRODUCT" | "STORE"; targetReach: number; deliveredReach: number; amount: number; status: string; createdAt: string; startsAt: string | null; endsAt: string | null; username: string; profileImageUrl: string | null; productTitle: string | null; image: string | null; paymentStatus: string | null; receiptNumber: string | null; phoneNumber: string | null };
type Analytics = { shops: ShopAnalytics[]; summary: { impressions: number; views: number; clicks: number; likes: number; reach: number; paidImpressions: number; paidReach: number }; daily: Daily[]; campaigns: Campaign[] };
const packages = [{ reach: 500, price: 100 }, { reach: 1000, price: 180 }, { reach: 2500, price: 400 }, { reach: 5000, price: 750 }, { reach: 10000, price: 1300 }];

function LineChart({ data, metric, color, title }: { data: Daily[]; metric: "impressions" | "views" | "clicks"; color: string; title: string }) {
  const max = Math.max(1, ...data.map(d => d[metric]));
  const points = data.map((d, i) => ({ x: data.length < 2 ? 50 : 8 + (i / (data.length - 1)) * 484, y: 90 - (d[metric] / max) * 72 }));
  const path = points.map(p => p.x + "," + p.y).join(" ");
  const last = points[points.length - 1];
  return <div className="seller-chart-card"><div className="seller-chart-heading"><div><span>{title}</span><small>Last 30 days</small></div><span className="seller-chart-dot" style={{ background: color }}/></div><svg viewBox="0 0 500 116" role="img" aria-label={title + " over the last 30 days"} className="seller-line-chart"><defs><linearGradient id={"chart-fill-" + metric} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".18"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>{[20,44,68,92].map(y => <line key={y} x1="8" x2="492" y1={y} y2={y} stroke="#eeeaf3" strokeDasharray="3 5"/>)}<polygon points={"8,92 " + path + " 492,92"} fill={"url(#chart-fill-" + metric + ")"} /><polyline points={path} fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>{last && <circle cx={last.x} cy={last.y} r="4" fill={color} stroke="#fff" strokeWidth="2"/>}</svg><div className="seller-chart-axis"><span>{data[0]?.label || "—"}</span><span>Daily activity</span><span>{data[data.length - 1]?.label || "—"}</span></div></div>;
}

export function SellerAnalytics({ connections }: { connections: Connection[] }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [selectedShopId, setSelectedShopId] = useState(connections[0]?.id || "");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [targetType, setTargetType] = useState<"STORE" | "PRODUCT">("PRODUCT");
  const [targetReach, setTargetReach] = useState(1000);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingCampaign, setPendingCampaign] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/account/analytics?shopId=" + encodeURIComponent(selectedShopId), { cache: "no-store" });
      if (response.ok) setData(await response.json());
    } catch { /* analytics refresh can be retried */ }
    finally { setLoading(false); }
  }, [selectedShopId]);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const timer = window.setInterval(() => { void refresh(); }, 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    if (!pendingCampaign) return;
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts++;
      try {
        const response = await fetch("/api/promotions/status?campaignId=" + encodeURIComponent(pendingCampaign), { cache: "no-store" });
        const status = await response.json();
        if (status.paymentStatus === "PAID" || status.paymentStatus === "FAILED" || status.status === "ACTIVE" || status.status === "COMPLETED") {
          setPaymentMessage(status.paymentStatus === "PAID" ? "Payment confirmed. Your promotion is now active and its reach is being measured." : status.paymentStatus === "FAILED" ? (status.message || "Payment was not completed. You can try again.") : "Your promotion status has been updated.");
          setPendingCampaign("");
          void refresh();
        } else if (attempts >= 30) {
          setPaymentMessage("The payment prompt was sent. If you entered your PIN, refresh analytics in a moment to check the confirmation.");
          setPendingCampaign("");
        }
      } catch { if (attempts >= 30) setPendingCampaign(""); }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [pendingCampaign, refresh]);

  const selectedShop = data?.shops.find(s => s.id === selectedShopId) || data?.shops[0];
  const connection = connections.find(c => c.id === selectedShopId) || connections[0];
  const products = selectedShop?.products || [];
  const selectedProduct = products.find(p => p.id === selectedPostId) || products[0];
  const packagePrice = packages.find(p => p.reach === targetReach)?.price || 180;
  const summary = data?.summary || { impressions: 0, views: 0, clicks: 0, likes: 0, reach: 0, paidImpressions: 0, paidReach: 0 };
  const chartData = data?.daily || [];
  const campaigns = data?.campaigns || [];

  async function startPayment() {
    setPaying(true); setMessage(""); setPaymentMessage("");
    try {
      const response = await fetch("/api/promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ connectionId: selectedShopId, targetType, postId: targetType === "PRODUCT" ? (selectedPostId || selectedProduct?.id) : null, targetReach, phoneNumber: phone }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error || "Unable to start payment."); return; }
      setPendingCampaign(result.campaignId);
      setPaymentMessage(result.message || "Check your phone and enter your M-Pesa PIN to pay.");
    } catch { setMessage("We could not reach the payment service. Please try again."); }
    finally { setPaying(false); }
  }

  return <div className="seller-analytics-content">
    <div className="seller-analytics-shopbar"><div className="seller-analytics-shop-title"><span className="analytics-shop-avatar">{selectedShop?.profileImageUrl ? <img src={selectedShop.profileImageUrl} alt=""/> : <Store size={19}/>}</span><div><small>ANALYTICS FOR</small><b>@{selectedShop?.username || "Your shop"}</b></div></div><label className="analytics-shop-select"><span>Switch shop</span><select value={selectedShopId} onChange={e => { setSelectedShopId(e.target.value); setSelectedPostId(""); }} aria-label="Select shop">{connections.map(c => <option key={c.id} value={c.id}>@{c.username}</option>)}</select><ChevronDown size={15}/></label></div>

    <div className="seller-analytics-kpis">
      <article><span className="analytics-kpi-icon purple"><Eye size={18}/></span><small>Marketplace impressions</small><b>{loading ? "…" : summary.impressions.toLocaleString()}</b><em>Listings and store cards</em></article>
      <article><span className="analytics-kpi-icon blue"><Activity size={18}/></span><small>Page views</small><b>{loading ? "…" : summary.views.toLocaleString()}</b><em>Shop and product pages</em></article>
      <article><span className="analytics-kpi-icon amber"><MousePointer2 size={18}/></span><small>Marketplace clicks</small><b>{loading ? "…" : summary.clicks.toLocaleString()}</b><em>Product and shop cards</em></article>
      <article><span className="analytics-kpi-icon rose"><Heart size={18}/></span><small>Marketplace likes</small><b>{loading ? "…" : summary.likes.toLocaleString()}</b><em>Across your products</em></article>
    </div>

    <section className="seller-analytics-panel"><div className="seller-analytics-panel-heading"><div><span>PERFORMANCE OVER TIME</span><h2>Your activity, day by day</h2><p>Only events recorded on Instagram Market are shown.</p></div></div><div className="seller-analytics-charts"><LineChart data={chartData} metric="impressions" color="#8054cb" title="Impressions"/><LineChart data={chartData} metric="views" color="#3c87d8" title="Page views"/><LineChart data={chartData} metric="clicks" color="#dc9b3f" title="Clicks"/></div><div className="analytics-legend"><span><i className="purple-dot"/> Impressions <b>{summary.impressions.toLocaleString()}</b></span><span><i className="blue-dot"/> Views <b>{summary.views.toLocaleString()}</b></span><span><i className="amber-dot"/> Clicks <b>{summary.clicks.toLocaleString()}</b></span></div></section>

    <section className="seller-analytics-panel"><div className="seller-analytics-panel-heading"><div><span>PRODUCT PERFORMANCE</span><h2>What people are discovering</h2><p>Compare activity for products in @{selectedShop?.username}.</p></div><span className="analytics-count-pill">{products.length} products</span></div>
      {products.length ? <div className="analytics-product-table"><div className="analytics-table-head"><span>Product</span><span>Impressions</span><span>Views</span><span>Clicks</span><span>IG likes</span><span>Market likes</span></div>{products.slice().sort((a,b) => b.views-a.views).map(p => <div className="analytics-table-row" key={p.id}><div className="analytics-product-name"><span>{p.image ? <img src={p.image} alt=""/> : <Store size={18}/>}</span><div><b>{p.title}</b><small>{p.boosted ? "Boost active" : "Organic listing"}</small></div></div><b>{p.impressions.toLocaleString()}</b><b>{p.views.toLocaleString()}</b><b>{p.clicks.toLocaleString()}</b><b>{p.instagramLikes.toLocaleString()}</b><b>{p.likes.toLocaleString()}</b></div>)}</div> : <div className="analytics-empty-inline">Products from this shop will appear here after they are listed.</div>}
    </section>

    <section className="seller-analytics-panel promotion-panel"><div className="seller-analytics-panel-heading"><div><span><Zap size={13}/> PAID PROMOTION</span><h2>Choose your reach target</h2><p>Pay for marketplace promotion. Your campaign reports measured delivery, not a guaranteed number of distinct people before it runs.</p></div><span className="analytics-mpesa-pill"><Wallet size={14}/> M-Pesa</span></div>
      <div className="promotion-builder">
        <div className="promotion-form">
          <div className="promotion-type-toggle"><button className={targetType === "PRODUCT" ? "active" : ""} onClick={() => setTargetType("PRODUCT")}><Sparkles size={16}/> Promote a product</button><button className={targetType === "STORE" ? "active" : ""} onClick={() => setTargetType("STORE")}><Store size={16}/> Promote whole shop</button></div>
          {targetType === "PRODUCT" && <label className="promotion-field"><span>Product to promote</span><select value={selectedPostId || selectedProduct?.id || ""} onChange={e => setSelectedPostId(e.target.value)}>{products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>}
          <label className="promotion-field"><span>M-Pesa phone number</span><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XX XXX XXX" inputMode="tel" autoComplete="tel" /></label>
          <div className="promotion-field"><span>Target marketplace reach</span><div className="promotion-packages">{packages.map(p => <button key={p.reach} className={targetReach === p.reach ? "active" : ""} onClick={() => setTargetReach(p.reach)}><b>{p.reach.toLocaleString()}</b><small>target</small><strong>KSh {p.price.toLocaleString()}</strong></button>)}</div></div>
          <div className="promotion-reach-note"><Users size={16}/><span>Reach counts distinct browser visitors who see your promoted listing on the marketplace. Campaigns stop counting once the target is reached.</span></div>
          {message && <div className="analytics-feedback error" role="alert">{message}</div>}
          {paymentMessage && <div className="analytics-feedback" role="status"><CheckCircle2 size={17}/><span>{paymentMessage}</span></div>}
          {!products.length && <div className="analytics-feedback error">Add at least one active product listing with media to this shop before buying promotion.</div>}
          <button className="promotion-pay-button" onClick={startPayment} disabled={paying || !!pendingCampaign || !products.length || !phone.trim()}>{paying ? "Starting M-Pesa…" : pendingCampaign ? "Waiting for payment confirmation…" : <>Pay KSh {packagePrice.toLocaleString()} with M-Pesa <ArrowUpRight size={16}/></>}</button>
          <small className="promotion-secure-note"><ShieldCheck size={13}/> Campaign activates only after the payment callback confirms the amount and receipt.</small>
        </div>
        <aside className="promotion-order-summary"><div className="promotion-summary-art"><TrendingUp size={28}/><span>Promotion plan</span></div><small>YOUR SELECTED PACKAGE</small><h3>{targetReach.toLocaleString()} reach</h3><p>{targetType === "PRODUCT" ? selectedProduct?.title || "Your selected product" : "All eligible products from @" + (selectedShop?.username || "your shop")}</p><div className="promotion-summary-line"><span>Promotion target</span><b>{targetReach.toLocaleString()}</b></div><div className="promotion-summary-line"><span>One-time payment</span><b>KSh {packagePrice.toLocaleString()}</b></div><div className="promotion-summary-line"><span>Payment method</span><b>M-Pesa STK Push</b></div><div className="promotion-summary-foot"><Radio size={14}/> Live delivery tracking after payment</div></aside>
      </div>
    </section>

    <section className="seller-analytics-panel"><div className="seller-analytics-panel-heading"><div><span>CAMPAIGN HISTORY</span><h2>Paid promotion delivery</h2><p>Follow payment status, target and real reach delivered.</p></div><button className="analytics-refresh" onClick={() => void refresh()}><Activity size={14}/> Refresh</button></div>
      {campaigns.length ? <div className="analytics-campaign-list">{campaigns.map(c => <article key={c.id} className="analytics-campaign"><span className="analytics-campaign-image">{c.image ? <img src={c.image} alt=""/> : c.profileImageUrl ? <img src={c.profileImageUrl} alt=""/> : <Store size={19}/>}</span><div className="analytics-campaign-info"><b>{c.targetType === "PRODUCT" ? c.productTitle || "Product promotion" : "Shop promotion"} · @{c.username}</b><small>{c.paymentStatus === "PAID" ? "Paid" + (c.receiptNumber ? " · Receipt " + c.receiptNumber : "") : c.paymentStatus === "FAILED" ? "Payment failed" : "Payment " + (c.paymentStatus || "pending").toLowerCase()}</small><div className="campaign-progress"><span style={{ width: Math.min(100, c.targetReach ? c.deliveredReach / c.targetReach * 100 : 0) + "%" }}/></div><small>{c.deliveredReach.toLocaleString()} of {c.targetReach.toLocaleString()} reach delivered</small></div><div className="analytics-campaign-right"><b>KSh {c.amount.toLocaleString()}</b><span className={"campaign-status " + c.status.toLowerCase()}>{c.status.replaceAll("_", " ")}</span></div></article>)}</div> : <div className="analytics-empty-inline">Your paid campaigns and payment receipts will appear here.</div>}
    </section>
  </div>;
}
