import Link from "next/link";
import { Grid2X2, ChevronRight } from "lucide-react";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { filterAvailableInstagramMedia } from "@/lib/instagram-media";
import { ProductMasonry } from "@/components/product-masonry";
import { ShopTabs } from "@/components/shop-tabs";

export const dynamic = "force-dynamic";


const shopCategories = [
  { label: "Fashion & clothing", tag: "fashion", icon: "✦", color: "bg-[#e2f3ff]" },
  { label: "Beauty & skincare", tag: "beauty", icon: "✧", color: "bg-[#fff0d6]" },
  { label: "Home & living", tag: "home", icon: "⌂", color: "bg-[#e7f6e8]" },
  { label: "Electronics", tag: "electronics", icon: "⌁", color: "bg-[#f3e8ff]" },
  { label: "Food & groceries", tag: "food", icon: "❋", color: "bg-[#ffe7e7]" },
  { label: "Services", tag: "services", icon: "↗", color: "bg-[#e7f4f1]" },
];

export async function Products({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const text = params.q?.trim();
  const initialTab = params.tab === "trending" || params.tab === "featured" ? params.tab : "discover";
  const currentUser = await user();
  const now = new Date();

  const [wishlistProducts, recentlyViewedProducts, featuredProductsRaw, featuredStoresRaw, topInstagramLiked, topLiked, topSaved, categoryProductsRaw] =
    await Promise.all([
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
          }).then((items) => filterAvailableInstagramMedia(items.map((item) => ({ ...item.post, historyViewedAt: item.lastViewedAt }))))
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
        orderBy: { instagramLikeCount: "desc" },
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
      db().instagramPost.findMany({
        where: { isProduct: true, mediaUrl: { not: null } },
        include: {
          connection: true,
          tags: true,
          likes: true,
          wishlistItems: true,
          _count: { select: { likes: true, wishlistItems: true } },
        },
        orderBy: [{ timestamp: "desc" }, { createdAt: "desc" }],
        take: 600,
      }).then((items) => filterAvailableInstagramMedia(items)),
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
  [...topInstagramLiked, ...topLiked, ...topSaved].forEach((post: any) => {
    trendingMap.set(post.id, post);
  });
  const trendingProducts = (await filterAvailableInstagramMedia(
    Array.from(trendingMap.values()),
  ))
    .sort(
      (a: any, b: any) =>
        (Number(b.instagramLikeCount || 0) + Number(b._count?.likes || 0) + Number(b._count?.wishlistItems || 0)) -
        (Number(a.instagramLikeCount || 0) + Number(a._count?.likes || 0) + Number(a._count?.wishlistItems || 0)),
    )
    .slice(0, 24);

  const trendingStoreScores = new Map<string, number>();
  trendingProducts.forEach((post: any) => {
    const connectionId = post.connectionId || post.connection?.id;
    if (!connectionId) return;
    const score = Number(post.instagramLikeCount || 0) + Number(post._count?.likes || 0) + Number(post._count?.wishlistItems || 0);
    trendingStoreScores.set(connectionId, (trendingStoreScores.get(connectionId) || 0) + score);
  });
  const trendingStores = [...featuredStores].sort((a, b) =>
    (trendingStoreScores.get(b.store.id) || 0) - (trendingStoreScores.get(a.store.id) || 0)
  );

  const activeStoreCampaigns = await db().promotionCampaign.findMany({ where: { status: "ACTIVE", targetType: "STORE" }, select: { connectionId: true } });
  const paidStoreIds = new Set(activeStoreCampaigns.map(campaign => campaign.connectionId));
  const promotedStores = featuredStores
    .map(({ store, posts }) => ({ store: { ...store, paidPromotionActive: paidStoreIds.has(store.id) }, posts }))
    .sort((a, b) => Number(Boolean(b.store.paidPromotionActive)) - Number(Boolean(a.store.paidPromotionActive)));

  const categoryGroups = new Map<string, { label: string; type: "product" | "service"; items: any[] }>();
  for (const post of categoryProductsRaw as any[]) {
    const isService = String(post.listingType || "").toUpperCase() === "SERVICE";
    const label = String(post.category || post.subcategory || post.tags?.[0]?.name || "").trim();
    if (!label || ["other", "other category", "more to explore"].includes(label.toLowerCase())) continue;
    const key = (isService ? "service:" : "product:") + label.toLowerCase();
    const group = categoryGroups.get(key) || { label, type: isService ? "service" as const : "product" as const, items: [] };
    group.items.push(post);
    categoryGroups.set(key, group);
  }
  const categorySections = [...categoryGroups.values()]
    .sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label))
    .map((group) => ({ ...group, items: group.items.slice(0, 10) }));

  const showDiscovery = !text;

  return (
    <main className="shop-page shell py-0">
      {showDiscovery && (
        <section className="shop-by-category relative left-1/2 mb-0 w-screen -translate-x-1/2 overflow-hidden rounded-none border-0 bg-gradient-to-br from-[#fff8f6] via-[#fffaf2] to-[#f4f8ff] py-2 sm:py-2.5" aria-label="Shop by category">
          <div className="shell">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/70 blur-3xl" aria-hidden="true" />
          <div className="relative mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-0.5 text-[8px] font-extrabold uppercase tracking-[.18em] text-[#b45365] sm:text-[9px]">Find your next favourite</p>
              <h1 className="flex items-center gap-1.5 text-base font-black leading-tight tracking-[-.035em] text-[#20202a] sm:text-lg"><Grid2X2 size={16} strokeWidth={2.5} className="text-[#b83250]" /> Shop by category</h1>
            </div>
            <Link href="/categories" className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-[#e8b9c1] bg-white/80 px-2.5 py-1.5 text-[10px] font-extrabold leading-none text-[#8f2942] transition-colors hover:bg-white sm:px-3 sm:text-[11px]">View all <ChevronRight size={14} /></Link>
          </div>
          <div className="relative grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-1.5 lg:grid-cols-6">
            {shopCategories.map((category) => (
              <Link key={category.tag} href={category.tag === "services" ? "/search?type=service" : "/search?tag=" + encodeURIComponent(category.tag)} className="group flex min-h-[46px] min-w-0 items-center gap-2 rounded-full border border-white/90 bg-white/90 px-2.5 py-1.5 shadow-[0_2px_10px_rgba(31,41,55,0.045)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e9b7c1] hover:bg-white hover:shadow-[0_5px_16px_rgba(31,41,55,0.09)] sm:min-h-[50px] sm:gap-2.5 sm:px-3">
                <span className={category.color + " flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base shadow-inner sm:h-9 sm:w-9"}>{category.icon}</span>
                <span className="min-w-0 text-[10px] font-bold leading-tight tracking-[-.015em] text-[#30303a] transition-colors group-hover:text-[#a52d49] sm:text-[11px]">{category.label}</span>
              </Link>
            ))}
          </div>
          </div>
        </section>
      )}
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
            trendingStores,
            trendingProducts: prepareProducts(trendingProducts),
            featuredProducts: prepareProducts(featuredProductsRaw),
            featuredFallbackProducts: prepareProducts([...categoryProductsRaw]
              .filter((post: any) => !featuredProductsRaw.some((featured: any) => featured.id === post.id))
              .sort(() => Math.random() - 0.5)
              .slice(0, 5)),
            categorySections: categorySections.map((section) => ({ ...section, items: prepareProducts(section.items) })),
          }),
        );

        return (
          <ShopTabs
            initialTab={initialTab}
            wishlistProducts={shopData.wishlistProducts}
            recentlyViewedProducts={shopData.recentlyViewedProducts}
            featuredStores={shopData.featuredStores}
            trendingStores={shopData.trendingStores}
            trendingProducts={shopData.trendingProducts}
            featuredProducts={shopData.featuredProducts}
            featuredFallbackProducts={shopData.featuredFallbackProducts}
            categorySections={shopData.categorySections}
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

export default Products;
