"use client";

import { useMemo, useState } from "react";
import { Check, Edit3, Plus, Save, Trash2, X } from "lucide-react";

type Offering = {
  id: string; code: string; name: string; category: "PROMOTION" | "GROWTH"; targetType: "STORE" | "PRODUCT" | null;
  description: string; price: number; targetReach: number; reachMode: string; durationDays: number; features: string[];
  active: boolean; sortOrder: number;
};
type Draft = Omit<Offering, "id"> & { id?: string };
const blank = (): Draft => ({ code: "", name: "", category: "PROMOTION", targetType: "PRODUCT", description: "", price: 100, targetReach: 500, reachMode: "FIXED", durationDays: 7, features: ["Campaign reach tracking"], active: true, sortOrder: 0 });

export default function AdminOfferingsManager({ initialOfferings, audienceSize }: { initialOfferings: Offering[]; audienceSize: number }) {
  const [items, setItems] = useState(initialOfferings);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const promotionCount = useMemo(() => items.filter(x => x.category === "PROMOTION").length, [items]);
  const growthCount = items.length - promotionCount;

  function edit(item: Offering) { setDraft({ ...item, features: [...item.features] }); setNotice(""); setError(""); }
  function update<K extends keyof Draft>(key: K, value: Draft[K]) { setDraft(current => current ? { ...current, [key]: value } : current); }

  async function refresh() {
    const response = await fetch("/api/admin/offerings", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setItems(data.offerings);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft || busy) return;
    setBusy(true); setNotice(""); setError("");
    try {
      const response = await fetch("/api/admin/offerings", {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, features: draft.features }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Could not save this offering."); return; }
      await refresh();
      setDraft(null);
      setNotice("Offering saved to the database.");
    } catch { setError("Network error. Please try again."); }
    finally { setBusy(false); }
  }

  async function remove(item: Offering) {
    if (busy || !window.confirm("Delete “" + item.name + "”? Existing campaign/request records will keep their saved price and duration, but this offering will no longer be available.")) return;
    setBusy(true); setNotice(""); setError("");
    try {
      const response = await fetch("/api/admin/offerings?id=" + encodeURIComponent(item.id), { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Could not delete offering."); return; }
      setItems(current => current.filter(x => x.id !== item.id));
      if (draft?.id === item.id) setDraft(null);
      setNotice("Offering deleted.");
    } catch { setError("Network error. Please try again."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-black/10 bg-white p-5"><span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Registered audience</span><div className="mt-2 text-3xl font-black">{audienceSize.toLocaleString()}</div><p className="mt-1 text-xs text-neutral-500">Current customer accounts; full-audience plans use this live count at checkout.</p></div>
      <div className="rounded-2xl border border-black/10 bg-white p-5"><span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Promotion packages</span><div className="mt-2 text-3xl font-black">{promotionCount}</div><p className="mt-1 text-xs text-neutral-500">Shop and product visibility campaigns.</p></div>
      <div className="rounded-2xl border border-black/10 bg-white p-5"><span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Growth plans</span><div className="mt-2 text-3xl font-black">{growthCount}</div><p className="mt-1 text-xs text-neutral-500">Verified, Pro Seller and other growth offers.</p></div>
    </div>

    {notice && <p role="status" className="rounded-xl bg-lime-50 p-3 text-sm font-semibold text-green-900">{notice}</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}

    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">Promotion & growth catalogue</h2><p className="mt-1 text-sm text-neutral-600">Set prices, duration, audience reach and included benefits. Changes apply to new requests and campaigns.</p></div><button type="button" onClick={() => { setDraft(blank()); setError(""); setNotice(""); }} className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-bold text-white"><Plus size={16}/> Add offering</button></div>

    {draft && <form onSubmit={save} className="rounded-2xl border border-black/10 bg-neutral-50 p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3"><div><span className="text-[10px] font-black uppercase tracking-[.18em] text-neutral-500">{draft.id ? "Edit offering" : "New offering"}</span><h3 className="mt-1 text-lg font-black">{draft.name || "Configure your offering"}</h3></div><button type="button" aria-label="Close editor" onClick={() => setDraft(null)} className="rounded-full border border-black/10 bg-white p-2"><X size={16}/></button></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-bold">Name<input required value={draft.name} onChange={e => update("name", e.target.value)} className="mt-2 block w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm font-normal" placeholder="e.g. Pro Seller"/></label>
        <label className="text-xs font-bold">Unique code<input required value={draft.code} onChange={e => update("code", e.target.value)} disabled={!!draft.id} className="mt-2 block w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm font-normal disabled:bg-neutral-100" placeholder="e.g. pro"/></label>
        <label className="text-xs font-bold">Offering type<select value={draft.category} onChange={e => { const category = e.target.value as Draft["category"]; update("category", category); update("targetType", category === "PROMOTION" ? "PRODUCT" : null); }} className="mt-2 block w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm font-normal"><option value="PROMOTION">Promotion campaign</option><option value="GROWTH">Growth / membership</option></select></label>
        {draft.category === "PROMOTION" && <label className="text-xs font-bold">Promote<select value={draft.targetType || "PRODUCT"} onChange={e => update("targetType", e.target.value as "STORE" | "PRODUCT")} className="mt-2 block w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm font-normal"><option value="PRODUCT">Single product or service</option><option value="STORE">Whole shop</option></select></label>}
        <label className="text-xs font-bold">Price (KSh)<input required type="number" min="0" step="1" value={draft.price} onChange={e => update("price", Number(e.target.value))} className="mt-2 block w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm font-normal"/></label>
        <label className="text-xs font-bold">Duration (days)<input required type="number" min="1" max="3650" value={draft.durationDays} onChange={e => update("durationDays", Number(e.target.value))} className="mt-2 block w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm font-normal"/></label>
        {draft.category === "PROMOTION" && <label className="text-xs font-bold">Audience reach<select value={draft.reachMode} onChange={e => update("reachMode", e.target.value)} className="mt-2 block w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm font-normal"><option value="FIXED">Fixed target reach</option><option value="ALL_USERS">All registered app users (dynamic)</option></select></label>}
        {draft.category === "PROMOTION" && draft.reachMode === "FIXED" && <label className="text-xs font-bold">Target users<input required type="number" min="1" step="1" value={draft.targetReach} onChange={e => update("targetReach", Number(e.target.value))} className="mt-2 block w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm font-normal"/></label>}
        <label className="text-xs font-bold">Display order<input type="number" step="1" value={draft.sortOrder} onChange={e => update("sortOrder", Number(e.target.value))} className="mt-2 block w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm font-normal"/></label>
        <label className="flex items-center gap-3 self-end rounded-xl border border-black/10 bg-white p-3 text-sm font-bold"><input type="checkbox" checked={draft.active} onChange={e => update("active", e.target.checked)}/> Available to sellers</label>
        <label className="text-xs font-bold sm:col-span-2 lg:col-span-3">Description<textarea rows={2} value={draft.description} onChange={e => update("description", e.target.value)} className="mt-2 block w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm font-normal" placeholder="Explain what this plan does."/></label>
        <label className="text-xs font-bold sm:col-span-2 lg:col-span-3">Included features (one per line)<textarea rows={4} value={draft.features.join("\n")} onChange={e => update("features", e.target.value.split("\n"))} className="mt-2 block w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm font-normal" placeholder={"Verified badge\nSeller analytics\nPriority support"}/></label>
      </div>
      {draft.category === "PROMOTION" && draft.reachMode === "ALL_USERS" && <p className="mt-3 text-xs text-neutral-600">Current audience target: {audienceSize.toLocaleString()} registered users. The live count is saved as the campaign target when a seller starts a promotion.</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setDraft(null)} className="rounded-full border border-black/15 bg-white px-4 py-3 text-sm font-bold">Cancel</button><button disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Save size={15}/>{busy ? "Saving…" : "Save to database"}</button></div>
    </form>}

    <div className="grid gap-3 lg:grid-cols-2">
      {items.map(item => <article key={item.id} className={"rounded-2xl border p-5 " + (item.active ? "border-black/10 bg-white" : "border-dashed border-black/20 bg-neutral-50 opacity-75")}>
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider">{item.category === "PROMOTION" ? item.targetType + " PROMOTION" : "GROWTH PLAN"}</span><span className={"rounded-full px-2.5 py-1 text-[9px] font-black uppercase " + (item.active ? "bg-lime-100 text-green-900" : "bg-neutral-200 text-neutral-600")}>{item.active ? "Active" : "Hidden"}</span></div><h3 className="mt-3 text-lg font-black">{item.name}</h3><p className="mt-1 text-sm text-neutral-600">{item.description}</p></div><div className="shrink-0 text-right"><b className="text-xl font-black">KSh {item.price.toLocaleString()}</b><p className="mt-1 text-xs text-neutral-500">{item.durationDays} days</p></div></div>
        {item.category === "PROMOTION" && <p className="mt-3 text-xs font-semibold text-neutral-700">Target: {item.reachMode === "ALL_USERS" ? "All registered users (" + audienceSize.toLocaleString() + " currently)" : item.targetReach.toLocaleString() + " users"}</p>}
        {!!item.features.length && <ul className="mt-4 grid gap-2 sm:grid-cols-2">{item.features.map((feature, i) => <li key={i} className="flex items-start gap-2 text-xs text-neutral-700"><Check size={14} className="mt-0.5 shrink-0 text-green-700"/>{feature}</li>)}</ul>}
        <div className="mt-5 flex justify-end gap-2 border-t border-black/5 pt-4"><button type="button" onClick={() => edit(item)} className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-2 text-xs font-bold"><Edit3 size={13}/> Edit</button><button type="button" disabled={busy} onClick={() => void remove(item)} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-2 text-xs font-bold text-red-700 disabled:opacity-50"><Trash2 size={13}/> Delete</button></div>
      </article>)}
      {!items.length && <div className="rounded-2xl border border-dashed border-black/20 p-10 text-center text-sm text-neutral-500 lg:col-span-2">No offerings yet. Add your first promotion or growth plan above.</div>}
    </div>
  </div>;
}
