"use client";

import { useEffect, useState } from "react";
import { Instagram, MessageCircle } from "lucide-react";

type InstagramComment = {
  id: string;
  text: string;
  username: string;
  timestamp: string | null;
};

export function InstagramCommentsReviews({ postId }: { postId: string }) {
  const [comments, setComments] = useState<InstagramComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadComments() {
      setLoading(true);
      try {
        const response = await fetch(
          "/api/products/" + encodeURIComponent(postId) + "/instagram-comments",
          { cache: "no-store", signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error("Could not load Instagram comments.");
        setComments(Array.isArray(data.comments) ? data.comments : []);
        setUnavailable(Boolean(data.unavailable));
      } catch {
        if (!controller.signal.aborted) setUnavailable(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadComments();
    return () => controller.abort();
  }, [postId]);

  return (
    <section className="review-community mt-8" aria-labelledby="instagram-comments-heading">
      <header className="review-community-head">
        <div className="review-community-heading">
          <span className="review-community-eyebrow"><Instagram size={13} /> FROM INSTAGRAM</span>
          <h2 id="instagram-comments-heading">Instagram comments</h2>
          <p>Conversation from the original post, shown alongside shopper reviews.</p>
          <div className="review-community-rating">
            <MessageCircle size={15} />
            <strong>{loading ? "…" : comments.length}</strong>
            <span>{comments.length === 1 ? "comment" : "comments"}</span>
          </div>
        </div>
        <a
          href="https://www.instagram.com/"
          target="_blank"
          rel="noreferrer"
          className="review-write-button"
        >
          <Instagram size={15} /> Instagram
        </a>
      </header>

      {loading ? (
        <div className="review-empty-state"><span><MessageCircle size={22} /></span><h3>Loading Instagram comments</h3><p>Fetching comments from the original post…</p></div>
      ) : comments.length > 0 ? (
        <div className="review-thread-list">
          {comments.map((comment) => (
            <article key={comment.id} className="review-thread">
              <div className="review-thread-main">
                <div className="review-avatar">@</div>
                <div className="review-thread-content">
                  <div className="review-thread-author">
                    <strong>@{comment.username.replace(/^@/, "")}</strong>
                    {comment.timestamp && (
                      <time dateTime={comment.timestamp}>
                        {new Date(comment.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </time>
                    )}
                  </div>
                  <span className="review-shop-reply-label">INSTAGRAM COMMENT</span>
                  <p className="review-thread-body">{comment.text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="review-empty-state">
          <span><MessageCircle size={22} /></span>
          <h3>{unavailable ? "Comments could not be loaded" : "No Instagram comments found"}</h3>
          <p>{unavailable
            ? "Instagram did not return comments right now. Shopper reviews are still available above."
            : "When Instagram makes comments available for this post, they will appear here. Shopper reviews are shown above."}</p>
        </div>
      )}
    </section>
  );
}
