"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clapperboard, Clock3, Download, Film, LoaderCircle, Play, RefreshCw, Sparkles, WandSparkles } from "lucide-react";

type Product = { id: string; title: string; image: string | null; mediaType: string; listingType: string };
type Connection = { id: string; username: string; name: string | null; profileImageUrl: string | null; products: Product[] };
type Campaign = { id: string; title: string; scope: string; mode: string; prompt: string; durationSeconds: number; format: string; status: string; finalVideoUrl: string | null; providerOutputUrl: string | null; errorMessage: string | null; createdAt: string; connection: { username: string }; post: { productTitle: string | null; thumbnailUrl: string | null; mediaUrl: string | null } | null };
const DEFAULT_PROMPT = "Create a stylish, premium promotion that highlights the product clearly and ends with a strong call to action.";

export function AiPromotionStudio({ connections }: { connections: Connection[] }) {
  const [connectionId, setConnectionId] = useState(connections[0]?.id || "");
  const [scope, setScope] = useState<"PRODUCT" | "STORE">("PRODUCT");
  const [postId, setPostId] = useState(connections[0]?.products[0]?.id || "");
  const [mode, setMode] = useState<"HYBRID" | "MOTION">("HYBRID");
  const [duration, setDuration] = useState("15");
  const [format, setFormat] = useState("VERTICAL");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [title, setTitle] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selected = connections.find(c => c.id === connectionId);
  const products = selected?.products || [];
  const ready = connections.length > 0 && (scope === "STORE" || !!postId) && prompt.trim().length >= 10;
  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch("/api/account/ai-promotions", { cache: "no-store" }); const data = await res.json(); if (!res.ok) throw new Error(data.error || "Could not load campaigns"); setCampaigns(data.campaigns || []); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load campaigns"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!products.some(p => p.id === postId)) setPostId(products[0]?.id || ""); }, [connectionId, products, postId]);
  const selectedProduct = useMemo(() => products.find(p => p.id === postId), [products, postId]);
  async function generate(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const res = await fetch("/api/account/ai-promotions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ connectionId, scope, postId: scope === "PRODUCT" ? postId : null, mode, durationSeconds: Number(duration), format, prompt: prompt.trim(), title: title.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start generation");
      setTitle(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not start generation"); }
    finally { setBusy(false); }
  }
  async function retry(id: string) {
    setBusy(true); setError("");
    try { const res = await fetch(`/api/account/ai-promotions/${id}/retry`, { method: "POST" }); const data = await res.json(); if (!res.ok) throw new Error(data.error || "Could not retry"); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not retry"); } finally { setBusy(false); }
  }
  return <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,.95fr)]">
    <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-neutral-950 text-white"><WandSparkles size={21}/></span><div><h2 className="text-xl font-extrabold tracking-tight">Create a promotion</h2><p className="mt-1 text-sm leading-6 text-neutral-500">Pick a shop, choose what to promote, and shape the creative direction.</p></div></div>
      {connections.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-center"><Clapperboard className="mx-auto mb-3 text-neutral-400" size={30}/><h3 className="font-bold">Connect an Instagram shop first</h3><p className="mt-2 text-sm text-neutral-500">AI promotions use products and media from your connected shops.</p><a href="/account/setup" className="mt-4 inline-flex rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white">Connect a shop</a></div> : <form className="mt-6 space-y-5" onSubmit={generate}>
        <div><label className="mb-2 block text-sm font-bold">Connected shop</label><select value={connectionId} onChange={e => setConnectionId(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-900">{connections.map(c => <option key={c.id} value={c.id}>@{c.username}{c.name ? ` · ${c.name}` : ""}</option>)}</select></div>
        <div><label className="mb-2 block text-sm font-bold">Promotion scope</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setScope("PRODUCT")} className={`rounded-xl border p-3 text-left ${scope === "PRODUCT" ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 hover:border-neutral-400"}`}><span className="block text-sm font-extrabold">Product</span><span className={`mt-1 block text-xs ${scope === "PRODUCT" ? "text-white/65" : "text-neutral-500"}`}>Feature one listing</span></button><button type="button" onClick={() => setScope("STORE")} className={`rounded-xl border p-3 text-left ${scope === "STORE" ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 hover:border-neutral-400"}`}><span className="block text-sm font-extrabold">Whole shop</span><span className={`mt-1 block text-xs ${scope === "STORE" ? "text-white/65" : "text-neutral-500"}`}>Build a shop overview</span></button></div></div>
        {scope === "PRODUCT" && <div><label className="mb-2 block text-sm font-bold">Product or service</label>{products.length ? <select value={postId} onChange={e => setPostId(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-900">{products.map(p => <option key={p.id} value={p.id}>{p.title} · {p.listingType.toLowerCase()}</option>)}</select> : <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">This shop has no eligible listings with media. Add a product image or video first.</p>}</div>}
        <div><label className="mb-2 block text-sm font-bold">Campaign title <span className="font-normal text-neutral-400">(optional)</span></label><input value={title} onChange={e => setTitle(e.target.value)} maxLength={90} placeholder={selectedProduct?.title || "e.g. New season spotlight"} className="w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm outline-none focus:border-neutral-900"/></div>
        <div><label className="mb-2 block text-sm font-bold">Creative mode</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setMode("HYBRID")} className={`rounded-xl border p-3 text-left ${mode === "HYBRID" ? "border-violet-500 bg-violet-50" : "border-neutral-200"}`}><b className="flex items-center gap-2 text-sm"><Sparkles size={15}/> Hybrid</b><span className="mt-1 block text-xs text-neutral-500">Product image + AI motion</span></button><button type="button" onClick={() => setMode("MOTION")} className={`rounded-xl border p-3 text-left ${mode === "MOTION" ? "border-violet-500 bg-violet-50" : "border-neutral-200"}`}><b className="flex items-center gap-2 text-sm"><Film size={15}/> Motion</b><span className="mt-1 block text-xs text-neutral-500">Motion-focused treatment</span></button></div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="mb-2 block text-sm font-bold">Duration</label><select value={duration} onChange={e => setDuration(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm"><option value="5">5 seconds</option><option value="10">10 seconds</option><option value="15">15 seconds</option></select></div><div><label className="mb-2 block text-sm font-bold">Format</label><select value={format} onChange={e => setFormat(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm"><option value="VERTICAL">Vertical · 9:16</option><option value="SQUARE">Square · 1:1</option><option value="LANDSCAPE">Landscape · 16:9</option></select></div></div>
        <div><label className="mb-2 block text-sm font-bold">Creative prompt</label><textarea value={prompt} onChange={e => setPrompt(e.target.value)} maxLength={1200} rows={4} className="w-full resize-y rounded-xl border border-neutral-200 px-3 py-3 text-sm leading-6 outline-none focus:border-neutral-900"/><p className="mt-1 text-right text-xs text-neutral-400">{prompt.length}/1200</p></div>
        {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0"/>{error}</p>}
        <button type="submit" disabled={busy || !ready} className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40">{busy ? <LoaderCircle className="animate-spin" size={17}/> : <Sparkles size={17}/>} Generate promotion</button>
        <p className="text-xs leading-5 text-neutral-400">Generation may incur charges with your configured video provider. Check provider pricing before enabling this feature for customers.</p>
      </form>}
    </section>
    <section className="min-w-0">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-extrabold tracking-tight">Your promotions</h2><p className="mt-1 text-sm text-neutral-500">Generation status and completed videos.</p></div><button onClick={() => void load()} disabled={loading} aria-label="Refresh campaigns" className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 hover:bg-neutral-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/></button></div>
      {loading && campaigns.length === 0 ? <div className="grid min-h-52 place-items-center rounded-2xl border border-neutral-200 text-sm text-neutral-400"><LoaderCircle className="animate-spin" size={22}/></div> : campaigns.length === 0 ? <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-neutral-300 p-8 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-neutral-100"><Clapperboard size={25}/></span><h3 className="mt-4 font-extrabold">Your first video starts here</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-neutral-500">Create a promotion and its progress will show up here automatically.</p></div></div> : <div className="space-y-3">{campaigns.map(c => <article key={c.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex gap-3 p-4"><div className="grid h-16 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-neutral-100">{c.finalVideoUrl || c.providerOutputUrl ? <Film size={24}/> : <Clapperboard size={22} className="text-neutral-400"/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-extrabold">{c.title}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide ${c.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : c.status === "FAILED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>{c.status.toLowerCase().replaceAll("_", " ")}</span></div><p className="mt-1 text-xs text-neutral-500">@{c.connection.username} · {c.durationSeconds}s · {c.format.toLowerCase()}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500">{c.errorMessage || c.prompt}</p></div></div>
        {(c.finalVideoUrl || c.providerOutputUrl) && <div className="flex flex-wrap gap-2 border-t border-neutral-100 p-3"><a href={c.finalVideoUrl || c.providerOutputUrl || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-3 py-2 text-xs font-bold text-white"><Play size={13}/> Preview video</a><a href={c.finalVideoUrl || c.providerOutputUrl || "#"} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 text-xs font-bold"><Download size={13}/> Download</a></div>}
        {c.status === "FAILED" && <div className="border-t border-neutral-100 p-3"><button disabled={busy} onClick={() => void retry(c.id)} className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-2 text-xs font-bold disabled:opacity-50"><RefreshCw size={13}/> Retry generation</button></div>}
      </article>)}</div>}
      <div className="mt-4 flex items-start gap-2 rounded-2xl bg-neutral-50 p-4 text-xs leading-5 text-neutral-500"><Clock3 size={16} className="mt-0.5 shrink-0"/> This page refreshes when you return or press refresh. A scheduled worker must be configured to advance queued generations.</div>
    </section>
  </div>;
}
