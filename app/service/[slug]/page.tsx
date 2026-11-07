import { db } from "@/lib/prisma";
import { user } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Instagram, Sparkles, BriefcaseBusiness, ShieldCheck, ArrowRight } from "lucide-react";
import { LikeButton } from "@/components/like-button";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductCarousel } from "@/components/product-carousel";
import { ProductInquiryButton } from "@/components/product-inquiry-button";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { ProductCard } from "@/components/product-card";
import { ListingComments } from "@/components/listing-comments";
import { ProductPriceEditor } from "@/components/product-price-editor";

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

  const relatedServices = await db().instagramPost.findMany({
    where: {
      isProduct: true, listingType: "SERVICE", productSlug: { not: slug },
      OR: [
        ...(service.category ? [{ category: service.category }] : []),
        ...(service.subcategory ? [{ subcategory: service.subcategory }] : []),
        ...(service.tags.length ? [{ tags: { some: { name: { in: service.tags.map((tag) => tag.name) } } } }] : []),
      ],
    },
    include: { connection: true, tags: true, likes: true },
    orderBy: [{ instagramLikeCount: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  return (
    <main className="product-detail-page min-h-screen bg-white">
      <AnalyticsTracker connectionId={service.connectionId} postId={service.id} type="VIEW" />
      <div className="shell py-5 sm:py-7 md:py-10">
        <div className="mb-5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#888] sm:mb-7"><BriefcaseBusiness size={14} className="text-black" /> SokoLink <span className="text-[#c4c4c4]">/</span> Service details</div>
        <div className="product-detail-modal-layout grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,.92fr)] lg:gap-8 lg:items-stretch">
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

          <div className="product-detail-scroll-area min-w-0"><aside>
            <section className="min-w-0 rounded-[26px] border border-black/[0.07] bg-white p-5 shadow-[0_16px_48px_rgba(0,0,0,0.055)] sm:rounded-[30px] sm:p-7 md:p-8">
              <div className="listing-detail-actions flex items-center gap-2 border-b border-[#ededeb] pb-5">
                <Link href={"/stores/" + service.connection.username} className="listing-seller-action group inline-flex w-fit max-w-full flex-none items-center gap-3 bg-transparent py-1 transition-colors duration-200">
                  <span className="listing-seller-avatar flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f0f0ed] p-[2px] text-base font-black text-[#666]">{service.connection.profileImageUrl ? <img src={service.connection.profileImageUrl} alt="" className="h-full w-full rounded-full object-cover transition-transform duration-200 group-hover:scale-110" /> : <span className="flex h-full w-full items-center justify-center rounded-full bg-[#e8e8e4]">{service.connection.username.slice(0, 1).toUpperCase()}</span>}</span>
                  <span className="min-w-0 flex-1"><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[.14em] text-[#e04444]">Service provider</span><span className="block truncate text-[12px] font-extrabold tracking-[-.02em] text-[#171717]">@{service.connection.username}</span><span className="mt-1 block text-[9px] font-semibold text-[#8b8b84]">View provider profile</span></span>
                  {service.connection.verifiedAt && <span className="listing-seller-verified inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f6f1df] px-2 py-1 text-[9px] font-extrabold text-[#8a6a16]"><ShieldCheck size={12}/> Verified</span>}
                </Link>
                <div className="listing-detail-social-actions flex shrink-0 items-center gap-2">
                  <LikeButton id={service.id} count={service.likes.length + Number(service.instagramLikeCount || 0)} compact largeCompact initialLiked={service.likes.some((like) => like.userId === currentUser?.id)} />
                  <WishlistButton id={service.id} count={service.wishlistItems.length} compact largeCompact productDetailStyle wishlisted={service.wishlistItems.length > 0} />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-white"><BriefcaseBusiness size={11} /> Service</span>{service.connection.verifiedAt && <span className="rounded-full bg-[#f5f0df] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-[#8a6a16]">✓ Verified</span>}</div>
              {service.priceAmount !== null && service.priceAmount !== undefined && <p className="mt-4 text-xl font-black text-[#171717]">{service.priceCurrency || "KES"} {Number(service.priceAmount).toLocaleString("en-KE", { maximumFractionDigits: 2 })}</p>}{currentUser?.id === service.connection.connectedByUserId && <ProductPriceEditor postId={service.id} amount={service.priceAmount === null ? null : Number(service.priceAmount)} currency={service.priceCurrency} />}
              <h1 className="mt-5 break-words text-[clamp(1.65rem,3vw,2.3rem)] font-black leading-[1.12] tracking-[-.055em] text-[#171717]">{service.productTitle || "Instagram service"}</h1>
              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#666]">{cleanCaption || "Discover this service from @" + service.connection.username + " and contact the provider directly on Instagram for pricing, availability and details."}</p>
              <div className="mt-6 grid grid-cols-3 gap-2 border-y border-[#ededeb] py-5"><div className="rounded-2xl bg-[#f7f7f4] p-3"><b className="block text-lg font-black">{(service.instagramLikeCount + service.likes.length).toLocaleString()}</b><p className="mt-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#999]">Likes</p></div><div className="rounded-2xl bg-[#f7f7f4] p-3"><b className="block text-lg font-black">{service.instagramCommentCount.toLocaleString()}</b><p className="mt-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#999]">IG comments</p></div><div className="rounded-2xl bg-[#f7f7f4] p-3"><b className="block text-lg font-black">{service.wishlistItems.length.toLocaleString()}</b><p className="mt-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#999]">Saved</p></div></div>
              {(service.category || service.subcategory || tags.length > 0) && <div className="mt-5"><h2 className="mb-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#999]">Service categories</h2><div className="flex flex-wrap gap-2">{[service.category, service.subcategory, ...tags.map((tag) => tag.name)].filter((value): value is string => Boolean(value?.trim())).map((tag) => <Link key={tag} href={"/search?tag=" + encodeURIComponent(tag)} className="rounded-full border border-black/[0.08] bg-[#f7f7f4] px-3 py-1.5 text-xs font-semibold text-[#555] transition hover:border-black hover:bg-black hover:text-white">{tag}</Link>)}</div></div>}

              <div className="mt-6 border-t border-[#ededeb] pt-5"><ListingComments postId={service.id} /></div>
              <div className="mt-6 flex flex-col gap-3 border-t border-[#ededeb] pt-5 sm:mt-7"><ProductInquiryButton username={service.connection.username} productTitle={service.productTitle || "this service"} postUrl={service.permalink || ""} />{service.permalink && <a href={service.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-black/[0.1] bg-white px-5 py-3.5 text-sm font-bold hover:border-black hover:bg-black hover:text-white"><Instagram size={16}/> View original post <ArrowUpRight size={14}/></a>}</div>
              <p className="mt-5 text-xs leading-5 text-[#777]"><b className="text-black">Contact the provider directly.</b> Ask for current pricing, availability, location and delivery details before booking.</p>
            </section>
          </aside>
          {relatedServices.length > 0 && <section className="product-recommendations mt-8 border-t border-[#ededeb] pt-6" aria-label="Recommended services">
            <div className="sokolink-recommendation-scroll grid grid-cols-2 gap-3">
              {relatedServices.map((item) => <ProductCard key={item.id} p={{...item, totalLikes: Number(item.instagramLikeCount || 0) + item.likes.length}} />)}
            </div>
          </section>}
          </div>
        </div>


      </div>
    </main>
  );
}
