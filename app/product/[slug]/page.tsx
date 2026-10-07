import { db } from "@/lib/prisma";
import { user } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Instagram, Sparkles, Star } from "lucide-react";
import { LikeButton } from "@/components/like-button";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductCarousel } from "@/components/product-carousel";
import { ProductInquiryButton } from "@/components/product-inquiry-button";
import { ReviewSection } from "@/components/review-section";

export const dynamic = "force-dynamic";

export default async function Product({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const currentUser = await user();
  const product = await db().instagramPost.findUnique({
    where: { productSlug: slug },
    include: {
      connection: true,
      tags: true,
      likes: true,
      wishlistItems: currentUser ? { where: { userId: currentUser.id } } : { where: { userId: "__anonymous__" } },
      reviews: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!product || !product.isProduct) notFound();

  const isVideo = String(product.mediaType || "").toUpperCase() === "VIDEO";
  const mediaUrl = product.mediaUrl || product.thumbnailUrl;
  const carouselItems = Array.isArray(product.mediaItems) ? (product.mediaItems as Array<{ mediaType: string; mediaUrl?: string | null; thumbnailUrl?: string | null }>) : null;
  const cleanCaption = product.caption ? product.caption.replace(/#[\\p{L}\\p{N}_]+/gu, "").trim() : "";
  const tags = product.tags.filter((tag) => tag.name !== "instagrammarket");
  const average = product.reviews.length
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
    : 0;

  return (
    <main className="product-detail-page min-h-screen bg-white">
      <div className="shell py-6 md:py-10">
        <Link href="/shop" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#666] transition hover:text-black">
          <ArrowLeft size={15} /> Back to shop
        </Link>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,.92fr)] lg:items-start">
          <div className="product-gallery-sticky min-w-0">
            <ProductGallery mediaUrl={mediaUrl} thumbnailUrl={product.thumbnailUrl} isVideo={isVideo} title={product.productTitle || "Product"} mediaItems={carouselItems} />
          </div>

          <aside className="lg:sticky lg:top-24">
            <section className="rounded-[30px] border border-black/[0.07] bg-white p-6 shadow-[0_20px_70px_rgba(0,0,0,0.07)] sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-white"><Sparkles size={11} /> Instagram Market</span>
                {product.connection.verifiedAt && <span className="rounded-full bg-[#f5f0df] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-[#8a6a16]">✓ Verified</span>}
                {product.connection.proUntil && new Date(product.connection.proUntil) > new Date() && <span className="rounded-full bg-[#efe7ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-[#5b21b6]">Pro Seller</span>}
              </div>

              <Link href={"/store/" + product.connection.username} className="mt-5 inline-flex items-center rounded-full border border-black/[0.08] bg-[#fafaf8] px-3 py-1.5 text-xs font-bold text-[#555] transition hover:border-black hover:text-black">
                @{product.connection.username}
              </Link>

              {product.boostUntil && new Date(product.boostUntil) > new Date() && (
                <div className="mt-5 inline-flex rounded-full bg-[#111] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-white">Boosted product</div>
              )}

              <h1 className="mt-5 text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-5xl">{product.productTitle}</h1>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex gap-0.5 text-[#d4a72c]">
                  {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={17} fill={star <= Math.round(average) ? "currentColor" : "none"} />)}
                </div>
                <span className="text-sm font-bold text-[#555]">{product.reviews.length ? average.toFixed(1) : "New"}</span>
                <span className="text-sm text-[#999]">({product.reviews.length} {product.reviews.length === 1 ? "review" : "reviews"})</span>
              </div>

              {cleanCaption && (
                <p className="mt-6 whitespace-pre-line text-[15px] leading-7 text-[#666]">{cleanCaption}</p>
              )}

              {tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {tags.map((tag) => <Link key={tag.name} href={"/products?tag=" + tag.name} className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[#555] transition hover:border-black hover:bg-black hover:text-white">#{tag.name}</Link>)}
                </div>
              )}

              <div className="mt-7 grid grid-cols-3 gap-2">
                <div className="rounded-[18px] bg-[#f7f7f4] p-3.5"><b className="block text-lg font-black">{product.instagramLikeCount.toLocaleString()}</b><p className="mt-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#999]">IG likes</p></div>
                <div className="rounded-[18px] bg-[#f7f7f4] p-3.5"><b className="block text-lg font-black">{product.instagramCommentCount.toLocaleString()}</b><p className="mt-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#999]">Comments</p></div>
                <div className="rounded-[18px] bg-[#f7f7f4] p-3.5"><b className="block text-lg font-black">{product.likes.length}</b><p className="mt-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#999]">Likes</p></div>
              </div>

              <div className="mt-7 flex flex-col gap-3">
                <ProductInquiryButton username={product.connection.username} productTitle={product.productTitle || "this product"} postUrl={product.permalink || ""} />
                <div className="flex flex-wrap gap-3">
                  <LikeButton id={product.id} count={product.likes.length} initialLiked={product.likes.some((like) => like.userId === currentUser?.id)} />
                  <WishlistButton id={product.id} count={product.wishlistItems.length} wishlisted={product.wishlistItems.length > 0} />
                  {product.permalink && <a href={product.permalink} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-black/[0.1] bg-white px-5 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 hover:border-black hover:bg-black hover:text-white"><Instagram size={16} /> View original post <ArrowUpRight size={14} /></a>}
                </div>
              </div>

              <div className="mt-6 border-t border-black/[0.07] pt-5">
                <p className="text-xs leading-5 text-[#777]"><b className="text-black">Shop directly with the seller.</b> Ask for the latest price, stock and delivery information before ordering.</p>
              </div>
            </section>
          </aside>
        </div>

        <ReviewSection type="product" targetId={product.id} reviews={product.reviews} currentUserId={currentUser?.id} title="Product reviews" />
      </div>
    </main>
  );
}

function ProductGallery({ mediaUrl, thumbnailUrl, isVideo, title, mediaItems }: { mediaUrl?: string | null; thumbnailUrl?: string | null; isVideo: boolean; title: string; mediaItems?: Array<{ mediaType: string; mediaUrl?: string | null; thumbnailUrl?: string | null }> | null }) {
  return (
    <div className="product-gallery-panel rounded-[30px] border border-black/[0.07] bg-[#f5f5f1] p-3 shadow-[0_20px_70px_rgba(0,0,0,0.06)] sm:p-5">
      <div className="product-gallery-frame">
        <ProductCarousel items={mediaItems} fallback={{ mediaType: isVideo ? "VIDEO" : "IMAGE", mediaUrl, thumbnailUrl }} title={title} />
      </div>
    </div>
  );
}
