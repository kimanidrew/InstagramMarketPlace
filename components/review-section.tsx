"use client";

import { Pencil, Star, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

type Review = {
  id: string;
  userId: string;
  rating: number;
  body: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: { id: string; name: string | null };
};

export function ReviewSection({
  type,
  targetId,
  reviews: initialReviews,
  currentUserId,
  title = "Reviews",
}: {
  type: "store" | "product";
  targetId: string;
  reviews: Review[];
  currentUserId?: string | null;
  title?: string;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState<Review | null>(
    initialReviews.find((review) => review.userId === currentUserId) || null,
  );
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const average = useMemo(
    () => (reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0),
    [reviews],
  );

  function startReview(review?: Review) {
    if (!currentUserId) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
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
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, targetId, rating, body }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not save your review.");
        return;
      }

      setReviews((current) => {
        const exists = current.some((review) => review.id === data.review.id);
        return exists ? current.map((review) => review.id === data.review.id ? data.review : review) : [data.review, ...current];
      });
      setEditing(data.review);
      setOpen(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(review: Review) {
    if (!window.confirm("Delete your review?")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/reviews/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id: review.id }),
      });
      if (response.ok) {
        setReviews((current) => current.filter((item) => item.id !== review.id));
        if (editing?.id === review.id) setEditing(null);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-[30px] border border-black/[0.07] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight">{title}</h2>
            {reviews.length > 0 && (
              <span className="rounded-full bg-[#f4f4f1] px-3 py-1 text-xs font-bold text-[#555]">
                {reviews.length}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex gap-0.5 text-[#d4a72c]">
              {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} fill={star <= Math.round(average) ? "currentColor" : "none"} />)}
            </div>
            <span className="text-sm font-semibold text-[#666]">
              {reviews.length ? average.toFixed(1) : "No ratings yet"}
            </span>
          </div>
        </div>

        <button
          onClick={() => startReview(editing || undefined)}
          className="rounded-full bg-black px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#222]"
        >
          {editing ? "Edit your review" : "Write a review"}
        </button>
      </div>

      {open && (
        <div className="mt-6 rounded-[24px] bg-[#f7f7f4] p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-black">{editing ? "Edit your review" : "Share your experience"}</h3>
            <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white"><X size={17} /></button>
          </div>
          <div className="mt-5 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)} aria-label={star + " stars"} className="rounded-full p-1 transition hover:scale-110">
                <Star size={25} fill={star <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={1000}
            rows={4}
            placeholder={type === "store" ? "How was your experience with this store?" : "What did you think about this product?"}
            className="mt-4 w-full resize-none rounded-[18px] border border-black/[0.08] bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-[#888]">{body.length}/1000</span>
            {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={save} disabled={busy} className="rounded-full bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
              {busy ? "Saving..." : editing ? "Save changes" : "Post review"}
            </button>
            <button onClick={() => setOpen(false)} className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold">Cancel</button>
          </div>
        </div>
      )}

      <div className="mt-7 space-y-3">
        {reviews.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-black/10 bg-[#fafaf8] px-5 py-8 text-center">
            <p className="font-bold">Be the first to review</p>
            <p className="mt-1 text-sm text-[#888]">Your experience can help other shoppers decide.</p>
          </div>
        ) : reviews.map((review) => (
          <article key={review.id} className="rounded-[22px] border border-black/[0.06] bg-[#fafaf8] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold">{review.user?.name || "Marketplace shopper"}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="flex gap-0.5 text-[#d4a72c]">{[1,2,3,4,5].map((star) => <Star key={star} size={12} fill={star <= review.rating ? "currentColor" : "none"} />)}</span>
                  <span className="text-[11px] text-[#999]">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {review.userId === currentUserId && (
                <div className="flex gap-1">
                  <button onClick={() => startReview(review)} aria-label="Edit review" className="rounded-full p-2 hover:bg-white"><Pencil size={14} /></button>
                  <button onClick={() => remove(review)} aria-label="Delete review" className="rounded-full p-2 text-red-600 hover:bg-white"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#555]">{review.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
