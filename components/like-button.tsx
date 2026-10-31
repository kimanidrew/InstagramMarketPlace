"use client";

import { Heart } from "lucide-react";
import { useState } from "react";

export function LikeButton({ id, count, compact = false, largeCompact = false, initialLiked = false }: { id: string; count: number; compact?: boolean; largeCompact?: boolean; initialLiked?: boolean }) {
  const [liked, setLiked] = useState(initialLiked);
  const [n, setN] = useState(count);
  const [busy, setBusy] = useState(false);

  async function go() {
    if (busy) return;
    const nextLiked = !liked;
    const nextCount = Math.max(0, n + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setN(nextCount);
    window.dispatchEvent(new CustomEvent("listing-like-updated", { detail: { id, liked: nextLiked, count: nextCount } }));
    setBusy(true);
    try {
      const r = await fetch("/api/products/" + id + "/like", { method: "POST" });
      if (r.status === 401) {
        location.href = "/login?next=" + encodeURIComponent(location.pathname);
        return;
      }
      if (!r.ok) throw new Error("Like request failed");
      const d = await r.json();
      const totalLikes = typeof d.totalLikes === "number" ? d.totalLikes : d.localLikes;
      setLiked(d.liked);
      setN(totalLikes);
      window.dispatchEvent(new CustomEvent("listing-like-updated", { detail: { id, liked: d.liked, count: totalLikes } }));
    } catch {
      setLiked(!nextLiked);
      setN(n);
      window.dispatchEvent(new CustomEvent("listing-like-updated", { detail: { id, liked: !nextLiked, count: n } }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); go(); }}
      aria-label={liked ? "Unlike listing" : "Like listing"}
      title={liked ? "Unlike listing" : "Like listing"}
      aria-busy={busy}
      aria-pressed={liked}
      className={
        "inline-flex items-center justify-center gap-2 rounded-full transition hover:-translate-y-0.5 " +
        (compact ? (largeCompact ? "h-12 w-12 shadow-sm " : "h-10 w-10 shadow-sm ") : "px-5 py-3 text-sm font-semibold ") +
        (liked ? "bg-[#ff3b6b] text-white ring-2 ring-white/80 shadow-md shadow-[#ff3b6b]/30" : "bg-white/90 text-black border-0 ring-0 shadow-sm backdrop-blur-sm")
      }
    >
      <Heart size={compact ? (largeCompact ? 21 : 17) : 16} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 2.5 : 2} />
      {!compact && <span>{n.toLocaleString()} likes</span>}
    </button>
  );
}
