"use client";

import { Heart, MessageCircle, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ProductDetailStats({
  id,
  initialLikes,
  reviews,
  rating,
  initiallyLiked,
}: {
  id: string;
  initialLikes: number;
  reviews: number;
  rating: number;
  initiallyLiked: boolean;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initiallyLiked);
  const [likeFlash, setLikeFlash] = useState(false);
  const countRef = useRef(initialLikes);

  useEffect(() => {
    countRef.current = initialLikes;
    setLikes(initialLikes);
  }, [id, initialLikes]);

  useEffect(() => {
    setIsLiked(initiallyLiked);
  }, [id, initiallyLiked]);

  useEffect(() => {
    const onLike = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; count: number; liked?: boolean }>).detail;
      if (detail?.id !== id) return;
      if (typeof detail.liked === "boolean") setIsLiked(detail.liked);
      const changed = detail.count !== countRef.current;
      countRef.current = detail.count;
      setLikes(detail.count);
      if (changed) {
        setLikeFlash(true);
        window.setTimeout(() => setLikeFlash(false), 450);
      }
    };

    window.addEventListener("listing-like-updated", onLike);
    return () => window.removeEventListener("listing-like-updated", onLike);
  }, [id]);

  return (
    <div className="product-detail-stats inline-flex flex-nowrap items-center justify-center gap-x-3 rounded-full bg-[#f7f7f4] px-3 py-2 text-center text-[#171717]" aria-label="Product statistics">
      <span className={"product-card-like-line inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-bold leading-none " + (likeFlash ? "is-updated" : "")} aria-label={likes.toLocaleString() + " likes"}>
        <Heart size={16} strokeWidth={2.4} fill={isLiked ? "currentColor" : "none"} className={"product-card-like-line-icon shrink-0 " + (isLiked ? "text-[#ff3b6b]" : "") + (likeFlash ? " is-animated" : "")} aria-hidden="true" />
        <b className={"interaction-stat-value leading-none " + (likeFlash ? "is-count-updated" : "")}>{likes.toLocaleString()}</b>
        <span className="font-medium leading-none text-[#777]">likes</span>
      </span>
      <span className="h-4 w-px shrink-0 bg-[#dededb]" aria-hidden="true" />
      <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-bold leading-none">
        <Star size={16} className="shrink-0 text-[#d4a72c]" fill={reviews ? "currentColor" : "none"} />
        {reviews ? rating.toFixed(1) : "New"} <span className="font-medium leading-none text-[#777]">rating</span>
      </span>
      <span className="h-4 w-px shrink-0 bg-[#dededb]" aria-hidden="true" />
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("open-review-composer"))}
        className="product-detail-reviews-stat inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-bold leading-none"
        aria-label={"Open " + reviews + (reviews === 1 ? " product review" : " product reviews")}
      >
        <MessageCircle size={16} className="shrink-0" />
        {reviews.toLocaleString()} <span className="font-medium leading-none text-[#777]">reviews</span>
      </button>
    </div>
  );
}
