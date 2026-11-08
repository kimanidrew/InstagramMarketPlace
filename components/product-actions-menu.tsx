"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreHorizontal, ExternalLink, Store, Pencil, X } from "lucide-react";

export function ProductActionsMenu({ editHref, productHref, storeHref, canEdit = false }: { editHref: string; productHref: string; storeHref: string; canEdit?: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return <div ref={root} className="relative inline-flex shrink-0">
    <button type="button" aria-label="More product options" aria-expanded={open} onClick={(event) => { event.stopPropagation(); setOpen(value => !value); }} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e9e9e7] bg-white text-[#333] transition hover:border-[#d5d5d2] hover:bg-[#f7f7f5] active:scale-95">
      <MoreHorizontal size={20}/>
    </button>
    {open && <>
      <button type="button" aria-label="Close product options" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)}/>
      <div role="menu" className="absolute right-0 top-[calc(100%+9px)] z-50 w-52 overflow-hidden rounded-2xl border border-[#ececea] bg-white p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.14)]">
        {canEdit && <Link role="menuitem" href={editHref} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#171717] transition hover:bg-[#f7f7f5]"><Pencil size={16}/> Edit product</Link>}
        <Link role="menuitem" href={productHref} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#444] transition hover:bg-[#f7f7f5]"><ExternalLink size={16}/> View details</Link>
        <Link role="menuitem" href={storeHref} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#444] transition hover:bg-[#f7f7f5]"><Store size={16}/> Visit shop</Link>
      </div>
    </>}
  </div>;
}
