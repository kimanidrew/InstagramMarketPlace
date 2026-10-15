"use client";

import Link from "next/link";
import { BadgeCheck, Crown, ArrowRight, LoaderCircle, Store } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product-card";

type ProductMasonryProps = {
  q?: string;
  tag?: string;
  personalized?: boolean;
  stores?: any[];
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

function StoreInlineSection({ stores, batchIndex }: { stores: any[]; batchIndex: number }) {
  const batch = stores.slice(batchIndex * 2, batchIndex * 2 + 2);
  if (!batch.length) return null;
  const heading = storeSectionTitles[batchIndex % storeSectionTitles.length];

  return (
    <section className="product-store-interlude column-span-all my-7 rounded-[26px] border border-black/[.06] bg-[#f7f7f4] p-4 sm:my-9 sm:rounded-[30px] sm:p-6" aria-label={heading.eyebrow}>
      <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.14em] text-[#777] sm:text-[10px]"><Store size={12} /> {heading.eyebrow}</p>
          <h3 className="mt-2 max-w-2xl text-xl font-black leading-tight tracking-[-.045em] text-[#171717] sm:text-2xl">{heading.title}</h3>
          <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#777] sm:text-sm">{heading.copy}</p>
        </div>
        <Link href="/stores" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[10px] font-black text-[#222] transition hover:bg-black hover:text-white sm:px-4 sm:text-xs">All stores <ArrowRight size={12} /></Link>
      </div>
      <div className="product-store-interlude-list flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0">
        {batch.map(({ store, posts }: any) => {
          const verified = Boolean(store.verifiedAt && (!store.verifiedUntil || new Date(store.verifiedUntil) > new Date()));
          const pro = Boolean(store.proUntil && new Date(store.proUntil) > new Date());
          return (
            <Link key={store.id} href={"/store/" + store.username} className="group w-[86%] min-w-0 shrink-0 snap-start rounded-[21px] sm:w-auto sm:shrink" border border-black/[.05] bg-white p-3 transition duration-300 hover:-translate-y-0.5 hover:border-black/10 hover:shadow-[0_12px_30px_rgba(0,0,0,.06)] sm:rounded-[24px] sm:p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative h-[58px] w-[58px] shrink-0 overflow-visible rounded-full bg-[#f0f0ec] p-[2px] sm:h-[66px] sm:w-[66px]">
                  <span className="block h-full w-full overflow-hidden rounded-full bg-[#f0f0ec]">
                    {store.profileImageUrl ? <img src={store.profileImageUrl} alt={"@" + store.username} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <span className="flex h-full w-full items-center justify-center text-sm font-black text-[#777]">@</span>}
                  </span>
                  {verified && <span className="absolute bottom-0 right-0 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-sm"><BadgeCheck size={13} fill="currentColor" className="text-white" /></span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <b className="truncate text-sm font-extrabold tracking-[-.02em] text-[#171717] sm:text-base">@{store.username}</b>
                    {pro && <Crown size={13} className="shrink-0 text-amber-500" />}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold text-[#888] sm:text-[11px]">{posts.length} listings · Instagram shop</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black text-[#555] transition group-hover:text-black sm:text-[11px]">Explore shop <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" /></span>
                </span>
              </div>
              <span className="mt-3 grid grid-cols-3 gap-2 border-t border-black/[.05] pt-3">
                {posts.slice(0, 3).map((post: any, index: number) => {
                  const image = post.thumbnailUrl || post.mediaUrl;
                  return <span key={post.id || index} className="block aspect-[4/3] overflow-hidden rounded-[11px] bg-[#f0f0ec]">
                    {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" /> : <span className="flex h-full items-center justify-center text-[9px] font-bold text-[#999]">Listing</span>}
                  </span>;
                })}
              </span>
            </Link>
          );
        })}
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

export function ProductMasonry({ q = "", tag = "", personalized = false, stores = [] }: ProductMasonryProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);
  const pageRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);

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

  return (
    <>
      <div className="columns-2 gap-3 sm:columns-2 sm:gap-5 md:columns-3 lg:columns-4">
        {products.map((product, index) => {
          const batchIndex = Math.floor((index + 1) / 12) - 1;
          const showStoreSection = stores.length > batchIndex * 2 && (index + 1) % 12 === 0;
          return (
            <Fragment key={product.id}>
              <LazyProductCard product={product} />
              {showStoreSection && <StoreInlineSection stores={stores} batchIndex={batchIndex} />}
            </Fragment>
          );
        })}
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
