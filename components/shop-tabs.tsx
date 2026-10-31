"use client";

import Link from "next/link";
import React, { Fragment, useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Bookmark, ChevronLeft, ChevronRight, Crown, Grid2X2, Heart, Megaphone, Sparkles, Store, Trash2, TrendingUp, X } from "lucide-react";
import { ProductMasonry, StoreCard, StoreInlineSection } from "@/components/product-masonry";
import { ProductCard } from "@/components/product-card";
import { AnalyticsImpression } from "@/components/analytics-impression";
import { analyticsVisitorId } from "@/lib/analytics-client";
import { SpotlightStoreCard, type StoreEntry } from "@/components/store-directory";

type ShopTab = "discover" | "trending" | "featured";

type PromoSlide =
  | { type: "store"; key: string; store: any; posts: any[] }
  | { type: "product"; key: string; product: any }
  | { type: "ad"; key: string };

function PromoSlideContent({ slide, measure = false, onVisit }: { slide: PromoSlide; measure?: boolean; onVisit?: (key: string) => void }) {
  if (slide.type === "store") {
    const now = Date.now();
    const entry: StoreEntry = {
      store: slide.store,
      posts: slide.posts,
      promoted: Boolean(slide.store.paidPromotionActive),
      activeVerified: Boolean(slide.store.verifiedAt && (!slide.store.verifiedUntil || new Date(slide.store.verifiedUntil).getTime() > now)),
      activePro: Boolean(slide.store.proUntil && new Date(slide.store.proUntil).getTime() > now),
    };
    const card = <SpotlightStoreCard entry={entry} measure={measure} onVisit={() => onVisit?.(slide.key)} />;
    return measure ? <div className="shop-promo-measure-slide shop-promo-shared-store-measure">{card}</div> : card;
  }

  const className = "shop-promo-slide " + (measure ? "shop-promo-measure-slide " : "") + (slide.type === "product" ? "shop-promo-product" : "shop-promo-ad") + " group grid overflow-hidden " + (slide.type === "product" ? "md:grid-cols-[.9fr_1.1fr]" : "md:grid-cols-[1fr_.85fr]");
  const copy = slide.type === "product" ? (
    <>
      <span className="shop-promo-label"><Sparkles size={11} /> Promoted</span>
      <h2 className="mt-4 max-w-lg text-3xl font-black leading-[.98] tracking-[-.055em] sm:text-4xl md:text-5xl">{slide.product.productTitle || "A find worth sharing."}</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-black/60">Handpicked for a closer look. Discover the details, then shop directly from the seller.</p>
      <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-black text-white">Discover listing <ArrowRight size={14} /></span>
    </>
  ) : (
    <>
      <span className="shop-promo-label"><Megaphone size={11} /> Marketplace spotlight · Ad</span>
      <h2 className="mt-4 max-w-xl text-3xl font-black leading-[.98] tracking-[-.055em] sm:text-4xl md:text-5xl">Your next great find <span className="text-[#d6ff63]">starts here.</span></h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-white/70">Meet independent sellers, uncover fresh finds and shop from the people behind the posts.</p>
      <Link href="/stores" className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black text-black">Explore all shops <ArrowRight size={14} /></Link>
    </>
  );
  const productImages = slide.type === "product" ? (() => {
    const product = slide.product;
    const isVideoUrl = (url: unknown) => typeof url === "string" && /\.(mp4|mov|webm|m3u8)(?:[?#]|$)/i.test(url);
    const mediaItems = Array.isArray(product.mediaItems) ? product.mediaItems : [];
    const fromItems = mediaItems.map((item: any) => {
      if (typeof item === "string") return isVideoUrl(item) ? null : item;
      const mediaType = String(item?.media_type || item?.mediaType || item?.type || "").toLowerCase();
      const isVideo = mediaType.includes("video") || isVideoUrl(item?.media_url || item?.mediaUrl || item?.url);
      return isVideo
        ? item?.thumbnail_url || item?.thumbnailUrl || null
        : item?.thumbnail_url || item?.thumbnailUrl || item?.media_url || item?.mediaUrl || item?.url || null;
    }).filter((url: unknown): url is string => typeof url === "string" && /^https?:\/\//i.test(url) && !isVideoUrl(url));
    const candidates = [product.thumbnailUrl, ...fromItems, !isVideoUrl(product.mediaUrl) ? product.mediaUrl : null]
      .filter((url: unknown): url is string => typeof url === "string" && /^https?:\/\//i.test(url) && !isVideoUrl(url));

    // The same uploaded image can appear as thumbnailUrl, mediaUrl and a mediaItems
    // entry with different resize/query parameters. Deduplicate by the underlying
    // asset URL before assigning collage positions.
    const seenImages = new Set<string>();
    return candidates.filter((url) => {
      try {
        const parsed = new URL(url);
        parsed.search = "";
        parsed.hash = "";
        parsed.hostname = parsed.hostname.toLowerCase();
        while (parsed.pathname.endsWith("/")) parsed.pathname = parsed.pathname.slice(0, -1);
        const pathParts = parsed.pathname.split("/");
        const uploadIndex = pathParts.findIndex((part) => part === "upload");
        if (uploadIndex >= 0 && pathParts[uploadIndex + 1] && /^(?:w_|h_|c_|q_|f_|ar_|fit_|crop_|dpr_|e_)/i.test(pathParts[uploadIndex + 1])) {
          pathParts.splice(uploadIndex + 1, 1);
          parsed.pathname = pathParts.join("/");
        }
        const identity = parsed.toString();
        if (seenImages.has(identity)) return false;
        seenImages.add(identity);
        return true;
      } catch {
        if (seenImages.has(url)) return false;
        seenImages.add(url);
        return true;
      }
    }).slice(0, 4);
  })() : [];
  const visual = slide.type === "product" ? (
    <div className={"shop-promo-product-visual " + (productImages.length > 1 ? "has-floating-images" : "")}>
      {productImages.length > 1 ? (
        <div className="shop-promo-floating-gallery">
          {productImages.slice(1).map((src, i) => <span key={src} className={"shop-promo-float-image shop-promo-float-image-" + (i + 1)}><img src={src} alt="" /></span>)}
          <span className="shop-promo-main-image"><img src={productImages[0]} alt={slide.product.productTitle || "Promoted listing"} /></span>
        </div>
      ) : productImages[0] ? (
        <span className="shop-promo-main-image shop-promo-single-card"><img src={productImages[0]} alt={slide.product.productTitle || "Promoted listing"} /></span>
      ) : null}
    </div>
  ) : (
    <div className="shop-promo-ad-art" aria-hidden="true"><span className="promo-art-card promo-art-card-a">DISCOVER</span><span className="promo-art-card promo-art-card-b">LOCAL FINDS</span><span className="promo-art-spark">✳</span><span className="promo-art-ring" /></div>
  );
  const slideContent = <><div className="relative z-10 flex flex-col justify-center p-6 sm:p-9 md:p-10">{copy}</div>{visual}</>;
  if (slide.type === "product") return measure ? <div className={className}>{slideContent}</div> : <Link href={"/" + (String(slide.product.listingType || "").toUpperCase() === "SERVICE" ? "service" : "product") + "/" + slide.product.productSlug} key={slide.key} className={"shop-promo-slide shop-promo-enter shop-promo-product " + className.split(" ").slice(3).join(" ")} onClick={() => onVisit?.(slide.key)}>{slideContent}</Link>;
  return <div key={slide.key} className={measure ? className : "shop-promo-slide shop-promo-enter shop-promo-ad group grid overflow-hidden md:grid-cols-[1fr_.85fr]"}>{slideContent}</div>;
}

function shuffleSlides<T,>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function ShopPromoCarousel({ stores, products }: { stores: any[]; products: any[] }) {
  const [slides] = useState<PromoSlide[]>(() => {
    const storeSlides: PromoSlide[] = stores
      .filter(({ store }) => store)
      .map(({ store, posts }) => ({
        type: "store" as const,
        key: "store-" + store.id,
        store,
        posts: posts || [],
      }));
    const productSlides: PromoSlide[] = products
      .filter((product) => product?.id && product?.productSlug && (product.thumbnailUrl || product.mediaUrl || (Array.isArray(product.mediaItems) && product.mediaItems.length)))
      .map((product) => ({ type: "product" as const, key: "product-" + product.id, product }));
    const unique = Array.from(new Map<string, PromoSlide>([...storeSlides, ...productSlides].map((slide): [string, PromoSlide] => [slide.key, slide])).values());
    const isFeatured = (slide: PromoSlide) => {
      if (slide.type === "store") return Boolean(slide.store.paidPromotionActive);
      if (slide.type === "product") return Boolean(slide.product.boostUntil && new Date(slide.product.boostUntil).getTime() > Date.now());
      return false;
    };
    const storeSlidesAll = unique.filter((slide) => slide.type === "store");
    const productSlidesAll = unique.filter((slide) => slide.type === "product");
    // Keep a healthy mix in every five-slide rotation: randomly use two or
    // three shops, then fill the remaining positions with product spotlights.
    const shopCount = Math.min(storeSlidesAll.length, Math.random() < 0.5 ? 2 : 3);
    const choose = (items: PromoSlide[], count: number) => {
      const featuredItems = shuffleSlides(items.filter(isFeatured));
      const organicItems = shuffleSlides(items.filter((item) => !isFeatured(item)));
      return [...featuredItems, ...organicItems].slice(0, count);
    };
    const selectedStores = choose(storeSlidesAll, shopCount);
    const selectedProducts = choose(productSlidesAll, Math.min(5 - selectedStores.length, productSlidesAll.length));
    // If one category has too few entries, use the remaining available slots
    // from the other category without duplicating a spotlight.
    const selectedKeys = new Set([...selectedStores, ...selectedProducts].map((slide) => slide.key));
    const remaining = choose(unique.filter((slide) => !selectedKeys.has(slide.key)), 5 - selectedKeys.size);
    return shuffleSlides([...selectedStores, ...selectedProducts, ...remaining]).slice(0, 5);
  });
  const [index, setIndex] = useState(0);
  const [bannerHeight, setBannerHeight] = useState(300);
  const [isMeasured, setIsMeasured] = useState(false);
  const measureRef = React.useRef<HTMLDivElement>(null);
  const swipeStartX = React.useRef<number | null>(null);
  const didSwipe = React.useRef(false);
  const visitorId = analyticsVisitorId();

  const goToSlide = (next: number) => {
    setIndex((next + slides.length) % slides.length);
  };
  const handleSwipeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    swipeStartX.current = event.clientX;
  };
  const handleSwipeEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (swipeStartX.current === null) return;
    const delta = event.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(delta) < 45 || slides.length < 2) return;
    didSwipe.current = true;
    goToSlide(index + (delta < 0 ? 1 : -1));
  };

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const container = measureRef.current;
    if (!container) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nodes = container.querySelectorAll<HTMLElement>(".shop-promo-measure-slide");
        if (!nodes.length) return;
        const max = Math.ceil(Math.max(...Array.from(nodes, (node) => node.getBoundingClientRect().height)));
        if (max > 0) {
          setBannerHeight((current) => current === max ? current : max);
          setIsMeasured(true);
        }
      });
    };
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(container);
    const images = Array.from(container.querySelectorAll("img"));
    images.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", measure);
      img.addEventListener("error", measure);
    });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      images.forEach((img) => {
        img.removeEventListener("load", measure);
        img.removeEventListener("error", measure);
      });
      window.removeEventListener("resize", measure);
    };
  }, [slides]);

  if (!slides.length) return null;
  const activeSlide = slides[index] || slides[0];

  return (
    <section
      className={"shop-promo-carousel relative mb-5 overflow-hidden rounded-[28px] sm:mb-7 " + (!isMeasured ? "shop-promo-loading" : "")}
      style={{ height: bannerHeight, minHeight: bannerHeight, ["--shop-promo-height" as any]: bannerHeight + "px" }}
      aria-label="Five featured shop and product spotlights"
    >
      {!isMeasured && <div className="shop-promo-shimmer" aria-label="Loading spotlights"><span /><i /><b /></div>}
      <div
        className="shop-promo-active"
        style={{ height: bannerHeight, visibility: isMeasured ? "visible" : "hidden" }}
        onPointerDown={handleSwipeStart}
        onPointerUp={handleSwipeEnd}
        onPointerCancel={() => { swipeStartX.current = null; }}
        onClickCapture={(event) => {
          if (!didSwipe.current) return;
          event.preventDefault();
          event.stopPropagation();
          didSwipe.current = false;
        }}
      >
        <div className="shop-promo-track" style={{ transform: `translate3d(-${index * 100}%,0,0)` }}>
          {slides.map((slide) => (
            <div className="shop-promo-track-item" key={slide.key}>
              <PromoSlideContent slide={slide} />
            </div>
          ))}
        </div>
        {activeSlide.type === "store" && <AnalyticsImpression key={activeSlide.key} connectionId={activeSlide.store.id} />}
        {activeSlide.type === "product" && <AnalyticsImpression key={activeSlide.key} connectionId={activeSlide.product.connectionId} postId={activeSlide.product.id} />}
      </div>
      <div ref={measureRef} className="shop-promo-measurement" aria-hidden="true">
        {slides.map((slide) => <PromoSlideContent key={"measure-" + slide.key} slide={slide} measure />)}
      </div>
      {isMeasured && slides.length > 1 && (
        <div className="shop-promo-controls" aria-label="Spotlight carousel controls">
          <div className="shop-promo-dots" role="group" aria-label="Choose a spotlight">
            {slides.map((slide, i) => <button key={slide.key} type="button" aria-label={"Show spotlight " + (i + 1)} aria-current={i === index ? "true" : undefined} onClick={() => goToSlide(i)} className={i === index ? "is-active" : ""} />)}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => goToSlide(index - 1)} aria-label="Previous spotlight"><ChevronLeft size={16} /></button>
            <button type="button" onClick={() => goToSlide(index + 1)} aria-label="Next spotlight"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </section>
  );
}

export function AnimatedMarketplaceBanner({ variant = "discover" }: { variant?: "discover" | "sell" }) {
  const selling = variant === "sell";
  return (
    <section className={"shop-animated-banner " + (selling ? "shop-animated-banner-sell" : "shop-animated-banner-discover")} aria-label={selling ? "Start selling on SokoLink" : "Discover SokoLink shops"}>
      <div className="shop-animated-banner-copy">
        <span className="shop-animated-banner-kicker"><Sparkles size={12} /> {selling ? "GROW WITH SOKOLINK" : "A WORLD OF FINDS"}</span>
        <h2>{selling ? <>Your shop deserves<br /><em>the spotlight.</em></> : <>Good finds.<br /><em>Great stories.</em></>}</h2>
        <p>{selling ? "Put your products in front of shoppers who are ready to discover something new." : "Explore independent shops, fresh arrivals and products worth talking about."}</p>
        <Link href={selling ? "/account/setup" : "/stores"}>{selling ? "Set up your shop" : "Meet the sellers"} <ArrowRight size={15} /></Link>
      </div>
      <div className="shop-animated-banner-art" aria-hidden="true">
        <span className="shop-banner-orbit shop-banner-orbit-one" />
        <span className="shop-banner-orbit shop-banner-orbit-two" />
        <span className="shop-banner-spark shop-banner-spark-one">✳</span>
        <span className="shop-banner-spark shop-banner-spark-two">✦</span>
        <span className="shop-banner-float shop-banner-float-one">{selling ? "YOUR BRAND" : "NEW FINDS"}</span>
        <span className="shop-banner-float shop-banner-float-two">{selling ? "GROW • REACH • SELL" : "STYLE • HOME • MORE"}</span>
        <span className="shop-banner-disc" />
      </div>
    </section>
  );
}

export function ShopTabs({
  initialTab = "discover",
  wishlistProducts = [],
  recentlyViewedProducts = [],
  featuredStores = [],
  trendingProducts = [],
  trendingStores = [],
  featuredProducts = [],
  featuredFallbackProducts = [],
  categorySections = [],
  now,
}: {
  initialTab?: ShopTab;
  wishlistProducts?: any[];
  recentlyViewedProducts?: any[];
  featuredStores?: any[];
  trendingProducts?: any[];
  trendingStores?: any[];
  featuredProducts?: any[];
  featuredFallbackProducts?: any[];
  categorySections?: { label: string; type: "product" | "service"; items: any[] }[];
  now: string;
}) {
  const [active, setActive] = useState<ShopTab>(initialTab);
  useEffect(() => {
    setActive(initialTab);
  }, [initialTab]);
  const [recentItems, setRecentItems] = useState(recentlyViewedProducts);
  const [recentStores, setRecentStores] = useState<any[]>([]);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [removingHistoryKeys, setRemovingHistoryKeys] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    const visitorId = analyticsVisitorId();
    fetch("/api/shopper/stores-history?visitorId=" + encodeURIComponent(visitorId), { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { stores: [] })
      .then((data) => { if (!cancelled) setRecentStores(data.stores || []); })
      .catch(() => { if (!cancelled) setRecentStores([]); });
    return () => { cancelled = true; };
  }, []);
  const clearRecentHistory = async () => {
    setClearingHistory(true);
    try {
      const [productsResponse, storesResponse] = await Promise.all([
        fetch("/api/shopper/history", { method: "DELETE" }),
        fetch("/api/shopper/stores-history?visitorId=" + encodeURIComponent(analyticsVisitorId()), { method: "DELETE" }),
      ]);
      if (productsResponse.ok) setRecentItems([]);
      if (storesResponse.ok) setRecentStores([]);
    } finally {
      setClearingHistory(false);
    }
  };
  const removeHistoryItem = async (kind: "product" | "store", item: any) => {
    const key = kind + "-" + item.id;
    setRemovingHistoryKeys((current) => [...current, key]);
    try {
      const url = kind === "product"
        ? "/api/shopper/history"
        : "/api/shopper/stores-history?visitorId=" + encodeURIComponent(analyticsVisitorId()) + "&connectionId=" + encodeURIComponent(item.id);
      const response = await fetch(url, kind === "product"
        ? { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: item.id }) }
        : { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to remove this item from history.");
      if (kind === "product") setRecentItems((current) => current.filter((entry) => entry.id !== item.id));
      else setRecentStores((current) => current.filter((entry) => entry.id !== item.id));
    } catch {
      // Keep the item visible if the server could not update the history.
    } finally {
      setRemovingHistoryKeys((current) => current.filter((entry) => entry !== key));
    }
  };

  const currentNow = new Date(now);

  const filteredTrendingProducts = trendingProducts;
  const filteredFeaturedProducts = featuredProducts;
  const featuredHomeProducts = [
    ...featuredProducts.slice(0, 5),
    ...featuredFallbackProducts.filter((product: any) => !featuredProducts.some((featured: any) => featured.id === product.id)).slice(0, Math.max(0, 5 - featuredProducts.length)),
  ];
  const filteredFeaturedStores = featuredStores;

  return (
    <div className="shop-tabs-wrap mt-0">
      <ShopPromoCarousel stores={filteredFeaturedStores} products={[...filteredFeaturedProducts, ...featuredFallbackProducts]} />
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#999]">SokoLink marketplace</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-.05em] text-[#171717]">{active === "discover" ? "Discover" : active === "trending" ? "Trending now" : "Featured collection"}</h2>
          <p className="mt-1 text-sm text-[#777]">{active === "discover" ? "Explore fresh finds, stores and categories." : active === "trending" ? "See what shoppers are loving right now." : "Explore standout stores and promoted listings."}</p>
        </div>
        <nav aria-label="Marketplace sections" className="flex flex-wrap items-center gap-2">
          <span aria-current={active === "discover" ? "page" : undefined} className={"rounded-full px-4 py-2 text-xs font-black " + (active === "discover" ? "bg-black text-white" : "bg-[#f4f4f2] text-[#777]")}>Discover</span>
          <Link href="/trending" aria-current={active === "trending" ? "page" : undefined} className={"rounded-full px-4 py-2 text-xs font-black transition " + (active === "trending" ? "bg-black text-white" : "bg-[#f4f4f2] text-[#333] hover:bg-black hover:text-white")}>Trending <TrendingUp size={13} className="ml-1 inline" /></Link>
          <Link href="/featured" aria-current={active === "featured" ? "page" : undefined} className={"rounded-full px-4 py-2 text-xs font-black transition " + (active === "featured" ? "bg-black text-white" : "bg-[#f4f4f2] text-[#333] hover:bg-black hover:text-white")}>Featured <Sparkles size={13} className="ml-1 inline" /></Link>
        </nav>
      </div>

      <div className="shop-tab-panel" role="tabpanel" id={"shop-tab-panel-" + active}>
        <>
            {active === "discover" && (
              <div className="space-y-12">
                {(recentItems.length > 0 || recentStores.length > 0) && (
                  <section className="rounded-[30px] border border-black/5 bg-white p-5 md:p-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="eyebrow plain"><Sparkles size={13} /> Back on Your Shopping List</p>
                        <h2 className="mt-2 text-2xl font-black tracking-[-.04em] md:text-3xl">Pick Up Where You Left Off</h2>
                        <p className="mt-2 text-sm text-[#777]">Revisit products, services and stores you recently checked out.</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                        <Link href="/history" className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-black text-white transition hover:bg-black/80">View all <ArrowRight size={14} /></Link>
                        <button type="button" onClick={clearRecentHistory} disabled={clearingHistory} aria-label={clearingHistory ? "Clearing history" : "Clear history"} title={clearingHistory ? "Clearing history" : "Clear history"} className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full border border-black/10 text-[#666] transition hover:border-black hover:text-black disabled:cursor-wait disabled:opacity-70 sm:h-auto sm:w-auto sm:px-4 sm:py-2"><Trash2 size={17} aria-hidden="true" className={clearingHistory ? "animate-bounce text-black" : "transition-transform duration-200 hover:rotate-[-8deg]"} /><span className="hidden text-[12px] font-black leading-5 sm:inline">{clearingHistory ? "Clearing…" : "Clear history"}</span></button>
                      </div>
                    </div>
                    {(recentItems.length > 0 || recentStores.length > 0) && (
                      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 md:gap-4">
                        {[
                          ...recentItems.slice(0, 7).map((item: any) => ({ kind: "product", item, viewedAt: new Date(item.historyViewedAt || 0).getTime() })),
                          ...recentStores.slice(0, 7).map((item: any) => ({ kind: "store", item, viewedAt: new Date(item.historyViewedAt || 0).getTime() })),
                        ].sort((a: any, b: any) => b.viewedAt - a.viewedAt).slice(0, 14).map(({ kind, item }: any) => kind === "product" ? (() => {
                          const isVideo = String(item.mediaType || "").toUpperCase() === "VIDEO";
                          const isService = String(item.listingType || "").toUpperCase() === "SERVICE";
                          const href = "/" + (isService ? "service" : "product") + "/" + item.productSlug;
                          const image = item.thumbnailUrl || item.mediaUrl;
                          return (
                            <Link key={"product-" + item.id} href={href} aria-label={item.productTitle || "Recently viewed listing"} className="group relative block aspect-square min-w-0 w-full">
                              <button type="button" aria-label="Remove from shopping history" title="Remove from history" disabled={removingHistoryKeys.includes("product-" + item.id)} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void removeHistoryItem("product", item); }} className="absolute left-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white shadow-sm transition hover:bg-black disabled:opacity-50"><X size={14} /></button>
                              <div className="h-full w-full overflow-hidden rounded-[22px] bg-[#eeeeeb]">
                                {isVideo && item.mediaUrl ? <video src={item.mediaUrl} poster={item.thumbnailUrl || undefined} muted loop playsInline className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : image ? <img src={image} alt={item.productTitle || "Recently viewed listing"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#999]">No media</div>}
                              </div>
                            </Link>
                          );
                        })() : (
                          <Link key={"store-" + item.id} href={"/stores/" + item.username} className="group relative flex aspect-square min-w-0 w-full flex-col items-center justify-center rounded-[22px] border border-black/[.05] bg-[#f8f8f6] p-3 text-center transition hover:border-black/10 hover:bg-white">
                            <button type="button" aria-label="Remove store from shopping history" title="Remove from history" disabled={removingHistoryKeys.includes("store-" + item.id)} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void removeHistoryItem("store", item); }} className="absolute left-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white shadow-sm transition hover:bg-black disabled:opacity-50"><X size={14} /></button>
                            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#ecece8] sm:h-16 sm:w-16">
                              {item.profileImageUrl ? <img src={item.profileImageUrl} alt={"@" + item.username} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <span className="flex h-full w-full items-center justify-center font-black text-[#777]">@</span>}
                            </span>
                            <b className="mt-3 max-w-full truncate text-xs font-extrabold text-[#171717]">@{item.username}</b>
                            <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black text-[#555] transition group-hover:text-black">Visit again <ArrowRight size={11} /></span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                <section className="rounded-[30px] border border-[#e7edf4] bg-gradient-to-br from-[#f4f9ff] via-white to-[#f7f5ff] p-5 md:p-7" aria-label="Trending products">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="eyebrow plain"><TrendingUp size={13} /> Popular right now</p>
                      <h2 className="mt-2 text-2xl font-black tracking-[-.045em] md:text-3xl">Trending products</h2>
                      <p className="mt-2 text-sm text-[#777]">Products shoppers are liking and saving across SokoLink.</p>
                    </div>
                    <Link href="/trending" className="inline-flex w-fit items-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-black text-white transition hover:bg-black/80">Explore trending <ArrowRight size={14} /></Link>
                  </div>
                  {filteredTrendingProducts.length > 0 ? (
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
                      {filteredTrendingProducts.slice(0, 5).map((product: any) => (
                        <div key={product.id} className="min-w-0">
                          <ProductCard p={product} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-[#dfe6ee] bg-white/70 px-5 py-8 text-center text-sm font-semibold text-[#888]">Trending products will appear here as shoppers interact with listings.</div>
                  )}
                </section>

                <AnimatedMarketplaceBanner variant="discover" />

                <section className="rounded-[30px] border border-[#f0e6e8] bg-gradient-to-br from-[#fff8f7] via-white to-[#f7f8ff] p-5 md:p-7" aria-label="Featured products">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="eyebrow plain"><Sparkles size={13} /> Handpicked for you</p>
                      <h2 className="mt-2 text-2xl font-black tracking-[-.045em] md:text-3xl">Featured products</h2>
                      <p className="mt-2 text-sm text-[#777]">Standout finds from shops across SokoLink.</p>
                    </div>
                    <Link href="/featured" className="inline-flex w-fit items-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-black text-white transition hover:bg-black/80">Explore featured <ArrowRight size={14} /></Link>
                  </div>
                  {featuredHomeProducts.length > 0 ? (
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
                      {featuredHomeProducts.map((product: any) => (
                        <div key={product.id} className="min-w-0">
                          <ProductCard p={product} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-[#e8dfe2] bg-white/70 px-5 py-8 text-center text-sm font-semibold text-[#888]">Fresh marketplace picks selected to complete this collection.</div>
                  )}
                </section>

                <AnimatedMarketplaceBanner variant="sell" />

                <section id="shop-all">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div><p className="eyebrow plain"><Grid2X2 size={13} /> Fresh marketplace</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">Find something made for you.</h2></div>
                    <span className="text-xs font-bold text-[#999]">Products & services</span>
                  </div>
                  <div className="mt-6"><ProductMasonry q="" tag="" stores={filteredFeaturedStores} wishlistProducts={wishlistProducts} categorySections={categorySections} /></div>
                </section>
              </div>
            )}

            {active === "trending" && (
              <section>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div><p className="eyebrow plain"><TrendingUp size={13} /> Trending now</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">What shoppers are saving and loving.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">Ranked from marketplace activity — likes plus saves — so the products people actually respond to rise naturally.</p></div>
                  <div className="flex shrink-0 items-center gap-3 self-start sm:self-auto">
                        <button type="button" onClick={clearRecentHistory} disabled={clearingHistory} aria-label={clearingHistory ? "Clearing history" : "Clear history"} title={clearingHistory ? "Clearing history" : "Clear history"} className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full border border-black/10 text-[#666] transition hover:border-black hover:text-black disabled:cursor-wait disabled:opacity-70 sm:h-auto sm:w-auto sm:px-4 sm:py-2"><Trash2 size={17} aria-hidden="true" className={clearingHistory ? "animate-bounce text-black" : "transition-transform duration-200 hover:rotate-[-8deg]"} /><span className="hidden text-[12px] font-black leading-5 sm:inline">{clearingHistory ? "Clearing…" : "Clear history"}</span></button>
                      </div>
                </div>
                {(filteredTrendingProducts.length > 0 || trendingStores.length > 0) ? (
                  <div className="product-feed-layout mt-6">
                    {filteredTrendingProducts.map((product: any, index: number) => {
                      const shouldInsertStores = index === 3 || (index > 3 && (index - 3) % 12 === 0);
                      const batchIndex = Math.floor((index - 3) / 12);
                      return (
                        <Fragment key={product.id}>
                          <div className="product-feed-item min-w-0">
                            <ProductCard p={product} />
                          </div>
                          {shouldInsertStores && batchIndex >= 0 && trendingStores.length > batchIndex * 4 && (
                            <div key={"trending-store-section-" + batchIndex} className="product-store-interlude-row">
                              <StoreInlineSection stores={trendingStores} batchIndex={batchIndex} variant="trending" />
                            </div>
                          )}
                        </Fragment>
                      );
                    })}
                    {Array.from({ length: Math.ceil(trendingStores.length / 4) }, (_, batchIndex) => batchIndex).filter((batchIndex) => {
                      const insertionIndex = batchIndex === 0 ? 3 : 3 + batchIndex * 12;
                      return insertionIndex >= filteredTrendingProducts.length;
                    }).map((batchIndex) => (
                      <div key={"trending-store-section-tail-" + batchIndex} className="product-store-interlude-row">
                        <StoreInlineSection stores={trendingStores} batchIndex={batchIndex} variant="trending" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[26px] border border-dashed border-black/10 bg-[#fafaf8] p-10 text-center text-sm font-bold text-[#777]">Trending picks will appear as shoppers interact with listings.</div>
                )}
              </section>
            )}

            {active === "featured" && (
              <div className="space-y-12">
                <section>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="eyebrow plain"><BadgeCheck size={13} /> Featured stores</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">Shops worth discovering.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">Featured store placement is reserved for approved marketplace growth through Verified or Pro.</p></div>
                    <Link href="/stores" className="inline-flex items-center gap-2 text-xs font-black">View all stores <ArrowRight size={14} /> </Link>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                    {filteredFeaturedStores.map((entry: any) => <StoreCard key={entry.store.id} entry={entry} />)}
                  </div>
                </section>

                <section>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow plain"><Sparkles size={13} /> Featured products</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">Put the spotlight on.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">Only listings with an approved promotion running now appear here.</p></div></div>
                  {filteredFeaturedProducts.length > 0 ? (
                    <div className="mt-6 columns-2 gap-3 sm:columns-2 sm:gap-5 md:columns-3 lg:columns-4">
                      {filteredFeaturedProducts.map((product: any) => (
                        <div key={product.id} className="mb-7 break-inside-avoid sm:mb-9">
                          <ProductCard p={product} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-[26px] border border-dashed border-black/10 bg-[#fafaf8] p-10 text-center text-sm font-bold text-[#777]">Featured products appear here when a seller has an active promotion.</div>
                  )}
                </section>
              </div>
            )}
        </>
      </div>
    </div>
  );
}
