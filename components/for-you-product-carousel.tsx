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

  useEffect(() => {
    if (paused || products.length < 2) return;
    const timer = window.setInterval(() => {
      const el = rail.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= max - 8) el.scrollTo({ left: 0, behavior: "smooth" });
      else {
        const card = el.querySelector<HTMLElement>("[data-recommendation-card]");
        el.scrollBy({ left: (card?.offsetWidth || 240) + 14, behavior: "smooth" });
      }
    }, 4200);
    return () => window.clearInterval(timer);
  }, [paused, products.length]);


  return (
    <section aria-label="Recommended products" className={compact ? "relative min-w-0 overflow-hidden rounded-[24px] border border-black/[.06] bg-white/75 p-3 sm:rounded-[28px] sm:p-4 md:p-5" : "relative mb-9 overflow-hidden rounded-[28px] border border-black/[.06] bg-[#f7f7f4] p-4 sm:mb-11 sm:rounded-[34px] sm:p-6 md:p-8"}>
      <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/80 blur-2xl" />
      <div className={compact ? "relative mb-3 flex items-end justify-between gap-2" : "relative mb-4 flex items-end justify-between gap-3 sm:mb-6"}>
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.16em] text-[#777] sm:text-[10px]"><Sparkles size={13} /> {personalized ? "Picked around your interests" : "A little inspiration to start"}</p>
          <h2 className={compact ? "mt-1.5 text-lg font-black leading-tight tracking-[-.055em] text-[#171717] sm:text-xl md:text-2xl" : "mt-2 text-2xl font-black leading-tight tracking-[-.055em] text-[#171717] sm:text-3xl md:text-4xl"}>{personalized ? "More of what you love." : "Find your next favourite."}</h2>
          <p className={compact ? "mt-1 max-w-xl text-[11px] leading-4 text-[#777] sm:text-xs" : "mt-1.5 max-w-xl text-xs leading-5 text-[#777] sm:text-sm"}>{personalized ? "Inspired by products you've viewed, liked or saved." : "A handpicked starting point from across SokoLink. Your picks get more personal as you browse."}</p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button type="button" onClick={() => rail.current?.scrollBy({ left: -300, behavior: "smooth" })} aria-label="Previous recommendations" className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-black hover:text-white"><ArrowLeft size={16} /></button>
          <button type="button" onClick={() => rail.current?.scrollBy({ left: 300, behavior: "smooth" })} aria-label="Next recommendations" className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-black hover:text-white"><ArrowRight size={16} /></button>
        </div>
      </div>
      {products.length > 0 ? <div ref={rail} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)} className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3">
        {products.map((p, index) => {
          const image = p.thumbnailUrl || p.mediaUrl;
          const href = "/" + (String(p.listingType).toUpperCase() === "SERVICE" ? "service" : "product") + "/" + p.productSlug;
          return (
            <article data-recommendation-card key={p.id} className={compact ? "group w-[70%] min-w-[70%] snap-start sm:w-[46%] sm:min-w-[46%] md:w-[48%] md:min-w-[48%]" : "group w-[68%] min-w-[68%] snap-start sm:w-[36%] sm:min-w-[36%] md:w-[24%] md:min-w-[24%]"}>
              <Link href={href} className={compact ? "relative block aspect-[4/3] overflow-hidden rounded-[16px] bg-white sm:rounded-[18px]" : "relative block aspect-[4/5] overflow-hidden rounded-[20px] bg-white sm:rounded-[24px]"}>
                {image ? (String(p.mediaType).toUpperCase() === "VIDEO" && p.thumbnailUrl ? <img src={image} alt={p.productTitle || "Recommended listing"} loading={index > 3 ? "lazy" : "eager"} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <img src={image} alt={p.productTitle || "Recommended listing"} loading={index > 3 ? "lazy" : "eager"} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />) : <div className="flex h-full items-center justify-center text-xs text-[#999]">Discover this find</div>}
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
      </div> : <div className="relative rounded-2xl border border-dashed border-black/10 bg-white/70 px-5 py-8 text-center">
        <Sparkles size={22} className="mx-auto text-[#999]" />
        <p className="mt-3 text-sm font-extrabold text-[#222]">Your next favourite is just around the corner.</p>
        <p className="mt-1 text-xs leading-5 text-[#777]">Listings will appear here as shops add products and services to SokoLink.</p>
        <Link href="/shop" className="mt-4 inline-flex rounded-full bg-[#171717] px-4 py-2.5 text-xs font-bold text-white">Explore all listings</Link>
      </div>}
      {products.length > 1 && <div className="relative mt-4 flex items-center justify-between sm:hidden">
        <span className="text-[10px] font-semibold text-[#999]">Swipe to explore</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => rail.current?.scrollBy({ left: -220, behavior: "smooth" })} aria-label="Previous recommendations" className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white"><ArrowLeft size={15} /></button>
          <button type="button" onClick={() => rail.current?.scrollBy({ left: 220, behavior: "smooth" })} aria-label="Next recommendations" className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white"><ArrowRight size={15} /></button>
        </div>
      </div>}
    </section>
  );
}
