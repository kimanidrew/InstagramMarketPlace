"use client";

import { useEffect, useState } from "react";

export function TotalLikesStat({ id, initialCount }: { id: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const onLike = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; count: number }>).detail;
      if (detail?.id === id && Number.isFinite(detail.count)) setCount(detail.count);
    };
    window.addEventListener("listing-like-updated", onLike);
    return () => window.removeEventListener("listing-like-updated", onLike);
  }, [id]);

  return (
    <div className="rounded-[18px] bg-[#f7f7f4] p-3.5">
      <b className="block text-lg font-black">{count.toLocaleString()}</b>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#999]">Total likes</p>
    </div>
  );
}
