"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Bookmark, Compass, Grid2X2, Heart, SlidersHorizontal, Sparkles, Store, TrendingUp } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ProductMasonry } from "@/components/product-masonry";

type ShopTab = "discover" | "trending" | "featured";

export function ShopTabs({
  tags = [],
  initialTag = "",
  wishlistProducts = [],
  featuredStores = [],
  trendingProducts = [],
  featuredProducts = [],
  now,
}: {
  tags?: string[];
  initialTag?: string;
  wishlistProducts?: any[];
  featuredStores?: any[];
  trendingProducts?: any[];
  featuredProducts?: any[];
  now: string;
}) {
  const [active, setActive] = useState<ShopTab>("discover");
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const currentNow = new Date(now);
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateFilterScrollState = () => {
    const el = filterScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < maxScroll - 1);
  };

  useEffect(() => {
    const el = filterScrollRef.current;
    if (!el) return;
    updateFilterScrollState();
    el.addEventListener("scroll", updateFilterScrollState, { passive: true });
    window.addEventListener("resize", updateFilterScrollState);
    return () => {
      el.removeEventListener("scroll", updateFilterScrollState);
      window.removeEventListener("resize", updateFilterScrollState);
    };
  }, [tags.length]);

  const scrollFilters = (direction: "left" | "right") => {
    const el = filterScrollRef.current;
    if (!el) return;
    const distance = Math.max(el.clientWidth * 0.72, 220);
    el.scrollBy({ left: direction === "left" ? -distance : distance, behavior: "smooth" });
  };

  const tabs = [
    { id: "discover" as const, label: "Discover", icon: Compass, copy: "Fresh finds & stores" },
    { id: "trending" as const, label: "Trending", icon: TrendingUp, copy: "Loved by shoppers" },
    { id: "featured" as const, label: "Featured", icon: Sparkles, copy: "Growth-powered picks" },
  ];

  const filterProducts = (items: any[]) =>
    items.filter(
      (product: any) =>
        !selectedTag ||
        product.tags?.some((t: any) => String(t.name).toLowerCase() === selectedTag),
    );

  return (
    <div className="shop-tabs-wrap mt-10">
      <div className="shop-tabs" role="tablist" aria-label="Shop discovery">
        {tabs.map(({ id, label, icon: Icon, copy }) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={"shop-tab-panel-" + id}
              className={"shop-tab " + (selected ? "shop-tab-active" : "")}
              onClick={() => setActive(id)}
            >
              <span className="shop-tab-icon"><Icon size={16} /></span>
              <span className="shop-tab-copy">
                <b>{label}</b>
                <small>{copy}</small>
              </span>
              <span className="shop-tab-indicator" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="shop-filter-panel">
        <div className="shop-filter-heading">
          <div>
            <span className="shop-filter-label"><SlidersHorizontal size={14} /> Filter by category</span>
            <span className="shop-filter-help">Choose a category to focus the marketplace.</span>
          </div>
          <span className="shop-filter-count">{selectedTag ? "#" + selectedTag : "All listings"}</span>
        </div>
        <div className="relative">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollFilters("left")}
              aria-label="Scroll categories left"
              className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-md backdrop-blur-sm transition hover:scale-105"
            >
              <ArrowLeft size={14} />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollFilters("right")}
              aria-label="Scroll categories right"
              className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-md backdrop-blur-sm transition hover:scale-105"
            >
              <ArrowRight size={14} />
            </button>
          )}
          <div ref={filterScrollRef} className="shop-filter-chips snap-x snap-mandatory scroll-smooth px-1" role="group" aria-label="Product categories">
          <button type="button" className={"chip " + (!selectedTag ? "chip-active" : "")} onClick={() => setSelectedTag("")}>All</button>
          {tags.map((name) => (
            <button
              key={name}
              type="button"
              className={"chip " + (selectedTag === name.toLowerCase() ? "chip-active" : "")}
              onClick={() => setSelectedTag(name.toLowerCase())}
            >
              #{name}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="shop-tab-panel" role="tabpanel" id={"shop-tab-panel-" + active}>
        {selectedTag ? (
          <section className="shop-category-selection">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow plain"><Grid2X2 size={13} /> Category selected</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-5xl">#{selectedTag}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">Products and services in this category, all in one place.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-[#f7f7f4] px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] text-[#777]">Products + Services</span>
            </div>
            <div className="mt-7">
              <ProductMasonry q="" tag={selectedTag} />
            </div>
          </section>
        ) : (
          <>
            {active === "discover" && (
              <div className="space-y-12">
                <section>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="eyebrow plain"><Store size={13} /> Discover stores</p>
                      <h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">Meet the shops behind the posts.</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">Explore Instagram businesses, creators and local brands with products and services on the marketplace.</p>
                    </div>
                    <Link href="/stores" className="inline-flex items-center gap-2 text-xs font-black">View all stores <ArrowRight size={14} /></Link>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {featuredStores.length > 0 ? featuredStores.slice(0, 4).map(({ store, posts }: any) => (
                      <Link key={store.id} href={"/store/" + store.username} className="group relative overflow-hidden rounded-[26px] border border-black/5 bg-[#f5f5f1] p-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(0,0,0,.09)]">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded-full bg-white ring-4 ring-white shadow-sm">
                            {store.profileImageUrl ? <img src={store.profileImageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs font-black">@</div>}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <b className="truncate text-sm">@{store.username}</b>
                              {(store.verifiedAt || (store.proUntil && new Date(store.proUntil) > currentNow)) && <BadgeCheck size={14} className="shrink-0" />}
                            </div>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#999]">{posts.length} listings</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-[10px] font-black uppercase tracking-[.12em] text-[#777]"><span>Instagram shop</span><ArrowRight size={13} className="transition-transform group-hover:translate-x-1" /></div>
                      </Link>
                    )) : (
                      <Link href="/stores" className="col-span-full rounded-[26px] border border-dashed border-black/10 bg-[#fafaf8] p-8 text-center">
                        <Store className="mx-auto" size={20} />
                        <b className="mt-3 block text-sm">Explore marketplace stores</b>
                        <span className="mt-1 block text-xs text-[#888]">Browse the businesses currently selling through Instagram Market.</span>
                      </Link>
                    )}
                  </div>
                </section>

                {wishlistProducts.length > 0 && (
                  <section className="rounded-[30px] border border-black/5 bg-[#f7f7f4] p-5 md:p-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="eyebrow plain">Pick up where you left off</p>
                        <h2 className="mt-2 text-2xl font-black tracking-[-.04em] md:text-3xl">Still loving these?</h2>
                        <p className="mt-2 text-sm text-[#777]">Your saved products and services are ready whenever you are.</p>
                      </div>
                      <Link href="/wishlist" className="inline-flex items-center gap-2 text-xs font-black">View full wishlist <ArrowRight size={14} /></Link>
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div><p className="eyebrow plain"><TrendingUp size={13} /> Trending now</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">What shoppers are saving and loving.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">Ranked from marketplace activity — likes plus saves — so the products people actually respond to rise naturally.</p></div>
                  <div className="flex items-center gap-2 rounded-full border border-black/5 bg-[#f7f7f4] px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] text-[#777]"><Heart size={12} /> Likes <span>+</span> <Bookmark size={12} /> Saves</div>
                </div>
                {trendingProducts.length > 0 ? (
                  <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{trendingProducts.map((product: any) => <ProductCard key={product.id} p={product} />)}</div>
                ) : (
                  <div className="mt-6 rounded-[26px] border border-dashed border-black/10 bg-[#fafaf8] p-10 text-center text-sm font-bold text-[#777]">Trending picks will appear as shoppers interact with listings.</div>
                )}
              </section>
            )}

            {active === "featured" && (
              <div className="space-y-12">
                <section>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div><p className="eyebrow plain"><BadgeCheck size={13} /> Featured stores</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">Shops worth discovering.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">Featured store placement is reserved for approved marketplace growth through Verified or Pro.</p></div>
                    <Link href="/stores" className="inline-flex items-center gap-2 text-xs font-black">View all stores <ArrowRight size={14} /> </Link>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {featuredStores.map(({ store, posts }: any) => (
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
                  {featuredProducts.length > 0 ? (
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featuredProducts.map((product: any) => <ProductCard key={product.id} p={product} />)}</div>
                  ) : (
                    <div className="mt-6 rounded-[26px] border border-dashed border-black/10 bg-[#fafaf8] p-10 text-center text-sm font-bold text-[#777]">Featured products appear here when a seller has an approved Boost running.</div>
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
