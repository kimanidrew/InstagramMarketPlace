"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product-card";

type ProductMasonryProps = {
  q?: string;
  tag?: string;
};

function ProductShimmer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mb-10 break-inside-avoid animate-pulse">
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
    <div className="columns-2 [column-gap:1rem] md:columns-3 md:[column-gap:1.5rem] lg:columns-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductShimmer key={i} compact={i % 3 === 1} />
      ))}
    </div>
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
    <div ref={ref} className="break-inside-avoid">
      {visible ? <ProductCard p={product} /> : <ProductShimmer compact />}
    </div>
  );
}

export function ProductMasonry({ q = "", tag = "" }: ProductMasonryProps) {
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
          limit: "8",
        });
        if (q) params.set("q", q);
        if (tag) params.set("tag", tag);

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
  }, [q, tag]);

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
  }, [hasMore, loading, loadingMore, q, tag, products.length]);

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
      <div className="columns-2 [column-gap:1rem] md:columns-3 md:[column-gap:1.5rem] lg:columns-4">
        {products.map((product) => (
          <LazyProductCard key={product.id} product={product} />
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
