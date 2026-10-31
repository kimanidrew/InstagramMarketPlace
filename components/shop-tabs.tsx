"use client";

import Link from "next/link";
import React, { Fragment, useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Bookmark, ChevronLeft, ChevronRight, Compass, Crown, Grid2X2, Heart, Megaphone, Sparkles, Store, Trash2, TrendingUp, X } from "lucide-react";
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
  const visual = slide.type === "product" ? (
    <div className="shop-promo-product-visual"><img src={slide.product.thumbnailUrl || slide.product.mediaUrl} alt={slide.product.productTitle || "Promoted listing"} /><span className="shop-promo-product-sticker">IN THE SPOTLIGHT</span></div>
  ) : (
    <div className="shop-promo-ad-art" aria-hidden="true"><span className="promo-art-card promo-art-card-a">DISCOVER</span><span className="promo-art-card promo-art-card-b">LOCAL FINDS</span><span className="promo-art-spark">✳</span><span className="promo-art-ring" /></div>
  );
  const slideContent = <><div className="relative z-10 flex flex-col justify-center p-6 sm:p-9 md:p-10">{copy}</div>{visual}</>;
  if (slide.type === "product") return measure ? <div className={className}>{slideContent}</div> : <Link href={"/" + (String(slide.product.listingType || "").toUpperCase() === "SERVICE" ? "service" : "product") + "/" + slide.product.productSlug} key={slide.key} className={"shop-promo-slide shop-promo-enter shop-promo-product " + className.split(" ").slice(3).join(" ")} onClick={() => onVisit?.(slide.key)}>{slideContent}</Link>;
  return <div key={slide.key} className={measure ? className : "shop-promo-slide shop-promo-enter shop-promo-ad group grid overflow-hidden md:grid-cols-[1fr_.85fr]"}>{slideContent}</div>;
}

function ShopPromoCarousel({ stores, products }: { stores: any[]; products: any[] }) {
  const promotedStores = stores.filter(({ store }) => store.paidPromotionActive);
  const promotedProducts = products.filter((product) => product.boostUntil && new Date(product.boostUntil).getTime() > Date.now());
  // Always keep a shop in the carousel, even when no paid shop campaign is active.
  const fallbackShop = promotedStores.length ? null : stores.find(({ store, posts }) => store && (store.profileImageUrl || posts?.length)) || stores[0] || null;
  const shopSlides: PromoSlide[] = promotedStores.length
    ? promotedStores.map(({ store, posts }) => ({ type: "store" as const, key: "store-" + store.id, store, posts }))
    : fallbackShop
      ? [{ type: "store" as const, key: "shop-spotlight-" + fallbackShop.store.id, store: fallbackShop.store, posts: fallbackShop.posts || [] }]
      : [];
  const allSlides: PromoSlide[] = [
    ...shopSlides,
    ...promotedProducts.map((product) => ({ type: "product" as const, key: "product-" + product.id, product })),
  ];
  // Keep the marketplace spotlight art only if no shop or product is available.
  const promotionSlides: PromoSlide[] = allSlides.length ? allSlides : [{ type: "ad", key: "sokolink-promo" }];
  const [seenPromoKeys, setSeenPromoKeys] = useState<string[]>([]);
  const seenPromoKeysRef = React.useRef<string[]>([]);
  const [index, setIndex] = useState(0);
  const [bannerHeight, setBannerHeight] = useState(300);
  const measureRef = React.useRef<HTMLDivElement>(null);
  const visitorId = analyticsVisitorId();
  const progressKey = "imarket_promo_view_cycle_" + visitorId;
  const cycleStartKey = progressKey + "_started";

  useEffect(() => {
    let cancelled = false;
    try {
      const stored = JSON.parse(window.localStorage.getItem(progressKey) || "[]");
      const validStored = Array.isArray(stored)
        ? stored.filter((key: unknown): key is string => typeof key === "string" && allSlides.some((slide) => slide.key === key))
        : [];
      // On the first cycle, include earlier detail-page views too.
      let cycleStart = Number(window.localStorage.getItem(cycleStartKey) || 1);
      if (!Number.isFinite(cycleStart) || cycleStart <= 0) {
        cycleStart = 1;
      }
      if (!window.localStorage.getItem(cycleStartKey)) {
        window.localStorage.setItem(cycleStartKey, String(cycleStart));
      }
      fetch("/api/shopper/promotion-views?visitorId=" + encodeURIComponent(visitorId) + "&since=" + encodeURIComponent(String(cycleStart)), { cache: "no-store" })
        .then((response) => response.ok ? response.json() : { storeConnectionIds: [], productPostIds: [] })
        .then((data) => {
          if (cancelled) return;
          const viewedKeys = allSlides.filter((slide) =>
            slide.type === "store"
              ? Array.isArray(data.storeConnectionIds) && data.storeConnectionIds.includes(slide.store.id)
              : slide.type === "product" && Array.isArray(data.productPostIds) && data.productPostIds.includes(slide.product.id)
          ).map((slide) => slide.key);
          const combined = [...new Set([...validStored, ...viewedKeys])];
          const cycleComplete = allSlides.length > 0 && allSlides.every((slide) => combined.includes(slide.key));
          if (cycleComplete) {
            const nextStart = Date.now();
            window.localStorage.setItem(progressKey, "[]");
            window.localStorage.setItem(cycleStartKey, String(nextStart));
            seenPromoKeysRef.current = [];
            setSeenPromoKeys([]);
          } else {
            window.localStorage.setItem(progressKey, JSON.stringify(combined));
            seenPromoKeysRef.current = combined;
            setSeenPromoKeys(combined);
          }
        })
        .catch(() => { if (!cancelled) { seenPromoKeysRef.current = validStored; setSeenPromoKeys(validStored); } });
    } catch {
      seenPromoKeysRef.current = [];
      setSeenPromoKeys([]);
    }
    return () => { cancelled = true; };
  // Refresh only when the visitor or active promotion inventory changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressKey, cycleStartKey, visitorId, allSlides.map((slide) => slide.key).join("|")]);

  const remainingSlides = promotionSlides.filter((slide) => !seenPromoKeys.includes(slide.key));
  // Keep at least one shop slide visible even when every shop promotion has already been seen.
  const visibleRemaining = shopSlides.length && !remainingSlides.some((slide) => slide.type === "store")
    ? [...remainingSlides, shopSlides[0]]
    : remainingSlides;
  const slides = visibleRemaining.length ? visibleRemaining : promotionSlides;

  useEffect(() => {
    setIndex((current) => slides.length ? current % slides.length : 0);
  }, [slides.length, slides.map((slide) => slide.key).join("|")]);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [slides.length, slides.map((slide) => slide.key).join("|")]);

  useEffect(() => {
    const measure = () => {
      const nodes = measureRef.current?.querySelectorAll<HTMLElement>(".shop-promo-measure-slide");
      if (!nodes?.length) return;
      const max = Math.ceil(Math.max(...Array.from(nodes, (node) => node.getBoundingClientRect().height)));
      if (max > 0) setBannerHeight(max);
    };
    measure();
    const observer = measureRef.current ? new ResizeObserver(measure) : null;
    if (measureRef.current && observer) observer.observe(measureRef.current);
    window.addEventListener("resize", measure);
    const images = measureRef.current?.querySelectorAll("img") || [];
    images.forEach((img) => img.addEventListener("load", measure));
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      images.forEach((img) => img.removeEventListener("load", measure));
    };
  }, [slides.map((slide) => slide.key).join("|"), stores, products]);

  if (!slides.length) return null;
  const activeSlide = slides[index] || slides[0];
  const markImpression = (slide: PromoSlide) => {
    if (slide.type === "ad" || seenPromoKeysRef.current.includes(slide.key)) return;
    const nextSeen = [...new Set([...seenPromoKeysRef.current, slide.key])];
    seenPromoKeysRef.current = nextSeen;
    const cycleComplete = allSlides.length > 0 && allSlides.every((item) => nextSeen.includes(item.key));
    if (cycleComplete) {
      window.localStorage.setItem(progressKey, "[]");
      window.localStorage.setItem(cycleStartKey, String(Date.now()));
      seenPromoKeysRef.current = [];
    } else {
      window.localStorage.setItem(progressKey, JSON.stringify(nextSeen));
    }
  };
  const previous = () => setIndex((current) => (current - 1 + slides.length) % slides.length);
  const next = () => setIndex((current) => (current + 1) % slides.length);

  return (
    <section className="shop-promo-carousel relative mb-5 overflow-hidden rounded-[28px] sm:mb-7" style={{ height: bannerHeight, minHeight: bannerHeight }} aria-label="Promoted shops, products and marketplace ads">
      <div className="shop-promo-active" style={{ height: bannerHeight }}>
        <PromoSlideContent key={activeSlide.key} slide={activeSlide} />
        {activeSlide.type === "store" && <AnalyticsImpression key={activeSlide.key} connectionId={activeSlide.store.id} onImpression={() => markImpression(activeSlide)} />}
        {activeSlide.type === "product" && <AnalyticsImpression key={activeSlide.key} connectionId={activeSlide.product.connectionId} postId={activeSlide.product.id} onImpression={() => markImpression(activeSlide)} />}
      </div>
      <div ref={measureRef} className="shop-promo-measurement" aria-hidden="true">
        {slides.map((slide) => <PromoSlideContent key={"measure-" + slide.key} slide={slide} measure />)}
      </div>
      {slides.length > 1 && <div className="shop-promo-controls" aria-label="Promotion carousel controls"><div className="shop-promo-dots" role="group" aria-label="Choose a promotion">{slides.map((slide, i) => <button key={slide.key} type="button" aria-label={"Show promotion " + (i + 1)} aria-current={i === index ? "true" : undefined} onClick={() => setIndex(i)} className={i === index ? "is-active" : ""} />)}</div><div className="flex gap-2"><button type="button" onClick={previous} aria-label="Previous promotion"><ChevronLeft size={16} /></button><button type="button" onClick={next} aria-label="Next promotion"><ChevronRight size={16} /></button></div></div>}
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

  const tabs = [
    { id: "discover" as const, label: "Discover", icon: Compass, copy: "Fresh finds & stores" },
    { id: "trending" as const, label: "Trending", icon: TrendingUp, copy: "Loved by shoppers" },
    { id: "featured" as const, label: "Featured", icon: Sparkles, copy: "Growth-powered picks" },
  ];

  const filteredTrendingProducts = trendingProducts;
  const filteredFeaturedProducts = featuredProducts;
  const filteredFeaturedStores = featuredStores;

  return (
    <div className="shop-tabs-wrap mt-0">
      <ShopPromoCarousel stores={filteredFeaturedStores} products={filteredFeaturedProducts} />
      <div className="shop-tabs flex w-full max-w-full flex-nowrap overflow-x-auto overscroll-x-contain" role="tablist" aria-label="Shop discovery">
        {tabs.map(({ id, label, icon: Icon, copy }) => {
          const selected = active === id;
          return (
            <Link
              key={id}
              href={"/shop?tab=" + id}
              role="tab"
              aria-selected={selected}
              aria-controls={"shop-tab-panel-" + id}
              className={"shop-tab shrink-0 " + (selected ? "shop-tab-active" : "")}
              onFocus={(event) => event.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })}
            >
              <span className="shop-tab-icon"><Icon size={16} /></span>
              <span className="shop-tab-copy">
                <b>{label}</b>
                <small>{copy}</small>
              </span>
              <span className="shop-tab-indicator" aria-hidden="true" />
            </Link>
          );
        })}
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
                              <button type="button" aria-label="Remove from shopping history" title="Remove from history" disabled={removingHistoryKeys.includes("product-" + item.id)} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void removeHistoryItem("product", item); }} className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white shadow-sm transition hover:bg-black disabled:opacity-50"><X size={14} /></button>
                              <div className="h-full w-full overflow-hidden rounded-[22px] bg-[#eeeeeb]">
                                {isVideo && item.mediaUrl ? <video src={item.mediaUrl} poster={item.thumbnailUrl || undefined} muted loop playsInline className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : image ? <img src={image} alt={item.productTitle || "Recently viewed listing"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#999]">No media</div>}
                              </div>
                            </Link>
                          );
                        })() : (
                          <Link key={"store-" + item.id} href={"/stores/" + item.username} className="group relative flex aspect-square min-w-0 w-full flex-col items-center justify-center rounded-[22px] border border-black/[.05] bg-[#f8f8f6] p-3 text-center transition hover:border-black/10 hover:bg-white">
                            <button type="button" aria-label="Remove store from shopping history" title="Remove from history" disabled={removingHistoryKeys.includes("store-" + item.id)} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void removeHistoryItem("store", item); }} className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white shadow-sm transition hover:bg-black disabled:opacity-50"><X size={14} /></button>
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
                        <Link href="/history" className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-black text-[#222] transition hover:border-black hover:bg-black hover:text-white">View all <ArrowRight size={14} /></Link>
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
