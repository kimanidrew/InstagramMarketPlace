"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, BarChart3, Check, ChevronDown, Megaphone, ShieldCheck, Sparkles, Store } from "lucide-react";
import { SellerAnalytics } from "@/components/seller-analytics";

type Connection = { id: string; username: string; name?: string | null; profileImageUrl?: string | null; verifiedAt?: string | null; verifiedUntil?: string | null; proUntil?: string | null; posts: { id: string }[] };
type GrowthOffering = { id: string; code: string; name: string; category: "PROMOTION" | "GROWTH"; description: string; price: number; durationDays: number; features: string[]; active: boolean };

export function SellerGrowth({ connections, embedded = false, initialTab = "store" }: { connections: Connection[]; embedded?: boolean; initialTab?: "store" | "promotion" }) {
  const [selectedId, setSelectedId] = useState(connections[0]?.id || "");
  const [growthOfferings, setGrowthOfferings] = useState<GrowthOffering[]>([]);
  useEffect(() => { fetch("/api/offerings", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => { if (data?.offerings) setGrowthOfferings(data.offerings.filter((item: GrowthOffering) => item.category === "GROWTH")); }).catch(() => {}); }, []);
  const studioTab = initialTab;
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const selectedShop = useMemo(() => connections.find(c => c.id === selectedId) || connections[0], [connections, selectedId]);

  async function request(offering: GrowthOffering, connectionId: string) {
    setBusy(offering.id + connectionId);
    setMessage("");
    try {
      const res = await fetch("/api/growth/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offeringId: offering.id, connectionId }) });
      const data = await res.json();
      setMessage(res.ok ? (data.message || "Your growth request has been sent for review.") : (data.error || "Something went wrong. Please try again."));
    } catch {
      setMessage("We couldn't send that request. Check your connection and try again.");
    } finally {
      setBusy("");
    }
  }

  if (!connections.length) return null;
  const activePro = !!selectedShop?.proUntil && new Date(selectedShop.proUntil) > new Date();
  const activeVerified = !!selectedShop?.verifiedAt && (!selectedShop?.verifiedUntil || new Date(selectedShop.verifiedUntil) > new Date());
  const profile = selectedShop?.profileImageUrl;

  return <section className="seller-growth">
    {!embedded && <div className="growth-welcome">
      <div><span className="growth-kicker"><Sparkles size={13}/> YOUR GROWTH STUDIO</span><h2>One place to grow<br/><span>your business.</span></h2><p>Choose a shop first, then decide whether to promote a product or grow your whole shop. You stay in control at every step.</p></div>
      <div className="growth-welcome-art"><BarChart3 size={34}/><span>Small steps.<br/><b>More visibility.</b></span></div>
    </div>}

    <div className="growth-shop-picker">
      <div className="growth-shop-picker-label"><span className="growth-step">01</span><div><b>Choose the shop</b><small>All growth options below apply to this shop.</small></div></div>
      <div className={"growth-shop-select-wrap" + (shopDropdownOpen ? " is-open" : "")}>
        <button type="button" className="growth-shop-select" aria-label="Choose a shop to grow" aria-haspopup="listbox" aria-expanded={shopDropdownOpen} onClick={() => setShopDropdownOpen(open => !open)}>
          <span className="growth-avatar">{profile ? <img src={profile} alt="" /> : <Store size={22}/>}</span>
          <span className="growth-shop-select-copy"><small>SELECTED INSTAGRAM SHOP</small><strong>@{selectedShop?.username}</strong><em>{selectedShop?.name || "Your Instagram Business profile"}</em></span>
          <span className="growth-select-indicator"><ChevronDown size={18}/></span>
        </button>
        {shopDropdownOpen && <div className="growth-shop-dropdown" role="listbox" aria-label="Instagram shops">
          <div className="growth-dropdown-heading"><span>YOUR SHOPS</span><small>{connections.length} {connections.length === 1 ? "shop" : "shops"}</small></div>
          {connections.map(c => <button type="button" role="option" aria-selected={c.id === selectedShop?.id} key={c.id} className={"growth-shop-option" + (c.id === selectedShop?.id ? " active" : "")} onClick={() => { setSelectedId(c.id); setMessage(""); setShopDropdownOpen(false); }}>
            <span className="growth-option-avatar">{c.profileImageUrl ? <img src={c.profileImageUrl} alt="" /> : <Store size={18}/>}</span>
            <span className="growth-option-copy"><strong>@{c.username}</strong><small>{c.name || "Instagram Business profile"}</small></span>
            {c.id === selectedShop?.id ? <span className="growth-option-check"><Check size={15}/></span> : <span className="growth-option-arrow">Select</span>}
          </button>)}
          <div className="growth-dropdown-foot"><ShieldCheck size={13}/> Choose which shop you want to grow</div>
        </div>}
      </div>
      {connections.length > 1 && <div className="growth-shop-chips">{connections.map(c => <button key={c.id} type="button" onClick={() => { setSelectedId(c.id); setMessage(""); }} className={c.id === selectedShop?.id ? "active" : ""}>{c.profileImageUrl ? <img src={c.profileImageUrl} alt="" /> : <Store size={14}/>}@{c.username}{c.id === selectedShop?.id && <Check size={13}/>}</button>)}</div>}
    </div>

    {message && <div role="status" className="seller-growth-message"><Sparkles size={16}/><span>{message}</span><button aria-label="Dismiss message" onClick={() => setMessage("")}>×</button></div>}

    <div className="growth-studio-tabs" role="tablist" aria-label="Seller Growth Studio">
      <Link href="/account/analytics?tab=store-growth" role="tab" aria-selected={studioTab === "store"} className={studioTab === "store" ? "active" : ""}><Store size={16}/> Store Growth</Link>
      <Link href="/account/analytics?tab=product-promotion" role="tab" aria-selected={studioTab === "promotion"} className={studioTab === "promotion" ? "active" : ""}><Megaphone size={16}/> Product Promotion</Link>
    </div>
    {studioTab === "store" ? <>
    <section className="growth-track growth-shop-plans">
      <div className="growth-section-heading"><span className="growth-step">01</span><div><span className="growth-section-kicker"><Store size={13}/> SHOP GROWTH</span><h3>Build trust in your whole shop</h3><p>These options apply to <b>@{selectedShop?.username}</b>, not an individual product.</p></div></div>
      <div className="growth-shop-plan-grid">
        {growthOfferings.map((offering) => {
          const code = offering.code.toUpperCase();
          const isVerified = code === "VERIFIED";
          const isPro = code === "PRO";
          const alreadyActive = (isVerified && activeVerified) || (isPro && activePro);
          return <article key={offering.id} className={"growth-plan-card" + (isPro ? " growth-plan-pro" : "")}>
            <span className="growth-plan-icon">{isVerified ? <ShieldCheck size={21}/> : isPro ? <Sparkles size={21}/> : <BadgeCheck size={21}/>}</span>
            <span className="growth-plan-price">KSh {offering.price.toLocaleString()} <small>/ {offering.durationDays} days</small></span>
            <h4>{offering.name}</h4>
            <p>{offering.description || "A marketplace growth option for your shop."}</p>
            {!!offering.features.length && <ul>{offering.features.map((feature, i) => <li key={i}><Check size={13}/>{feature}</li>)}</ul>}
            <button type="button" disabled={!!busy || alreadyActive} onClick={() => request(offering, selectedShop!.id)}>{alreadyActive ? (isVerified ? "Shop already verified" : "Plan already active") : busy === offering.id + selectedShop?.id ? "Sending request…" : <>Request plan <Sparkles size={15}/></>}</button>
            {isVerified && activeVerified && <small className="growth-active-note">Verified until {selectedShop?.verifiedUntil ? new Date(selectedShop.verifiedUntil).toLocaleDateString() : "further notice"}.</small>}
            {isPro && activePro && <small className="growth-active-note">Pro active until {new Date(selectedShop!.proUntil!).toLocaleDateString()}.</small>}
          </article>;
        })}
        {!growthOfferings.length && <p className="col-span-full rounded-2xl border border-dashed border-black/15 p-6 text-sm text-[#777]">Growth plans are loading, or no active plans are currently available. Please check back soon.</p>}
      </div>
    </section>
    </> : <div className="growth-promotion-tab-panel">
      <SellerAnalytics
        promotionOnly
        connections={connections.map(c => ({ id: c.id, username: c.username, name: c.name || null, profileImageUrl: c.profileImageUrl || null, posts: c.posts.map(p => ({ id: p.id, title: p.productTitle || "Untitled product", slug: null, image: p.thumbnailUrl || p.mediaUrl || null, mediaType: p.mediaType || "IMAGE" })) }))}
        initialShopId={selectedId}
        activeShopId={selectedId}
        onShopChange={setSelectedId}
      />
    </div>}
    <p className="growth-review-note"><ShieldCheck size={15}/> Verification and Pro Seller requests require admin approval. Approved verification lasts 12 months; Pro Seller lasts 30 days. Shop growth requests are reviewed by an admin.</p>
  </section>;
}
