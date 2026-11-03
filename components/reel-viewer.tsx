"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Instagram, MessageCircle, Pause, Play, Star, X } from "lucide-react";
import { useRouter } from "next/navigation";

type ReelReview = { id: string; rating: number; body: string; createdAt: string; user: { name: string | null } };
type Reel = {
  id: string;
  productSlug: string;
  productTitle: string | null;
  caption: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
  listingType: string | null;
  connection: { username: string; profileImageUrl: string | null };
  reviews: ReelReview[];
};

export function ReelViewer({ reels, initialId }: { reels: Reel[]; initialId: string }) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const index = Math.max(0, reels.findIndex(item => item.id === initialId));
  const [activeIndex, setActiveIndex] = useState(index);
  const [playing, setPlaying] = useState(true);
  const activeReel = reels[activeIndex];

  const move = (direction: number) => {
    const current = refs.current.findIndex(el => el && Math.abs(el.getBoundingClientRect().top) < window.innerHeight * .6);
    const next = Math.min(reels.length - 1, Math.max(0, (current < 0 ? activeIndex : current) + direction));
    refs.current[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const togglePlayback = (i: number) => {
    const video = videoRefs.current[i];
    if (!video) return;
    if (video.paused) void video.play().catch(() => setPlaying(false));
    else video.pause();
  };

  useEffect(() => {
    refs.current[index]?.scrollIntoView({ block: "start" });
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowRight"].includes(event.key)) { event.preventDefault(); move(1); }
      if (["ArrowUp", "ArrowLeft"].includes(event.key)) { event.preventDefault(); move(-1); }
      if (event.key === " " && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); togglePlayback(activeIndex); }
      if (event.key === "Escape") router.back();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const sellerMessage = `Hi @${activeReel.connection.username}! I'm interested in "${activeReel.productTitle || "your listing"}" that I saw on SokoLink. Could you please share the price, availability and more details?${activeReel.permalink ? "\\n\\nInstagram post: " + activeReel.permalink : ""}`;
  const askSellerUrl = `https://ig.me/m/${encodeURIComponent(activeReel.connection.username)}?text=${encodeURIComponent(sellerMessage)}`;
  const listingType = activeReel.listingType === "SERVICE" ? "service" : "product";
  const average = activeReel.reviews.length ? activeReel.reviews.reduce((sum, review) => sum + review.rating, 0) / activeReel.reviews.length : 0;

  return <div ref={container} className="sokolink-reel-feed fixed inset-0 z-[10000] h-[100vh] min-h-[100vh] max-h-[100vh] overflow-y-auto bg-[#090909] text-white snap-y snap-mandatory">
    <button onClick={() => router.back()} aria-label="Close reels" className="fixed right-4 top-4 z-[10003] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur"><X size={20}/></button>
    <div className="fixed right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-3">
      <button onClick={() => move(-1)} aria-label="Previous reel" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 backdrop-blur hover:bg-white/20"><ChevronUp/></button>
      <button onClick={() => move(1)} aria-label="Next reel" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 backdrop-blur hover:bg-white/20"><ChevronDown/></button>
    </div>
    {reels.map((reel, i) => {
      const caption = (reel.caption || "").replace(/#[\p{L}\p{N}_]+/gu, "").trim();
      const reviews = reel.reviews || [];
      const rating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
      const type = reel.listingType === "SERVICE" ? "service" : "product";
      const message = `Hi @${reel.connection.username}! I'm interested in "${reel.productTitle || "your listing"}" that I saw on SokoLink. Could you please share the price, availability and more details?${reel.permalink ? "\\n\\nInstagram post: " + reel.permalink : ""}`;
      return <section ref={el => { refs.current[i] = el; }} key={reel.id} onMouseEnter={() => setActiveIndex(i)} className="sokolink-reel-slide relative flex min-h-[100dvh] w-full snap-start snap-always items-stretch justify-center">
        <div className="sokolink-reel-stage relative flex min-h-[100dvh] min-w-0 flex-1 items-center justify-center overflow-hidden bg-black">
          <video ref={el => { videoRefs.current[i] = el; }} src={reel.mediaUrl || undefined} poster={reel.thumbnailUrl || undefined} autoPlay={i === index} muted loop playsInline onPlay={() => { if (i === activeIndex) setPlaying(true); }} onPause={() => { if (i === activeIndex) setPlaying(false); }} className="absolute inset-0 h-full w-full object-contain"/>
          <button type="button" onClick={() => togglePlayback(i)} aria-label={i === activeIndex && playing ? "Pause reel" : "Play reel"} className="sokolink-reel-play absolute left-1/2 top-1/2 z-20 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/45 text-white shadow-2xl backdrop-blur-md transition hover:scale-105 hover:bg-black/65">
            {i === activeIndex && playing ? <Pause size={30} fill="currentColor"/> : <Play size={32} fill="currentColor" className="ml-1"/>}
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/70 to-transparent"/>
          <div className="absolute bottom-5 left-5 z-10 flex items-center gap-3 sm:bottom-8 sm:left-8">
            <Link href={"/stores/"+reel.connection.username} className="pointer-events-auto flex items-center gap-2 text-sm font-bold"><span className="h-10 w-10 overflow-hidden rounded-full border border-white/25 bg-white/15">{reel.connection.profileImageUrl && <img src={reel.connection.profileImageUrl} className="h-full w-full object-cover" alt=""/>}</span>@{reel.connection.username}</Link>
            <span className="text-xs font-semibold text-white/60">{i+1} / {reels.length}</span>
          </div>
        </div>
        <aside className="sokolink-reel-details relative z-10 flex min-h-[100dvh] w-[390px] max-w-[39vw] shrink-0 flex-col overflow-y-auto border-l border-white/10 bg-[#111] px-6 pb-8 pt-20">
          <span className="text-[10px] font-black uppercase tracking-[.18em] text-white/45">SokoLink {type}</span>
          <h2 className="mt-3 break-words text-2xl font-black leading-tight tracking-tight">{reel.productTitle || "Explore this listing"}</h2>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="flex gap-0.5 text-amber-400">{[1,2,3,4,5].map(star => <Star key={star} size={14} fill={star <= Math.round(rating) ? "currentColor" : "none"}/>)}</span>
            <strong>{reviews.length ? rating.toFixed(1) : "New"}</strong>
            <span className="text-white/45">({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span>
          </div>
          {caption && <div className="mt-6 border-t border-white/10 pt-5"><h3 className="text-[10px] font-extrabold uppercase tracking-[.14em] text-white/45">About this {type}</h3><p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-white/75">{caption}</p></div>}
          <div className="mt-6 flex flex-col gap-2">
            <Link href={"/stores/"+reel.connection.username} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] p-3 transition hover:bg-white/[.08]">
              <span className="h-10 w-10 overflow-hidden rounded-full bg-white/10">{reel.connection.profileImageUrl && <img src={reel.connection.profileImageUrl} alt="" className="h-full w-full object-cover"/>}</span>
              <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Sold by</span><span className="block truncate text-sm font-bold">@{reel.connection.username}</span></span>
              <ExternalLink size={15} className="text-white/50"/>
            </Link>
            <a href={`https://ig.me/m/${encodeURIComponent(reel.connection.username)}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-black transition hover:bg-white/90"><MessageCircle size={17}/> Ask the seller <ExternalLink size={14}/></a>
            {reel.permalink && <a href={reel.permalink} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"><Instagram size={17}/> Go to original post <ExternalLink size={14}/></a>}
            <Link href={`/${type}/${reel.productSlug}`} className="text-center text-xs font-bold text-white/55 underline underline-offset-4 hover:text-white">Open full {type} details</Link>
          </div>
          <div className="mt-7 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-extrabold">Reviews</h3><span className="text-xs text-white/45">{reviews.length} total</span></div>
            {reviews.length ? <div className="mt-4 space-y-4">{reviews.map(review => <article key={review.id} className="border-b border-white/10 pb-4 last:border-0"><div className="flex items-center justify-between gap-2"><strong className="truncate text-xs">{review.user?.name || "SokoLink shopper"}</strong><time className="shrink-0 text-[10px] text-white/40">{new Date(review.createdAt).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</time></div><div className="mt-1 flex gap-0.5 text-amber-400">{[1,2,3,4,5].map(star=><Star key={star} size={11} fill={star <= review.rating ? "currentColor" : "none"}/>)}</div><p className="mt-2 whitespace-pre-line break-words text-xs leading-5 text-white/70">{review.body}</p></article>)}</div> : <p className="mt-4 rounded-xl bg-white/[.04] p-4 text-xs leading-5 text-white/50">No reviews yet. Ask the seller a question or open the listing to share your experience.</p>}
            <Link href={`/${type}/${reel.productSlug}/reviews`} className="mt-4 inline-flex text-xs font-bold text-white/70 underline underline-offset-4 hover:text-white">View all reviews / write a review</Link>
          </div>
        </aside>
      </section>;
    })}
  </div>;
}
