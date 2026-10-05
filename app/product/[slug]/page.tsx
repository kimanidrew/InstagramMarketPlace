import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LikeButton } from "@/components/like-button";
import { ProductMedia } from "@/components/product-media";

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

  return (
    <main className="shell py-8 md:py-14">
      <div className="mb-7">
        <Link
          href="/products"
          className="text-xs font-bold uppercase tracking-[.18em] text-[#999] transition hover:text-black"
        >
          ← Back to products
        </Link>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-black/[0.06] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.07)]">
        <div className="grid lg:grid-cols-[1.05fr_.95fr]">
          <ProductGallery
            mediaUrl={mediaUrl}
            thumbnailUrl={product.thumbnailUrl}
            isVideo={isVideo}
            title={product.productTitle || "Product"}
          />

          <section className="flex flex-col justify-center p-7 md:p-10 lg:p-14">
            <Link
              href={"/store/" + product.connection.username}
              className="inline-flex w-fit items-center rounded-full bg-[#f5f5f2] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.15em] text-[#666] transition hover:bg-black hover:text-white"
            >
              @{product.connection.username}
            </Link>

            <h1 className="mt-5 max-w-xl text-4xl font-black leading-[.98] tracking-[-.055em] md:text-6xl">
              {product.productTitle}
            </h1>

            {cleanCaption && (
              <p className="mt-6 max-w-xl whitespace-pre-line text-[15px] leading-7 text-[#666]">
                {cleanCaption}
              </p>
            )}

            {product.tags.filter((tag) => tag.name !== "instagrammarket").length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2">
                {product.tags
                  .filter((tag) => tag.name !== "instagrammarket")
                  .map((tag) => (
                    <Link
                      key={tag.name}
                      href={"/products?tag=" + tag.name}
                      className="rounded-full border border-black/[0.08] px-3 py-1.5 text-xs font-medium transition hover:border-black hover:bg-black hover:text-white"
                    >
                      #{tag.name}
                    </Link>
                  ))}
              </div>
            )}

            <div className="mt-9 flex flex-wrap gap-3">
              <LikeButton id={product.id} count={product.likes.length} />

              {product.permalink && (
                <a
                  href={product.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-black/[0.1] px-5 py-3 text-sm font-bold transition hover:bg-black hover:text-white"
                >
                  Open Instagram <ExternalLink size={14} />
                </a>
              )}
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-2 gap-3">
              <div className="rounded-[22px] bg-[#f7f7f5] p-5">
                <b className="block text-2xl tracking-tight">
                  {product.instagramLikeCount.toLocaleString()}
                </b>
                <p className="mt-1 text-xs text-[#777]">Instagram likes</p>
              </div>

              <div className="rounded-[22px] bg-[#f7f7f5] p-5">
                <b className="block text-2xl tracking-tight">{product.likes.length}</b>
                <p className="mt-1 text-xs text-[#777]">Marketplace likes</p>
              </div>
            </div>

            <p className="mt-6 max-w-xl text-xs leading-5 text-[#999]">
              Marketplace likes are local. Open the original Instagram post to
              interact with the post on Instagram.
            </p>
          </section>
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
    <div className="bg-[#f1f1ef] p-3 md:p-5">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[26px] bg-black">
        {isVideo && mediaUrl ? (
          <ProductMedia src={mediaUrl} poster={thumbnailUrl} alt={title} />
        ) : mediaUrl ? (
          <img src={mediaUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/60">
            No media available
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/25 to-transparent" />

        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-black shadow-sm">
          {isVideo ? "Video" : "Instagram post"}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-[11px] font-medium text-[#888]">
          {isVideo ? "Video post" : "Photo post"}
        </span>
        <span className="text-[11px] text-[#aaa]">Instagram media</span>
      </div>
    </div>
  );
}
