"use client";

import Link from "next/link";
import React, { Fragment, useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Bookmark, ChevronLeft, ChevronRight, Compass, Crown, Grid2X2, Heart, Megaphone, Sparkles, Store, TrendingUp } from "lucide-react";
import { ProductMasonry, StoreCard, StoreInlineSection } from "@/components/product-masonry";
import { ProductCard } from "@/components/product-card";
import { AnalyticsImpression } from "@/components/analytics-impression";
import { analyticsVisitorId } from "@/lib/analytics-client";

type ShopTab = "discover" | "trending" | "featured";

type PromoSlide =
  | { type: "store"; key: string; store: any; posts: any[] }
  | { type: "product"; key: string; product: any }
  | { type: "ad"; key: string };

function PromoSlideContent({ slide, measure = false }: { slide: PromoSlide; measure?: boolean }) {
  const className = "shop-promo-slide " + (measure ? "shop-promo-measure-slide " : "") + (slide.type === "store" ? "shop-promo-store" : slide.type === "product" ? "shop-promo-product" : "shop-promo-ad") + " group grid overflow-hidden " + (slide.type === "store" ? "md:grid-cols-[1.05fr_.95fr]" : slide.type === "product" ? "md:grid-cols-[.9fr_1.1fr]" : "md:grid-cols-[1fr_.85fr]");
  const copy = slide.type === "store" ? (
    <>
      <span className="shop-promo-label"><Sparkles size={11} /> Promoted shop</span>
      <h2 className="mt-4 max-w-xl text-3xl font-black leading-[.98] tracking-[-.055em] sm:text-4xl md:text-5xl">Meet <span className="text-[#d6ff63]">@{slide.store.username}</span></h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-white/70">{slide.store.biography?.trim() || "Discover the shop behind the posts and explore their latest finds."}</p>
      <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black text-black">Explore shop <ArrowRight size={14} /></span>
    </>
  ) : slide.type === "product" ? (
    <>
      <span className="shop-promo-label"><Sparkles size={11} /> Boosted listing</span>
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
  const visual = slide.type === "store" ? (
    <div className="shop-promo-store-visual relative min-h-[150px] overflow-hidden sm:min-h-[200px]">
      {slide.posts.slice(0, 3).map((post: any, i: number) => <img key={post.id} src={post.thumbnailUrl || post.mediaUrl} alt="" className={"shop-promo-float shop-promo-float-" + i} />)}
      {slide.store.profileImageUrl && <img src={slide.store.profileImageUrl} alt="" className="shop-promo-store-avatar" />}
      <span className="shop-promo-orbit" />
    </div>
  ) : slide.type === "product" ? (
    <div className="shop-promo-product-visual"><img src={slide.product.thumbnailUrl || slide.product.mediaUrl} alt={slide.product.productTitle || "Promoted listing"} /><span className="shop-promo-product-sticker">IN THE SPOTLIGHT</span></div>
  ) : (
    <div className="shop-promo-ad-art" aria-hidden="true"><span className="promo-art-card promo-art-card-a">DISCOVER</span><span className="promo-art-card promo-art-card-b">LOCAL FINDS</span><span className="promo-art-spark">✳</span><span className="promo-art-ring" /></div>
  );
  const slideContent = <><div className="relative z-10 flex flex-col justify-center p-6 sm:p-9 md:p-10">{copy}</div>{visual}</>;
  if (slide.type === "store") return measure ? <div className={className}>{slideContent}</div> : <Link href={"/store/" + slide.store.username} key={slide.key} className={"shop-promo-slide shop-promo-enter shop-promo-store " + className.split(" ").slice(3).join(" ")}>{slideContent}</Link>;
  if (slide.type === "product") return measure ? <div className={className}>{slideContent}</div> : <Link href={"/" + (String(slide.product.listingType || "").toUpperCase() === "SERVICE" ? "service" : "product") + "/" + slide.product.productSlug} key={slide.key} className={"shop-promo-slide shop-promo-enter shop-promo-product " + className.split(" ").slice(3).join(" ")}>{slideContent}</Link>;
  return <div key={slide.key} className={measure ? className : "shop-promo-slide shop-promo-enter shop-promo-ad group grid overflow-hidden md:grid-cols-[1fr_.85fr]"}>{slideContent}</div>;
}

function ShopPromoCarousel({ stores, products }: { stores: any[]; products: any[] }) {
  const promotedStores = stores.filter(({ store }) => store.paidPromotionActive).slice(0, 4);
  const promotedProducts = products.filter((product) => product.boostUntil && new Date(product.boostUntil).getTime() > Date.now()).slice(0, 4);
  const slides: PromoSlide[] = [
    ...promotedStores.map(({ store, posts }) => ({ type: "store" as const, key: "store-" + store.id, store, posts })),
    ...promotedProducts.map((product) => ({ type: "product" as const, key: "product-" + product.id, product })),
    { type: "ad", key: "sokolink-promo" },
  ];
  const [index, setIndex] = useState(0);
  const [bannerHeight, setBannerHeight] = useState(300);
  const measureRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);
  useEffect(() => { setIndex((current) => Math.min(current, slides.length - 1)); }, [slides.length]);
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
  }, [slides.length, stores, products]);
  if (!slides.length) return null;
  const activeSlide = slides[index] || slides[0];
  const previous = () => setIndex((current) => (current - 1 + slides.length) % slides.length);
  const next = () => setIndex((current) => (current + 1) % slides.length);

  return (
    <section className="shop-promo-carousel relative mb-5 overflow-hidden rounded-[28px] sm:mb-7" style={{ height: bannerHeight, minHeight: bannerHeight }} aria-label="Promoted shops, products and marketplace ads">
      <div className="shop-promo-active" style={{ height: bannerHeight }}>
        <PromoSlideContent slide={activeSlide} />
      </div>
      <div ref={measureRef} className="shop-promo-measurement" aria-hidden="true">
        {slides.map((slide) => <PromoSlideContent key={"measure-" + slide.key} slide={slide} measure />)}
      </div>
      {slides.length > 1 && <div className="shop-promo-controls"><div className="shop-promo-dots">{slides.map((slide, i) => <button key={slide.key} type="button" aria-label={"Show promotion " + (i + 1)} aria-current={i === index} onClick={() => setIndex(i)} className={i === index ? "is-active" : ""} />)}</div><div className="flex gap-2"><button type="button" onClick={previous} aria-label="Previous promotion"><ChevronLeft size={16} /></button><button type="button" onClick={next} aria-label="Next promotion"><ChevronRight size={16} /></button></div></div>}
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
  now,
}: {
  initialTab?: ShopTab;
  wishlistProducts?: any[];
  recentlyViewedProducts?: any[];
  featuredStores?: any[];
  trendingProducts?: any[];
  trendingStores?: any[];
  featuredProducts?: any[];
  now: string;
}) {
  const [active, setActive] = useState<ShopTab>(initialTab);
  useEffect(() => {
    setActive(initialTab);
  }, [initialTab]);
  const [recentItems, setRecentItems] = useState(recentlyViewedProducts);
  const [recentStores, setRecentStores] = useState<any[]>([]);
  const [clearingHistory, setClearingHistory] = useState(false);
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
                      <button type="button" onClick={clearRecentHistory} disabled={clearingHistory} className="inline-flex shrink-0 items-center justify-center self-start rounded-full border border-black/10 px-4 py-2 text-[12px] font-black leading-5 text-[#666] transition hover:border-black hover:text-black disabled:opacity-50 sm:self-auto">{clearingHistory ? "Clearing…" : "Clear history"}</button>
                    </div>
                    {(recentItems.length > 0 || recentStores.length > 0) && (
                      <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
                        {[
                          ...recentItems.slice(0, 7).map((item: any) => ({ kind: "product", item })),
                          ...recentStores.slice(0, 7).map((item: any) => ({ kind: "store", item })),
                        ].map(({ kind, item }: any) => kind === "product" ? (() => {
                          const isVideo = String(item.mediaType || "").toUpperCase() === "VIDEO";
                          const isService = String(item.listingType || "").toUpperCase() === "SERVICE";
                          const href = "/" + (isService ? "service" : "product") + "/" + item.productSlug;
                          const image = item.thumbnailUrl || item.mediaUrl;
                          return (
                            <Link key={"product-" + item.id} href={href} aria-label={item.productTitle || "Recently viewed listing"} className="group block w-[112px] shrink-0 sm:w-[136px]">
                              <div className="aspect-square overflow-hidden rounded-[22px] bg-[#eeeeeb]">
                                {isVideo && item.mediaUrl ? <video src={item.mediaUrl} poster={item.thumbnailUrl || undefined} muted loop playsInline className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : image ? <img src={image} alt={item.productTitle || "Recently viewed listing"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#999]">No media</div>}
                              </div>
                            </Link>
                          );
                        })() : (
                          <Link key={"store-" + item.id} href={"/store/" + item.username} className="group flex w-[112px] shrink-0 flex-col items-center rounded-[22px] border border-black/[.05] bg-[#f8f8f6] p-3 text-center transition hover:border-black/10 hover:bg-white sm:w-[136px]">
                            <span className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#ecece8] sm:h-[76px] sm:w-[76px]">
                              {item.profileImageUrl ? <img src={item.profileImageUrl} alt={"@" + item.username} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <span className="flex h-full w-full items-center justify-center font-black text-[#777]">@</span>}
                            </span>
                            <b className="mt-3 max-w-full truncate text-xs font-extrabold text-[#171717]">@{item.username}</b>
                            <span className="mt-1 text-[10px] font-semibold text-[#888]">{item.listingCount} listings</span>
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
                  <div className="mt-6"><ProductMasonry q="" tag="" stores={filteredFeaturedStores} wishlistProducts={wishlistProducts} /></div>
                </section>
              </div>
            )}

            {active === "trending" && (
              <section>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div><p className="eyebrow plain"><TrendingUp size={13} /> Trending now</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">What shoppers are saving and loving.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">Ranked from marketplace activity — likes plus saves — so the products people actually respond to rise naturally.</p></div>
                  <div className="flex items-center gap-2 rounded-full border border-black/5 bg-[#f7f7f4] px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] text-[#777]"><Heart size={12} /> Likes <span>+</span> <Bookmark size={12} /> Saves</div>
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
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow plain"><Sparkles size={13} /> Featured products</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">Put the spotlight on.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">Only listings with an approved Boost running now appear here.</p></div><span className="inline-flex items-center gap-2 self-start rounded-full bg-black px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] text-white sm:self-auto"><Sparkles size={12} /> Boosted now</span></div>
                  {filteredFeaturedProducts.length > 0 ? (
                    <div className="mt-6 columns-2 gap-3 sm:columns-2 sm:gap-5 md:columns-3 lg:columns-4">
                      {filteredFeaturedProducts.map((product: any) => (
                        <div key={product.id} className="mb-7 break-inside-avoid sm:mb-9">
                          <ProductCard p={product} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-[26px] border border-dashed border-black/10 bg-[#fafaf8] p-10 text-center text-sm font-bold text-[#777]">Featured products appear here when a seller has an approved Boost running.</div>
                  )}
                </section>
              </div>
            )}
        </>
      </div>
    </div>
  );
}
