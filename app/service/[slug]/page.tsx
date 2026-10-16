import { db } from "@/lib/prisma";
import { user } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Instagram, Sparkles, Star, BriefcaseBusiness } from "lucide-react";
import { LikeButton } from "@/components/like-button";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductCarousel } from "@/components/product-carousel";
import { ProductInquiryButton } from "@/components/product-inquiry-button";
import { ReviewSection } from "@/components/review-section";
import { AnalyticsTracker } from "@/components/analytics-tracker";

export const dynamic = "force-dynamic";

export default async function Service({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const currentUser = await user();
  const service = await db().instagramPost.findUnique({
    where: { productSlug: slug },
    include: {
      connection: true,
      tags: true,
      likes: true,
      wishlistItems: currentUser ? { where: { userId: currentUser.id } } : { where: { userId: "__anonymous__" } },
      reviews: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!service || !service.isProduct || service.listingType !== "SERVICE") notFound();

  // Keep a private, account-linked history so shoppers can continue on another device.
  if (currentUser) {
    await db().recentlyViewedProduct.upsert({
      where: { userId_postId: { userId: currentUser.id, postId: service.id } },
      create: { userId: currentUser.id, postId: service.id, lastViewedAt: new Date() },
      update: { lastViewedAt: new Date(), viewCount: { increment: 1 } },
    });
  }

  const isVideo = String(service.mediaType || "").toUpperCase() === "VIDEO";
  const mediaUrl = service.mediaUrl || service.thumbnailUrl;
  const mediaItems = Array.isArray(service.mediaItems)
    ? (service.mediaItems as Array<{ mediaType: string; mediaUrl?: string | null; thumbnailUrl?: string | null }>)
    : null;
  const cleanCaption = service.caption ? service.caption.replace(/#[\p{L}\p{N}_]+/gu, "").trim() : "";
  const tags = service.tags.filter((tag) => tag.name !== "instagrammarket");
  const average = service.reviews.length
    ? service.reviews.reduce((sum, review) => sum + review.rating, 0) / service.reviews.length
    : 0;

  return (
    <main className="product-detail-page min-h-screen bg-white">
      <AnalyticsTracker connectionId={service.connectionId} postId={service.id} type="VIEW" />
      <div className="shell py-6 md:py-10">
        <Link href="/products" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#666] hover:text-black">
          <ArrowLeft size={15} /> Back to marketplace
        </Link>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,.92fr)] lg:items-start">
          <div className="product-gallery-sticky min-w-0">
            <div className="product-gallery-panel rounded-[30px] border border-black/[0.07] bg-[#f5f5f1] p-3 shadow-[0_20px_70px_rgba(0,0,0,0.06)] sm:p-5">
              <div className="product-gallery-frame">
                <ProductCarousel
                  items={mediaItems}
                  fallback={{ mediaType: isVideo ? "VIDEO" : "IMAGE", mediaUrl, thumbnailUrl: service.thumbnailUrl }}
                  title={service.productTitle || "Service"}
                />
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24">
            <section className="rounded-[30px] border border-black/[0.07] bg-white p-6 shadow-[0_20px_70px_rgba(0,0,0,0.07)] sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-white"><BriefcaseBusiness size={11} /> Service</span>
                <span className="rounded-full bg-[#f5f5f2] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-[#555]">{service.category} · {service.subcategory}</span>
                {service.connection.verifiedAt && <span className="rounded-full bg-[#f5f0df] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-[#8a6a16]">✓ Verified</span>}
              </div>

              <Link href={"/stores/" + service.connection.username} className="mt-5 inline-flex rounded-full border border-black/[0.08] bg-[#fafaf8] px-3 py-1.5 text-xs font-bold text-[#555]">
                @{service.connection.username}
              </Link>

              <h1 className="mt-5 text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-5xl">{service.productTitle || "Instagram service"}</h1>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex gap-0.5 text-[#d4a72c]">
                  {[1,2,3,4,5].map((star) => <Star key={star} size={17} fill={star <= Math.round(average) ? "currentColor" : "none"} />)}
                </div>
                <span className="text-sm font-bold text-[#555]">{service.reviews.length ? average.toFixed(1) : "New"}</span>
                <span className="text-sm text-[#999]">({service.reviews.length} {service.reviews.length === 1 ? "review" : "reviews"})</span>
              </div>

              <p className="mt-6 whitespace-pre-line text-[15px] leading-7 text-[#666]">
                {cleanCaption || "Discover this service from @" + service.connection.username + " and contact the provider directly on Instagram for pricing, availability and details."}
              </p>

              {tags.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{tags.map((tag) => <Link key={tag.name} href={"/products?tag=" + tag.name} className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[#555]">{tag.name}</Link>)}</div>}

              <div className="mt-7 grid grid-cols-3 gap-2">
                <div className="rounded-[18px] bg-[#f7f7f4] p-3.5"><b className="block text-lg font-black">{service.instagramLikeCount.toLocaleString()}</b><p className="mt-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#999]">IG likes</p></div>
                <div className="rounded-[18px] bg-[#f7f7f4] p-3.5"><b className="block text-lg font-black">{service.instagramCommentCount.toLocaleString()}</b><p className="mt-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#999]">Comments</p></div>
                <div className="rounded-[18px] bg-[#f7f7f4] p-3.5"><b className="block text-lg font-black">{service.wishlistItems.length}</b><p className="mt-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#999]">Wishlist</p></div>
              </div>

              <div className="mt-7 flex flex-col gap-3">
                <ProductInquiryButton username={service.connection.username} productTitle={service.productTitle || "this service"} postUrl={service.permalink || ""} />
                <div className="flex flex-wrap gap-3">
                  <LikeButton id={service.id} count={service.likes.length} initialLiked={service.likes.some((like) => like.userId === currentUser?.id)} />
                  <WishlistButton id={service.id} count={service.wishlistItems.length} wishlisted={service.wishlistItems.length > 0} />
                </div>
                {service.permalink && <a href={service.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-black/[0.1] bg-white px-5 py-3.5 text-sm font-bold hover:border-black hover:bg-black hover:text-white"><Instagram size={16} /> View original post <ArrowUpRight size={14} /></a>}
              </div>

              <div className="mt-6 border-t border-black/[0.07] pt-5">
                <p className="text-xs leading-5 text-[#777]"><b className="text-black">Contact the provider directly.</b> Ask for current pricing, availability, location and delivery details before booking.</p>
              </div>
            </section>
          </aside>
        </div>

        <ReviewSection type="product" targetId={service.id} reviews={service.reviews} currentUserId={currentUser?.id} title="Service reviews" />
      </div>
    </main>
  );
}
