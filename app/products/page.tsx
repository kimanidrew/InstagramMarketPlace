import Link from "next/link";
import { ArrowRight, Bookmark, Heart, Grid2X2, Search, Sparkles, Store, TrendingUp, BadgeCheck } from "lucide-react";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { filterAvailableInstagramMedia } from "@/lib/instagram-media";
import { ProductMasonry } from "@/components/product-masonry";
import { ShopTabs } from "@/components/shop-tabs";

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
          posts: { some: { isProduct: true, mediaUrl: { not: null } } },
        },
        include: {
          posts: {
            where: { isProduct: true, mediaUrl: { not: null } },
            select: {
              id: true,
              mediaUrl: true,
              thumbnailUrl: true,
              productSlug: true,
              productTitle: true,
              mediaType: true,
              listingType: true,
              tags: { select: { name: true } },
            },
            orderBy: { timestamp: "desc" },
            take: 6,
          },
        },
        orderBy: [{ verifiedAt: "desc" }, { proUntil: "desc" }, { username: "asc" }],
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
          likes: true,
          wishlistItems: true,
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

  const activeStoreCampaigns = await db().promotionCampaign.findMany({ where: { status: "ACTIVE", targetType: "STORE" }, select: { connectionId: true } });
  const paidStoreIds = new Set(activeStoreCampaigns.map(campaign => campaign.connectionId));
  const promotedStores = featuredStores
    .map(({ store, posts }) => ({ store: { ...store, paidPromotionActive: paidStoreIds.has(store.id) }, posts }))
    .sort((a, b) => Number(Boolean(b.store.paidPromotionActive)) - Number(Boolean(a.store.paidPromotionActive)));

  const showDiscovery = !text;

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
              <Link href="/wishlist" className="products-hero-light-button text-sm font-black">
                <Bookmark size={17} fill="currentColor" /> Continue from saved
              </Link>
            )}
            <Link href="#shop-all" className="products-hero-ghost-button text-sm font-black">
              Browse everything <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {showDiscovery && (() => {
        const prepareProducts = (items: any[]) =>
          items.map((product: any) => ({
            ...product,
            likedByCurrentUser: currentUser
              ? product.likes?.some((like: any) => like.userId === currentUser.id)
              : false,
            wishlistedByCurrentUser: currentUser
              ? product.wishlistItems?.some((item: any) => item.userId === currentUser.id)
              : false,
          }));

        const shopData = JSON.parse(
          JSON.stringify({
            wishlistProducts,
            featuredStores: promotedStores,
            trendingProducts: prepareProducts(trendingProducts),
            featuredProducts: prepareProducts(featuredProductsRaw),
          }),
        );

        return (
          <ShopTabs
            tags={tags.map((x) => x.name)}
            initialTag={tag || ""}
            wishlistProducts={shopData.wishlistProducts}
            featuredStores={shopData.featuredStores}
            trendingProducts={shopData.trendingProducts}
            featuredProducts={shopData.featuredProducts}
            now={now.toISOString()}
          />
        );
      })()}

      {text && (
        <div className="mt-8">
          <ProductMasonry q={text} tag="" />
        </div>
      )}
    </main>
  );
}
