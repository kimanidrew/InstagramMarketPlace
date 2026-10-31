"use client";

import Link from "next/link";
import { BadgeCheck, Bookmark, Crown, ArrowRight, ChevronLeft, ChevronRight, LoaderCircle, Store, Sparkles } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { WishlistButton } from "@/components/wishlist-button";

type ProductMasonryProps = {
  q?: string;
  tag?: string;
  personalized?: boolean;
  stores?: any[];
  wishlistProducts?: any[];
  categorySections?: { label: string; type: "product" | "service"; items: any[] }[];
};

function ProductShimmer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="min-w-0 animate-pulse">
      <div className={"overflow-hidden rounded-[24px] bg-[#eeeeeb] " + (compact ? "aspect-[4/5]" : "aspect-[4/5]")}>
        <div className="h-full w-full bg-gradient-to-br from-[#eeeeeb] via-white/60 to-[#e8e8e4]" />
      </div>
      <div className="space-y-2.5 pt-4">
        <div className="h-4 w-3/4 rounded-full bg-[#e9e9e6]" />
        <div className="h-3 w-1/2 rounded-full bg-[#eeeeeb]" />
        <div className="h-3 w-2/3 rounded-full bg-[#eeeeeb]" />
      </div>
    </div>
  );
}

function ProductShimmers({ count = 8 }: { count?: number }) {
  return (
    <div className="columns-2 gap-3 sm:columns-2 sm:gap-5 md:columns-3 lg:columns-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="mb-7 break-inside-avoid sm:mb-9">
          <ProductShimmer compact={i % 3 === 1} />
        </div>
      ))}
    </div>
  );
}

const storeSectionTitles = [
  { eyebrow: "Meet the makers", title: "The people behind the products.", copy: "Take a moment to meet the shops bringing fresh finds to the marketplace." },
  { eyebrow: "Fresh shops to explore", title: "More brands worth knowing.", copy: "Keep discovering independent businesses and the stories behind their posts." },
  { eyebrow: "Good finds, good people", title: "Get to know your next favourite shop.", copy: "Browse more sellers and find something new to love." },
  { eyebrow: "Around the marketplace", title: "A few more shops to discover.", copy: "Real businesses, fresh inspiration and more reasons to keep exploring." },
];

export function StoreCard({ entry }: { entry: any }) {
  const { store, posts } = entry;
  const verified = Boolean(store.verifiedAt && (!store.verifiedUntil || new Date(store.verifiedUntil) > new Date()));
  const pro = Boolean(store.proUntil && new Date(store.proUntil) > new Date());
  return (
    <Link href={"/stores/" + store.username} className="group flex min-w-0 flex-col items-center rounded-[21px] border border-black/[.05] bg-white p-3 text-center transition duration-300 hover:-translate-y-0.5 hover:border-black/10 hover:shadow-[0_12px_30px_rgba(0,0,0,.06)] sm:rounded-[24px] sm:p-4">
      <span className="relative mb-3 block h-[88px] w-[88px] shrink-0 overflow-visible rounded-full bg-[#f0f0ec] p-[2px] sm:h-[100px] sm:w-[100px]">
        <span className="block h-full w-full overflow-hidden rounded-full bg-[#f0f0ec]">
          {store.profileImageUrl ? <img src={store.profileImageUrl} alt={"@" + store.username} className="h-full w-full rounded-full object-cover transition duration-500 group-hover:scale-105" /> : <span className="flex h-full w-full items-center justify-center rounded-full text-sm font-black text-[#777]">@</span>}
        </span>
        {verified && <span className="absolute bottom-0 right-0 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm sm:h-[18px] sm:w-[18px]" title="Verified shop" aria-label="Verified shop"><BadgeCheck size={16} strokeWidth={2.8} className="fill-[#2563eb] text-white sm:h-[18px] sm:w-[18px]" /></span>}
      </span>
      <span className="flex min-w-0 max-w-full items-center justify-center gap-1.5">
        <b className="truncate text-sm font-extrabold tracking-[-.02em] text-[#171717] sm:text-base">@{store.username}</b>
        {pro && <Crown size={13} className="shrink-0 text-amber-500" />}
      </span>
      <span className="mt-1 block text-[10px] font-semibold text-[#888] sm:text-[11px]">{posts.length} listings · Instagram shop</span>
      <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black text-[#555] transition group-hover:text-black sm:text-[11px]">Explore shop <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" /></span>
    </Link>
  );
}

export function StoreInlineSection({ stores, batchIndex, variant = "discover" }: { stores: any[]; batchIndex: number; variant?: "discover" | "trending" }) {
  const batch = stores.slice(batchIndex * 4, batchIndex * 4 + 4);
  if (!batch.length) return null;
  const heading = variant === "trending"
    ? [
        { eyebrow: "Trending shops", title: "Stores shoppers are loving.", copy: "Explore the shops behind listings getting the most attention." },
        { eyebrow: "More shops on the rise", title: "Keep up with the stores gaining attention.", copy: "More sellers are making waves across the marketplace." },
        { eyebrow: "Popular with the community", title: "Discover the shops people come back to.", copy: "Find more businesses earning likes, saves and attention." },
        { eyebrow: "Still trending", title: "More shops worth a closer look.", copy: "Keep exploring sellers making their mark." },
      ][batchIndex % 4]
    : storeSectionTitles[batchIndex % storeSectionTitles.length];

  return (
    <section className={"product-store-interlude column-span-all rounded-[26px] border border-black/[.06] bg-[#f7f7f4] px-5 py-4 sm:rounded-[30px] sm:px-8 sm:py-6 " + (variant === "trending" ? "mt-4 mb-7 md:mt-[30px] sm:mb-9" : "my-7 sm:my-9")} aria-label={heading.eyebrow}>
      <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.14em] text-[#777] sm:text-[10px]"><Store size={12} /> {heading.eyebrow}</p>
          <h3 className="mt-2 max-w-2xl text-xl font-black leading-tight tracking-[-.045em] text-[#171717] sm:text-2xl">{heading.title}</h3>
          <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#777] sm:text-sm">{heading.copy}</p>
        </div>
        <Link href="/stores" style={{ backgroundColor: "#000000", color: "#ffffff", borderColor: "#000000" }} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border !border-black !bg-black px-3 py-2 text-[10px] font-black !text-white transition-colors hover:!border-black hover:!bg-black hover:!text-white active:!bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:px-4 sm:text-xs">All stores <ArrowRight size={12} /></Link>
      </div>
      <div className="product-store-interlude-list grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {batch.map((entry: any) => <StoreCard key={entry.store.id} entry={entry} />)}
      </div>
    </section>
  );
}

function LazyProductCard({ product }: { product: any }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className="mb-7 min-w-0 break-inside-avoid sm:mb-9">
      {visible ? <ProductCard p={product} /> : <ProductShimmer compact />}
    </div>
  );
}

export function ProductMasonry({ q = "", tag = "", personalized = false, stores = [], wishlistProducts = [], categorySections = [] }: ProductMasonryProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [savedProducts, setSavedProducts] = useState<any[]>(wishlistProducts);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);
  const pageRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const savedForLaterScrollRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSavedProducts(wishlistProducts);
  }, [wishlistProducts]);

  useEffect(() => {
    const onWishlistUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; wishlisted: boolean }>).detail;
      if (!detail?.id) return;

      if (!detail.wishlisted) {
        setSavedProducts((current) => current.filter((item) => item.id !== detail.id));
        return;
      }

      // Add the just-saved listing immediately using the already-loaded feed data.
      const product = products.find((item) => item.id === detail.id);
      if (product) {
        setSavedProducts((current) => [
          product,
          ...current.filter((item) => item.id !== detail.id),
        ]);
      }
    };
    window.addEventListener("listing-wishlist-updated", onWishlistUpdate);
    return () => window.removeEventListener("listing-wishlist-updated", onWishlistUpdate);
  }, [products]);

  useEffect(() => {
    pageRef.current = 0;
    setProducts([]);
    setHasMore(true);
    setLoading(true);
    setError(false);

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    async function loadFirstPage() {
      try {
        const params = new URLSearchParams({
          page: "0",
          limit: "12",
        });
        if (q) params.set("q", q);
        if (tag) params.set("tag", tag);
        if (personalized) params.set("personalized", "1");

        const response = await fetch("/api/products?" + params.toString(), {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Failed to load products");

        const data = await response.json();
        setProducts(data.products || []);
        setHasMore(Boolean(data.hasMore));
        pageRef.current = 0;
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadFirstPage();

    return () => controller.abort();
  }, [q, tag, personalized]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "700px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, q, tag, personalized, products.length]);

  async function loadMore() {
    if (loading || loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const nextPage = pageRef.current + 1;
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: "12",
      });
      if (q) params.set("q", q);
      if (tag) params.set("tag", tag);
      if (personalized) params.set("personalized", "1");

      const response = await fetch("/api/products?" + params.toString(), {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Failed to load more products");

      const data = await response.json();
      setProducts((current) => {
        const existing = new Set(current.map((product) => product.id));
        return [...current, ...(data.products || []).filter((product: any) => !existing.has(product.id))];
      });
      pageRef.current = nextPage;
      setHasMore(Boolean(data.hasMore));
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) {
    return <ProductShimmers />;
  }

  if (error && products.length === 0) {
    return (
      <div className="rounded-[28px] border border-black/5 bg-[#f7f7f4] px-6 py-20 text-center">
        <h2 className="text-xl font-black">We couldn't load the products.</h2>
        <p className="mt-2 text-sm text-[#777]">Please refresh and try again.</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-black">Nothing found</h2>
        <p className="mt-2 text-sm text-[#777]">
          Try another search or browse all products.
        </p>
      </div>
    );
  }

  type FeedItem =
    | { type: "product"; product: any }
    | { type: "stores"; batchIndex: number }
    | { type: "recommendations"; batchIndex: number; products: any[] }
    | { type: "saved" }
    | { type: "category"; section: { label: string; type: "product" | "service"; items: any[] }; sectionIndex: number };
  const productFeed: FeedItem[] = [];
  const visibleCategorySections = categorySections.filter((section) => !["other", "other category", "more to explore"].includes(section.label.trim().toLowerCase()) && section.items.length > 0);

  products.forEach((product, index) => {
    // Keep every listing in sequence. The first discovery pair is deliberately
    // placed immediately after listing five: Meet the Makers, then category.
    productFeed.push({ type: "product", product });

    const productCount = index + 1;
    const isFirstDiscoveryPair = productCount === 5;
    const isLaterDiscoveryPair = productCount > 5 && (productCount - 5) % 10 === 0;

    if (isFirstDiscoveryPair || isLaterDiscoveryPair) {
      const sectionBatchIndex = isFirstDiscoveryPair
        ? 0
        : Math.floor((productCount - 5) / 10);

      if (stores.length > sectionBatchIndex * 4) {
        productFeed.push({ type: "stores", batchIndex: sectionBatchIndex });
      }

      const section = visibleCategorySections[sectionBatchIndex];
      if (section) {
        productFeed.push({ type: "category", section, sectionIndex: sectionBatchIndex });
      }
    }

    if (productCount === 10 && savedProducts.length > 0) {
      productFeed.push({ type: "saved" });
    }
  });

  // Keep Saved for Later available even when the feed has fewer than eight products.
  if (savedProducts.length > 0 && !productFeed.some((item) => item.type === "saved")) {
    productFeed.push({ type: "saved" });
  }

  return (
    <>
      <div className="product-feed-layout">
        {productFeed.map((item) => item.type === "product" ? (
          <div key={item.product.id} className="product-feed-item"><LazyProductCard product={item.product} /></div>
        ) : item.type === "stores" ? (
          <div key={"store-section-" + item.batchIndex} className="product-store-interlude-row"><StoreInlineSection stores={stores} batchIndex={item.batchIndex} /></div>
        ) : item.type === "category" ? (
          <section key={"category-interlude-" + item.sectionIndex} className="product-feed-full-row category-product-shelf" aria-label={item.section.label}>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow plain">{item.section.type === "service" ? "Services" : "Popular category"}</p>
                <h3 className="mt-1 truncate text-xl font-black tracking-[-.045em] sm:text-2xl">{item.section.label}</h3>
              </div>
              <Link href={item.section.type === "service" ? "/search?type=service" : "/search?category=" + encodeURIComponent(item.section.label)} className="inline-flex shrink-0 items-center gap-1 text-xs font-black text-[#555] hover:text-black">Explore <ArrowRight size={13} /></Link>
            </div>
            <div className="category-product-grid-mobile grid grid-cols-2 gap-3 sm:hidden">
              {item.section.items.slice(0, 4).map((product: any) => <div key={product.id} className="min-w-0"><ProductCard p={product} /></div>)}
            </div>
            <div className="category-product-grid-desktop hidden grid-cols-5 gap-4 sm:grid">
              {item.section.items.slice(0, 5).map((product: any) => <div key={product.id} className="min-w-0"><ProductCard p={product} /></div>)}
            </div>
          </section>
        ) : item.type === "recommendations" ? (
          <section key={"recommended-products-" + item.batchIndex} className="product-feed-full-row product-recommendations-interlude rounded-[26px] border border-black/[.06] bg-[#f7f7f4] px-5 py-5 sm:rounded-[30px] sm:px-8 sm:py-8" aria-label="Picked for you">
            <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.14em] text-[#777] sm:text-[10px]"><Sparkles size={12} /> Picked for you</p>
                <h3 className="mt-2 max-w-2xl text-xl font-black leading-tight tracking-[-.045em] text-[#171717] sm:text-2xl">A few things you might love.</h3>
                <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#777] sm:text-sm">More finds worth a closer look, picked as you keep exploring.</p>
              </div>
              <Link href="/shop" style={{ backgroundColor: "#000000", color: "#ffffff", borderColor: "#000000" }} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border !border-black !bg-black px-3 py-2 text-[10px] font-black !text-white transition-colors hover:!border-black hover:!bg-black hover:!text-white active:!bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:px-4 sm:text-xs">Explore shop <ArrowRight size={12} /></Link>
            </div>
            <div className="product-recommendations-list mt-1 flex gap-3 overflow-x-auto pb-2 sm:gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
              {item.products.map((recommended: any) => (
                <div key={recommended.id} className="product-recommendation-card min-w-[148px] w-[148px] shrink-0 sm:min-w-[190px] sm:w-[190px] md:min-w-0 md:w-auto md:shrink"><ProductCard p={recommended} /></div>
              ))}
            </div>
          </section>
        ) : (
          <section key="saved-for-later" className="product-feed-full-row rounded-[30px] border border-black/5 bg-[#f7f7f4] px-6 py-5 md:px-9 md:py-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.12em] text-[#777]"><Bookmark size={13} /> Saved for later</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">Still loving these?</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">Your saved products and services are ready whenever you are.</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                <div className="hidden items-center gap-2 md:flex" aria-label="Scroll saved listings">
                  <button type="button" onClick={() => savedForLaterScrollRef.current?.scrollBy({ left: -360, behavior: "smooth" })} aria-label="Scroll saved listings left" style={{ backgroundColor: "#000000", color: "#ffffff", borderColor: "#000000" }} className="flex h-10 w-10 items-center justify-center rounded-full border !border-black !bg-black text-white transition-colors hover:!border-black hover:!bg-black active:!bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"><ChevronLeft size={18} /></button>
                  <button type="button" onClick={() => savedForLaterScrollRef.current?.scrollBy({ left: 360, behavior: "smooth" })} aria-label="Scroll saved listings right" style={{ backgroundColor: "#000000", color: "#ffffff", borderColor: "#000000" }} className="flex h-10 w-10 items-center justify-center rounded-full border !border-black !bg-black text-white transition-colors hover:!border-black hover:!bg-black active:!bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"><ChevronRight size={18} /></button>
                </div>
                <Link href="/wishlist" className="saved-for-later-link group inline-flex shrink-0 items-center gap-2 text-xs font-black leading-5">View full wishlist <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></Link>
              </div>
            </div>
            <div ref={savedForLaterScrollRef} className="saved-for-later-list mt-6 -mx-6 flex flex-nowrap gap-3 overflow-x-auto px-6 pb-2 scroll-smooth md:-mx-9 md:px-9 md:gap-4">
              {savedProducts.slice(0, 7).map((x: any) => {
                const isVideo = String(x.mediaType || "").toUpperCase() === "VIDEO";
                const isService = String(x.listingType || "").toUpperCase() === "SERVICE";
                const href = "/" + (isService ? "service" : "product") + "/" + x.productSlug;
                const image = x.mediaUrl || x.thumbnailUrl;
                return (
                  <div key={x.id} className="saved-for-later-card group relative h-[112px] w-[112px] shrink-0 overflow-hidden rounded-[20px] bg-[#eeeeeb] sm:h-[136px] sm:w-[136px] md:h-[180px] md:w-[180px] md:shrink-0">
                    <Link href={href} aria-label={x.productTitle || "Saved listing"} className="block h-full w-full">
                      {isVideo && x.mediaUrl ? <video src={x.mediaUrl} poster={x.thumbnailUrl || undefined} muted loop autoPlay playsInline className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : image ? <img src={image} alt={x.productTitle || "Saved listing"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#999]">No media</div>}
                    </Link>
                    <div className="absolute right-2 top-2 z-10">
                      <WishlistButton id={x.id} wishlisted compact />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div ref={sentinelRef} className="min-h-20 pt-3">
        {loadingMore && <ProductShimmers count={2} />}
        {!hasMore && (
          <p className="pb-4 pt-2 text-center text-xs font-semibold text-[#999]">
            You've reached the end of the marketplace.
          </p>
        )}
        {error && products.length > 0 && (
          <button
            type="button"
            onClick={loadMore}
            className="mx-auto mb-4 flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-xs font-bold shadow-sm"
          >
            Try loading more
          </button>
        )}
      </div>

      {!loadingMore && hasMore && (
        <div className="pointer-events-none h-px" aria-hidden="true">
          <LoaderCircle className="mx-auto hidden animate-spin" size={16} />
        </div>
      )}
    </>
  );
}
