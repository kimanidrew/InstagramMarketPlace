"use client";

import Link from "next/link";
import { Heart, ExternalLink } from "lucide-react";
import { useState } from "react";
import { ProductMedia } from "@/components/product-media";

export function ProductCard({ p }: { p: any }) {
  const [l, setL] = useState(false);
  const [n, setN] = useState(p.likes?.length || 0);

  async function like() {
    const r = await fetch("/api/products/" + p.id + "/like", { method: "POST" });
    if (r.status === 401) {
      location.href = "/login?next=" + encodeURIComponent(location.pathname);
      return;
    }
    if (r.ok) {
      const d = await r.json();
      setL(d.liked);
      setN(d.localLikes);
    }
  }

  const isVideo = String(p.mediaType || "").toUpperCase() === "VIDEO";
  const img = p.mediaUrl || p.thumbnailUrl;

  return (
    <article className="mb-10 break-inside-avoid">
      <div className="relative overflow-hidden rounded-[24px] bg-[#f4f4f2]">
        {isVideo && p.mediaUrl ? (
          <div className="aspect-[4/5]">
            <ProductMedia
              src={p.mediaUrl}
              poster={p.thumbnailUrl}
              alt={p.productTitle || "Product video"}
            />
          </div>
        ) : (
          img && (
            <Link
              href={"/product/" + p.productSlug}
              aria-label={"View " + (p.productTitle || "product")}
              className="block h-full w-full"
            >
              <img
                src={img}
                alt={p.productTitle || "Product"}
                className="block h-auto w-full object-cover transition duration-500 hover:scale-[1.03]"
              />
            </Link>
          )
        )}

        <button
          onClick={like}
          aria-label={l ? "Unlike product" : "Like product"}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-105"
        >
          <Heart size={17} fill={l ? "currentColor" : "none"} />
        </button>

        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold">
          {p.instagramLikeCount.toLocaleString()} IG likes
        </span>
      </div>

      <div className="pt-4">
        <Link href={"/product/" + p.productSlug} className="font-bold">
          {p.productTitle}
        </Link>
        <Link
          href={"/store/" + p.connection.username}
          className="mt-1 block text-xs text-[#777]"
        >
          @{p.connection.username}
        </Link>

        <div className="mt-3 flex flex-wrap gap-1">
          {p.tags
            ?.filter((t: any) => t.name !== "instagrammarket")
            .slice(0, 3)
            .map((t: any) => (
              <Link
                href={"/products?tag=" + t.name}
                key={t.name}
                className="rounded-full bg-[#f5f5f5] px-2.5 py-1 text-[10px]"
              >
                #{t.name}
              </Link>
            ))}
        </div>

        <div className="mt-3 flex justify-between text-xs text-[#777]">
          <span>{n} marketplace likes</span>
          {p.permalink && (
            <a
              href={p.permalink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex gap-1 font-semibold text-black"
            >
              Instagram <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
