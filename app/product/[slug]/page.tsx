import { db } from "@/lib/prisma";
import { user } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Instagram, ShieldCheck, Package, ShoppingBag, ArrowRight } from "lucide-react";
import { LikeButton } from "@/components/like-button";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductCarousel } from "@/components/product-carousel";
import { ProductInquiryButton } from "@/components/product-inquiry-button";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { ListingComments } from "@/components/listing-comments";

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
        <div className="product-detail-modal-layout grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,.92fr)] lg:gap-5 lg:items-stretch">
          <div className="product-gallery-sticky min-w-0">
            <ProductGallery mediaUrl={mediaUrl} thumbnailUrl={product.thumbnailUrl} isVideo={isVideo} title={product.productTitle || "Product"} mediaItems={carouselItems} />
          </div>


          <div className="product-detail-scroll-area min-w-0"><aside className="product-detail-aside min-w-0">
            <section className="product-info-card min-w-0 rounded-[26px] border border-black/[0.07] bg-white p-5 sm:rounded-[30px] sm:p-7 md:p-8">
              <div className="listing-detail-actions flex items-center gap-2 border-b border-[#ededeb] pb-5">
                <Link href={"/stores/" + product.connection.username} className="listing-seller-action group inline-flex w-fit max-w-full flex-none items-center gap-3 bg-transparent py-1 transition-colors duration-200">
                  <span className="listing-seller-avatar flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f0f0ed] p-[2px] text-base font-black text-[#666]">{product.connection.profileImageUrl ? <img src={product.connection.profileImageUrl} alt="" className="h-full w-full rounded-full object-cover transition-transform duration-200 group-hover:scale-110" /> : <span className="flex h-full w-full items-center justify-center rounded-full bg-[#e8e8e4]">{product.connection.username.slice(0, 1).toUpperCase()}</span>}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-extrabold tracking-[-.02em] text-[#171717]">@{product.connection.username}</span><span className="mt-1 block text-[10px] font-semibold text-[#8b8b84]">Visit shop</span></span>
                  {product.connection.verifiedAt && <span className="listing-seller-verified inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f6f1df] px-2 py-1 text-[9px] font-extrabold text-[#8a6a16]"><ShieldCheck size={12}/> Verified</span>}
                </Link>
                <div className="listing-detail-social-actions flex shrink-0 items-center gap-2">
                  <LikeButton id={product.id} count={totalLikes} compact largeCompact initialLiked={product.likes.some((like) => like.userId === currentUser?.id)} />
                  <WishlistButton id={product.id} count={product.wishlistItems.length} compact largeCompact productDetailStyle wishlisted={product.wishlistItems.length > 0} />
                </div>
              </div>
              {product.boostUntil && new Date(product.boostUntil) > new Date() && <div className="mt-5 inline-flex rounded-full bg-[#111] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-white">Promoted</div>}
              <div className="mt-5">
                <h1 className="product-detail-title break-words text-[clamp(1.65rem,3vw,2.3rem)] font-black leading-[1.12] tracking-[-.055em] text-black">{product.productTitle?.trim() || "Product"}</h1>
                {fullCaption && <p className="mt-5 whitespace-pre-line break-words text-sm leading-7 text-[#555]">{fullCaption}</p>}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 border-y border-[#ededeb] py-5">
                <div className="rounded-2xl bg-[#f7f7f5] p-3"><strong className="block text-lg font-black tabular-nums">{totalLikes.toLocaleString()}</strong><span className="mt-1 block text-[9px] font-extrabold uppercase tracking-wider text-[#999]">Likes</span></div>
                <div className="rounded-2xl bg-[#f7f7f5] p-3"><strong className="block text-lg font-black tabular-nums">{product.instagramCommentCount.toLocaleString()}</strong><span className="mt-1 block text-[9px] font-extrabold uppercase tracking-wider text-[#999]">IG comments</span></div>
                <div className="rounded-2xl bg-[#f7f7f5] p-3"><strong className="block text-lg font-black tabular-nums">{product.wishlistItems.length.toLocaleString()}</strong><span className="mt-1 block text-[9px] font-extrabold uppercase tracking-wider text-[#999]">Saved</span></div>
              </div>
              {categoryLabels.length > 0 && <div className="mt-5"><h2 className="mb-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#999]">Product categories</h2><div className="flex flex-wrap gap-2">{categoryLabels.map((category) => <Link key={category} href={"/shop?category=" + encodeURIComponent(category)} className="rounded-full border border-[#e8e8e8] bg-[#f7f7f4] px-3 py-1.5 text-xs font-semibold text-[#171717] transition hover:border-black hover:bg-black hover:text-white">{category}</Link>)}</div></div>}

              <div className="mt-6 border-t border-[#ededeb] pt-5"><ListingComments postId={product.id} /></div>
              <div className="product-action-stack mt-6 flex flex-row items-stretch gap-2 border-t border-[#ededeb] pt-5 sm:mt-7"><ProductInquiryButton username={product.connection.username} productTitle={product.productTitle || "this product"} postUrl={product.permalink || ""} />{product.permalink && <a href={product.permalink} target="_blank" rel="noreferrer" className="product-view-button inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#dededb] bg-white px-3 py-3.5 text-center text-xs font-bold text-[#171717] transition hover:border-black hover:bg-[#f7f7f4] sm:px-5 sm:text-sm"><Instagram size={16} className="shrink-0" /><span>Original post</span><ArrowUpRight size={14} className="shrink-0" /></a>}</div>
              <p className="mt-5 text-xs leading-5 text-[#777]"><b className="text-black">Shop directly with the seller.</b> Ask for the latest price, stock and delivery information before ordering.</p>
            </section>
            {relatedProducts.length > 0 && <nav className="sokolink-recommendation-scroll sr-only" aria-label="Listing navigation">
              {relatedProducts.map((item) => <Link key={item.id} href={"/product/" + item.productSlug}>{item.productTitle || "Product"}</Link>)}
            </nav>}
          </aside></div>
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
