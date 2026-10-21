"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";

export function WishlistButton({ id, wishlisted = false, count, compact = false, largeCompact = false, productDetailStyle = false }: { id: string; wishlisted?: boolean; count?: number; compact?: boolean; largeCompact?: boolean; productDetailStyle?: boolean }) {
  const [saved, setSaved] = useState(wishlisted);
  const [n, setN] = useState(count ?? 0);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const nextSaved = !saved;
    const nextCount = Math.max(0, n + (nextSaved ? 1 : -1));
    setSaved(nextSaved);
    setN(nextCount);
    window.dispatchEvent(new CustomEvent("listing-wishlist-updated", { detail: { id, wishlisted: nextSaved, count: nextCount } }));
    setBusy(true);
    try {
      const r = await fetch("/api/products/" + id + "/wishlist", { method: "POST" });
      if (r.status === 401) {
        location.href = "/login?next=" + encodeURIComponent(location.pathname);
        return;
      }
      if (!r.ok) throw new Error("Wishlist request failed");
      const d = await r.json();
      setSaved(d.wishlisted);
      setN(d.wishlistCount);
      window.dispatchEvent(new CustomEvent("listing-wishlist-updated", { detail: { id, wishlisted: d.wishlisted, count: d.wishlistCount } }));
    } catch {
      setSaved(!nextSaved);
      setN(n);
      window.dispatchEvent(new CustomEvent("listing-wishlist-updated", { detail: { id, wishlisted: !nextSaved, count: n } }));
    } finally {
      setBusy(false);
    }
  }

  const productDetailColors = productDetailStyle
    ? (saved ? "!bg-white !text-black ring-1 ring-black/10" : "!bg-white !text-black ring-1 ring-black/10 hover:!bg-[#f7f7f7] active:!bg-[#f0f0f0]")
    : (saved ? "!bg-[#fff0bd] !text-[#6f4b00] ring-2 ring-white/90 shadow-md shadow-black/10" : "!bg-black/60 !text-white hover:!bg-black/75 active:!bg-black/75 ring-1 ring-white/25 backdrop-blur-sm");

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      title={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-busy={busy}
      aria-pressed={saved}
      className={
        "inline-flex items-center justify-center gap-2 rounded-full transition hover:-translate-y-0.5 " +
        (compact ? (largeCompact ? "h-12 w-12 " : "h-10 w-10 ") + (productDetailStyle ? "" : "shadow-sm ") : "px-5 py-3.5 text-sm font-bold ") +
        productDetailColors
      }
    >
      <Bookmark size={compact ? (largeCompact ? 21 : 17) : 16} fill={saved ? "currentColor" : "none"} strokeWidth={saved ? 2.5 : 2} />
      {!compact && <span>{n} saved</span>}
    </button>
  );
}
