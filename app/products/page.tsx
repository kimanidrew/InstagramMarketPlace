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
  searchParams: Promise<{ q?: string; tag?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const text = params.q?.trim();
  const tag = params.tag?.toLowerCase();
  const initialTab = params.tab === "trending" || params.tab === "featured" ? params.tab : "discover";
  const currentUser = await user();
  const now = new Date();

  const [tags, wishlistProducts, recentlyViewedProducts, featuredProductsRaw, featuredStoresRaw, topLiked, topSaved] =
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
      currentUser
        ? db().recentlyViewedProduct.findMany({
            where: { userId: currentUser.id, post: { isProduct: true } },
            include: {
              post: {
                include: {
                  connection: true,
                  tags: true,
                  likes: true,
                  wishlistItems: { where: { userId: currentUser.id } },
                },
              },
            },
            orderBy: { lastViewedAt: "desc" },
            take: 7,
          }).then((items) => filterAvailableInstagramMedia(items.map((item) => item.post)))
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
          reviews: { select: { rating: true } },
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
        take: 50,
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
    <main className="shop-page shell py-5 md:py-7">
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
            recentlyViewedProducts,
            featuredStores: promotedStores,
            trendingProducts: prepareProducts(trendingProducts),
            featuredProducts: prepareProducts(featuredProductsRaw),
          }),
        );

        return (
          <ShopTabs
            tags={tags.map((x) => x.name)}
            initialTag={tag || ""}
            initialTab={initialTab}
            wishlistProducts={shopData.wishlistProducts}
            recentlyViewedProducts={shopData.recentlyViewedProducts}
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
