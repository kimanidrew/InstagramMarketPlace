"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Save } from "lucide-react";

type Listing = { id: string; slug: string; type: "PRODUCT" | "SERVICE"; title: string; description: string; category: string; subcategory: string; amount: string; currency: string; image?: string | null };

export function ProductEditForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [category, setCategory] = useState(listing.category);
  const [subcategory, setSubcategory] = useState(listing.subcategory);
  const [amount, setAmount] = useState(listing.amount);
  const [currency, setCurrency] = useState(listing.currency || "KES");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/products/" + encodeURIComponent(listing.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, subcategory, amount: amount.trim() ? amount : null, currency }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We couldn't save your changes.");
      router.push((listing.type === "SERVICE" ? "/service/" : "/product/") + listing.slug);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't save your changes.");
      setBusy(false);
    }
  }

  const field = "mt-2 h-12 w-full rounded-xl border border-[#e7e7e4] bg-white px-3.5 text-sm font-medium text-[#222] outline-none transition placeholder:text-[#aaa] focus:border-[#df4141] focus:ring-4 focus:ring-[#df4141]/[0.08]";
  const label = "block text-xs font-bold tracking-wide text-[#555]";

  return <form onSubmit={save} className="space-y-5">
    {listing.image && <div className="flex items-center gap-3 rounded-2xl bg-[#f7f7f5] p-3"><img src={listing.image} alt="" className="h-16 w-16 rounded-xl object-cover"/><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#999]">{listing.type === "SERVICE" ? "Your service" : "Your product"}</p><p className="mt-1 truncate text-sm font-bold text-[#222]">{listing.title}</p><p className="mt-1 text-xs text-[#888]">Changes appear on your SokoLink listing.</p></div></div>}
    <label className={label}>Product or service name<input className={field} value={title} onChange={e=>setTitle(e.target.value)} maxLength={120} required placeholder="Give your listing a clear name"/></label>
    <label className={label}>Description<textarea className="mt-2 min-h-32 w-full resize-y rounded-xl border border-[#e7e7e4] bg-white px-3.5 py-3 text-sm leading-6 text-[#222] outline-none transition placeholder:text-[#aaa] focus:border-[#df4141] focus:ring-4 focus:ring-[#df4141]/[0.08]" value={description} onChange={e=>setDescription(e.target.value)} maxLength={2000} placeholder="Tell shoppers what makes it special..."/></label>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className={label}>Category<input className={field} value={category} onChange={e=>setCategory(e.target.value)} maxLength={60} placeholder="e.g. Fashion"/></label>
      <label className={label}>Subcategory<input className={field} value={subcategory} onChange={e=>setSubcategory(e.target.value)} maxLength={60} placeholder="e.g. Shoes"/></label>
    </div>
    <div className="rounded-2xl border border-[#eeeeeb] bg-[#fafaf9] p-4">
      <p className="text-sm font-extrabold text-[#222]">Selling price</p>
      <p className="mt-1 text-xs leading-5 text-[#888]">Leave the amount empty if you prefer customers to contact you for a quote.</p>
      <div className="mt-3 grid grid-cols-[110px_minmax(0,1fr)] gap-2">
        <select aria-label="Currency" className={field+" mt-0"} value={currency} onChange={e=>setCurrency(e.target.value)}><option value="KES">KES</option><option value="USD">USD</option></select>
        <input aria-label="Price amount" className={field+" mt-0"} type="number" min="0.01" max="10000000" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Enter amount"/>
      </div>
    </div>
    {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700">{error}</p>}
    <div className="flex flex-col-reverse gap-3 border-t border-[#efefed] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <Link href={(listing.type === "SERVICE" ? "/service/" : "/product/") + listing.slug} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-[#666] transition hover:bg-[#f5f5f3]"><ArrowLeft size={16}/> Cancel</Link>
      <button type="submit" disabled={busy || !title.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ed4545] to-[#d92f36] px-6 text-sm font-extrabold text-white shadow-[0_5px_14px_rgba(217,47,54,0.18)] transition hover:-translate-y-px hover:shadow-[0_7px_18px_rgba(217,47,54,0.23)] disabled:cursor-not-allowed disabled:opacity-60">{busy?<Loader2 size={16} className="animate-spin"/>:<><Save size={16}/><Check size={15}/></>}{busy?"Saving changes...":"Save changes"}</button>
    </div>
  </form>;
}
