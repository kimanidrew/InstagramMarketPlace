"use client";

import Link from "next/link";
import { Bookmark, Heart, Instagram } from "lucide-react";
import { ProductMedia } from "@/components/product-media";
import { LikeButton } from "@/components/like-button";
import { WishlistButton } from "@/components/wishlist-button";
import { useEffect, useRef, useState } from "react";

export function ProductCard({ p }: { p: any }) {
  const [likeCount, setLikeCount] = useState(p.likes?.length || 0);
  const [wishlistCount, setWishlistCount] = useState(p.wishlistItems?.length || 0);
  const [likeFlash, setLikeFlash] = useState(false);
  const [wishlistFlash, setWishlistFlash] = useState(false);
  const likeCountRef = useRef(likeCount);
  const wishlistCountRef = useRef(wishlistCount);

  useEffect(() => {
    const onLike = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; count: number }>).detail;
      if (detail?.id === p.id) {
        const changed = detail.count !== likeCountRef.current;
        likeCountRef.current = detail.count;
        setLikeCount(detail.count);
        if (changed) {
          setLikeFlash(true);
          window.setTimeout(() => setLikeFlash(false), 450);
        }
      }
    };
    const onWishlist = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; count: number }>).detail;
      if (detail?.id === p.id) {
        const changed = detail.count !== wishlistCountRef.current;
        wishlistCountRef.current = detail.count;
        setWishlistCount(detail.count);
        if (changed) {
          setWishlistFlash(true);
          window.setTimeout(() => setWishlistFlash(false), 450);
        }
      }
    };
    window.addEventListener("listing-like-updated", onLike);
    window.addEventListener("listing-wishlist-updated", onWishlist);
    return () => {
      window.removeEventListener("listing-like-updated", onLike);
      window.removeEventListener("listing-wishlist-updated", onWishlist);
    };
  }, [p.id]);

  const isVideo = String(p.mediaType || "").toUpperCase() === "VIDEO";
  const img = p.mediaUrl || p.thumbnailUrl;
  const isService = String(p.listingType || "").toUpperCase() === "SERVICE";
  const href = "/" + (isService ? "service" : "product") + "/" + p.productSlug;

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-[#f4f4f2] sm:rounded-[22px]">
        {isVideo && p.mediaUrl ? (
          <div className="h-full w-full">
            <ProductMedia
              src={p.mediaUrl}
              poster={p.thumbnailUrl}
              alt={p.productTitle || "Product video"}
              href={href}
            />
          </div>
        ) : (
          img && (
            <Link
              href={href}
              aria-label={"View " + (p.productTitle || "product")}
              className="block h-full w-full"
            >
              <img
                src={img}
                alt={p.productTitle || "Product"}
                className="block h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            </Link>
          )
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{p.boostUntil && new Date(p.boostUntil) > new Date() && <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1.5 text-[10px] font-black text-white shadow-sm">Boosted</span>}{p.connection?.verifiedAt && new Date(p.connection.verifiedAt) <= new Date() && <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[10px] font-black text-black shadow-sm">✓ Verified</span>}</div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          <LikeButton id={p.id} count={likeCount} compact initialLiked={Boolean(p.likedByCurrentUser)} />
          <WishlistButton id={p.id} count={wishlistCount} compact wishlisted={Boolean(p.wishlistedByCurrentUser ?? p.wishlistItems?.length)} />
        </div>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-black shadow-sm backdrop-blur-sm">
          <Instagram size={13} strokeWidth={2.2} />
          {Number(p.instagramLikeCount || 0).toLocaleString()} likes
        </span>
      </div>

      <div className="pt-3 sm:pt-4">
        <p className="line-clamp-2 break-words text-xs font-bold leading-5 text-black sm:text-sm sm:leading-6">
          {p.productTitle}
        </p>

        <Link
          href={"/store/" + p.connection.username}
          className="mt-2 flex min-w-0 max-w-full items-center gap-2"
        >
          <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#ecece8] ring-1 ring-black/5 sm:h-8 sm:w-8">
            {p.connection.profileImageUrl ? (
              <img
                src={p.connection.profileImageUrl}
                alt={"@" + p.connection.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[10px] font-black text-[#777]">
                {(p.connection.username || "?").slice(0, 1).toUpperCase()}
              </span>
            )}
          </span>
          <span className="min-w-0 truncate text-xs font-semibold leading-5 text-[#555]">
            @{p.connection.username}
          </span>
        </Link>

        <div className="mt-2 flex flex-wrap gap-1 sm:mt-3">
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

        <div className="product-card-stats mt-3">
          <div className={"product-card-stat " + (likeFlash ? "is-updated" : "")}>
            <span className="product-card-stat-icon"><Heart size={13} strokeWidth={2.4} /></span>
            <span className="product-card-stat-copy">
              <b className={"interaction-stat-value " + (likeFlash ? "is-count-updated" : "")}>{likeCount.toLocaleString()}</b>
              <small>Likes</small>
            </span>
          </div>
          <div className={"product-card-stat " + (wishlistFlash ? "is-updated" : "")}>
            <span className="product-card-stat-icon"><Bookmark size={13} strokeWidth={2.4} /></span>
            <span className="product-card-stat-copy">
              <b className={"interaction-stat-value " + (wishlistFlash ? "is-count-updated" : "")}>{wishlistCount.toLocaleString()}</b>
              <small>Saved</small>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
