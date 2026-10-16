import Link from "next/link";
import { BadgeCheck, Crown, Instagram, MessageCircle, Star, ArrowUpRight } from "lucide-react";
import { db } from "@/lib/prisma";
import { user } from "@/lib/auth";
import { ProductCard } from "@/components/product-card";
import { StoreReviewsDrawer } from "@/components/store-reviews-drawer";
import { notFound } from "next/navigation";
import { filterAvailableInstagramMedia } from "@/lib/instagram-media";
import { AnalyticsTracker } from "@/components/analytics-tracker";

export const dynamic = "force-dynamic";

export default async function Store({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ reviews?: string }>;
}) {
  const { username } = await params;
  const { reviews: reviewsParam } = await searchParams;

  const [store, currentUser] = await Promise.all([
    db().instagramConnection.findUnique({
      where: { username },
      include: {
        reviews: {
          include: {
            user: { select: { id: true, name: true } },
            replies: {
              include: {
                user: { select: { id: true, name: true } },
                connection: { select: { id: true, username: true, profileImageUrl: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        posts: {
          where: { isProduct: true },
          include: { connection: true, tags: true, likes: true, wishlistItems: true },
          orderBy: { timestamp: "desc" },
        },
      },
    }),
    user(),
  ]);

  if (!store) notFound();

  const posts = await filterAvailableInstagramMedia(store.posts);
  const average =
    store.reviews.length > 0
      ? store.reviews.reduce((sum, review) => sum + review.rating, 0) / store.reviews.length
      : 0;
  const isPro = !!store.proUntil && new Date(store.proUntil) > new Date();
  const isVerified = !!store.verifiedAt && (!store.verifiedUntil || new Date(store.verifiedUntil) > new Date());
  const hasGrowth = isVerified || isPro;

  return (
    <main className="store-page">
      <AnalyticsTracker connectionId={store.id} type="VIEW" />
      <section className="store-hero" style={{ "--store-accent": store.profileAccentColor || "#a78bfa" } as React.CSSProperties}>
        <div className="store-hero-orb store-hero-orb-a" />
        <div className="store-hero-orb store-hero-orb-b" />
        <div className="shell store-hero-inner">
          <div className="store-profile">
            <div className="store-avatar-wrap">
              <div className={"store-avatar" + (isVerified ? " store-avatar-verified" : "")}>
                {store.profileImageUrl ? (
                  <img src={store.profileImageUrl} alt={"@" + store.username} />
                ) : (
                  <span>@</span>
                )}
              </div>
              {isVerified && <span className="store-avatar-check" title="Verified shop" aria-label="Verified shop"><BadgeCheck size={18} strokeWidth={2.8} /></span>}
            </div>

            <div className="store-hero-copy">
              <div className="store-kicker-row">
                <span className="store-kicker"><Instagram size={13} /> Instagram shop</span>
                {isPro && <span className="store-profile-pro" title="Pro Seller" aria-label="Pro Seller"><Crown size={16} strokeWidth={2.5} /><span>Pro Seller</span></span>}
              </div>
              <h1>@{store.username}</h1>
              <p className="store-hero-bio">
                {store.biography || "Discover products and services from this Instagram business on Instagram Market."}
              </p>
              <div className="store-hero-stats">
                <span><b>{posts.length}</b> {posts.length === 1 ? "listing" : "listings"}</span>
                <span><b>{store.reviews.length}</b> reviews</span>
                {average > 0 && <span><Star size={13} fill="currentColor" /> <b>{average.toFixed(1)}</b></span>}
              </div>
            </div>

            <div className="store-hero-actions">
              <Link href={"/store/" + store.username + "?reviews=1"} className="store-review-button">
                <Star size={15} fill="currentColor" /> Reviews
              </Link>
              <a href={"https://www.instagram.com/" + store.username + "/"} target="_blank" rel="noreferrer" className="store-instagram-button">
                Visit Instagram <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="shell store-content">
        <div className="store-content-head">
          <div>
            <span className="store-section-kicker">The collection</span>
            <h2>Shop from @{store.username}</h2>
            <p>Products and services shared by this store on Instagram.</p>
          </div>
          <Link href="/products" className="store-browse-link">Browse marketplace <ArrowUpRight size={14} /></Link>
        </div>

        {posts.length > 0 ? (
          <div className="store-product-grid">
            {posts.map((post: any) => <ProductCard key={post.id} p={post} />)}
          </div>
        ) : (
          <div className="store-empty">
            <div className="store-empty-icon"><Instagram size={20} /></div>
            <h3>More from this shop is on the way.</h3>
            <p>This store is connected, but there are no available marketplace listings right now.</p>
            <a href={"https://www.instagram.com/" + store.username + "/"} target="_blank" rel="noreferrer">See @{store.username} on Instagram <ArrowUpRight size={14} /></a>
          </div>
        )}

        <div className="store-review-teaser">
          <div className="store-review-teaser-rating">
            <div className="store-review-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={16} fill={star <= Math.round(average) ? "currentColor" : "none"} />
              ))}
            </div>
            <b>{average ? average.toFixed(1) : "New"}</b>
          </div>
          <div className="store-review-teaser-copy">
            <span>Shopper feedback</span>
            <strong>{store.reviews.length ? store.reviews.length + " reviews from the community" : "Be the first to share your experience"}</strong>
          </div>
          <Link href={"/store/" + store.username + "?reviews=1"} className="store-review-open">
            <MessageCircle size={15} /> Open reviews <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      {reviewsParam === "1" && (
        <StoreReviewsDrawer
          username={store.username}
          storeId={store.id}
          reviews={store.reviews.map((review) => ({
            ...review,
            createdAt: review.createdAt.toISOString(),
            updatedAt: review.updatedAt.toISOString(),
            replies: review.replies.map((reply) => ({
              ...reply,
              createdAt: reply.createdAt.toISOString(),
              updatedAt: reply.updatedAt.toISOString(),
            })),
          }))}
          currentUserId={currentUser?.id}
          storeOwnerUserId={store.connectedByUserId}
          storeProfileImageUrl={store.profileImageUrl}
        />
      )}
    </main>
  );
}
