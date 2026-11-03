"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";

type CommentItem = {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  user: { id: string; name: string | null };
  likeCount: number;
  likedByMe: boolean;
};

export function ListingComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [draft, setDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [liking, setLiking] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/listing-comments?postId=" + encodeURIComponent(postId), { cache: "no-store" });
      const data = await response.json();
      if (response.ok) setComments(data.comments || []);
      else setError(data.error || "Comments could not be loaded.");
    } catch { setError("Comments could not be loaded. Check your connection."); }
    finally { setLoaded(true); }
  }, [postId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const topLevel = useMemo(() => comments.filter((comment) => !comment.parentId), [comments]);
  const repliesFor = (id: string) => comments.filter((comment) => comment.parentId === id);

  async function submit(parentId: string | null = null) {
    const body = (parentId ? replyDrafts[parentId] : draft || "").trim();
    if (!body) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/listing-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, parentId, body }),
      });
      const data = await response.json();
      if (!response.ok || !data.comment?.id) {
        if (response.status === 401) {
          window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname + window.location.search);
          return;
        }
        setError(data.error || "Your comment could not be posted.");
        return;
      }
      setComments((current) => [...current, data.comment]);
      if (parentId) {
        setReplyDrafts((current) => ({ ...current, [parentId]: "" }));
        setReplyingTo(null);
      } else setDraft("");
    } catch { setError("Connection problem. Your comment was not confirmed as posted."); }
    finally { setBusy(false); }
  }

  async function toggleLike(comment: CommentItem) {
    if (liking) return;
    setLiking(comment.id);
    setError("");
    try {
      const response = await fetch("/api/listing-comments/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: comment.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname + window.location.search);
          return;
        }
        setError(data.error || "Could not update comment like.");
        return;
      }
      setComments((current) => current.map((item) => item.id === comment.id ? { ...item, likedByMe: data.liked, likeCount: data.likeCount } : item));
    } catch { setError("Connection problem. Like was not confirmed."); }
    finally { setLiking(null); }
  }

  const avatar = (comment: CommentItem) => (comment.user?.name || "S").trim().charAt(0).toUpperCase();
  const date = (value: string) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <section className="listing-comments" aria-label="Comments">
      <div className="listing-comments-heading">
        <div><span className="listing-comments-kicker">COMMUNITY</span><h2>Comments <span>{comments.length}</span></h2></div>
        <MessageCircle size={19} />
      </div>

      <div className="listing-comment-composer">
        <div className="listing-comment-avatar listing-comment-avatar-you">Y</div>
        <div className="listing-comment-composer-main">
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1000} rows={2} placeholder="Share your thoughts or ask the seller a question…" />
          <div className="listing-comment-composer-footer"><span>{draft.length}/1000</span><button type="button" onClick={() => void submit()} disabled={busy || !draft.trim()}><Send size={14}/>{busy ? "Posting…" : "Post comment"}</button></div>
        </div>
      </div>

      {error && <p className="listing-comments-error" role="alert">{error}</p>}
      <div className="listing-comments-list">
        {!loaded ? <p className="listing-comments-muted">Loading comments…</p> : topLevel.length === 0 ? (
          <div className="listing-comments-empty"><MessageCircle size={22}/><strong>Start the conversation</strong><span>Be the first to leave a comment.</span></div>
        ) : topLevel.map((comment) => (
          <article className="listing-comment" key={comment.id}>
            <div className="listing-comment-row">
              <div className="listing-comment-avatar">{avatar(comment)}</div>
              <div className="listing-comment-main">
                <div className="listing-comment-meta"><strong>{comment.user?.name || "SokoLink shopper"}</strong><time>{date(comment.createdAt)}</time></div>
                <p>{comment.body}</p>
                <div className="listing-comment-actions">
                  <button type="button" className={comment.likedByMe ? "is-liked" : ""} onClick={() => void toggleLike(comment)} disabled={liking === comment.id}><Heart size={14} fill={comment.likedByMe ? "currentColor" : "none"}/>{comment.likeCount > 0 ? comment.likeCount : "Like"}</button>
                  <button type="button" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}><MessageCircle size={14}/>Reply{repliesFor(comment.id).length ? " · " + repliesFor(comment.id).length : ""}</button>
                </div>
              </div>
            </div>
            {repliesFor(comment.id).length > 0 && <div className="listing-comment-replies">{repliesFor(comment.id).map((reply) => (
              <div className="listing-comment-reply" key={reply.id}>
                <div className="listing-comment-avatar listing-comment-avatar-reply">{avatar(reply)}</div>
                <div className="listing-comment-main">
                  <div className="listing-comment-meta"><strong>{reply.user?.name || "SokoLink shopper"}</strong><time>{date(reply.createdAt)}</time></div>
                  <p>{reply.body}</p>
                  <div className="listing-comment-actions"><button type="button" className={reply.likedByMe ? "is-liked" : ""} onClick={() => void toggleLike(reply)} disabled={liking === reply.id}><Heart size={13} fill={reply.likedByMe ? "currentColor" : "none"}/>{reply.likeCount > 0 ? reply.likeCount : "Like"}</button></div>
                </div>
              </div>
            ))}</div>}
            {replyingTo === comment.id && <div className="listing-comment-reply-composer"><textarea value={replyDrafts[comment.id] || ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [comment.id]: event.target.value }))} rows={2} maxLength={1000} placeholder={"Reply to " + (comment.user?.name || "this comment") + "…"} /><button type="button" onClick={() => void submit(comment.id)} disabled={busy || !(replyDrafts[comment.id] || "").trim()}><Send size={13}/>Reply</button></div>}
          </article>
        ))}
      </div>
    </section>
  );
}
