"use client";

import Link from "next/link";
import { ExternalLink, Instagram } from "lucide-react";
import { ProductMedia } from "@/components/product-media";

export function ProductCard({ p }: { p: any }) {
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

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{p.boostUntil && new Date(p.boostUntil) > new Date() && <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1.5 text-[10px] font-black text-white shadow-sm">Boosted</span>}{p.connection?.verifiedAt && new Date(p.connection.verifiedAt) <= new Date() && <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[10px] font-black text-black shadow-sm">✓ Verified</span>}</div>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-black shadow-sm backdrop-blur-sm">
          <Instagram size={13} strokeWidth={2.2} />
          {Number(p.instagramLikeCount || 0).toLocaleString()} likes
        </span>
      </div>

      <div className="pt-4">
        <p className="line-clamp-3 text-sm font-bold leading-6 text-black">
          {p.productTitle}
        </p>

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
          <span>{p.likes?.length || 0} marketplace likes</span>
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
