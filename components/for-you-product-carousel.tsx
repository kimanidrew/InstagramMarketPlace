"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Heart, Sparkles } from "lucide-react";

type Product = {
  id: string;
  productTitle?: string | null;
  productSlug?: string | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  mediaType?: string | null;
  listingType?: string | null;
  instagramLikeCount?: number | null;
  tags?: { name: string }[];
  connection?: { username?: string | null; profileImageUrl?: string | null };
};

export function ForYouProductCarousel({ products, personalized, compact = false }: { products: Product[]; personalized: boolean; compact?: boolean }) {
  const rail = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (paused || products.length < 2) return;
    const timer = window.setInterval(() => {
      if (compact) {
        setActiveIndex((current) => (current + 1) % products.length);
        return;
      }
      const el = rail.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= max - 8) el.scrollTo({ left: 0, behavior: "smooth" });
      else {
        const card = el.querySelector<HTMLElement>("[data-recommendation-card]");
        el.scrollBy({ left: (card?.offsetWidth || 240) + 14, behavior: "smooth" });
      }
    }, compact ? 3400 : 4200);
    return () => window.clearInterval(timer);
  }, [paused, products.length, compact]);


  return (
    <section aria-label="Recommended products" className={compact ? "relative min-w-0 overflow-hidden rounded-[24px] border border-black/[.06] bg-white/75 p-3 sm:rounded-[28px] sm:p-4 md:p-5" : "relative mb-9 overflow-hidden rounded-[28px] border border-black/[.06] bg-[#f7f7f4] p-4 sm:mb-11 sm:rounded-[34px] sm:p-6 md:p-8"}>
      <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/80 blur-2xl" />
      <div className={compact ? "relative mb-3 flex items-end justify-between gap-2" : "relative mb-4 flex items-end justify-between gap-3 sm:mb-6"}>
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.16em] text-[#777] sm:text-[10px]"><Sparkles size={13} /> {personalized ? "Picked around your interests" : "A little inspiration to start"}</p>
          <h2 className={compact ? "mt-1.5 text-lg font-black leading-tight tracking-[-.055em] text-[#171717] sm:text-xl md:text-2xl" : "mt-2 text-2xl font-black leading-tight tracking-[-.055em] text-[#171717] sm:text-3xl md:text-4xl"}>{personalized ? "More of what you love." : "Find your next favourite."}</h2>
          <p className={compact ? "mt-1 max-w-xl text-[11px] leading-4 text-[#777] sm:text-xs" : "mt-1.5 max-w-xl text-xs leading-5 text-[#777] sm:text-sm"}>{personalized ? "Inspired by products you've viewed, liked or saved." : "A handpicked starting point from across SokoLink. Your picks get more personal as you browse."}</p>
        </div>
        <div className={compact ? "hidden" : "hidden shrink-0 items-center gap-2 sm:flex"}>
          <button type="button" onClick={() => rail.current?.scrollBy({ left: -300, behavior: "smooth" })} aria-label="Previous recommendations" className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-black hover:text-white"><ArrowLeft size={16} /></button>
          <button type="button" onClick={() => rail.current?.scrollBy({ left: 300, behavior: "smooth" })} aria-label="Next recommendations" className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-black hover:text-white"><ArrowRight size={16} /></button>
        </div>
      </div>
      {products.length > 0 ? (compact ? (
        <div
          className="relative h-[270px] overflow-hidden sm:h-[300px] md:h-[330px]"
          style={{ perspective: "1000px" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {products.map((p, index) => {
            const image = p.thumbnailUrl || p.mediaUrl;
            const href = "/" + (String(p.listingType).toUpperCase() === "SERVICE" ? "service" : "product") + "/" + p.productSlug;
            const total = products.length;
            let offset = (index - activeIndex + total) % total;
            if (offset > Math.floor(total / 2)) offset -= total;
            const visible = Math.abs(offset) <= 2;
            const x = offset === 0 ? 0 : offset * (Math.abs(offset) === 1 ? 34 : 49);
            const y = offset === 0 ? 0 : Math.abs(offset) * 7;
            const rotate = offset === 0 ? 0 : offset * 7;
            const scale = offset === 0 ? 1 : Math.max(0.72, 0.91 - Math.abs(offset) * 0.075);
            return (
              <article
                data-recommendation-card
                key={p.id}
                className="absolute left-1/2 top-1/2 w-[67%] max-w-[250px] -translate-x-1/2 -translate-y-1/2 sm:w-[64%] md:w-[68%]"
                style={{
                  transform: `translate(-50%, -50%) translateX(${x}%) translateY(${y}px) rotate(${rotate}deg) scale(${scale})`,
                  opacity: visible ? (offset === 0 ? 1 : 0.72) : 0,
                  zIndex: 20 - Math.abs(offset),
                  pointerEvents: visible ? "auto" : "none",
                  transition: "transform 850ms cubic-bezier(.22,1,.36,1), opacity 650ms ease",
                }}
              >
                <Link href={href} className="group relative block aspect-[4/5] overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-[0_22px_45px_rgba(0,0,0,.18)] sm:rounded-[24px]">
                  {image ? <img src={image} alt={p.productTitle || "Recommended listing"} loading={Math.abs(offset) > 1 ? "lazy" : "eager"} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs text-[#999]">Discover this find</div>}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-12 text-white sm:px-4 sm:pb-4">
                    <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[8px] font-black text-[#222]"><Sparkles size={10} /> {personalized ? "For you" : "Popular find"}</span>
                    <p className="line-clamp-1 text-[11px] font-extrabold sm:text-xs">{p.productTitle || "Explore this find"}</p>
                    <p className="mt-1 truncate text-[9px] font-semibold text-white/75">@{p.connection?.username || "SokoLink seller"}</p>
                  </div>
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1.5 text-[9px] font-bold text-white"><Heart size={11} /> {(p.instagramLikeCount || 0).toLocaleString()}</span>
                </Link>
              </article>
            );
          })}
          {products.length > 1 && <>
            <button type="button" onClick={() => setActiveIndex((current) => (current - 1 + products.length) % products.length)} aria-label="Previous recommendation" className="absolute left-0 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 shadow-lg transition hover:scale-105 sm:left-1 sm:h-10 sm:w-10"><ArrowLeft size={15} /></button>
            <button type="button" onClick={() => setActiveIndex((current) => (current + 1) % products.length)} aria-label="Next recommendation" className="absolute right-0 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 shadow-lg transition hover:scale-105 sm:right-1 sm:h-10 sm:w-10"><ArrowRight size={15} /></button>
            <div className="absolute bottom-1 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5">
              {products.slice(0, Math.min(products.length, 8)).map((p, dotIndex) => (
                <button key={p.id} type="button" aria-label={`Show recommendation ${dotIndex + 1}`} onClick={() => setActiveIndex(dotIndex)} className={dotIndex === activeIndex % Math.min(products.length, 8) ? "h-1.5 w-4 rounded-full bg-[#171717] transition-all" : "h-1.5 w-1.5 rounded-full bg-black/15 transition-all"} />
              ))}
            </div>
          </>}
        </div>
      ) : (
        <div ref={rail} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)} className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3">
          {products.map((p, index) => {
            const image = p.thumbnailUrl || p.mediaUrl;
            const href = "/" + (String(p.listingType).toUpperCase() === "SERVICE" ? "service" : "product") + "/" + p.productSlug;
            return (
              <article data-recommendation-card key={p.id} className="group w-[68%] min-w-[68%] snap-start sm:w-[36%] sm:min-w-[36%] md:w-[24%] md:min-w-[24%]">
                <Link href={href} className="relative block aspect-[4/5] overflow-hidden rounded-[20px] bg-white sm:rounded-[24px]">
                  {image ? <img src={image} alt={p.productTitle || "Recommended listing"} loading={index > 3 ? "lazy" : "eager"} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs text-[#999]">Discover this find</div>}
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1.5 text-[9px] font-black text-[#222] backdrop-blur"><Sparkles size={11} /> {personalized ? "For you" : "Popular find"}</span>
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/65 px-2 py-1.5 text-[10px] font-bold text-white backdrop-blur"><Heart size={12} /> {(p.instagramLikeCount || 0).toLocaleString()}</span>
                </Link>
                <div className="px-1 pt-3">
                  <Link href={href} className="line-clamp-2 text-xs font-extrabold leading-5 text-[#202020] hover:underline sm:text-sm">{p.productTitle || "Explore this find"}</Link>
                  <Link href={"/store/" + p.connection?.username} className="mt-1.5 block truncate text-[10px] font-semibold text-[#858585] sm:text-[11px]">@{p.connection?.username || "SokoLink seller"}</Link>
                  <div className="mt-2 flex flex-wrap gap-1">{p.tags?.filter(t => t.name.toLowerCase() !== "instamart").slice(0, 2).map(t => <span key={t.name} className="rounded-full bg-white px-2 py-1 text-[9px] font-semibold text-[#777]">#{t.name}</span>)}</div>
                </div>
              </article>
            );
          })}
        </div>
      )) : <div className="relative rounded-2xl border border-dashed border-black/10 bg-white/70 px-5 py-8 text-center">

        <Sparkles size={22} className="mx-auto text-[#999]" />
        <p className="mt-3 text-sm font-extrabold text-[#222]">Your next favourite is just around the corner.</p>
        <p className="mt-1 text-xs leading-5 text-[#777]">Listings will appear here as shops add products and services to SokoLink.</p>
        <Link href="/shop" className="mt-4 inline-flex rounded-full bg-[#171717] px-4 py-2.5 text-xs font-bold text-white">Explore all listings</Link>
      </div>}
      {!compact && products.length > 1 && <div className="relative mt-4 flex items-center justify-between sm:hidden">
        <span className="text-[10px] font-semibold text-[#999]">Swipe to explore</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => rail.current?.scrollBy({ left: -220, behavior: "smooth" })} aria-label="Previous recommendations" className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white"><ArrowLeft size={15} /></button>
          <button type="button" onClick={() => rail.current?.scrollBy({ left: 220, behavior: "smooth" })} aria-label="Next recommendations" className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white"><ArrowRight size={15} /></button>
        </div>
      </div>}
    </section>
  );
}
