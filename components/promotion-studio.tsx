"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, Clapperboard, Clock3, ExternalLink, LoaderCircle, Play, Sparkles, Store, Trash2, WandSparkles } from "lucide-react";
import { userFriendlyError } from "@/lib/user-friendly-errors";

type Product = { id: string; title: string; image: string | null };
type Shop = { id: string; username: string; profileImageUrl: string | null; products: Product[] };
export type Project = { id: string; title: string; shop: string; product: string | null; scope: string; mode: string; duration: number; status: string; createdAt: string; videoReady: boolean; videoUrl?: string | null; errorMessage?: string | null; payment?: { status: string; amountKes: number; phoneNumber?: string; receiptNumber?: string | null; message?: string | null } | null };
type PriceQuote = { amountKes: number; providerCostUsd: number; providerCostKes: number; marginPercent: number; fixedFeeKes: number; overridden: boolean };
const DEFAULT_PROMPT = "Create a stylish, premium promotion that highlights the product clearly and ends with a strong call to action.";
const steps = [
  { title: "Choose what to promote", description: "Select your shop and product." },
  { title: "Choose video style", description: "Set the look, length and sound." },
  { title: "Add your message", description: "Tell us how the promotion should feel." },
  { title: "Review and pay", description: "Confirm the details before checkout." },
];

function Avatar({ src, label, size = "md" }: { src: string | null | undefined; label: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-14 w-14 text-lg" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return src ? <img src={src} alt={label} className={sizeClass + " shrink-0 rounded-full border border-black/5 bg-neutral-100 object-cover"} /> : <span className={sizeClass + " flex shrink-0 items-center justify-center rounded-full bg-neutral-100 font-semibold text-neutral-600"}>{label.replace("@", "").slice(0, 1).toUpperCase() || "S"}</span>;
}

export function PromotionStudio({ shops }: { shops: Shop[]; history?: Project[] }) {
  const [step, setStep] = useState(1);
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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const shop = shops.find((s) => s.id === shopId);
  const products = shop?.products || [];
  const product = useMemo(() => products.find((p) => p.id === postId), [products, postId]);
  const inputClass = "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100";
  const labelClass = "mb-2 block text-sm font-semibold text-neutral-800";

  useEffect(() => {
    let alive = true;
    fetch(`/api/ai-promotions?quote=1&durationSeconds=${duration}&generateAudio=${generateAudio}`, { cache: "no-store" })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Pricing unavailable"); return d.quote as PriceQuote; })
      .then((q) => { if (alive) { setQuote(q); setQuoteError(""); } })
      .catch((e) => { if (alive) { setQuote(null); setQuoteError(e instanceof Error ? e.message : "Pricing unavailable"); } });
    return () => { alive = false; };
  }, [duration, generateAudio]);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/ai-promotions", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (alive && Array.isArray(data.projects)) {
          setPaymentPending(data.projects.some((p: Project) => p.payment?.status === "PENDING" || p.payment?.status === "INITIATED"));
        }
      } catch { /* Keep the current checkout state if the network is temporarily unavailable. */ }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 6000);
    return () => { alive = false; window.clearInterval(timer); };
  }, []);

  function canContinue() {
    if (step === 1) {
      if (!shopId) { setMessage({ ok: false, text: "Choose the shop you want to promote." }); return false; }
      if (scope === "PRODUCT" && !postId) { setMessage({ ok: false, text: "Choose a product to continue." }); return false; }
    }
    if (step === 3 && prompt.trim().length < 12) { setMessage({ ok: false, text: "Please add a little more detail (at least 12 characters)." }); return false; }
    setMessage(null);
    return true;
  }

  async function submit() {
    if (submittingRef.current || paymentPending) return;
    if (!phoneNumber.trim()) { setMessage({ ok: false, text: "Enter the phone number that should receive the M-Pesa prompt." }); return; }
    if (!quote) { setMessage({ ok: false, text: quoteError || "The current price is not available yet." }); return; }
    submittingRef.current = true;
    if (!requestKeyRef.current) requestKeyRef.current = crypto.randomUUID();
    setBusy(true); setMessage(null);
    try {
      const r = await fetch("/api/ai-promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope, mode, durationSeconds: Number(duration), connectionId: shopId, postId: scope === "PRODUCT" ? postId : null, prompt, generateAudio, phoneNumber, idempotencyKey: requestKeyRef.current, expectedAmountKes: quote.amountKes }) });
      const d = await r.json();
      if (!r.ok) { if (d.quote) setQuote(d.quote as PriceQuote); throw new Error(d.error || "Could not start payment"); }
      requestKeyRef.current = "";
      setPaymentPending(d.payment?.status === "PENDING" || d.payment?.status === "INITIATED");
      setMessage({ ok: true, text: d.message || d.payment?.customerMessage || "Approve the M-Pesa prompt on your phone. Video generation starts after payment confirmation." });
    } catch (e) { setMessage({ ok: false, text: e instanceof Error ? e.message : "Request failed" }); }
    finally { submittingRef.current = false; setBusy(false); }
  }

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[28px] bg-neutral-950 px-5 py-7 text-white sm:px-8 sm:py-9">
      <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 right-1/3 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80"><WandSparkles size={14}/> PROMOTION CREATOR</span><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Make your next big impression.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-white/65">Follow the steps to create a polished vertical promotion for a product or your whole shop.</p></div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-neutral-950"><Clapperboard size={19}/></div><div><p className="text-sm font-semibold">Vertical video</p><p className="mt-0.5 text-xs text-white/55">9:16 · {duration} seconds</p></div></div>
      </div>
    </section>

    <section className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-7">
        <div className="mb-4 flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Step {step} of {steps.length}</p><p className="text-xs text-neutral-500">{Math.round(step / steps.length * 100)}% complete</p></div>
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-neutral-950 transition-all duration-300" style={{ width: `${step / steps.length * 100}%` }}/></div>
        <div className="grid grid-cols-4 gap-2">{steps.map((item, i) => <button key={item.title} type="button" onClick={() => { if (i + 1 < step) { setStep(i + 1); setMessage(null); } }} className="min-w-0 text-left disabled:cursor-default" disabled={i + 1 >= step}><span className={"mb-2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold " + (step === i + 1 ? "bg-neutral-950 text-white" : step > i + 1 ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-500")}>{step > i + 1 ? <Check size={15}/> : i + 1}</span><span className={"hidden text-xs font-semibold sm:block " + (step === i + 1 ? "text-neutral-950" : "text-neutral-400")}>{item.title}</span></button>)}</div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight">{steps[step - 1].title}</h2><p className="mt-1 text-sm text-neutral-500">{steps[step - 1].description}</p>
      </div>

      {!shops.length ? <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center"><Store className="mx-auto mb-3 text-neutral-400" size={28}/><p className="font-semibold">Connect a shop to get started</p><p className="mt-1 text-sm text-neutral-500">Your connected Instagram Business shop and products will appear here.</p><a href="/account/setup" className="mt-4 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white">Connect Instagram</a></div> : <>
        {step === 1 && <div className="space-y-6">
          <div><label className={labelClass}>1. What would you like to promote?</label><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{([{ value: "PRODUCT", title: "One product", detail: "Highlight a specific listing", icon: <Play size={18}/> }, { value: "STORE", title: "My whole shop", detail: "Introduce your brand and range", icon: <Store size={18}/> }] as const).map(item => <button key={item.value} type="button" onClick={() => setScope(item.value)} className={"flex items-start gap-3 rounded-2xl border p-4 text-left transition " + (scope === item.value ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 hover:border-neutral-400")}><span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + (scope === item.value ? "bg-white/15" : "bg-neutral-100 text-neutral-700")}>{item.icon}</span><span><span className="block font-semibold">{item.title}</span><span className={"mt-1 block text-sm " + (scope === item.value ? "text-white/65" : "text-neutral-500")}>{item.detail}</span></span></button>)}</div></div>
          <div><label className={labelClass}>2. Choose your connected shop</label><div className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3"><Avatar src={shop?.profileImageUrl} label={shop?.username || "S"} size="lg"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">@{shop?.username || "Choose a shop"}</p><p className="mt-1 text-xs text-neutral-500">{products.length} eligible {products.length === 1 ? "product" : "products"}</p></div><select aria-label="Select connected shop" value={shopId} onChange={e => { setShopId(e.target.value); setPostId(shops.find(s => s.id === e.target.value)?.products[0]?.id || ""); }} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm sm:w-auto"><option value="" disabled>Select shop</option>{shops.map(s => <option key={s.id} value={s.id}>@{s.username}</option>)}</select></div></div>
          {scope === "PRODUCT" && <div><label className={labelClass}>3. Select a product</label>{products.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{products.map(p => <button type="button" key={p.id} onClick={() => setPostId(p.id)} className={"overflow-hidden rounded-2xl border text-left transition " + (postId === p.id ? "border-neutral-950 ring-2 ring-neutral-950 ring-offset-2" : "border-neutral-200 hover:border-neutral-400")}><div className="relative aspect-[4/5] bg-neutral-100">{p.image ? <img src={p.image} alt={p.title} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-neutral-400"><Store size={26}/></div>}{postId === p.id && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-950 text-white"><CheckCircle2 size={16}/></span>}</div><p className="line-clamp-2 px-3 py-2.5 text-xs font-semibold">{p.title}</p></button>)}</div> : <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">No eligible products with media were found in this shop. Try another shop or choose “My whole shop”.</p>}</div>}
        </div>}

        {step === 2 && <div className="space-y-6">
          <div><label className={labelClass}>Choose a creative style</label><div className="grid gap-3 sm:grid-cols-3">{([{ value: "HYBRID", title: "Hybrid", sub: "Recommended balance" }, { value: "AI", title: "AI creative", sub: "AI-led treatment" }, { value: "MOTION", title: "Motion", sub: "Animate your image" }] as const).map(item => <button type="button" key={item.value} onClick={() => setMode(item.value)} className={"rounded-2xl border p-4 text-left transition " + (mode === item.value ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 hover:border-neutral-400")}><span className="block font-semibold">{item.title}</span><span className={"mt-1 block text-sm " + (mode === item.value ? "text-white/60" : "text-neutral-500")}>{item.sub}</span></button>)}</div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label className={labelClass}>Video length</label><select value={duration} onChange={e => setDuration(e.target.value)} className={inputClass}>{["10", "15"].map(n => <option key={n} value={n}>{n} seconds</option>)}</select></div><div><label className={labelClass}>Video format</label><div className="flex h-[46px] items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 text-sm"><span className="h-4 w-3 rounded-sm border-2 border-neutral-700"/>Vertical · 9:16 (1080 × 1920)</div></div></div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"><input type="checkbox" checked={generateAudio} onChange={e => setGenerateAudio(e.target.checked)} className="mt-1 h-5 w-5 accent-neutral-950"/><span><span className="block text-sm font-semibold">Generate video with audio <span className="ml-1 rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] uppercase">Optional</span></span><span className="mt-1 block text-sm leading-5 text-neutral-500">Add AI-generated sound. Leave unchecked for a silent video.</span></span></label>
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900"><Clock3 size={18} className="mt-0.5 shrink-0"/><p>The selected length and audio option affect the final price. You’ll see the current price before you pay.</p></div>
        </div>}

        {step === 3 && <div className="space-y-5">
          <div><label className={labelClass}>Describe your promotion</label><p className="mb-3 text-sm leading-6 text-neutral-500">Mention the mood, the most important selling point and what you want viewers to do next. You can keep the suggested text or personalize it.</p><textarea value={prompt} onChange={e => setPrompt(e.target.value)} maxLength={1200} rows={6} className={inputClass + " resize-y leading-6"} placeholder="Describe the mood, key selling points and call to action..."/><p className="mt-1.5 text-right text-xs text-neutral-400">{prompt.length}/1200 characters</p></div>
          <div className="rounded-2xl border border-neutral-200 p-4"><p className="text-sm font-semibold">Example direction</p><p className="mt-2 text-sm leading-6 text-neutral-600">“Show the product clearly, use an elegant premium look, highlight its main benefit and finish with a strong ‘Shop now’ call to action.”</p><button type="button" onClick={() => setPrompt(DEFAULT_PROMPT)} className="mt-3 text-sm font-semibold underline underline-offset-4">Use suggested direction</button></div>
        </div>}

        {step === 4 && <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]"><div className="rounded-2xl border border-neutral-200 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Your promotion</p><div className="mt-3 flex items-center gap-3">{scope === "PRODUCT" && product?.image ? <img src={product.image} alt="" className="h-16 w-16 rounded-xl object-cover"/> : <Avatar src={shop?.profileImageUrl} label={shop?.username || "S"} size="lg"/>}<div className="min-w-0"><p className="font-semibold">{scope === "STORE" ? "Whole shop promotion" : product?.title || "Product promotion"}</p><p className="mt-1 text-sm text-neutral-500">@{shop?.username} · {duration} seconds</p><p className="mt-1 text-xs text-neutral-500">{mode === "AI" ? "AI creative" : mode === "MOTION" ? "Motion" : "Hybrid"} · {generateAudio ? "With audio" : "Silent"} · Vertical 9:16</p></div></div></div><div className="rounded-2xl bg-neutral-950 p-4 text-white"><p className="text-xs text-white/65">Total to pay</p><p className="mt-2 text-2xl font-bold tabular-nums">{quote ? `KSh ${quote.amountKes.toLocaleString("en-KE")}` : "—"}</p><p className="mt-2 text-xs text-white/60">Confirmed before checkout</p></div></div>
          {quote ? <div className="rounded-2xl border border-neutral-200 p-4"><p className="text-sm font-semibold">Price breakdown</p><div className="mt-3 space-y-2 text-sm text-neutral-600"><div className="flex justify-between gap-3"><span>Estimated video provider cost</span><span>US${quote.providerCostUsd.toFixed(2)} · KSh {quote.providerCostKes.toLocaleString("en-KE")}</span></div><div className="flex justify-between gap-3"><span>Cost-plus margin</span><span>{quote.marginPercent}%</span></div><div className="flex justify-between gap-3"><span>Operating fee</span><span>KSh {quote.fixedFeeKes.toLocaleString("en-KE")}</span></div>{quote.overridden && <p className="pt-1 text-xs font-medium text-neutral-700">A fixed selling price set by the administrator applies.</p>}</div></div> : <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{quoteError || "Calculating current price…"}</p>}
          <div><label className={labelClass}>M-Pesa phone number</label><input type="tel" inputMode="tel" autoComplete="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="0712 345 678" className={inputClass}/><p className="mt-1.5 text-xs text-neutral-500">An M-Pesa payment prompt will be sent to this number.</p></div>
          <div className="rounded-2xl bg-neutral-50 p-4"><p className="text-sm font-semibold">Creative direction</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-600">{prompt}</p></div>
          {paymentPending && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">There is already a payment awaiting confirmation. Approve or cancel that prompt before starting another promotion.</p>}
        </div>}
      </>}

      {message && <p role="status" className={"mt-6 flex items-start gap-2 rounded-xl p-3 text-sm " + (message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>{message.ok ? <CheckCircle2 size={17} className="mt-0.5 shrink-0"/> : <AlertCircle size={17} className="mt-0.5 shrink-0"/>}<span>{message.text}</span></p>}
      {!!shops.length && <div className="mt-7 flex flex-col-reverse gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => { setMessage(null); setStep(s => Math.max(1, s - 1)); }} disabled={step === 1 || busy} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 py-3 text-sm font-semibold disabled:opacity-30"><ArrowLeft size={16}/> Back</button>{step < 4 ? <button type="button" onClick={() => { if (canContinue()) setStep(s => Math.min(4, s + 1)); }} className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800">Continue <ArrowRight size={16}/></button> : <button type="button" disabled={busy || paymentPending || !quote || !phoneNumber.trim() || prompt.trim().length < 12} onClick={() => void submit()} className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40">{busy ? <LoaderCircle size={17} className="animate-spin"/> : <Sparkles size={17}/>} {busy ? "Sending M-Pesa prompt…" : paymentPending ? "Awaiting M-Pesa payment…" : quote ? `Pay KSh ${quote.amountKes.toLocaleString("en-KE")} & create promotion` : "Price unavailable"}</button>}</div>}
      <p className="mt-4 text-center text-xs leading-5 text-neutral-500">You’ll review the price before checkout. Video generation starts only after successful M-Pesa payment confirmation. Failed paid generations are flagged for refund review.</p>
    </section>
  </div>;
}

export function PromotionProjects({ projects: initialProjects, shops }: { projects: Project[]; shops: Shop[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function deleteProject(project: Project) {
    if (!window.confirm(`Delete “${project.title}” from your recent projects? This cannot be undone.`)) return;
    setDeletingId(project.id);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/ai-promotions/${encodeURIComponent(project.id)}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "We couldn't delete this promotion.");
      setProjects(current => current.filter(item => item.id !== project.id));
    } catch (error) {
      setActionMessage(userFriendlyError(error));
    } finally {
      setDeletingId(null);
    }
  }

  return <section className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Your library</p><h2 className="mt-2 text-2xl font-semibold">Recent projects</h2><p className="mt-1 text-sm text-neutral-500">Watch completed videos, check payment status or remove projects you no longer need.</p></div><span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600">{projects.length} {projects.length === 1 ? "project" : "projects"}</span></div>
    {actionMessage && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionMessage}</p>}
    {!projects.length ? <div className="rounded-2xl border border-dashed border-neutral-200 p-10 text-center"><Clapperboard className="mx-auto mb-3 text-neutral-400" size={28}/><p className="font-semibold">No projects yet</p><p className="mt-1 text-sm text-neutral-500">Create a promotion and it will appear here.</p><a href="/account/promotion-studio" className="mt-4 inline-flex rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white">Create a promotion</a></div> : <div className="divide-y divide-neutral-100">{projects.map(p => {
      const projectShop = shops.find(s => s.username === p.shop);
      const projectProduct = projectShop?.products.find(x => x.title === p.product);
      const paymentPending = p.payment?.status === "PENDING" || p.payment?.status === "INITIATED";
      const videoUrl = p.videoUrl && /^https:\/\//i.test(p.videoUrl) ? p.videoUrl : null;
      return <article key={p.id} className="py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">{p.scope === "PRODUCT" && projectProduct?.image ? <img src={projectProduct.image} alt="" className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center"><Avatar src={projectShop?.profileImageUrl} label={p.shop} size="sm"/></div>}</div><div className="min-w-0"><p className="font-semibold">{p.title}</p><p className="mt-1 text-xs leading-5 text-neutral-500">@{p.shop} · {p.scope === "STORE" ? "Whole shop" : p.product || "Product"} · {p.duration}s · {new Date(p.createdAt).toLocaleDateString()}{p.payment ? ` · KSh ${p.payment.amountKes.toLocaleString("en-KE")} · ${p.payment.status.toLowerCase().replaceAll("_", " ")}` : ""}</p>{p.payment?.receiptNumber && <p className="mt-1 text-xs text-neutral-500">M-Pesa receipt: {p.payment.receiptNumber}</p>}{p.errorMessage && <p className="mt-1 text-xs text-red-600">{userFriendlyError(p.errorMessage, p.payment?.status === "FAILED" ? "mpesa" : "general")}</p>}</div></div>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 sm:justify-end"><span className={"rounded-full px-3 py-1.5 text-[10px] font-semibold " + (p.status === "READY" ? "bg-emerald-50 text-emerald-700" : p.status === "FAILED" ? "bg-red-50 text-red-700" : "bg-neutral-100 text-neutral-700")}>{p.status === "PROCESSING" ? "GENERATING" : p.status.replaceAll("_", " ")}</span>
            {videoUrl && <a href={videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900 underline underline-offset-4"><ExternalLink size={14}/> Open video</a>}
            {p.payment?.status === "REFUND_PENDING" && <span className="text-xs font-medium text-amber-700">Refund review pending</span>}
            <button type="button" onClick={() => void deleteProject(p)} disabled={deletingId === p.id || paymentPending || p.payment?.status === "REFUND_PENDING"} title={paymentPending ? "Finish or cancel the pending payment before deleting" : p.payment?.status === "REFUND_PENDING" ? "Project is awaiting refund review" : "Delete project"} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40">{deletingId === p.id ? <LoaderCircle size={14} className="animate-spin"/> : <Trash2 size={14}/>} {deletingId === p.id ? "Deleting…" : "Delete"}</button>
          </div>
        </div>
        {videoUrl && <details className="group mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold"><span className="flex items-center gap-2"><Play size={16}/> Watch generated video</span><span className="text-xs font-medium text-neutral-500 group-open:hidden">Show player</span><span className="hidden text-xs font-medium text-neutral-500 group-open:inline">Hide player</span></summary><video className="mt-4 max-h-[560px] w-full rounded-xl bg-black" controls playsInline preload="metadata" src={videoUrl}>Your browser cannot play this video. Use Open video to view it in a new tab.</video><p className="mt-2 text-xs text-neutral-500">Use the video player controls to watch, or open the video in a new tab to download if supported by your browser.</p></details>}
        {p.videoReady && !videoUrl && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Your video is ready, but its viewing link is not available right now. Please try refreshing later or contact support.</p>}
      </article>;
    })}</div>}
  </section>;
}
