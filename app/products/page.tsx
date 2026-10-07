import Link from "next/link";
import { ArrowRight, Heart, Grid2X2, LayoutList, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { filterAvailableInstagramMedia } from "@/lib/instagram-media";
import { ProductMasonry } from "@/components/product-masonry";

export const dynamic = "force-dynamic";

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const text = params.q?.trim();
  const tag = params.tag?.toLowerCase();

  const currentUser = await user();

  const [tags, wishlistProducts] = await Promise.all([
    db().productTag.groupBy({
      by: ["name"],
      where: { post: { isProduct: true } },
      _count: { name: true },
      orderBy: { _count: { name: "desc" } },
      take: 14,
    }),
    currentUser
      ? db().instagramPost.findMany({
          where: {
            isProduct: true,
            wishlistItems: { some: { userId: currentUser.id } },
          },
          include: { connection: true, tags: true, likes: true, wishlistItems: { where: { userId: currentUser.id } } },
          orderBy: { timestamp: "desc" },
          take: 8,
        }).then((items) => filterAvailableInstagramMedia(items))
      : Promise.resolve([]),
  ]);

  return (
    <main className="products-page shell py-10 md:py-14">
      <section className="products-hero relative overflow-hidden rounded-[32px] text-white">
        <div className="products-hero-glass absolute inset-0" aria-hidden="true" />
        <div className="products-hero-content relative z-10 mx-auto flex min-h-[430px] max-w-4xl flex-col items-center justify-center px-5 py-12 text-center md:min-h-[500px] md:px-10">
          <div className="products-hero-kicker">
            <Sparkles size={13} /> Discover · Shop · Support
          </div>

          <h1 className="products-hero-title mt-6 max-w-3xl">
            Unique finds from <span>real Instagram shops.</span>
          </h1>

          <p className="products-hero-copy mt-5 max-w-2xl">
            Explore products and services from creators, brands and small businesses — all in one place.
          </p>

          <form action="/products" className="products-hero-search mt-8 w-full max-w-2xl">
            <Search className="shrink-0" size={18} />
            <input
              name="q"
              defaultValue={text}
              placeholder="Search products, stores or categories..."
              aria-label="Search products, stores or categories"
            />
            <button type="submit">
              Search <ArrowRight size={14} />
            </button>
          </form>

          <div className="products-hero-actions mt-5 flex flex-wrap items-center justify-center gap-3">
            {wishlistProducts.length > 0 && (
              <Link href="/wishlist" className="products-hero-light-button">
                <Heart size={14} fill="currentColor" /> Continue from wishlist
              </Link>
            )}
            <Link href="#shop-all" className="products-hero-ghost-button">
              Browse everything <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {!text && wishlistProducts.length > 0 && (
        <section className="mt-10 rounded-[30px] border border-black/5 bg-[#f7f7f4] p-5 md:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow plain">Pick up where you left off</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.04em] md:text-3xl">Still loving these?</h2>
              <p className="mt-2 text-sm text-[#777]">Your saved products and services are ready whenever you are.</p>
            </div>
            <Link href="/wishlist" className="inline-flex items-center gap-2 text-xs font-black">
              View full wishlist <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-6">
            {wishlistProducts.slice(0, 6).map((x) => {
              const isVideo = String(x.mediaType || "").toUpperCase() === "VIDEO";
              const isService = String(x.listingType || "").toUpperCase() === "SERVICE";
              const href = "/" + (isService ? "service" : "product") + "/" + x.productSlug;
              const image = x.mediaUrl || x.thumbnailUrl;

              return (
                <Link
                  key={x.id}
                  href={href}
                  aria-label={x.productTitle || "Saved listing"}
                  className="group block aspect-square overflow-hidden rounded-[22px] bg-[#eeeeeb]"
                >
                  {isVideo && x.mediaUrl ? (
                    <video
                      src={x.mediaUrl}
                      poster={x.thumbnailUrl || undefined}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : image ? (
                    <img
                      src={image}
                      alt={x.productTitle || "Saved listing"}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#999]">
                      No media
                    </div>
                  )}
                </Link>
              );
            })}
          </div>       </section>
      )}

      <div id="shop-all" className="mt-10 flex gap-2 overflow-x-auto pb-2">
        <Link
          href="/products"
          className={"chip " + (!tag ? "chip-active" : "")}
        >
          All
        </Link>

        {tags.map((x) => (
          <Link
            key={x.name}
            href={"/products?tag=" + encodeURIComponent(x.name)}
            className={"chip " + (tag === x.name ? "chip-active" : "")}
          >
            #{x.name}
          </Link>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-y border-black/5 py-4">
        <div className="flex items-center gap-2 text-xs font-bold">
          <SlidersHorizontal size={15} />
          Filters
          <span className="hidden font-normal text-[#999] sm:inline">· Fresh finds, picked for you</span>
        </div>

        <div className="hidden items-center gap-2 text-xs text-[#999] sm:flex">
          <Grid2X2 size={15} />
          Shop the latest
          <LayoutList size={15} />
        </div>
      </div>

      <div className="mt-8">
        <ProductMasonry q={text || ""} tag={tag || ""} />
      </div>
    </main>
  );
}
