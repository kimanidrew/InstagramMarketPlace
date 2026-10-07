import Link from "next/link";
import { ArrowRight, Bookmark, Heart, Grid2X2, LayoutList, Search, SlidersHorizontal, Sparkles, Store, TrendingUp, BadgeCheck } from "lucide-react";
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
  const now = new Date();

  const [tags, wishlistProducts, featuredProductsRaw, featuredStoresRaw, topLiked, topSaved] =
    await Promise.all([
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
            include: {
              connection: true,
              tags: true,
              likes: true,
              wishlistItems: { where: { userId: currentUser.id } },
            },
            orderBy: { timestamp: "desc" },
            take: 8,
          }).then((items) => filterAvailableInstagramMedia(items))
        : Promise.resolve([]),
      db().instagramPost.findMany({
        where: { isProduct: true, boostUntil: { gt: now } },
        include: {
          connection: true,
          tags: true,
          likes: true,
          wishlistItems: true,
        },
        orderBy: { boostUntil: "desc" },
        take: 8,
      }).then((items) => filterAvailableInstagramMedia(items)),
      db().instagramConnection.findMany({
        where: {
          OR: [
            { verifiedAt: { not: null } },
            { proUntil: { gt: now } },
          ],
          posts: { some: { isProduct: true, mediaUrl: { not: null } } },
        },
        include: {
          posts: {
            where: { isProduct: true, mediaUrl: { not: null } },
            select: { id: true, mediaUrl: true, thumbnailUrl: true },
            take: 6,
          },
        },
        orderBy: [{ proUntil: "desc" }, { verifiedAt: "desc" }, { username: "asc" }],
        take: 8,
      }),
      db().instagramPost.findMany({
        where: { isProduct: true },
        include: {
          connection: true,
          tags: true,
          likes: true,
          wishlistItems: true,
          _count: { select: { likes: true, wishlistItems: true } },
        },
        orderBy: { likes: { _count: "desc" } },
        take: 24,
      }),
      db().instagramPost.findMany({
        where: { isProduct: true },
        include: {
          connection: true,
          tags: true,
          likes: currentUser ? { where: { userId: currentUser.id } } : false,
          wishlistItems: currentUser ? { where: { userId: currentUser.id } } : false,
          _count: { select: { likes: true, wishlistItems: true } },
        },
        orderBy: { wishlistItems: { _count: "desc" } },
        take: 24,
      }),
    ]);

  const featuredStores = (
    await Promise.all(
      featuredStoresRaw.map(async (store) => ({
        store,
        posts: await filterAvailableInstagramMedia(store.posts),
      })),
    )
  ).filter(({ posts }) => posts.length > 0);

  const trendingMap = new Map<string, any>();
  [...topLiked, ...topSaved].forEach((post: any) => {
    trendingMap.set(post.id, post);
  });
  const trendingProducts = (await filterAvailableInstagramMedia(
    Array.from(trendingMap.values()),
  ))
    .sort(
      (a: any, b: any) =>
        (b._count.likes + b._count.wishlistItems) -
        (a._count.likes + a._count.wishlistItems),
    )
    .slice(0, 8);

  const showDiscovery = !text && !tag;

  return (
    <main className="shop-page shell py-10 md:py-14">
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

          <form action="/shop" className="products-hero-search mt-8 w-full max-w-2xl">
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

      {showDiscovery && (
        <section className="mt-12 space-y-12">
          {featuredStores.length > 0 && (
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow plain"><BadgeCheck size={13} /> Featured stores</p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">Shops worth discovering.</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">
                    Featured placement is earned through approved marketplace growth — not simply by listing a store.
                  </p>
                </div>
                <Link href="/stores" className="inline-flex items-center gap-2 text-xs font-black">
                  View all stores <ArrowRight size={14} />
                </Link>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {featuredStores.map(({ store, posts }) => (
                  <Link
                    key={store.id}
                    href={"/store/" + store.username}
                    className="group relative overflow-hidden rounded-[26px] border border-black/5 bg-[#f5f5f1] p-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(0,0,0,.09)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-full bg-white ring-4 ring-white shadow-sm">
                        {store.profileImageUrl ? (
                          <img src={store.profileImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-black">@</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <b className="truncate text-sm">@{store.username}</b>
                          <BadgeCheck size={14} className="shrink-0" />
                        </div>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#999]">
                          {posts.length} featured listings
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-[10px] font-black uppercase tracking-[.12em] text-[#777]">
                      <span>Instagram shop</span>
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {featuredProductsRaw.length > 0 && (
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow plain"><Sparkles size={13} /> Featured products</p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">Put the spotlight on.</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">
                    These listings are featured because their sellers have an approved Boost running now.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 self-start rounded-full bg-black px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] text-white sm:self-auto">
                  <Sparkles size={12} /> Boosted now
                </span>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {featuredProductsRaw.slice(0, 8).map((product: any) => (
                  <ProductCard
                    key={product.id}
                    p={{
                      ...product,
                      likedByCurrentUser: currentUser ? product.likes.some((like: any) => like.userId === currentUser.id) : false,
                      wishlistedByCurrentUser: currentUser ? product.wishlistItems.some((item: any) => item.userId === currentUser.id) : false,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {trendingProducts.length > 0 && (
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow plain"><TrendingUp size={13} /> Trending now</p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-.05em] md:text-4xl">What shoppers are saving and loving.</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777]">
                    Ranked from marketplace activity — likes plus saves — so the products people actually respond to rise naturally.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-black/5 bg-[#f7f7f4] px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] text-[#777]">
                  <Heart size={12} /> Likes <span>+</span> <Bookmark size={12} /> Saves
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {trendingProducts.map((product: any) => (
                  <ProductCard
                    key={product.id}
                    p={{
                      ...product,
                      likedByCurrentUser: currentUser ? product.likes.some((like: any) => like.userId === currentUser.id) : false,
                      wishlistedByCurrentUser: currentUser ? product.wishlistItems.some((item: any) => item.userId === currentUser.id) : false,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {!text && wishlistProducts.length > 0 && (
        <section className="mt-12 rounded-[30px] border border-black/5 bg-[#f7f7f4] p-5 md:p-7">
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
          </div>
        </section>
      )}

      <div id="shop-all" className="mt-12 flex gap-2 overflow-x-auto pb-2">
        <Link href="/shop" className={"chip " + (!tag ? "chip-active" : "")}>All</Link>
        {tags.map((x) => (
          <Link
            key={x.name}
            href={"/shop?tag=" + encodeURIComponent(x.name)}
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
