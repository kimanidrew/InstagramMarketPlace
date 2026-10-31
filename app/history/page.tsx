"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Clock3, Search, SlidersHorizontal, Store, Trash2, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { analyticsVisitorId } from "@/lib/analytics-client";

type HistoryEntry = { kind: "product" | "store"; item: any; viewedAt: number };

export default function HistoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "product" | "service" | "store">("all");
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [removing, setRemoving] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const visitorId = analyticsVisitorId();
    Promise.all([
      fetch("/api/shopper/history", { cache: "no-store" }).then((r) => r.ok ? r.json() : { products: [] }),
      fetch("/api/shopper/stores-history?visitorId=" + encodeURIComponent(visitorId), { cache: "no-store" }).then((r) => r.ok ? r.json() : { stores: [] }),
    ]).then(([p, s]) => {
      if (!cancelled) { setProducts(p.products || []); setStores(s.stores || []); }
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const entries = useMemo<HistoryEntry[]>(() => [
    ...products.map((item) => ({ kind: "product" as const, item, viewedAt: new Date(item.historyViewedAt || 0).getTime() })),
    ...stores.map((item) => ({ kind: "store" as const, item, viewedAt: new Date(item.historyViewedAt || 0).getTime() })),
  ].sort((a, b) => b.viewedAt - a.viewedAt), [products, stores]);

  const visible = entries.filter(({ kind, item }) => {
    const service = kind === "product" && String(item.listingType || "").toUpperCase() === "SERVICE";
    const matchesFilter = filter === "all" || (filter === "store" ? kind === "store" : kind === "product" && (filter === "service" ? service : !service));
    const haystack = kind === "store"
      ? [item.username].join(" ").toLowerCase()
      : [item.productTitle, item.category, item.subcategory, item.connection?.username, ...(item.tags || []).map((tag: any) => tag.name)].join(" ").toLowerCase();
    return matchesFilter && haystack.includes(query.trim().toLowerCase());
  });

  async function removeEntry(entry: HistoryEntry) {
    const { kind, item } = entry;
    const key = kind + "-" + item.id;
    setRemoving((v) => [...v, key]);
    try {
      const url = kind === "product" ? "/api/shopper/history" : "/api/shopper/stores-history?visitorId=" + encodeURIComponent(analyticsVisitorId()) + "&connectionId=" + encodeURIComponent(item.id);
      const response = await fetch(url, kind === "product"
        ? { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: item.id }) }
        : { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to remove history item");
      if (kind === "product") setProducts((v) => v.filter((x) => x.id !== item.id));
      else setStores((v) => v.filter((x) => x.id !== item.id));
    } finally {
      setRemoving((v) => v.filter((x) => x !== key));
    }
  }

  async function clearAll() {
    setClearing(true);
    try {
      const [p, s] = await Promise.all([
        fetch("/api/shopper/history", { method: "DELETE" }),
        fetch("/api/shopper/stores-history?visitorId=" + encodeURIComponent(analyticsVisitorId()), { method: "DELETE" }),
      ]);
      if (p.ok) setProducts([]);
      if (s.ok) setStores([]);
    } finally { setClearing(false); }
  }

  return (
    <main className="shell min-h-[65vh] py-8 md:py-12">
      <Link href="/shop" className="inline-flex items-center gap-2 text-xs font-bold text-[#666] hover:text-black"><ArrowLeft size={15} /> Back to shop</Link>
      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow plain"><Clock3 size={13} /> Your activity</p><h1 className="mt-2 text-4xl font-black tracking-[-.05em] md:text-5xl">Shopping history.</h1><p className="mt-2 text-sm text-[#777]">Pick up where you left off with products, services and stores you recently visited.</p></div>
        <button type="button" onClick={clearAll} disabled={clearing || entries.length === 0} className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-xs font-black text-[#555] transition hover:border-black hover:text-black disabled:opacity-40"><Trash2 size={14} /> {clearing ? "Clearing…" : "Clear history"}</button>
      </div>

      <div className="mt-8 flex flex-col gap-3 lg:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 focus-within:border-black"><Search size={17} className="shrink-0 text-[#888]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, services or stores…" className="w-full bg-transparent text-sm outline-none placeholder:text-[#999]" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button>}</label>
        <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 px-1 text-xs font-bold text-[#777]"><SlidersHorizontal size={14} /> Filter</span>{(["all","product","service","store"] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={"rounded-full px-4 py-2.5 text-xs font-black capitalize transition " + (filter === value ? "bg-black text-white" : "border border-black/10 bg-white text-[#555] hover:border-black")}>{value === "all" ? "All" : value === "product" ? "Products" : value === "service" ? "Services" : "Stores"}</button>)}</div>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs font-bold text-[#888]"><span>{loading ? "Loading history…" : visible.length + (visible.length === 1 ? " item" : " items")}</span><span>Most recent first</span></div>
      {loading ? <div className="py-24 text-center text-sm text-[#888]">Loading your shopping history…</div> : visible.length ? (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {visible.map(({ kind, item }) => kind === "product" ? (
            <div key={"product-" + item.id} className="relative min-w-0">
              <ProductCard p={item} />
              <button type="button" onClick={() => void removeEntry({ kind, item, viewedAt: 0 })} disabled={removing.includes("product-" + item.id)} aria-label="Remove from history" className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-white shadow-sm hover:bg-black disabled:opacity-50"><X size={14} /></button>
            </div>
          ) : (
            <div key={"store-" + item.id} className="relative">
              <Link href={"/stores/" + item.username} className="flex aspect-square flex-col items-center justify-center rounded-[24px] border border-black/5 bg-[#f8f8f6] p-5 text-center transition hover:bg-white">
                <span className="h-20 w-20 overflow-hidden rounded-full bg-[#ecece8]">{item.profileImageUrl ? <img src={item.profileImageUrl} alt={"@" + item.username} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center font-black">@</span>}</span>
                <b className="mt-4 max-w-full truncate text-sm font-black">@{item.username}</b><span className="mt-2 text-xs font-bold text-[#777]">Visit store <ArrowRight size={12} className="inline" /></span>
              </Link>
              <button type="button" onClick={() => void removeEntry({ kind, item, viewedAt: 0 })} disabled={removing.includes("store-" + item.id)} aria-label="Remove from history" className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-white shadow-sm hover:bg-black disabled:opacity-50"><X size={14} /></button>
            </div>
          ))}
        </div>
      ) : <div className="mt-8 rounded-[28px] border border-dashed border-black/10 bg-[#fafaf8] px-5 py-20 text-center"><Clock3 className="mx-auto text-[#999]" size={26} /><h2 className="mt-4 text-xl font-black">{entries.length ? "No matching history" : "Your history is empty"}</h2><p className="mt-2 text-sm text-[#777]">{entries.length ? "Try another search or filter." : "Listings and stores you visit will appear here."}</p><Link href="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-black text-white">Explore marketplace <ArrowRight size={14} /></Link></div>}
    </main>
  );
}
