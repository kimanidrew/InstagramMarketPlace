"use client";

import { BadgeCheck, ChevronRight, CornerDownRight, MessageCircle, Pencil, Send, Star, Store as StoreIcon, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ReviewReply = {
  id: string;
  reviewId: string;
  userId: string;
  connectionId: string | null;
  body: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  user?: { id: string; name: string | null };
  connection?: { id: string; username: string; profileImageUrl: string | null } | null;
};

type Review = {
  id: string;
  userId: string;
  rating: number;
  body: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: { id: string; name: string | null };
  replies?: ReviewReply[];
};

export function ReviewSection({
  type,
  targetId,
  reviews: initialReviews,
  currentUserId,
  title = "Reviews",
  storeUsername,
  storeOwnerUserId,
  storeProfileImageUrl,
  presentation = "modal",
  hideWriteButton = false,
  previewLimit = 2,
  reviewUrl,
}: {
  type: "store" | "product";
  targetId: string;
  reviews: Review[];
  currentUserId?: string | null;
  title?: string;
  storeUsername?: string;
  storeOwnerUserId?: string | null;
  storeProfileImageUrl?: string | null;
  presentation?: "modal" | "page" | "preview";
  hideWriteButton?: boolean;
  previewLimit?: number;
  reviewUrl?: string;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState<Review | null>(
    initialReviews.find((review) => review.userId === currentUserId) || null,
  );
  const [open, setOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(presentation === "page");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyBusy, setReplyBusy] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<Record<string, string>>({});

  const visibleReviews = presentation === "preview" ? reviews.slice(0, previewLimit) : reviews;
  const average = useMemo(
    () => (reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0),
    [reviews],
  );
  const isStoreOwner = !!currentUserId && !!storeOwnerUserId && currentUserId === storeOwnerUserId;

  useEffect(() => {
    const openComposer = () => {
      if (presentation === "page") return;
      if (type === "product") setPanelOpen(true);
      else startReview(editing || undefined);
    };
    window.addEventListener("open-review-composer", openComposer);
    return () => window.removeEventListener("open-review-composer", openComposer);
  }, [editing, currentUserId, type, presentation]);

  useEffect(() => {
    if (!panelOpen || presentation === "page") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [panelOpen, presentation]);

  function startReview(review?: Review) {
    if (!currentUserId) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname + window.location.search);
      return;
    }
    setError("");
    if (review) {
      setEditing(review);
      setRating(review.rating);
      setBody(review.body);
    } else {
      setEditing(null);
      setRating(5);
      setBody("");
    }
    setOpen(true);
  }

  async function save() {
    if (body.trim().length < 3) {
      setError("Please write at least 3 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, targetId, rating, body: body.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.review?.id) {
        setError(data.error || "Your review could not be saved. Please try again.");
        return;
      }

      const savedReview = data.review as Review;
      setReviews((current) => {
        const exists = current.some((review) => review.id === savedReview.id);
        return exists
          ? current.map((review) => review.id === savedReview.id ? { ...review, ...savedReview } : review)
          : [{ ...savedReview, replies: [] }, ...current];
      });
      setEditing(savedReview);
      setOpen(false);
      setBody("");
    } catch {
      setError("Connection problem. Your review was not confirmed as saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(review: Review) {
    if (!window.confirm("Delete your review and its replies?")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reviews/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id: review.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Could not delete this review.");
        return;
      }
      setReviews((current) => current.filter((item) => item.id !== review.id));
      if (editing?.id === review.id) setEditing(null);
    } catch {
      setError("Connection problem. The review was not deleted.");
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(review: Review) {
    if (!currentUserId) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname + window.location.search);
      return;
    }
    const replyBody = (replyDrafts[review.id] || "").trim();
    if (!replyBody) {
      setReplyError((current) => ({ ...current, [review.id]: "Write a reply first." }));
      return;
    }
    setReplyBusy(review.id);
    setReplyError((current) => ({ ...current, [review.id]: "" }));
    try {
      const response = await fetch("/api/reviews/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, body: replyBody }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.reply?.id) {
        setReplyError((current) => ({ ...current, [review.id]: data.error || "Reply could not be saved." }));
        return;
      }
      setReviews((current) => current.map((item) => item.id === review.id
        ? { ...item, replies: [...(item.replies || []), data.reply as ReviewReply] }
        : item));
      setReplyDrafts((current) => ({ ...current, [review.id]: "" }));
      setReplyOpen(null);
    } catch {
      setReplyError((current) => ({ ...current, [review.id]: "Connection problem. Your reply was not confirmed as saved." }));
    } finally {
      setReplyBusy(null);
    }
  }

  if (type === "product" && presentation === "modal" && !panelOpen) return null;

  return (
    <section className={"review-community" + (type === "product" && presentation === "modal" ? " review-product-panel review-panel-open" : "") + (type === "product" && presentation === "page" ? " review-product-page" : "")}>
      {type === "product" && presentation === "modal" && <button type="button" className="review-panel-backdrop" aria-label="Close product reviews" onClick={() => setPanelOpen(false)} />}
      <div className="review-panel-content">
      {presentation !== "preview" && <header className="review-community-head">
        <div className="review-community-heading">
          <span className="review-community-eyebrow"><MessageCircle size={13} /> COMMUNITY CONVERSATION</span>
          <h2>{title}</h2>
          <p>Real experiences, helpful replies, and a direct conversation with the shop.</p>
          <div className="review-community-rating">
            <span className="review-community-stars">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} fill={star <= Math.round(average) ? "currentColor" : "none"} />)}</span>
            <strong>{reviews.length ? average.toFixed(1) : "New shop"}</strong>
            <span>{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
          </div>
        </div>
        {type === "product" && presentation === "modal" && <button type="button" className="review-panel-close" aria-label="Close product reviews" onClick={() => setPanelOpen(false)}><X size={19} /></button>}
        {!isStoreOwner && !hideWriteButton && <button type="button" onClick={() => startReview(editing || undefined)} className="review-write-button">
          <Pencil size={15} /> {editing ? "Edit your review" : "Write a review"}
        </button>}
      </header>}

      {open && (
        <div className="review-compose">
          <div className="review-compose-top">
            <div><span>{editing ? "UPDATE YOUR FEEDBACK" : "YOUR EXPERIENCE MATTERS"}</span><h3>{editing ? "Edit your review" : "Write a review"}</h3></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close review form"><X size={18} /></button>
          </div>
          <div className="review-rating-picker" aria-label="Choose a rating">
            {[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setRating(star)} aria-label={star + " stars"}><Star size={27} fill={star <= rating ? "currentColor" : "none"} /></button>)}
            <span>{rating}/5</span>
          </div>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} rows={4} placeholder={type === "store" ? "Share what shopping with this store was like…" : "Share what you thought about this product…"} />
          <div className="review-compose-footer"><span>{body.length}/1000</span><button type="button" onClick={() => void save()} disabled={busy}><Send size={14} /> {busy ? "Saving review…" : editing ? "Save changes" : "Post review"}</button></div>
          {error && <p className="review-error" role="alert">{error}</p>}
        </div>
      )}

      {error && !open && <p className="review-error review-global-error" role="alert">{error}</p>}

      <div className="review-thread-list">
        {reviews.length === 0 ? (
          <div className="review-empty-state"><span><MessageCircle size={22} /></span><h3>Start the conversation</h3><p>Be the first to share a thoughtful review. Your feedback helps shoppers and the shop owner.</p></div>
        ) : visibleReviews.map((review) => (
          <article key={review.id} className="review-thread">
            <div className="review-thread-main">
              <div className="review-avatar">{(review.user?.name || "S").trim().charAt(0).toUpperCase()}</div>
              <div className="review-thread-content">
                <div className="review-thread-author">
                  <strong>{review.user?.name || "Marketplace shopper"}</strong>
                  <time>{new Date(review.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time>
                </div>
                <div className="review-thread-stars">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={12} fill={star <= review.rating ? "currentColor" : "none"} />)}</div>
                <p className="review-thread-body">{review.body}</p>
                {review.userId === currentUserId && (
                  <div className="review-own-actions">
                    <button type="button" onClick={() => startReview(review)}><Pencil size={12} /> Edit</button>
                    <button type="button" onClick={() => void remove(review)} disabled={busy}><Trash2 size={12} /> Delete</button>
                  </div>
                )}
              </div>
            </div>

            {(review.replies || []).length > 0 && (
              <div className="review-replies">
                {(review.replies || []).map((reply) => {
                  const isShopReply = !!reply.connection;
                  const displayName = isShopReply ? "@" + reply.connection!.username : reply.user?.name || "Marketplace shopper";
                  return <div key={reply.id} className={"review-reply" + (isShopReply ? " review-reply-shop" : "")}>
                    <span className="review-reply-rail"><CornerDownRight size={15} /></span>
                    <div className={"review-reply-avatar" + (isShopReply ? " is-shop" : "")}>
                      {isShopReply && reply.connection?.profileImageUrl
                        ? <img src={reply.connection.profileImageUrl} alt="" />
                        : isShopReply ? <StoreIcon size={15} /> : (reply.user?.name || "S").trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="review-reply-content">
                      <div className="review-thread-author"><strong>{displayName}{isShopReply && <BadgeCheck size={13} />}</strong><time>{new Date(reply.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time></div>
                      {isShopReply && <span className="review-shop-reply-label">OFFICIAL SHOP REPLY</span>}
                      <p>{reply.body}</p>
                    </div>
                  </div>;
                })}
              </div>
            )}

            {currentUserId && (
              <div className="review-reply-actions">
                <button type="button" onClick={() => { setReplyOpen(replyOpen === review.id ? null : review.id); setReplyError((current) => ({ ...current, [review.id]: "" })); }}>
                  <MessageCircle size={13} /> Reply{(review.replies || []).length ? " (" + review.replies!.length + ")" : ""}
                </button>
                {isStoreOwner && <span className="review-reply-as-shop"><StoreIcon size={12} /> Replying as @{storeUsername}</span>}
              </div>
            )}
            {replyOpen === review.id && (
              <div className="review-reply-compose">
                <div className={"review-reply-avatar" + (isStoreOwner ? " is-shop" : "")}>
                  {isStoreOwner && storeProfileImageUrl ? <img src={storeProfileImageUrl} alt="" /> : isStoreOwner ? <StoreIcon size={15} /> : "Y"}
                </div>
                <div className="review-reply-compose-field">
                  <textarea value={replyDrafts[review.id] || ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [review.id]: event.target.value }))} maxLength={1000} rows={2} placeholder={isStoreOwner ? "Reply as @" + storeUsername + "…" : "Add a reply…"} />
                  <div className="review-reply-compose-bottom"><span>{(replyDrafts[review.id] || "").length}/1000</span><button type="button" onClick={() => void sendReply(review)} disabled={replyBusy === review.id}><Send size={13} /> {replyBusy === review.id ? "Sending…" : "Reply"}</button></div>
                  {replyError[review.id] && <p className="review-error" role="alert">{replyError[review.id]}</p>}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
      {presentation === "preview" && reviewUrl && reviews.length > 0 && (
        <div className="review-preview-more-wrap">
          <Link href={reviewUrl} className="review-preview-more">Show more reviews{reviews.length > previewLimit && <span>({reviews.length - previewLimit} more)</span>}<ChevronRight size={16} aria-hidden="true" /></Link>
        </div>
      )}
      </div>
    </section>
  );
}
