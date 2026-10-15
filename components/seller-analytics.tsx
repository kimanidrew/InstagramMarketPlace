"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowUpRight, CheckCircle2, ChevronDown, Eye, Heart, MousePointer2, Radio, ShieldCheck, Sparkles, Store, TrendingUp, Users, Wallet, Zap } from "lucide-react";
import { GlobalFeedbackModal } from "@/components/global-feedback-modal";

type Product = { id: string; title: string; slug: string | null; image: string | null; mediaType: string };
type Connection = { id: string; username: string; name: string | null; profileImageUrl: string | null; posts: Product[] };
type Daily = { date: string; label: string; impressions: number; views: number; clicks: number; likes: number };
type ShopAnalytics = { id: string; username: string; name: string | null; profileImageUrl: string | null; productCount: number; impressions: number; views: number; clicks: number; reach: number; likes: number; products: Array<{ id: string; title: string; slug: string | null; image: string | null; mediaType: string; likes: number; instagramLikes: number; impressions: number; views: number; clicks: number; boosted: boolean }> };
type Campaign = { id: string; targetType: "PRODUCT" | "STORE"; targetReach: number; deliveredReach: number; amount: number; status: string; createdAt: string; startsAt: string | null; endsAt: string | null; username: string; profileImageUrl: string | null; productTitle: string | null; image: string | null; paymentStatus: string | null; receiptNumber: string | null; phoneNumber: string | null; provider: string | null; offeringName?: string | null; durationDays?: number };\ntype PromotionOffering = { id: string; name: string; targetType: "PRODUCT" | "STORE" | null; description: string; price: number; targetReach: number; effectiveReach: number; reachMode: string; durationDays: number; features: string[] };
type Analytics = { shops: ShopAnalytics[]; summary: { impressions: number; views: number; clicks: number; likes: number; reach: number; paidImpressions: number; paidReach: number }; daily: Daily[]; campaigns: Campaign[] };
// Keep the UI in demo mode in sync with the promotions API; never request an STK push.
const demoMode = true;

function LineChart({ data, metric, color, title }: { data: Daily[]; metric: "impressions" | "views" | "clicks" | "likes"; color: string; title: string }) {
  const max = Math.max(1, ...data.map(d => d[metric]));
  const points = data.map((d, i) => ({ x: data.length < 2 ? 50 : 8 + (i / (data.length - 1)) * 484, y: 90 - (d[metric] / max) * 72 }));
  const path = points.map(p => p.x + "," + p.y).join(" ");
  const last = points[points.length - 1];
  return <div className="seller-chart-card"><div className="seller-chart-heading"><div><span>{title}</span><small>Last 30 days</small></div><span className="seller-chart-dot" style={{ background: color }}/></div><svg viewBox="0 0 500 116" role="img" aria-label={title + " over the last 30 days"} className="seller-line-chart"><defs><linearGradient id={"chart-fill-" + metric} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".18"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>{[20,44,68,92].map(y => <line key={y} x1="8" x2="492" y1={y} y2={y} stroke="#eeeaf3" strokeDasharray="3 5"/>)}<polygon points={"8,92 " + path + " 492,92"} fill={"url(#chart-fill-" + metric + ")"} /><polyline points={path} fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>{last && <circle cx={last.x} cy={last.y} r="4" fill={color} stroke="#fff" strokeWidth="2"/>}</svg><div className="seller-chart-axis"><span>{data[0]?.label || "—"}</span><span>Daily activity</span><span>{data[data.length - 1]?.label || "—"}</span></div></div>;
}

export function SellerAnalytics({ connections, initialShopId, initialPostId, promotionOnly = false, activeShopId, onShopChange }: { connections: Connection[]; initialShopId?: string; initialPostId?: string; promotionOnly?: boolean; activeShopId?: string; onShopChange?: (id: string) => void }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [selectedShopId, setSelectedShopId] = useState(initialShopId || connections[0]?.id || "");
  const effectiveShopId = activeShopId ?? selectedShopId;
  const [selectedPostId, setSelectedPostId] = useState(initialPostId || "");
  const [targetType, setTargetType] = useState<"STORE" | "PRODUCT">("PRODUCT");
  const [promotionOfferings, setPromotionOfferings] = useState<PromotionOffering[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingCampaign, setPendingCampaign] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/account/analytics?shopId=" + encodeURIComponent(effectiveShopId), { cache: "no-store" });
      if (response.ok) setData(await response.json());
    } catch { /* analytics refresh can be retried */ }
    finally { setLoading(false); }
  }, [effectiveShopId]);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { fetch("/api/offerings", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(result => { const plans: PromotionOffering[] = (result?.offerings || []).filter((item: PromotionOffering & { category: string }) => item.category === "PROMOTION"); setPromotionOfferings(plans); setSelectedOfferingId(current => plans.some(p => p.id === current && p.targetType === targetType) ? current : (plans.find(p => p.targetType === targetType)?.id || "")); }).catch(() => {}); }, [targetType]);
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
          const completedMessage = status.paymentStatus === "PAID" ? "Payment confirmed. Your promotion is now active and its reach is being measured." : status.paymentStatus === "FAILED" ? (status.message || "Payment was not completed. You can try again.") : "Your promotion status has been updated.";
          setPaymentMessage(completedMessage);
          setFeedback({ type: status.paymentStatus === "FAILED" ? "error" : "success", title: status.paymentStatus === "FAILED" ? "Payment unsuccessful" : "Promotion update", message: completedMessage });
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

  const selectedShop = data?.shops.find(s => s.id === effectiveShopId) || data?.shops[0];
  const connection = connections.find(c => c.id === effectiveShopId) || connections[0];
  const products = selectedShop?.products || [];
  const selectedProduct = products.find(p => p.id === selectedPostId) || products[0];
  const selectedOffering = promotionOfferings.find(p => p.id === selectedOfferingId && p.targetType === targetType);
  const targetReach = selectedOffering?.effectiveReach ?? selectedOffering?.targetReach ?? 0;
  const durationDays = selectedOffering?.durationDays ?? 7;
  const packagePrice = selectedOffering?.price ?? 0;
  const summary = data?.summary || { impressions: 0, views: 0, clicks: 0, likes: 0, reach: 0, paidImpressions: 0, paidReach: 0 };
  const chartData = data?.daily || [];
  const campaigns = data?.campaigns || [];

  async function startPayment() {
    setPaying(true); setMessage(""); setPaymentMessage("");
    try {
      const response = await fetch("/api/promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ connectionId: effectiveShopId, targetType, offeringId: selectedOffering?.id, postId: targetType === "PRODUCT" ? (selectedPostId || selectedProduct?.id) : null, phoneNumber: phone }) });
      const result = await response.json();
      if (!response.ok) { const error = result.error || "Unable to start payment."; setMessage(error); setFeedback({ type: "error", title: "Promotion could not start", message: error }); return; }
      if (result.demoMode) {
        setPaymentMessage(result.message || "Demo promotion activated. No payment was taken.");
        setFeedback({ type: "success", title: "Promotion successful", message: (result.message || "Your promotion is active.") + " Duration: " + (durationDays + " days.") });
        void refresh();
      } else {
        setPendingCampaign(result.campaignId);
        setPaymentMessage(result.message || "Check your phone and enter your M-Pesa PIN to pay.");
        setFeedback({ type: "success", title: "Payment prompt sent", message: result.message || "Check your phone and enter your M-Pesa PIN to complete payment." });
      }
    } catch { const error = "We could not reach the payment service. Please try again."; setMessage(error); setFeedback({ type: "error", title: "Connection error", message: error }); }
    finally { setPaying(false); }
  }

  return <div className="seller-analytics-content">
    <GlobalFeedbackModal open={!!feedback} type={feedback?.type || "success"} title={feedback?.title || ""} message={feedback?.message || ""} onClose={() => setFeedback(null)} />
    {!promotionOnly && <div className="seller-analytics-shopbar"><div className="seller-analytics-shop-title"><span className="analytics-shop-avatar">{selectedShop?.profileImageUrl ? <img src={selectedShop.profileImageUrl} alt=""/> : <Store size={19}/>}</span><div><small>ANALYTICS FOR</small><b>@{connection?.username || selectedShop?.username || "—"}</b></div></div><label className="analytics-shop-select"><span>Switch shop</span><select value={effectiveShopId} onChange={e => { setSelectedShopId(e.target.value); onShopChange?.(e.target.value); setSelectedPostId(""); }} aria-label="Select shop">{connections.map(c => <option key={c.id} value={c.id}>@{c.username}</option>)}</select><ChevronDown size={15}/></label></div>}

{!promotionOnly && (<>
        <div className="seller-analytics-kpis">
      <article><span className="analytics-kpi-icon purple"><Eye size={18}/></span><small>Marketplace impressions</small><b>{loading ? "…" : summary.impressions.toLocaleString()}</b><em>Listings and store cards</em></article>
      <article><span className="analytics-kpi-icon blue"><Activity size={18}/></span><small>Page views</small><b>{loading ? "…" : summary.views.toLocaleString()}</b><em>Shop and product pages</em></article>
      <article><span className="analytics-kpi-icon violet"><Users size={18}/></span><small>Unique visitors reached</small><b>{loading ? "…" : summary.reach.toLocaleString()}</b><em>Estimated distinct browsers that saw a listing</em></article>
      <article><span className="analytics-kpi-icon amber"><MousePointer2 size={18}/></span><small>Marketplace clicks</small><b>{loading ? "…" : summary.clicks.toLocaleString()}</b><em>Product and shop cards</em></article>
      <article><span className="analytics-kpi-icon rose"><Heart size={18}/></span><small>Marketplace likes</small><b>{loading ? "…" : summary.likes.toLocaleString()}</b><em>Across your products</em></article>
    </div>

    <section className="seller-analytics-panel"><div className="seller-analytics-panel-heading"><div><span>PERFORMANCE OVER TIME</span><h2>Your activity, day by day</h2><p>Only events recorded on Instagram Market are shown.</p></div></div><div className="seller-analytics-charts"><LineChart data={chartData} metric="impressions" color="#8054cb" title="Impressions"/><LineChart data={chartData} metric="views" color="#3c87d8" title="Page views"/><LineChart data={chartData} metric="clicks" color="#dc9b3f" title="Clicks"/><LineChart data={chartData} metric="likes" color="#d75b7b" title="Likes"/></div><div className="analytics-legend"><span><i className="purple-dot"/> Impressions <b>{summary.impressions.toLocaleString()}</b></span><span><i className="blue-dot"/> Views <b>{summary.views.toLocaleString()}</b></span><span><i className="amber-dot"/> Clicks <b>{summary.clicks.toLocaleString()}</b></span><span><i className="rose-dot"/> All-time likes <b>{summary.likes.toLocaleString()}</b></span></div></section>

    <section className="seller-analytics-panel"><div className="seller-analytics-panel-heading"><div><span>PRODUCT PERFORMANCE</span><h2>What people are discovering</h2><p>Compare activity for products in @{selectedShop?.username}.</p></div><span className="analytics-count-pill">{products.length} products</span></div>
      {products.length ? <div className="analytics-product-table"><div className="analytics-table-head"><span>Product</span><span>Impressions</span><span>Views</span><span>Clicks</span><span>IG likes</span><span>Market likes</span></div>{products.slice().sort((a,b) => b.views-a.views).map(p => <div className="analytics-table-row" key={p.id}><div className="analytics-product-name"><span>{p.image ? <img src={p.image} alt=""/> : <Store size={18}/>}</span><div><b>{p.title}</b><small>{p.boosted ? "Boost active" : "Organic listing"}</small></div></div><b>{p.impressions.toLocaleString()}</b><b>{p.views.toLocaleString()}</b><b>{p.clicks.toLocaleString()}</b><b>{p.instagramLikes.toLocaleString()}</b><b>{p.likes.toLocaleString()}</b></div>)}</div> : <div className="analytics-empty-inline">Products from this shop will appear here after they are listed.</div>}
    </section>
    </>)}

    {promotionOnly && (<>
        <section className="seller-analytics-panel promotion-panel"><div className="seller-analytics-panel-heading"><div><span><Zap size={13}/> PRODUCT PROMOTION</span><h2>Promote your product or shop</h2><p>Demo mode is on: promotions activate immediately without M-Pesa or a charge. Choose 7 days or a full month (30 days), then select your reach target.</p></div><span className="analytics-mpesa-pill"><CheckCircle2 size={14}/> Demo mode · no charge</span></div>
      <div className="promotion-builder">
        <div className="promotion-form">
          <div className="promotion-type-toggle"><button type="button" className={targetType === "PRODUCT" ? "active" : ""} onClick={() => { setTargetType("PRODUCT"); setSelectedOfferingId(promotionOfferings.find(p => p.targetType === "PRODUCT")?.id || ""); }}><Sparkles size={16}/> Promote a product</button><button type="button" className={targetType === "STORE" ? "active" : ""} onClick={() => { setTargetType("STORE"); setSelectedOfferingId(promotionOfferings.find(p => p.targetType === "STORE")?.id || ""); }}><Store size={16}/> Promote whole shop</button></div>
          <div className="promotion-field"><span>Choose a promotion package</span><div className="promotion-packages">{promotionOfferings.filter(p => p.targetType === targetType).map(plan => <button type="button" key={plan.id} className={selectedOfferingId === plan.id ? "active" : ""} onClick={() => setSelectedOfferingId(plan.id)}><b>{plan.name}</b><small>{plan.reachMode === "ALL_USERS" ? plan.effectiveReach.toLocaleString() + " registered users" : plan.effectiveReach.toLocaleString() + " reach target"}</small><strong>KSh {plan.price.toLocaleString()} · {plan.durationDays} days</strong></button>)}</div>{!promotionOfferings.some(p => p.targetType === targetType) && <p className="analytics-empty-inline">No active packages for this promotion type. Ask the marketplace admin to publish one.</p>}{selectedOffering?.description && <p className="mt-3 text-xs leading-5 text-neutral-600">{selectedOffering.description}</p>}{!!selectedOffering?.features?.length && <ul className="mt-2 space-y-1">{selectedOffering.features.map((feature, i) => <li key={i} className="text-xs text-neutral-600">✓ {feature}</li>)}</ul>}</div></div>
          {targetType === "PRODUCT" && <div className="promotion-field"><span>Choose a product to promote</span><div className="promotion-product-picker">{products.map(p => <button type="button" key={p.id} className={"promotion-product-option " + ((selectedPostId || selectedProduct?.id) === p.id ? "active" : "")} onClick={() => setSelectedPostId(p.id)} aria-pressed={(selectedPostId || selectedProduct?.id) === p.id}><span className="promotion-product-image">{p.image ? <img src={p.image} alt="" /> : <Store size={20}/>}</span><span className="promotion-product-copy"><b>{p.title}</b><small>{p.mediaType === "VIDEO" ? "Video listing" : "Photo listing"} · {p.views.toLocaleString()} views · {p.likes.toLocaleString()} market likes</small><em>{p.boosted ? "Currently boosted" : "Ready to promote"}</em></span><span className="promotion-product-check">{(selectedPostId || selectedProduct?.id) === p.id ? <CheckCircle2 size={18}/> : null}</span></button>)}</div></div>}
          {!demoMode && <label className="promotion-field"><span>M-Pesa phone number</span><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XX XXX XXX" inputMode="tel" autoComplete="tel" /></label>}
          <div className="promotion-reach-note"><Users size={16}/><span>Reach is measured as distinct browser visitors whose promoted listing impression was recorded. It is an estimate, not a verified count of individual people; delivery can take time depending on marketplace traffic.</span></div>
          {message && <div className="analytics-feedback error" role="alert">{message}</div>}
          {paymentMessage && <div className="analytics-feedback" role="status"><CheckCircle2 size={17}/><span>{paymentMessage}</span></div>}
          {!products.length && <div className="analytics-feedback error">Add at least one active product listing with media to this shop before buying promotion.</div>}
          <button className="promotion-pay-button" onClick={startPayment} disabled={paying || !!pendingCampaign || !products.length || !selectedOffering || (targetType === "PRODUCT" && !selectedProduct) || (!demoMode && !phone.trim())}>{paying ? (demoMode ? "Activating promotion…" : "Starting M-Pesa…") : pendingCampaign ? "Waiting for payment confirmation…" : demoMode ? <>Activate promotion · KSh {packagePrice.toLocaleString()} <ArrowUpRight size={16}/></> : <>Pay KSh {packagePrice.toLocaleString()} with M-Pesa <ArrowUpRight size={16}/></>}</button>
          <small className="promotion-secure-note"><ShieldCheck size={13}/>{demoMode ? "Demo mode activates campaigns immediately without charging you. Live M-Pesa checkout can be enabled later." : "Your promotion activates after M-Pesa confirms payment."}</small>
        </div>
        <aside className="promotion-order-summary"><div className="promotion-summary-art"><TrendingUp size={28}/><span>Promotion plan</span></div><small>YOUR SELECTED PACKAGE</small><h3>{targetReach.toLocaleString()} reach</h3><p>{selectedOffering?.name || "Choose a promotion package"} · {targetType === "PRODUCT" ? selectedProduct?.title || "Your selected product" : "All eligible products from @" + (selectedShop?.username || "your shop")}</p><div className="promotion-summary-line"><span>Promotion duration</span><b>{durationDays} days</b></div><div className="promotion-summary-line"><span>Promotion target</span><b>{targetReach.toLocaleString()}</b></div><div className="promotion-summary-line"><span>One-time payment</span><b>KSh {packagePrice.toLocaleString()}</b></div><div className="promotion-summary-line"><span>Payment mode</span><b>{demoMode ? "Demo · no charge" : "M-Pesa STK Push"}</b></div><div className="promotion-summary-foot"><Radio size={14}/>{demoMode ? "Campaign activates instantly; reach tracking remains live" : "Live delivery tracking after payment"}</div></aside>
      </div>
    </section>

    <section className="seller-analytics-panel"><div className="seller-analytics-panel-heading"><div><span>CAMPAIGN HISTORY</span><h2>Paid promotion delivery</h2><p>Follow payment status, target and measured unique visitors delivered.</p></div><button className="analytics-refresh" onClick={() => void refresh()}><Activity size={14}/> Refresh</button></div>
      {campaigns.length ? <div className="analytics-campaign-list">{campaigns.map(c => <article key={c.id} className="analytics-campaign"><span className="analytics-campaign-image">{c.image ? <img src={c.image} alt=""/> : c.profileImageUrl ? <img src={c.profileImageUrl} alt=""/> : <Store size={19}/>}</span><div className="analytics-campaign-info"><b>{c.offeringName || (c.targetType === "PRODUCT" ? c.productTitle || "Product promotion" : "Shop promotion")} · @{c.username}</b><small>{c.provider === "DEMO" ? "Demo activation · no charge" : c.paymentStatus === "PAID" ? "Paid" + (c.receiptNumber ? " · Receipt " + c.receiptNumber : "") : c.paymentStatus === "FAILED" ? "Payment failed" : "Payment " + (c.paymentStatus || "pending").toLowerCase()}</small><div className="campaign-progress"><span style={{ width: Math.min(100, c.targetReach ? c.deliveredReach / c.targetReach * 100 : 0) + "%" }}/></div><small>{c.deliveredReach.toLocaleString()} of {c.targetReach.toLocaleString()} reach delivered</small></div><div className="analytics-campaign-right"><b>KSh {c.amount.toLocaleString()}</b><span className={"campaign-status " + c.status.toLowerCase()}>{c.status.replaceAll("_", " ")}</span></div></article>)}</div> : <div className="analytics-empty-inline">Your paid campaigns and payment receipts will appear here.</div>}
    </section>
    </>)}
  </div>;
}
