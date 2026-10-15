"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Bookmark, ChevronLeft, ChevronRight, Compass, Crown, Grid2X2, Heart, Megaphone, Sparkles, Store, TrendingUp } from "lucide-react";
import { ProductMasonry } from "@/components/product-masonry";
import { ProductCard } from "@/components/product-card";
import { AnalyticsImpression } from "@/components/analytics-impression";
import { recordAnalytics } from "@/lib/analytics-client";

type ShopTab = "discover" | "trending" | "featured";

type PromoSlide =
  | { type: "store"; key: string; store: any; posts: any[] }
  | { type: "product"; key: string; product: any }
  | { type: "ad"; key: string };

function ShopPromoCarousel({ stores, products }: { stores: any[]; products: any[] }) {
  const promotedStores = stores.filter(({ store }) => store.paidPromotionActive).slice(0, 4);
  const promotedProducts = products.filter((product) => product.boostUntil && new Date(product.boostUntil).getTime() > Date.now()).slice(0, 4);
  const slides: PromoSlide[] = [
    ...promotedStores.map(({ store, posts }) => ({ type: "store" as const, key: "store-" + store.id, store, posts })),
    ...promotedProducts.map((product) => ({ type: "product" as const, key: "product-" + product.id, product })),
    { type: "ad", key: "sokolink-promo" },
  ];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);
  useEffect(() => { setIndex((current) => Math.min(current, slides.length - 1)); }, [slides.length]);
  if (!slides.length) return null;
  const activeSlide = slides[index] || slides[0];
  const previous = () => setIndex((current) => (current - 1 + slides.length) % slides.length);
  const next = () => setIndex((current) => (current + 1) % slides.length);

  return (
    <section className="shop-promo-carousel relative mb-5 overflow-hidden rounded-[28px] sm:mb-7" aria-label="Promoted shops, products and marketplace ads">
      {activeSlide.type === "store" && (
        <Link href={"/store/" + activeSlide.store.username} key={activeSlide.key} className="shop-promo-slide shop-promo-enter shop-promo-store group grid min-h-[230px] overflow-hidden sm:min-h-[260px] md:grid-cols-[1.05fr_.95fr]">
          <div className="relative z-10 flex flex-col justify-center p-6 sm:p-9 md:p-10">
            <span className="shop-promo-label"><Sparkles size={11} /> Promoted shop</span>
            <h2 className="mt-4 max-w-xl text-3xl font-black leading-[.98] tracking-[-.055em] sm:text-4xl md:text-5xl">Meet <span className="text-[#d6ff63]">@{activeSlide.store.username}</span></h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/70">{activeSlide.store.biography?.trim() || "Discover the shop behind the posts and explore their latest finds."}</p>
            <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black text-black">Explore shop <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
          </div>
          <div className="shop-promo-store-visual relative min-h-[150px] overflow-hidden sm:min-h-[200px]">
            {activeSlide.posts.slice(0, 3).map((post: any, i: number) => <img key={post.id} src={post.thumbnailUrl || post.mediaUrl} alt="" className={"shop-promo-float shop-promo-float-" + i} />)}
            {activeSlide.store.profileImageUrl && <img src={activeSlide.store.profileImageUrl} alt="" className="shop-promo-store-avatar" />}
            <span className="shop-promo-orbit" />
          </div>
        </Link>
      )}
      {activeSlide.type === "product" && (
        <Link href={"/" + (String(activeSlide.product.listingType || "").toUpperCase() === "SERVICE" ? "service" : "product") + "/" + activeSlide.product.productSlug} key={activeSlide.key} className="shop-promo-slide shop-promo-enter shop-promo-product group grid min-h-[230px] overflow-hidden sm:min-h-[260px] md:grid-cols-[.9fr_1.1fr]">
          <div className="relative z-10 flex flex-col justify-center p-6 sm:p-9 md:p-10">
            <span className="shop-promo-label"><Sparkles size={11} /> Boosted listing</span>
            <h2 className="mt-4 max-w-lg text-3xl font-black leading-[.98] tracking-[-.055em] sm:text-4xl md:text-5xl">{activeSlide.product.productTitle || "A find worth sharing."}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-black/60">Handpicked for a closer look. Discover the details, then shop directly from the seller.</p>
            <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-black text-white">Discover listing <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
          </div>
          <div className="shop-promo-product-visual">
            <img src={activeSlide.product.thumbnailUrl || activeSlide.product.mediaUrl} alt={activeSlide.product.productTitle || "Promoted listing"} />
            <span className="shop-promo-product-sticker">IN THE SPOTLIGHT</span>
          </div>
        </Link>
      )}
      {activeSlide.type === "ad" && (
        <div key={activeSlide.key} className="shop-promo-slide shop-promo-enter shop-promo-ad grid min-h-[230px] overflow-hidden sm:min-h-[260px] md:grid-cols-[1fr_.85fr]">
          <div className="relative z-10 flex flex-col justify-center p-6 sm:p-9 md:p-10">
            <span className="shop-promo-label"><Megaphone size={11} /> Marketplace spotlight · Ad</span>
            <h2 className="mt-4 max-w-xl text-3xl font-black leading-[.98] tracking-[-.055em] sm:text-4xl md:text-5xl">Your next great find <span className="text-[#d6ff63]">starts here.</span></h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/70">Meet independent sellers, uncover fresh finds and shop from the people behind the posts.</p>
            <Link href="/stores" className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black text-black">Explore all shops <ArrowRight size={14} /></Link>
          </div>
          <div className="shop-promo-ad-art" aria-hidden="true"><span className="promo-art-card promo-art-card-a">DISCOVER</span><span className="promo-art-card promo-art-card-b">LOCAL FINDS</span><span className="promo-art-spark">✳</span><span className="promo-art-ring" /></div>
        </div>
      )}
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
  featuredProducts = [],
  now,
}: {
  initialTab?: ShopTab;
  wishlistProducts?: any[];
  recentlyViewedProducts?: any[];
  featuredStores?: any[];
  trendingProducts?: any[];
  featuredProducts?: any[];
  now: string;
}) {
  const [active, setActive] = useState<ShopTab>(initialTab);
  useEffect(() => {
    setActive(initialTab);
  }, [initialTab]);
  const [recentItems, setRecentItems] = useState(recentlyViewedProducts);
  const [clearingHistory, setClearingHistory] = useState(false);
  const clearRecentHistory = async () => {
    setClearingHistory(true);
    try {
      const response = await fetch("/api/shopper/history", { method: "DELETE" });
      if (response.ok) setRecentItems([]);
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
                <section>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="eyebrow plain"><Store size={13} /> Discover stores</p>
                      <h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">Meet the shops behind the posts.</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">Explore Instagram businesses, creators and local brands with products and services on the marketplace.</p>
                    </div>
                    <Link href="/stores" className="inline-flex items-center gap-2 text-[12px] leading-5 font-black">View all stores <ArrowRight size={14} /></Link>
                  </div>
                  <div className="discover-stores-list mt-7 grid gap-5 lg:grid-cols-2">
                    {featuredStores.filter(({ posts }: any) => posts?.length > 0).slice(0, 5).map(({ store, posts }: any) => {
                      const isVerified = Boolean(store.verifiedAt && (!store.verifiedUntil || new Date(store.verifiedUntil) > currentNow));
                      const isPro = Boolean(store.proUntil && new Date(store.proUntil) > currentNow);
                      return (
                        <article key={store.id} className="discover-store-card group relative min-w-0 overflow-hidden rounded-[24px] border border-black/[.06] bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-black/10 hover:shadow-[0_16px_38px_rgba(0,0,0,.07)] sm:p-5">
                          <AnalyticsImpression connectionId={store.id} />
                          <Link href={"/store/" + store.username} onClick={() => recordAnalytics({ connectionId: store.id, type: "CLICK" })} className="flex h-full flex-col items-center text-center">
                            <div className="discover-store-avatar relative mb-3 h-24 w-24 shrink-0 overflow-hidden rounded-full bg-[#f1f1ed] p-[3px] sm:h-28 sm:w-28">
                              <div className="h-full w-full overflow-hidden rounded-full bg-white">
                                {store.profileImageUrl ? (
                                  <img src={store.profileImageUrl} alt={"@" + store.username} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[#777]">@</div>
                                )}
                              </div>
                              {isVerified && <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white text-blue-600" title="Verified shop" aria-label="Verified shop"><BadgeCheck size={19} fill="currentColor" className="text-white" /></span>}
                            </div>
                            <div className="flex max-w-full items-center justify-center gap-1.5">
                              <b className="max-w-full truncate text-sm font-extrabold tracking-[-.02em] text-[#171717] sm:text-base">@{store.username}</b>
                              {isPro && <Crown size={14} className="shrink-0 text-amber-500" aria-label="Pro Seller" />}
                            </div>
                            <span className="mt-1 text-[10px] font-semibold tracking-wide text-[#888]">Instagram shop</span>
                            {store.paidPromotionActive && <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#f1f5e8] px-2.5 py-1 text-[9px] font-extrabold text-[#536b27]"><Sparkles size={10} /> Promoted</span>}
                            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f2] px-4 py-2 text-[11px] font-extrabold text-[#222] transition group-hover:bg-black group-hover:text-white">
                              Visit shop <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                            </span>
                          </Link>
                        </article>
                      );
                    })}
                    {featuredStores.filter(({ posts }: any) => posts?.length > 0).length === 0 && (
                      <Link href="/stores" className="col-span-full rounded-[26px] border border-dashed border-black/10 bg-[#fafaf8] p-8 text-center">
                        <Store className="mx-auto" size={20} />
                        <b className="mt-3 block text-sm">New shops are on the way</b>
                        <span className="mt-1 block text-xs text-[#888]">Check back soon for more stores and their latest products.</span>
                      </Link>
                    )}
                  </div>
                </section>

                {recentItems.length > 0 && (
                  <section className="rounded-[30px] border border-black/5 bg-white p-5 md:p-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="eyebrow plain"><Sparkles size={13} /> Back on Your Shopping List</p>
                        <h2 className="mt-2 text-2xl font-black tracking-[-.04em] md:text-3xl">Pick Up Where You Left Off</h2>
                        <p className="mt-2 text-sm text-[#777]">Revisit the products and services you recently checked out.</p>
                      </div>
                      <button type="button" onClick={clearRecentHistory} disabled={clearingHistory} className="inline-flex shrink-0 items-center justify-center self-start rounded-full border border-black/10 px-4 py-2 text-[12px] font-black leading-5 text-[#666] transition hover:border-black hover:text-black disabled:opacity-50 sm:self-auto">{clearingHistory ? "Clearing…" : "Clear history"}</button>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-7">
                      {recentItems.slice(0, 7).map((x: any) => {
                        const isVideo = String(x.mediaType || "").toUpperCase() === "VIDEO";
                        const isService = String(x.listingType || "").toUpperCase() === "SERVICE";
                        const href = "/" + (isService ? "service" : "product") + "/" + x.productSlug;
                        const image = x.thumbnailUrl || x.mediaUrl;
                        return (
                          <Link key={x.id} href={href} aria-label={x.productTitle || "Recently viewed listing"} className="group block aspect-square overflow-hidden rounded-[22px] bg-[#eeeeeb]">
                            {isVideo && x.mediaUrl ? (
                              <video src={x.mediaUrl} poster={x.thumbnailUrl || undefined} muted loop playsInline className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                            ) : image ? (
                              <img src={image} alt={x.productTitle || "Recently viewed listing"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#999]">No media</div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                )}

                {wishlistProducts.length > 0 && (
                  <section className="rounded-[30px] border border-black/5 bg-[#f7f7f4] p-5 md:p-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="eyebrow plain"><Bookmark size={13} /> Saved for later</p>
                        <h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">Still loving these?</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">Your saved products and services are ready whenever you are.</p>
                      </div>
                      <Link href="/wishlist" className="saved-for-later-link group inline-flex shrink-0 items-center gap-2 text-xs font-black leading-5">View full wishlist <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></Link>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-7">
                      {wishlistProducts.slice(0, 7).map((x: any) => {
                        const isVideo = String(x.mediaType || "").toUpperCase() === "VIDEO";
                        const isService = String(x.listingType || "").toUpperCase() === "SERVICE";
                        const href = "/" + (isService ? "service" : "product") + "/" + x.productSlug;
                        const image = x.mediaUrl || x.thumbnailUrl;
                        return (
                          <Link key={x.id} href={href} aria-label={x.productTitle || "Saved listing"} className="group block aspect-square overflow-hidden rounded-[22px] bg-[#eeeeeb]">
                            {isVideo && x.mediaUrl ? (
                              <video src={x.mediaUrl} poster={x.thumbnailUrl || undefined} muted loop autoPlay playsInline className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                            ) : image ? (
                              <img src={image} alt={x.productTitle || "Saved listing"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#999]">No media</div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                )}

                <section id="shop-all">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div><p className="eyebrow plain"><Grid2X2 size={13} /> Fresh marketplace</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">Find something made for you.</h2></div>
                    <span className="text-xs font-bold text-[#999]">Products & services</span>
                  </div>
                  <div className="mt-6"><ProductMasonry q="" tag="" /></div>
                </section>
              </div>
            )}

            {active === "trending" && (
              <section>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div><p className="eyebrow plain"><TrendingUp size={13} /> Trending now</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">What shoppers are saving and loving.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">Ranked from marketplace activity — likes plus saves — so the products people actually respond to rise naturally.</p></div>
                  <div className="flex items-center gap-2 rounded-full border border-black/5 bg-[#f7f7f4] px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] text-[#777]"><Heart size={12} /> Likes <span>+</span> <Bookmark size={12} /> Saves</div>
                </div>
                {filteredTrendingProducts.length > 0 ? (
                  <div className="mt-6 columns-2 gap-3 sm:columns-2 sm:gap-5 md:columns-3 lg:columns-4">
                    {filteredTrendingProducts.map((product: any) => (
                      <div key={product.id} className="mb-7 min-w-0 break-inside-avoid sm:mb-9">
                        <ProductCard p={product} />
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
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                    {filteredFeaturedStores.map(({ store, posts }: any) => (
                      <Link key={store.id} href={"/store/" + store.username} className="group relative overflow-hidden rounded-[26px] border border-black/5 bg-[#f5f5f1] p-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(0,0,0,.09)]">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded-full bg-white ring-4 ring-white shadow-sm">{store.profileImageUrl ? <img src={store.profileImageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs font-black">@</div>}</div>
                          <div className="min-w-0"><div className="flex items-center gap-1.5"><b className="truncate text-sm">@{store.username}</b><BadgeCheck size={14} className="shrink-0" /></div><p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#999]">{posts.length} featured listings</p></div>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-[10px] font-black uppercase tracking-[.12em] text-[#777]"><span>Growth member</span><ArrowRight size={13} className="transition-transform group-hover:translate-x-1" /></div>
                      </Link>
                    ))}
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
