"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, BarChart3, Check, ChevronDown, Image as ImageIcon, Megaphone, ShieldCheck, Sparkles, Store, Zap } from "lucide-react";

type Product = { id: string; productTitle: string | null; mediaUrl?: string | null; thumbnailUrl?: string | null; mediaType?: string | null; permalink?: string | null };
type Connection = { id: string; username: string; name?: string | null; profileImageUrl?: string | null; verifiedAt?: string | null; proUntil?: string | null; posts: Product[] };

export function SellerGrowth({ connections }: { connections: Connection[] }) {
  const [selectedId, setSelectedId] = useState(connections[0]?.id || "");
  const [selectedProductId, setSelectedProductId] = useState("");
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
  const profile = selectedShop?.profileImageUrl;

  return <section className="seller-growth">
    <div className="growth-welcome">
      <div><span className="growth-kicker"><Sparkles size={13}/> YOUR GROWTH STUDIO</span><h2>One place to grow<br/><span>your business.</span></h2><p>Choose a shop first, then decide whether to promote a product or grow your whole shop. You stay in control at every step.</p></div>
      <div className="growth-welcome-art"><BarChart3 size={34}/><span>Small steps.<br/><b>More visibility.</b></span></div>
    </div>

    <div className="growth-shop-picker">
      <div className="growth-shop-picker-label"><span className="growth-step">01</span><div><b>Choose the shop</b><small>All growth options below apply to this shop.</small></div></div>
      <label className="growth-shop-select">
        <span className="growth-avatar">{profile ? <img src={profile} alt={selectedShop?.username + " profile"} /> : <Store size={22}/>}</span>
        <span className="growth-shop-select-copy"><small>SELECTED INSTAGRAM SHOP</small><strong>@{selectedShop?.username}</strong><em>{selectedShop?.name || "Your Instagram Business profile"}</em></span>
        <ChevronDown size={18}/>
        <select aria-label="Choose a shop to grow" value={selectedShop?.id || ""} onChange={e => { setSelectedId(e.target.value); setSelectedProductId(""); setMessage(""); }}>
          {connections.map(c => <option key={c.id} value={c.id}>@{c.username}</option>)}
        </select>
      </label>
      {connections.length > 1 && <div className="growth-shop-chips">{connections.map(c => <button key={c.id} type="button" onClick={() => { setSelectedId(c.id); setSelectedProductId(""); setMessage(""); }} className={c.id === selectedShop?.id ? "active" : ""}>{c.profileImageUrl ? <img src={c.profileImageUrl} alt="" /> : <Store size={14}/>}@{c.username}{c.id === selectedShop?.id && <Check size={13}/>}</button>)}</div>}
    </div>

    {message && <div role="status" className="seller-growth-message"><Sparkles size={16}/><span>{message}</span><button aria-label="Dismiss message" onClick={() => setMessage("")}>×</button></div>}

    <section className="growth-track growth-products">
      <div className="growth-section-heading"><span className="growth-step">02</span><div><span className="growth-section-kicker"><Megaphone size={13}/> PRODUCT GROWTH</span><h3>Put a product in the spotlight</h3><p>Pick the exact product you want more people to discover.</p></div><span className="growth-price-pill">KSh 150 <small>/ 7 days</small></span></div>
      {products.length ? <>
        <div className="growth-product-grid">{products.map((p) => {
          const selected = (chosenProduct?.id || "") === p.id;
          const image = p.thumbnailUrl || p.mediaUrl;
          return <button type="button" key={p.id} className={"growth-product-choice" + (selected ? " selected" : "")} onClick={() => { setSelectedProductId(p.id); setMessage(""); }} aria-pressed={selected}>
            <span className="growth-product-image">{image ? <img src={image} alt={p.productTitle || "Product"} loading="lazy"/> : <span className="growth-image-fallback"><ImageIcon size={25}/></span>}{selected && <span className="growth-selected-check"><Check size={15}/></span>}</span>
            <span className="growth-product-info"><strong>{p.productTitle || "Untitled product"}</strong><small>{selected ? "Selected for boost" : "Tap to select"}</small></span>
          </button>;
        })}</div>
        <div className="growth-action-row"><div><b>{chosenProduct?.productTitle || "Choose a product"}</b><small>Selected product · 7-day visibility boost</small></div><button type="button" className="growth-primary-action" disabled={!chosenProduct || !!busy} onClick={() => chosenProduct && request("BOOST", selectedShop.id, chosenProduct.id)}>{busy === "BOOST" + selectedShop.id + chosenProduct?.id ? "Sending request…" : <>Request product boost <Zap size={15}/></>}</button></div>
      </> : <div className="growth-no-products"><ImageIcon size={22}/><div><b>No products found for this shop yet</b><p>Once your Instagram posts are listed as products, you can choose one here to boost.</p></div></div>}
    </section>

    <section className="growth-track growth-shop-plans">
      <div className="growth-section-heading"><span className="growth-step">03</span><div><span className="growth-section-kicker"><Store size={13}/> SHOP GROWTH</span><h3>Build trust in your whole shop</h3><p>These options apply to <b>@{selectedShop?.username}</b>, not an individual product.</p></div></div>
      <div className="growth-shop-plan-grid">
        <article className="growth-plan-card"><span className="growth-plan-icon"><ShieldCheck size={21}/></span><span className="growth-plan-price">KSh 999 <small>/ year</small></span><h4>Verified shop</h4><p>Show customers that your business has completed the marketplace verification review.</p><ul><li><Check size={13}/> Verified badge on your shop</li><li><Check size={13}/> Trust-focused profile</li><li><Check size={13}/> Verification review</li></ul><button type="button" disabled={!!busy || !!selectedShop?.verifiedAt} onClick={() => request("VERIFIED", selectedShop!.id)}>{selectedShop?.verifiedAt ? "Shop already verified" : busy === "VERIFIED" + selectedShop?.id ? "Sending request…" : <>Request verification <BadgeCheck size={15}/></>}</button></article>
        <article className="growth-plan-card growth-plan-pro"><span className="growth-plan-icon"><Sparkles size={21}/></span><span className="growth-plan-price">KSh 499 <small>/ month</small></span><h4>Pro Seller</h4><p>Give your shop a stronger presence with seller-focused tools and priority growth features.</p><ul><li><Check size={13}/> Pro Seller badge</li><li><Check size={13}/> Seller analytics foundation</li><li><Check size={13}/> Priority growth features</li></ul><button type="button" disabled={!!busy || activePro} onClick={() => request("PRO", selectedShop!.id)}>{activePro ? "Pro is active" : busy === "PRO" + selectedShop?.id ? "Sending request…" : <>Explore Pro Seller <Sparkles size={15}/></>}</button>{activePro && <small className="growth-active-note">Your Pro plan is active until {new Date(selectedShop!.proUntil!).toLocaleDateString()}.</small>}</article>
      </div>
    </section>
    <p className="growth-review-note"><ShieldCheck size={15}/> Requests are reviewed by the marketplace team. Paid features activate only after approval and payment confirmation.</p>
  </section>;
}
