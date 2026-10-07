"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";

export function WishlistButton({
  id,
  wishlisted = false,
  count,
  compact = false,
}: {
  id: string;
  wishlisted?: boolean;
  count?: number;
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(wishlisted);
  const [n, setN] = useState(count);

  async function toggle() {
    const r = await fetch("/api/products/" + id + "/wishlist", { method: "POST" });
    if (r.status === 401) {
      location.href = "/login?next=" + encodeURIComponent(location.pathname);
      return;
    }
    if (!r.ok) return;
    const d = await r.json();
    setSaved(d.wishlisted);
    setN(d.wishlistCount);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      title={saved ? "Remove from wishlist" : "Add to wishlist"}
      className={
        "inline-flex items-center justify-center gap-2 rounded-full border transition hover:-translate-y-0.5 " +
        (compact ? "h-10 w-10 bg-white/95 shadow-sm" : "px-5 py-3.5 text-sm font-bold ") +
        (saved ? "border-black bg-black text-white" : "border-black/10 bg-white text-black")
      }
    >
      <Bookmark size={compact ? 17 : 16} fill={saved ? "currentColor" : "none"} />
      {!compact && <span>{n ?? 0} saved</span>}
    </button>
  );
}
