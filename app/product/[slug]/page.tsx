import { db } from "@/lib/prisma";
import { user } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Instagram, Star, ShieldCheck, Package, ShoppingBag, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { LikeButton } from "@/components/like-button";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductCarousel } from "@/components/product-carousel";
import { ProductInquiryButton } from "@/components/product-inquiry-button";
import { ReviewSection } from "@/components/review-section";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { ProductDetailStats } from "@/components/product-detail-stats";
import { WriteReviewButton } from "@/components/write-review-button";

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

  // Keep a private, account-linked history so shoppers can continue on another device.
  if (currentUser) {
    await db().recentlyViewedProduct.upsert({
      where: { userId_postId: { userId: currentUser.id, postId: product.id } },
      create: { userId: currentUser.id, postId: product.id, lastViewedAt: new Date() },
      update: { lastViewedAt: new Date(), viewCount: { increment: 1 } },
    });
  }

  const isVideo = String(product.mediaType || "").toUpperCase() === "VIDEO";
  const mediaUrl = product.mediaUrl || product.thumbnailUrl;
  const carouselItems = Array.isArray(product.mediaItems) ? (product.mediaItems as Array<{ mediaType: string; mediaUrl?: string | null; thumbnailUrl?: string | null }>) : null;
  const fullCaption = product.caption
    ? product.caption
        .replace(/#[\p{L}\p{N}_]+/gu, "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line, index, lines) => index === 0 || line !== lines[0])
        .join("\n")
        .trim()
    : "";
  const tags = product.tags.filter((tag) => tag.name !== "instagrammarket");
  const categoryLabels = [...new Set([product.category, product.subcategory, ...tags.map((tag) => tag.name)].filter((value): value is string => Boolean(value?.trim())))];
  const average = product.reviews.length
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
    : 0;
  const totalLikes = Number(product.instagramLikeCount || 0) + product.likes.length;

  const relatedProducts = await db().instagramPost.findMany({
    where: {
      isProduct: true,
      listingType: "PRODUCT",
      productSlug: { not: slug },
      OR: [
        ...(product.category ? [{ category: product.category }] : []),
        ...(product.subcategory ? [{ subcategory: product.subcategory }] : []),
        ...(product.tags.length ? [{ tags: { some: { name: { in: product.tags.map((tag) => tag.name) } } } }] : []),
      ],
    },
    include: {
      connection: true,
      tags: true,
      likes: true,
    },
    orderBy: [{ instagramLikeCount: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  return (
    <main className="product-detail-page min-h-screen bg-white">
      <AnalyticsTracker connectionId={product.connectionId} postId={product.id} type="VIEW" />
      <div className="shell py-5 sm:py-7 md:py-10">
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,.92fr)] lg:gap-8 lg:items-start">
          <div className="product-gallery-sticky min-w-0">
            <ProductGallery mediaUrl={mediaUrl} thumbnailUrl={product.thumbnailUrl} isVideo={isVideo} title={product.productTitle || "Product"} mediaItems={carouselItems} />
          </div>

          <aside className="product-detail-aside min-w-0 lg:sticky lg:top-24">
            <section className="product-info-card min-w-0 rounded-[26px] border border-black/[0.07] bg-white p-5 sm:rounded-[30px] sm:p-7 md:p-8">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ededeb] pb-4">
                  <div className="min-w-0 flex-1">
                    <ProductDetailStats id={product.id} initialLikes={totalLikes} reviews={product.reviews.length} rating={average} initiallyLiked={product.likes.some((like) => like.userId === currentUser?.id)} reviewUrl={"/product/" + slug + "/reviews"} />
                  </div>
                  <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
                    <LikeButton id={product.id} count={totalLikes} compact largeCompact initialLiked={product.likes.some((like) => like.userId === currentUser?.id)} />
                    <WishlistButton id={product.id} count={product.wishlistItems.length} compact largeCompact productDetailStyle wishlisted={product.wishlistItems.length > 0} />
                  </div>
                </div>
                <div className="w-full">
                  <WriteReviewButton reviewUrl={"/product/" + slug + "/reviews"} />
                </div>
              </div>

              <div className="product-seller-wrap mt-5"><span className="product-seller-label">SOLD BY</span><Link href={"/stores/" + product.connection.username} className="product-seller-link inline-flex max-w-full items-center gap-3 rounded-2xl border border-[#e9e9e9] bg-white px-3 py-3 text-sm font-bold text-[#222] transition hover:border-black"><span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f0f0ee] ring-1 ring-black/5">{product.connection.profileImageUrl ? <img src={product.connection.profileImageUrl} alt={"@" + product.connection.username} className="h-full w-full object-cover" /> : <span className="text-sm font-black text-[#777]">{product.connection.username.slice(0, 1).toUpperCase()}</span>}</span><span className="flex min-w-0 flex-1 flex-col gap-1"><span className="truncate">@{product.connection.username}</span><span className="text-[11px] font-medium text-[#888]">Visit shop profile</span></span>{product.connection.verifiedAt && <ShieldCheck size={17} className="shrink-0 text-[#8a6a16]" />}{product.connection.proUntil && new Date(product.connection.proUntil) > new Date() && <span className="rounded-full bg-[#f4f4f2] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#555]">Pro</span>}<ArrowRight size={16} className="shrink-0 text-[#777]" /></Link></div>

              {product.boostUntil && new Date(product.boostUntil) > new Date() && (
                <div className="mt-5 inline-flex rounded-full bg-[#111] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-white">Promoted</div>
              )}

              <h1 className="product-detail-title mt-5 break-words text-[20px] font-black leading-[1.6] tracking-[-.055em] text-black">{product.productTitle?.trim() || fullCaption || "Product"}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <div className="flex gap-0.5 text-[#d4a72c]" aria-label={average ? `Rated ${average.toFixed(1)} out of 5` : "No ratings yet"}>
                  {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={16} fill={star <= Math.round(average) ? "currentColor" : "none"} />)}
                </div>
                <span className="text-sm font-bold text-[#333]">{product.reviews.length ? average.toFixed(1) : "New"}</span>
                <Link href={"/product/" + slug + "/reviews"} className="text-sm text-[#777] underline-offset-4 hover:underline">({product.reviews.length} {product.reviews.length === 1 ? "review" : "reviews"})</Link>
              </div>

                            {fullCaption && (
                <div className="mt-5 border-t border-[#ededeb] pt-4">
                  <h2 className="mb-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#999]">About this product</h2>
                  <p className="whitespace-pre-line break-words text-sm leading-6 text-[#555]">{fullCaption}</p>
                </div>
              )}



              {categoryLabels.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2" aria-label="Product categories">
                  {categoryLabels.map((category) => <Link key={category} href={"/shop?category=" + encodeURIComponent(category)} className="rounded-full border border-[#e8e8e8] bg-[#f7f7f4] px-3 py-1.5 text-xs font-semibold text-[#171717] transition hover:border-black hover:bg-black hover:text-white">{category}</Link>)}
                </div>
              )}

              {product.reviews.length > 0 && (
                <div className="product-detail-review-preview mt-5 border-t border-[#ededeb] pt-5">
                  <ReviewSection type="product" presentation="preview" previewLimit={1} reviewUrl={"/product/" + slug + "/reviews"} targetId={product.id} reviews={product.reviews} currentUserId={currentUser?.id} title="Shopper reviews" />
                </div>
              )}

              <div className="product-action-stack mt-6 flex flex-row items-stretch gap-2 sm:mt-7">
                <ProductInquiryButton username={product.connection.username} productTitle={product.productTitle || "this product"} postUrl={product.permalink || ""} />
                {product.permalink && <a href={product.permalink} target="_blank" rel="noreferrer" className="product-view-button inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#dededb] bg-white px-3 py-3.5 text-center text-xs font-bold text-[#171717] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-black hover:bg-[#f7f7f4] hover:text-black hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:gap-2 sm:px-5 sm:py-4 sm:text-sm"><Instagram size={16} className="shrink-0" /> <span>View original post</span> <ArrowUpRight size={14} className="shrink-0" /></a>}
              </div>

              <div className="mt-6 border-t border-black/[0.07] pt-5">
                <p className="text-xs leading-5 text-[#777]"><b className="text-black">Shop directly with the seller.</b> Ask for the latest price, stock and delivery information before ordering.</p>
              </div>
            </section>
          </aside>
        </div>

        <div className="product-detail-lower-content">
          {relatedProducts.length > 0 && (
            <section className="product-recommendations mt-12 sm:mt-16" aria-labelledby="related-products-heading">
              <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#888]"><ShoppingBag size={13} /> Keep exploring</p>
                  <h2 id="related-products-heading" className="text-2xl font-black tracking-[-.05em] text-[#171717] sm:text-3xl">You might also like</h2>
                  <p className="mt-2 text-sm text-[#777]">More finds from SokoLink shops, picked for their similarity.</p>
                </div>
                <Link href="/shop" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#e8e8e8] px-4 py-2.5 text-xs font-bold transition hover:border-black hover:bg-black hover:text-white">Explore shop <ArrowRight size={14} /></Link>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
                {relatedProducts.map((item) => <ProductCard key={item.id} p={{...item, totalLikes: Number(item.instagramLikeCount || 0) + item.likes.length}} />)}
              </div>
            </section>
          )}
        </div>
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
