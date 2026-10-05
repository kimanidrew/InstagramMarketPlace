import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Instagram, Sparkles } from "lucide-react";
import { LikeButton } from "@/components/like-button";
import { ProductMedia } from "@/components/product-media";
import { ProductInquiryButton } from "@/components/product-inquiry-button";

export const dynamic = "force-dynamic";

export default async function Product({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await db().instagramPost.findUnique({
    where: { productSlug: slug },
    include: {
      connection: true,
      tags: true,
      likes: true,
    },
  });

  if (!product || !product.isProduct) {
    notFound();
  }

  const isVideo = String(product.mediaType || "").toUpperCase() === "VIDEO";
  const mediaUrl = product.mediaUrl || product.thumbnailUrl;
  const cleanCaption = product.caption
    ? product.caption.replace(/#[\p{L}\p{N}_]+/gu, "").trim()
    : "";
  const tags = product.tags.filter((tag) => tag.name !== "instagrammarket");

  return (
    <main className="product-detail-page min-h-screen bg-[#f7f7f4]">
      <div className="shell py-6 md:py-10">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2.5 text-xs font-bold text-[#555] shadow-sm transition hover:-translate-y-0.5 hover:border-black hover:text-black"
        >
          <ArrowLeft size={14} />
          Back to shop
        </Link>

        <div className="mt-5 overflow-hidden rounded-[34px] border border-black/[0.06] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.09)]">
          <div className="grid lg:grid-cols-[1.02fr_.98fr]">
            <ProductGallery
              mediaUrl={mediaUrl}
              thumbnailUrl={product.thumbnailUrl}
              isVideo={isVideo}
              title={product.productTitle || "Product"}
            />

            <section className="flex flex-col justify-center p-6 sm:p-9 md:p-12 lg:p-16">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-white">
                  <Sparkles size={11} />
                  Instagram Market
                </span>

                <Link
                  href={"/store/" + product.connection.username}
                  className="rounded-full border border-black/[0.08] bg-[#fafaf8] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-[#666] transition hover:border-black hover:text-black"
                >
                  @{product.connection.username}
                </Link>
              </div>

              <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[.94] tracking-[-.065em] sm:text-5xl md:text-6xl lg:text-[4.6rem]">
                {product.productTitle}
              </h1>

              {cleanCaption ? (
                <p className="mt-6 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-[#666]">
                  {cleanCaption}
                </p>
              ) : (
                <p className="mt-6 max-w-xl text-sm leading-6 text-[#888]">
                  Discover this product from @{product.connection.username} and
                  contact the shop directly on Instagram for current details,
                  pricing and availability.
                </p>
              )}

              {tags.length > 0 && (
                <div className="mt-7 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link
                      key={tag.name}
                      href={"/products?tag=" + tag.name}
                      className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[#555] transition hover:border-black hover:bg-black hover:text-white"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] bg-[#f5f5f2] p-4">
                  <b className="block text-xl font-black tracking-tight">
                    {product.instagramLikeCount.toLocaleString()}
                  </b>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.08em] text-[#888]">
                    IG likes
                  </p>
                </div>
                <div className="rounded-[20px] bg-[#f5f5f2] p-4">
                  <b className="block text-xl font-black tracking-tight">
                    {product.instagramCommentCount.toLocaleString()}
                  </b>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.08em] text-[#888]">
                    Comments
                  </p>
                </div>
                <div className="rounded-[20px] bg-[#f5f5f2] p-4 col-span-2 sm:col-span-1">
                  <b className="block text-xl font-black tracking-tight">
                    {product.likes.length}
                  </b>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.08em] text-[#888]">
                    Saved locally
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <ProductInquiryButton
                  username={product.connection.username}
                  productTitle={product.productTitle || "this product"}
                  postUrl={product.permalink || ""}
                />

                <div className="flex flex-wrap gap-3">
                  <LikeButton id={product.id} count={product.likes.length} />

                  {product.permalink && (
                    <a
                      href={product.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-black/[0.1] bg-white px-5 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 hover:border-black hover:bg-black hover:text-white"
                    >
                      <Instagram size={16} />
                      View original post
                      <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-7 rounded-[22px] border border-black/[0.06] bg-[#fafaf8] p-4">
                <p className="text-xs leading-5 text-[#777]">
                  <b className="text-black">Shopping on Instagram Market</b>{" "}
                  connects you to the original shop. Ask the seller for the
                  latest price, stock and delivery information.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function ProductGallery({
  mediaUrl,
  thumbnailUrl,
  isVideo,
  title,
}: {
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  isVideo: boolean;
  title: string;
}) {
  return (
    <div className="product-gallery-panel bg-[#111] p-3 sm:p-5 lg:p-7">
      <div className="relative overflow-hidden rounded-[28px] bg-black shadow-[0_25px_70px_rgba(0,0,0,0.28)]">
        <div className="aspect-[4/5]">
          {isVideo && mediaUrl ? (
            <ProductMedia src={mediaUrl} poster={thumbnailUrl} alt={title} />
          ) : mediaUrl ? (
            <img
              src={mediaUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/60">
              No media available
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />

        <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-white backdrop-blur-md">
          {isVideo ? "Video" : "Instagram post"}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-[.13em] text-white/50">
        <span>{isVideo ? "Video post" : "Photo post"}</span>
        <span>Original Instagram media</span>
      </div>
    </div>
  );
}
