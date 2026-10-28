"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clapperboard, LoaderCircle, Play, Sparkles, Store, WandSparkles } from "lucide-react";

type Product = { id: string; title: string; image: string | null };
type Shop = { id: string; username: string; profileImageUrl: string | null; products: Product[] };
type Project = { id: string; title: string; shop: string; product: string | null; scope: string; mode: string; duration: number; status: string; createdAt: string; videoReady: boolean; videoUrl?: string | null; errorMessage?: string | null; payment?: { status: string; amountKes: number; phoneNumber?: string; receiptNumber?: string | null; message?: string | null } | null };
type PriceQuote = { amountKes: number; providerCostUsd: number; providerCostKes: number; marginPercent: number; fixedFeeKes: number; overridden: boolean };
const DEFAULT_PROMPT = "Create a stylish, premium promotion that highlights the product clearly and ends with a strong call to action.";

function Avatar({ src, label, size = "md" }: { src: string | null | undefined; label: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-14 w-14 text-lg" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return src ? <img src={src} alt={label} className={sizeClass + " shrink-0 rounded-full border border-black/5 bg-neutral-100 object-cover"} /> : <span className={sizeClass + " flex shrink-0 items-center justify-center rounded-full bg-neutral-100 font-semibold text-neutral-600"}>{label.replace("@", "").slice(0, 1).toUpperCase() || "S"}</span>;
}

export function PromotionStudio({ shops, history: initial }: { shops: Shop[]; history: Project[] }) {
  const [scope, setScope] = useState<"PRODUCT" | "STORE">("PRODUCT");
  const [mode, setMode] = useState<"HYBRID" | "AI" | "MOTION">("HYBRID");
  const [duration, setDuration] = useState("15");
  const [generateAudio, setGenerateAudio] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [paymentPending, setPaymentPending] = useState(false);
  const submittingRef = useRef(false);
  const requestKeyRef = useRef("");
  const [shopId, setShopId] = useState(shops[0]?.id || "");
  const [postId, setPostId] = useState(shops[0]?.products[0]?.id || "");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [history, setHistory] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const shop = shops.find((s) => s.id === shopId);
  const products = shop?.products || [];
  const product = useMemo(() => products.find((p) => p.id === postId), [products, postId]);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/ai-promotions", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (alive && Array.isArray(data.projects)) { setHistory(data.projects); setPaymentPending(data.projects[0]?.payment?.status === "PENDING" || data.projects[0]?.payment?.status === "INITIATED"); }
      } catch { /* Keep the last known state while temporarily offline. */ }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 6000);
    return () => { alive = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(`/api/ai-promotions?quote=1&durationSeconds=${duration}&generateAudio=${generateAudio}`, { cache: "no-store" })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Pricing unavailable"); return d.quote as PriceQuote; })
      .then((q) => { if (alive) { setQuote(q); setQuoteError(""); } })
      .catch((e) => { if (alive) { setQuote(null); setQuoteError(e instanceof Error ? e.message : "Pricing unavailable"); } });
    return () => { alive = false; };
  }, [duration, generateAudio]);

  async function submit() {
    if (submittingRef.current || paymentPending) return;
    submittingRef.current = true;
    if (!requestKeyRef.current) requestKeyRef.current = crypto.randomUUID();
    setBusy(true); setMessage(null);
    try {
      const idempotencyKey = requestKeyRef.current;
      const r = await fetch("/api/ai-promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope, mode, durationSeconds: Number(duration), connectionId: shopId, postId: scope === "PRODUCT" ? postId : null, prompt, generateAudio, phoneNumber, idempotencyKey, expectedAmountKes: quote?.amountKes }) });
      const d = await r.json();
      if (!r.ok) { if (d.quote) setQuote(d.quote as PriceQuote); throw new Error(d.error || "Could not start payment"); }
      setHistory((h) => [{ id: d.project.id, title: d.project.title, shop: shop?.username || "", product: scope === "PRODUCT" ? product?.title || null : null, scope, mode, duration: Number(duration), status: d.project.status, createdAt: new Date().toISOString(), videoReady: false, payment: d.payment ? { status: d.payment.status, amountKes: d.payment.amountKes, phoneNumber } : null }, ...h.filter((p) => p.id !== d.project.id)]);
      setPaymentPending(d.payment?.status === "PENDING" || d.payment?.status === "INITIATED");
      requestKeyRef.current = "";
      setMessage({ ok: true, text: d.message || d.payment?.customerMessage || "Approve the M-Pesa prompt on your phone. Generation starts only after payment confirmation." });
    } catch (e) { setMessage({ ok: false, text: e instanceof Error ? e.message : "Request failed" }); }
    finally { submittingRef.current = false; setBusy(false); }
  }

  const inputClass = "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100";
  const labelClass = "mb-2 block text-sm font-semibold text-neutral-800";

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[28px] bg-neutral-950 px-5 py-7 text-white sm:px-8 sm:py-9">
      <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 right-1/3 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80"><WandSparkles size={14}/> AI CREATIVE WORKSPACE</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Make your next big impression.</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/65">Turn a product or your whole shop into a polished vertical promotion, ready for the next step in your campaign.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-neutral-950"><Clapperboard size={19}/></div>
          <div><p className="text-sm font-semibold">Vertical video</p><p className="mt-0.5 text-xs text-white/55">9:16 · {duration} seconds</p></div>
        </div>
      </div>
    </section>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
      <section className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100"><Sparkles size={19}/></span><div><h2 className="text-lg font-semibold">Build your promotion</h2><p className="mt-1 text-sm text-neutral-500">Choose what to feature and set the creative direction.</p></div></div>
        {!shops.length ? <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center"><Store className="mx-auto mb-3 text-neutral-400" size={28}/><p className="font-semibold">Connect a shop to get started</p><p className="mt-1 text-sm text-neutral-500">Your connected Instagram Business shop and products will appear here.</p><a href="/account/setup" className="mt-4 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white">Connect Instagram</a></div> : <>
          <label className={labelClass}>What are we promoting?</label>
          <div className="mb-6 grid grid-cols-2 gap-3">
            {([{ value: "PRODUCT", title: "A product", detail: "Feature one listing", icon: <Play size={17}/> }, { value: "STORE", title: "My whole shop", detail: "Promote your brand", icon: <Store size={17}/> }] as const).map((item) => <button key={item.value} type="button" onClick={() => setScope(item.value)} className={"rounded-2xl border p-4 text-left transition " + (scope === item.value ? "border-neutral-950 bg-neutral-950 text-white shadow-md" : "border-neutral-200 hover:border-neutral-400")}><span className={"mb-4 flex h-9 w-9 items-center justify-center rounded-xl " + (scope === item.value ? "bg-white/15" : "bg-neutral-100 text-neutral-700")}>{item.icon}</span><span className="block text-sm font-semibold">{item.title}</span><span className={"mt-1 block text-xs " + (scope === item.value ? "text-white/60" : "text-neutral-500")}>{item.detail}</span></button>)}
          </div>

          <label className={labelClass}>Your connected shop</label>
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <Avatar src={shop?.profileImageUrl} label={shop?.username || "S"} size="lg"/>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">@{shop?.username || "Choose a shop"}</p><p className="mt-1 text-xs text-neutral-500">{products.length} eligible {products.length === 1 ? "product" : "products"}</p></div>
            <select aria-label="Select connected shop" value={shopId} onChange={(e) => { setShopId(e.target.value); setPostId(shops.find((s) => s.id === e.target.value)?.products[0]?.id || ""); }} className="max-w-[46%] rounded-xl border border-neutral-200 bg-white px-2 py-2 text-xs"><option value="" disabled>Select shop</option>{shops.map((s) => <option key={s.id} value={s.id}>@{s.username}</option>)}</select>
          </div>

          {scope === "PRODUCT" && <><label className={labelClass}>Choose a product</label>{products.length ? <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{products.map((p) => <button type="button" key={p.id} onClick={() => setPostId(p.id)} className={"overflow-hidden rounded-2xl border text-left transition " + (postId === p.id ? "border-neutral-950 ring-2 ring-neutral-950 ring-offset-2" : "border-neutral-200 hover:border-neutral-400")}><div className="relative aspect-[4/5] bg-neutral-100">{p.image ? <img src={p.image} alt={p.title} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-neutral-400"><Store size={26}/></div>}{postId === p.id && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-950 text-white"><CheckCircle2 size={16}/></span>}</div><p className="line-clamp-2 px-3 py-2.5 text-xs font-semibold">{p.title}</p></button>)}</div> : <p className="mb-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">No eligible products with media were found in this shop.</p>}</>}

          <label className={labelClass}>Creative style</label>
          <div className="mb-5 grid grid-cols-3 gap-2">{([{ value: "HYBRID", title: "Hybrid", sub: "Recommended" }, { value: "AI", title: "AI creative", sub: "AI-led" }, { value: "MOTION", title: "Motion", sub: "Image animation" }] as const).map((item) => <button type="button" key={item.value} onClick={() => setMode(item.value)} className={"rounded-xl border px-2 py-3 text-left transition " + (mode === item.value ? "border-neutral-950 bg-neutral-100" : "border-neutral-200 hover:border-neutral-400")}><span className="block text-xs font-semibold sm:text-sm">{item.title}</span><span className="mt-1 block text-[10px] text-neutral-500 sm:text-xs">{item.sub}</span></button>)}</div>

          <div className="mb-5 grid grid-cols-2 gap-3"><div><label className={labelClass}>Duration</label><select value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass}>{["10", "15"].map((n) => <option key={n} value={n}>{n} seconds</option>)}</select></div><div><label className={labelClass}>Video format</label><div className="flex h-[46px] items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 text-sm"><span className="h-4 w-3 rounded-sm border-2 border-neutral-700"/><span>Vertical · 9:16</span></div></div></div>
          <div className="mb-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <label htmlFor="promotion-audio" className="flex cursor-pointer items-start gap-3">
              <input id="promotion-audio" type="checkbox" checked={generateAudio} onChange={(e) => setGenerateAudio(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 rounded border-neutral-300 accent-neutral-950" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900">Generate video with audio <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-700">Optional</span></span>
                <span className="mt-1 block text-xs leading-5 text-neutral-500">Add AI-generated sound and audio to your promotional video. Leave unchecked for a silent video.</span>
                <span className="mt-2 block text-xs font-medium text-neutral-700">Estimated provider cost for ${duration}s: US${(Number(duration) * (generateAudio ? 0.168 : 0.112)).toFixed(2)} ${generateAudio ? "with audio" : "without audio"}.</span>
              </span>
            </label>
          </div>
          <div className="mb-5 rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-neutral-900">Your generation price</p><p className="mt-1 text-xs text-neutral-500">Provider cost plus SokoLink margin and operating fee.</p></div><p className="text-2xl font-bold tabular-nums">{quote ? `KSh ${quote.amountKes.toLocaleString("en-KE")}` : "—"}</p></div>
            {quote ? <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-xs text-neutral-500"><div className="flex justify-between"><span>Estimated provider cost</span><span>US${quote.providerCostUsd.toFixed(2)} · KSh {quote.providerCostKes.toLocaleString("en-KE")}</span></div><div className="flex justify-between"><span>Cost-plus margin</span><span>{quote.marginPercent}%</span></div><div className="flex justify-between"><span>Operating fee</span><span>KSh {quote.fixedFeeKes.toLocaleString("en-KE")}</span></div>{quote.overridden && <p className="pt-1 font-medium text-neutral-700">Admin-set selling price applies.</p>}</div> : <p className="mt-2 text-xs text-amber-700">{quoteError || "Calculating current price…"}</p>}
          </div>
          <label className={labelClass}>M-Pesa phone number</label><input type="tel" inputMode="tel" autoComplete="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0712 345 678" className={inputClass + " mb-5"} />
          <label className={labelClass}>Creative direction</label><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={1200} rows={4} className={inputClass + " resize-y leading-6"} placeholder="Describe the mood, key selling points, and call to action..."/><p className="mt-1.5 text-right text-xs text-neutral-400">{prompt.length}/1200</p>
          {message && <p role="status" className={"mt-4 flex items-start gap-2 rounded-xl p-3 text-sm " + (message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>{message.ok ? <CheckCircle2 size={17} className="mt-0.5 shrink-0"/> : <AlertCircle size={17} className="mt-0.5 shrink-0"/>}<span>{message.text}</span></p>}
          <button disabled={busy || paymentPending || !quote || !phoneNumber.trim() || !shopId || (scope === "PRODUCT" && !postId) || prompt.trim().length < 12} onClick={submit} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 p-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40">{busy ? <LoaderCircle size={17} className="animate-spin"/> : <Sparkles size={17}/>} {busy ? "Sending M-Pesa prompt…" : paymentPending ? "Awaiting M-Pesa payment…" : quote ? `Pay KSh ${quote.amountKes.toLocaleString("en-KE")} & generate` : "Price unavailable"}</button>
          <p className="mt-3 text-center text-xs leading-5 text-neutral-500">Video generation starts only after SokoLink verifies successful M-Pesa payment. Paid generation failures are flagged for refund review.</p>
        </>}
      </section>

      <aside className="space-y-5">
        <section className="rounded-[26px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between"><div><h3 className="font-semibold">Live concept preview</h3><p className="mt-1 text-xs text-neutral-500">A guide to your creative direction</p></div><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">Preview</span></div>
          <div className="mx-auto max-w-[270px] overflow-hidden rounded-[30px] border-[5px] border-neutral-950 bg-neutral-950 p-1.5 shadow-xl">
            <div className="relative flex aspect-[9/16] flex-col justify-between overflow-hidden rounded-[23px] bg-neutral-900 text-white">
              {scope === "PRODUCT" && product?.image ? <img src={product.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75"/> : shop?.profileImageUrl ? <img src={shop.profileImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40"/> : null}
              <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/90"/>
              <div className="relative flex items-center gap-2 p-4"><Avatar src={shop?.profileImageUrl} label={shop?.username || "S"} size="sm"/><div className="min-w-0"><p className="truncate text-xs font-semibold">@{shop?.username || "your shop"}</p><p className="text-[10px] text-white/65">PRESENTS</p></div></div>
              <div className="relative p-4 pb-5"><span className="rounded-full border border-white/30 bg-black/20 px-2.5 py-1 text-[9px] uppercase tracking-widest">{scope === "STORE" ? "Discover the shop" : "Featured product"}</span><h4 className="mt-3 line-clamp-3 text-2xl font-bold leading-tight">{scope === "STORE" ? shop?.username ? "Meet @" + shop.username : "Your next favourite store" : product?.title || "Your product here"}</h4><p className="mt-2 line-clamp-4 text-xs leading-5 text-white/75">{prompt}</p><div className="mt-5 rounded-full bg-white px-4 py-3 text-center text-xs font-bold text-neutral-950">SHOP NOW ↗</div></div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>{duration}s · 9:16 vertical · 1080 × 1920</div>
          <p className="mt-2 text-center text-[11px] text-neutral-400">Concept preview only — not a rendered video.</p>
        </section>
        <section className="rounded-[26px] border border-neutral-200 bg-neutral-50 p-5"><h3 className="font-semibold">Your campaign setup</h3><div className="mt-4 space-y-3"><div className="flex items-center justify-between gap-3 text-sm"><span className="text-neutral-500">Promotion scope</span><span className="font-semibold">{scope === "STORE" ? "Whole shop" : "Single product"}</span></div><div className="flex items-center justify-between gap-3 text-sm"><span className="text-neutral-500">Creative mode</span><span className="font-semibold">{mode === "AI" ? "AI creative" : mode === "MOTION" ? "Motion fallback" : "Hybrid"}</span></div><div className="flex items-center justify-between gap-3 text-sm"><span className="text-neutral-500">Selected shop</span><span className="max-w-[55%] truncate font-semibold">@{shop?.username || "—"}</span></div><div className="flex items-center justify-between gap-3 text-sm"><span className="text-neutral-500">Duration</span><span className="font-semibold">{duration} seconds</span></div></div></section>
      </aside>
    </div>

    <section className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Recent projects</h2><p className="mt-1 text-sm text-neutral-500">Your generated videos and live rendering status.</p></div><span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600">{history.length} {history.length === 1 ? "project" : "projects"}</span></div>
      {!history.length ? <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center"><Clapperboard className="mx-auto mb-2 text-neutral-400" size={24}/><p className="text-sm text-neutral-500">Your saved projects will appear here.</p></div> : <div className="divide-y divide-neutral-100">{history.map((p) => { const projectShop = shops.find((s) => s.username === p.shop); const projectProduct = projectShop?.products.find((x) => x.title === p.product); return <article key={p.id} className="flex items-center gap-3 py-4 sm:gap-4"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">{p.scope === "PRODUCT" && projectProduct?.image ? <img src={projectProduct.image} alt="" className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center"><Avatar src={projectShop?.profileImageUrl} label={p.shop} size="sm"/></div>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.title}</p><p className="mt-1 line-clamp-2 text-xs text-neutral-500">@{p.shop} · {p.scope === "STORE" ? "Whole shop" : p.product || "Product"} · {p.duration}s · {new Date(p.createdAt).toLocaleDateString()}{p.payment ? ` · KSh ${p.payment.amountKes} · payment ${p.payment.status.toLowerCase().replaceAll("_", " ")}` : ""}</p></div><div className="flex shrink-0 flex-col items-end gap-2"><span className={"rounded-full px-3 py-1.5 text-[10px] font-semibold " + (p.status === "READY" ? "bg-emerald-50 text-emerald-700" : p.status === "FAILED" ? "bg-red-50 text-red-700" : "bg-neutral-100 text-neutral-700")}>{p.status === "PROCESSING" ? "GENERATING" : p.status.replaceAll("_", " ")}</span>{p.videoUrl && <a href={p.videoUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-neutral-900 underline underline-offset-4">Preview / download</a>}{p.payment?.status === "REFUND_PENDING" && <span className="max-w-40 text-right text-[10px] font-medium text-amber-700">Refund review pending</span>}{p.status === "FAILED" && p.errorMessage && <span title={p.errorMessage} className="max-w-40 text-right text-[10px] text-red-600">Generation failed</span>}</div></article>; })}</div>}
    </section>
  </div>;
}
