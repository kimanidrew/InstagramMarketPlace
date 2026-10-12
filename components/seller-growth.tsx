"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, BarChart3, Check, ChevronDown, Image as ImageIcon, Megaphone, ShieldCheck, Sparkles, Store, Zap } from "lucide-react";

type Product = { id: string; productTitle: string | null; mediaUrl?: string | null; thumbnailUrl?: string | null; mediaType?: string | null; permalink?: string | null };
type Connection = { id: string; username: string; name?: string | null; profileImageUrl?: string | null; verifiedAt?: string | null; verifiedUntil?: string | null; proUntil?: string | null; posts: Product[] };

export function SellerGrowth({ connections, embedded = false }: { connections: Connection[]; embedded?: boolean }) {
  const [selectedId, setSelectedId] = useState(connections[0]?.id || "");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const selectedShop = useMemo(() => connections.find(c => c.id === selectedId) || connections[0], [connections, selectedId]);
  const products = selectedShop?.posts || [];
  const chosenProduct = products.find(p => p.id === selectedProductId) || products[0];

  async function request(type: "BOOST" | "VERIFIED" | "PRO", connectionId: string, postId?: string) {
    setBusy(type + connectionId + (postId || ""));
    setMessage("");
    try {
      const res = await fetch("/api/growth/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, connectionId, postId }) });
      const data = await res.json();
      setMessage(res.ok ? (data.message || (type === "BOOST" ? "Your product boost request has been sent for review." : "Your shop growth request has been sent for review.")) : (data.error || "Something went wrong. Please try again."));
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
          {connections.map(c => <button type="button" role="option" aria-selected={c.id === selectedShop?.id} key={c.id} className={"growth-shop-option" + (c.id === selectedShop?.id ? " active" : "")} onClick={() => { setSelectedId(c.id); setSelectedProductId(""); setMessage(""); setShopDropdownOpen(false); }}>
            <span className="growth-option-avatar">{c.profileImageUrl ? <img src={c.profileImageUrl} alt="" /> : <Store size={18}/>}</span>
            <span className="growth-option-copy"><strong>@{c.username}</strong><small>{c.name || "Instagram Business profile"}</small></span>
            {c.id === selectedShop?.id ? <span className="growth-option-check"><Check size={15}/></span> : <span className="growth-option-arrow">Select</span>}
          </button>)}
          <div className="growth-dropdown-foot"><ShieldCheck size={13}/> Choose which shop you want to grow</div>
        </div>}
      </div>
      {connections.length > 1 && <div className="growth-shop-chips">{connections.map(c => <button key={c.id} type="button" onClick={() => { setSelectedId(c.id); setSelectedProductId(""); setMessage(""); }} className={c.id === selectedShop?.id ? "active" : ""}>{c.profileImageUrl ? <img src={c.profileImageUrl} alt="" /> : <Store size={14}/>}@{c.username}{c.id === selectedShop?.id && <Check size={13}/>}</button>)}</div>}
    </div>

    {message && <div role="status" className="seller-growth-message"><Sparkles size={16}/><span>{message}</span><button aria-label="Dismiss message" onClick={() => setMessage("")}>×</button></div>}

    <section className="growth-track growth-products">
      <div className="growth-section-heading"><span className="growth-step">02</span><div><span className="growth-section-kicker"><Megaphone size={13}/> PRODUCT GROWTH</span><h3>Put a product in the spotlight</h3><p>Pick the exact product you want more people to discover.</p></div><span className="growth-price-pill">Pay by reach <small>from KSh 100</small></span></div>
      {products.length ? <>
        <div className="growth-product-grid">{products.map((p) => {
          const selected = (chosenProduct?.id || "") === p.id;
          const image = p.thumbnailUrl || p.mediaUrl;
          return <button type="button" key={p.id} className={"growth-product-choice" + (selected ? " selected" : "")} onClick={() => { setSelectedProductId(p.id); setMessage(""); }} aria-pressed={selected}>
            <span className="growth-product-image">{image ? <img src={image} alt={p.productTitle || "Product"} loading="lazy"/> : <span className="growth-image-fallback"><ImageIcon size={25}/></span>}{selected && <span className="growth-selected-check"><Check size={15}/></span>}</span>
            <span className="growth-product-info"><strong>{p.productTitle || "Untitled product"}</strong><small>{selected ? "Selected for boost" : "Tap to select"}</small></span>
          </button>;
        })}</div>
        <div className="growth-action-row"><div><b>{chosenProduct?.productTitle || "Choose a product"}</b><small>Selected product · 7-day visibility boost</small></div><Link href={chosenProduct ? "/account/analytics?shopId=" + encodeURIComponent(selectedShop.id) + "&postId=" + encodeURIComponent(chosenProduct.id) : "/account/analytics"} className="growth-primary-action">{<>Choose reach &amp; pay <Zap size={15}/></>}</Link></div>
      </> : <div className="growth-no-products"><ImageIcon size={22}/><div><b>No products found for this shop yet</b><p>Once your Instagram posts are listed as products, you can choose one here to boost.</p></div></div>}
    </section>

    <section className="growth-track growth-shop-plans">
      <div className="growth-section-heading"><span className="growth-step">03</span><div><span className="growth-section-kicker"><Store size={13}/> SHOP GROWTH</span><h3>Build trust in your whole shop</h3><p>These options apply to <b>@{selectedShop?.username}</b>, not an individual product.</p></div></div>
      <div className="growth-shop-plan-grid">
        <article className="growth-plan-card"><span className="growth-plan-icon"><ShieldCheck size={21}/></span><span className="growth-plan-price">KSh 999 <small>/ year</small></span><h4>Verified shop</h4><p>After approval, your shop displays a Verified badge for 12 months, helping customers identify businesses that passed the marketplace review.</p><ul><li><Check size={13}/> Verified badge on your shop</li><li><Check size={13}/> Trust-focused profile</li><li><Check size={13}/> Verification review</li></ul><button type="button" disabled={!!busy || activeVerified} onClick={() => request("VERIFIED", selectedShop!.id)}>{activeVerified ? "Shop already verified" : busy === "VERIFIED" + selectedShop?.id ? "Sending request…" : <>Request verification <BadgeCheck size={15}/></>}</button></article>
        <article className="growth-plan-card growth-plan-pro"><span className="growth-plan-icon"><Sparkles size={21}/></span><span className="growth-plan-price">KSh 499 <small>/ month</small></span><h4>Pro Seller</h4><p>After approval, your shop displays the Pro Seller badge and receives a 30-day Pro period with seller analytics and priority growth features.</p><ul><li><Check size={13}/> Pro Seller badge</li><li><Check size={13}/> Seller analytics foundation</li><li><Check size={13}/> Priority growth features</li></ul><button type="button" disabled={!!busy || activePro} onClick={() => request("PRO", selectedShop!.id)}>{activePro ? "Pro is active" : busy === "PRO" + selectedShop?.id ? "Sending request…" : <>Explore Pro Seller <Sparkles size={15}/></>}</button>{activePro && <small className="growth-active-note">Your Pro plan is active until {new Date(selectedShop!.proUntil!).toLocaleDateString()}.</small>}</article>
      </div>
    </section>
    <p className="growth-review-note"><ShieldCheck size={15}/> Verification and Pro Seller requests require admin approval. Approved verification lasts 12 months; Pro Seller lasts 30 days. Product and shop promotions use the separate reach-based payment flow.</p>
  </section>;
}
