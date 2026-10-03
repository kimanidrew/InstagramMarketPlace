import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LikeButton } from "@/components/like-button";

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

  const imageUrl = product.mediaUrl || product.thumbnailUrl;
  const cleanCaption = product.caption
    ? product.caption
        .replace(/#[\p{L}\p{N}_]+/gu, "")
        .trim()
    : "";

  return (
    <main className="shell py-12 md:py-16">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-[4/5] overflow-hidden rounded-[30px] bg-[#f4f4f2]">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={product.productTitle || "Product"}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="flex flex-col justify-center">
          <Link
            href={"/store/" + product.connection.username}
            className="text-xs font-bold uppercase tracking-[.2em] text-[#888]"
          >
            @{product.connection.username}
          </Link>

          <h1 className="mt-4 text-5xl font-black tracking-[-.06em]">
            {product.productTitle}
          </h1>

          {cleanCaption && (
            <p className="mt-5 whitespace-pre-line leading-7 text-[#666]">
              {cleanCaption}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {product.tags
              .filter((tag) => tag.name !== "instagrammarket")
              .map((tag) => (
                <Link
                  key={tag.name}
                  href={"/products?tag=" + tag.name}
                  className="rounded-full bg-[#f5f5f5] px-3 py-1.5 text-xs"
                >
                  #{tag.name}
                </Link>
              ))}
          </div>

          <div className="mt-8 flex gap-3">
            <LikeButton id={product.id} count={product.likes.length} />

            {product.permalink && (
              <a
                href={product.permalink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold"
              >
                Open Instagram <ExternalLink size={14} />
              </a>
            )}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#f7f7f5] p-5">
              <b className="text-2xl">
                {product.instagramLikeCount.toLocaleString()}
              </b>
              <p className="text-xs text-[#777]">Instagram likes</p>
            </div>

            <div className="rounded-2xl bg-[#f7f7f5] p-5">
              <b className="text-2xl">{product.likes.length}</b>
              <p className="text-xs text-[#777]">Marketplace likes</p>
            </div>
          </div>

          <p className="mt-6 text-xs leading-5 text-[#999]">
            Marketplace likes are local. To increase the real Instagram like
            count, open the original Instagram post.
          </p>
        </div>
      </div>
    </main>
  );
}
