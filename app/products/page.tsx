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
      <section className="relative overflow-hidden rounded-[32px] bg-black p-7 text-white md:p-10 lg:p-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-white/75">
              <Sparkles size={13} /> Discover & shop
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-[-.055em] md:text-5xl">
              Shop the Instagram feed.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 md:text-base">
              Find something you love, save it for later, or message the shop directly on Instagram. New products appear automatically as you keep browsing.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {wishlistProducts.length > 0 && (
                <Link href="/wishlist" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black text-black transition hover:-translate-y-0.5">
                  <Heart size={14} fill="currentColor" /> Continue from wishlist
                </Link>
              )}
              <Link href="#shop-all" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white transition hover:bg-white/15">
                Browse everything <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <form
            action="/products"
            className="mt-1 flex w-full max-w-xl rounded-full border border-black/10 bg-white p-1 shadow-sm lg:mt-0"
          >
            <Search className="ml-3 mt-2.5 shrink-0 text-[#888]" size={17} />
            <input
              name="q"
              defaultValue={text}
              placeholder="Search products, stores & captions..."
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
            />
            <button className="rounded-full bg-black px-5 py-2.5 text-xs font-bold text-white">
              Search
            </button>
          </form>
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
          <span className="hidden font-normal text-[#999] sm:inline">· New products load automatically as you scroll</span>
        </div>

        <div className="hidden items-center gap-2 text-xs text-[#999] sm:flex">
          <Grid2X2 size={15} />
          Curated grid
          <LayoutList size={15} />
        </div>
      </div>

      <div className="mt-8">
        <ProductMasonry q={text || ""} tag={tag || ""} />
      </div>
    </main>
  );
}
