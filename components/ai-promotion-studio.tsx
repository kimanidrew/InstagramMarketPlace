"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, Clapperboard,
  Clock3, Film, LoaderCircle, RefreshCw, Sparkles, Store, WandSparkles, XCircle,
} from "lucide-react";
import { DEFAULT_PROMOTION_PROMPT } from "@/lib/ai-promotions/contracts";
import "./ai-promotion-studio.css";

type Product = { id: string; title: string; slug: string | null; image: string | null; mediaType: string };
type Connection = { id: string; username: string; name: string | null; profileImageUrl: string | null; products: Product[] };
type Campaign = {
  id: string; scope: "PRODUCT" | "STORE"; mode: "MOTION" | "HYBRID" | "CINEMATIC";
  status: string; durationSeconds: number; width: number; height: number; prompt: string;
  progress: number; errorCode: string | null; createdAt: string; completedAt: string | null;
  connection: { username: string; name: string | null; profileImageUrl: string | null };
  post: { id?: string; productTitle: string | null; thumbnailUrl: string | null; mediaUrl: string | null } | null;
  downloadUrl: string | null; thumbnailUrl?: string | null; hasOutput: boolean;
};
type Props = { connections: Connection[] };

const statusLabels: Record<string, string> = {
  DRAFT: "Draft", QUEUED: "Queued", PLANNING: "Planning", GENERATING: "Generating",
  RENDERING: "Rendering", COMPLETED: "Completed", FAILED: "Failed", CANCELLED: "Cancelled",
};

export function AiPromotionStudio({ connections }: Props) {
  const [connectionId, setConnectionId] = useState(connections[0]?.id || "");
  const [scope, setScope] = useState<"PRODUCT" | "STORE">("PRODUCT");
  const [postId, setPostId] = useState(connections[0]?.products[0]?.id || "");
  const [mode, setMode] = useState<"MOTION" | "HYBRID" | "CINEMATIC">("HYBRID");
  const [duration, setDuration] = useState("15");
  const [format, setFormat] = useState<"VERTICAL" | "SQUARE" | "LANDSCAPE">("VERTICAL");
  const [prompt, setPrompt] = useState(DEFAULT_PROMOTION_PROMPT);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [credits, setCredits] = useState<{ availableCredits: number; reservedCredits: number; lifetimeConsumed: number; cinematicEnabled: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedConnection = connections.find((connection) => connection.id === connectionId);
  const products = selectedConnection?.products ?? [];
  const selectedProduct = products.find((product) => product.id === postId);
  const dimensions = format === "VERTICAL" ? "1080 × 1920" : format === "SQUARE" ? "1080 × 1080" : "1920 × 1080";

  const loadData = useCallback(async () => {
    try {
      const [campaignResponse, creditResponse] = await Promise.all([
        fetch("/api/account/ai-promotions?limit=30", { cache: "no-store" }),
        fetch("/api/account/ai-promotions/credits", { cache: "no-store" }),
      ]);
      if (campaignResponse.ok) {
        const payload = await campaignResponse.json();
        setCampaigns(payload.campaigns || []);
      }
      if (creditResponse.ok) setCredits(await creditResponse.json());
    } catch {
      setError("We couldn't refresh your campaigns. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => {
    const active = campaigns.some((campaign) => ["QUEUED", "PLANNING", "GENERATING", "RENDERING"].includes(campaign.status));
    if (!active) return;
    const timer = window.setInterval(() => { void loadData(); }, 4000);
    return () => window.clearInterval(timer);
  }, [campaigns, loadData]);

  const onConnectionChange = (value: string) => {
    setConnectionId(value);
    const next = connections.find((connection) => connection.id === value);
    setPostId(next?.products[0]?.id || "");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!connectionId || (scope === "PRODUCT" && !postId)) {
      setError("Select a connected store and an eligible product.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/account/ai-promotions", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({
          connectionId, scope, postId: scope === "PRODUCT" ? postId : null,
          mode, durationSeconds: Number(duration), format, prompt,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "We couldn't start your promotion.");
      setNotice("Your promotion has been queued. You can leave this page while it renders.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't start your promotion.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id: string) => {
    setError("");
    try {
      const response = await fetch(`/api/account/ai-promotions/${id}/cancel`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not cancel this promotion.");
      setNotice("Promotion cancelled.");
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not cancel this promotion."); }
  };

  const retry = async (id: string) => {
    setError("");
    try {
      const response = await fetch(`/api/account/ai-promotions/${id}/retry`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not retry this promotion.");
      setNotice("Promotion queued again.");
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not retry this promotion."); }
  };

  const sortedCampaigns = useMemo(() => campaigns, [campaigns]);

  return (
    <main className="ai-promo-page">
      <div className="ai-promo-shell">
        <Link href="/account" className="ai-promo-back"><ArrowLeft size={16}/> Seller dashboard</Link>
        <header className="ai-promo-hero">
          <div className="ai-promo-hero-copy">
            <span className="ai-promo-eyebrow"><Sparkles size={14}/> AI CREATIVE STUDIO</span>
            <h1>Make your next<br/><span>product stand out.</span></h1>
            <p>Create polished short-form promotions from your real SokoLink product photos and store identity. Start with free motion design and add cinematic AI scenes when available.</p>
            <div className="ai-promo-hero-pills"><span><CheckCircle2 size={14}/> 1080p export</span><span><Clock3 size={14}/> 15 seconds</span><span><WandSparkles size={14}/> Hybrid creative</span></div>
          </div>
          <div className="ai-promo-hero-art" aria-hidden="true">
            <div className="ai-promo-art-orbit"/><div className="ai-promo-art-card"><Film size={26}/><span>YOUR NEXT CAMPAIGN</span><strong>Made to<br/>get noticed.</strong><i>PRODUCT · STORY · ACTION</i></div>
            <Sparkles className="ai-promo-art-spark" size={22}/>
          </div>
        </header>

        {(error || notice) && <div className={`ai-promo-feedback ${error ? "is-error" : "is-success"}`} role="status">{error ? <XCircle size={17}/> : <CheckCircle2 size={17}/>}<span>{error || notice}</span><button type="button" onClick={() => { setError(""); setNotice(""); }} aria-label="Dismiss"><XCircle size={16}/></button></div>}

        <div className="ai-promo-layout">
          <section className="ai-promo-builder">
            <div className="ai-promo-section-title"><span className="ai-promo-step">01</span><div><h2>Create a promotion</h2><p>Choose a source and tell us how it should feel.</p></div></div>
            {!connections.length ? (
              <div className="ai-promo-empty"><Store size={28}/><h3>Connect your first shop</h3><p>Once a shop is connected, you can create promotions from its eligible product photos.</p><Link href="/account/setup" className="ai-promo-primary">Connect a shop <ArrowRight size={15}/></Link></div>
            ) : (
              <form className="ai-promo-form" onSubmit={submit}>
                <label className="ai-promo-label">Connected store
                  <select value={connectionId} onChange={(event) => onConnectionChange(event.target.value)} required>
                    {connections.map((connection) => <option key={connection.id} value={connection.id}>@{connection.username}{connection.name ? ` · ${connection.name}` : ""}</option>)}
                  </select>
                </label>

                <div className="ai-promo-label">What are you promoting?</div>
                <div className="ai-promo-segmented">
                  <button type="button" className={scope === "PRODUCT" ? "active" : ""} onClick={() => setScope("PRODUCT")}><Film size={16}/> One product</button>
                  <button type="button" className={scope === "STORE" ? "active" : ""} onClick={() => setScope("STORE")}><Store size={16}/> Whole store</button>
                </div>

                {scope === "PRODUCT" && <label className="ai-promo-label">Product or service
                  <select value={postId} onChange={(event) => setPostId(event.target.value)} required>
                    {!products.length && <option value="">No eligible products found</option>}
                    {products.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}
                  </select>
                </label>}

                <div className="ai-promo-label">Creative mode</div>
                <div className="ai-promo-mode-grid">
                  <button type="button" className={mode === "MOTION" ? "selected" : ""} onClick={() => setMode("MOTION")}><Film size={18}/><strong>Free motion</strong><span>Animated real photos, motion, and text.</span><small>FREE RENDER</small></button>
                  <button type="button" className={mode === "HYBRID" ? "selected" : ""} onClick={() => setMode("HYBRID")}><WandSparkles size={18}/><strong>Hybrid</strong><span>Motion first, cinematic scenes when enabled.</span><small>RECOMMENDED</small></button>
                  <button type="button" className={mode === "CINEMATIC" ? "selected" : ""} onClick={() => setMode("CINEMATIC")}><Sparkles size={18}/><strong>Cinematic</strong><span>Prioritize generated scenes when configured.</span><small>USES AI CREDITS</small></button>
                </div>

                <div className="ai-promo-field-row">
                  <label className="ai-promo-label">Duration
                    <select value={duration} onChange={(event) => setDuration(event.target.value)}>
                      <option value="10">10 seconds</option><option value="15">15 seconds</option><option value="30">30 seconds</option>
                    </select>
                  </label>
                  <label className="ai-promo-label">Video format
                    <select value={format} onChange={(event) => setFormat(event.target.value as typeof format)}>
                      <option value="VERTICAL">Vertical · 9:16</option><option value="SQUARE">Square · 1:1</option><option value="LANDSCAPE">Landscape · 16:9</option>
                    </select>
                  </label>
                </div>

                {scope === "PRODUCT" && selectedProduct && <div className="ai-promo-source-preview">
                  {selectedProduct.image ? <img src={selectedProduct.image} alt="" /> : <div className="ai-promo-source-placeholder"><Film size={22}/></div>}
                  <div><span>SELECTED SOURCE</span><strong>{selectedProduct.title}</strong><small>Actual listing media will be used in the render.</small></div>
                </div>}
                {scope === "STORE" && <div className="ai-promo-store-note"><Store size={19}/><span>Your campaign will use the selected store identity and its eligible product imagery.</span></div>}

                <label className="ai-promo-label">Creative direction
                  <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={1600} rows={4} required />
                  <span className="ai-promo-character-count">{prompt.length}/1600 characters</span>
                </label>

                <div className="ai-promo-submit-summary"><div><span>OUTPUT</span><strong>{duration}s · {dimensions} · MP4</strong><small>Seller preview before any future publishing integration.</small></div><button type="submit" className="ai-promo-primary" disabled={submitting || !connectionId || (scope === "PRODUCT" && !postId)}>{submitting ? <LoaderCircle className="ai-promo-spin" size={17}/> : <Sparkles size={17}/>} {submitting ? "Queuing…" : "Create promotion"} <ArrowRight size={15}/></button></div>
              </form>
            )}
          </section>

          <aside className="ai-promo-side">
            <section className="ai-promo-credit-card"><div className="ai-promo-credit-icon"><Sparkles size={20}/></div><span className="ai-promo-side-kicker">CINEMATIC CREDITS</span><strong>{credits ? credits.availableCredits : "—"}</strong><p>Available credits for eligible AI-generated scenes.</p><div className="ai-promo-credit-meta"><span>Reserved <b>{credits?.reservedCredits ?? "—"}</b></span><span>Used <b>{credits?.lifetimeConsumed ?? "—"}</b></span></div><small>{credits?.cinematicEnabled ? "Cinematic provider enabled" : "Motion rendering is available; cinematic provider setup is still required."}</small></section>
            <section className="ai-promo-how-card"><span className="ai-promo-side-kicker">HOW IT WORKS</span><div><i>1</i><p><b>Choose your source</b><span>Use an actual listing or your whole store.</span></p></div><div><i>2</i><p><b>Build the story</b><span>AI-ready creative direction and scene plan.</span></p></div><div><i>3</i><p><b>Render and review</b><span>Download a polished MP4 when complete.</span></p></div></section>
            <section className="ai-promo-trust-note"><BadgeCheck size={18}/><p><b>Product accuracy first.</b><span>Store names and product details come from SokoLink. Generated marketing copy must not invent discounts or features.</span></p></section>
          </aside>
        </div>

        <section className="ai-promo-library">
          <div className="ai-promo-library-heading"><div><span className="ai-promo-eyebrow">YOUR CREATIVE HISTORY</span><h2>Recent promotions</h2><p>Track progress and return to finished videos anytime.</p></div><button type="button" className="ai-promo-refresh" onClick={() => void loadData()}><RefreshCw size={15}/> Refresh</button></div>
          {loading ? <div className="ai-promo-loading"><LoaderCircle className="ai-promo-spin" size={20}/> Loading your campaigns…</div> : sortedCampaigns.length === 0 ? <div className="ai-promo-library-empty"><Clapperboard size={26}/><strong>Your first campaign starts here.</strong><span>Create a promotion above and its progress will appear here.</span></div> : <div className="ai-promo-campaign-grid">
            {sortedCampaigns.map((campaign) => {
              const active = ["QUEUED", "PLANNING", "GENERATING", "RENDERING"].includes(campaign.status);
              const image = campaign.thumbnailUrl || campaign.post?.thumbnailUrl || campaign.post?.mediaUrl || campaign.connection.profileImageUrl;
              return <article className="ai-promo-campaign-card" key={campaign.id}>
                <div className="ai-promo-campaign-thumb">{campaign.status === "COMPLETED" && campaign.downloadUrl ? <video src={campaign.downloadUrl} controls playsInline preload="metadata" poster={image || undefined}/> : image ? <img src={image} alt="" /> : <div className="ai-promo-source-placeholder"><Film size={25}/></div>}{active && <span className="ai-promo-progress-tag"><LoaderCircle size={13} className="ai-promo-spin"/> In progress</span>}</div>
                <div className="ai-promo-campaign-info"><div className="ai-promo-campaign-top"><span className={`ai-promo-status status-${campaign.status.toLowerCase()}`}>{statusLabels[campaign.status] || campaign.status}</span><span>{campaign.durationSeconds}s</span></div><h3>{campaign.post?.productTitle || (campaign.scope === "STORE" ? `@${campaign.connection.username} store campaign` : "Product promotion")}</h3><p>@{campaign.connection.username} · {campaign.mode.toLowerCase()} · {new Date(campaign.createdAt).toLocaleDateString()}</p>{active && <div className="ai-promo-progress"><span style={{ width: `${Math.max(5, Math.min(100, campaign.progress || 5))}%` }}/></div>}{campaign.status === "COMPLETED" && campaign.downloadUrl && <a className="ai-promo-download" href={campaign.downloadUrl}><ArrowDownToLine size={15}/> Download video</a>}{active && <button className="ai-promo-text-button" onClick={() => void cancel(campaign.id)}>Cancel promotion</button>}{["FAILED", "CANCELLED"].includes(campaign.status) && <button className="ai-promo-text-button" onClick={() => void retry(campaign.id)}><RefreshCw size={14}/> Try again</button>}{campaign.status === "FAILED" && <small className="ai-promo-error-code">Error: {campaign.errorCode || "RENDER_FAILED"}</small>}</div>
              </article>;
            })}
          </div>}
        </section>
      </div>
    </main>
  );
}
