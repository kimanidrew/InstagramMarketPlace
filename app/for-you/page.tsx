import { ArrowRight, Heart, ShoppingBag, Sparkles } from "lucide-react";
import Link from "next/link";
import { user } from "@/lib/auth";
import { ForYouFilters } from "@/components/for-you-filters";
import { ForYouProductCarousel } from "@/components/for-you-product-carousel";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ForYouPage() {
  const currentUser = await user();
  const database = db();

  const tags = await database.productTag.groupBy({
    by: ["name"],
    where: { post: { isProduct: true } },
    _count: { name: true },
    orderBy: { _count: { name: "desc" } },
    take: 14,
  });

  const [viewed, saved, liked] = currentUser
    ? await Promise.all([
        database.recentlyViewedProduct.findMany({
          where: { userId: currentUser.id, post: { isProduct: true } },
          select: { post: { select: { id: true, tags: { select: { name: true } } } } },
          orderBy: { lastViewedAt: "desc" },
          take: 10,
        }),
        database.wishlistItem.findMany({
          where: { userId: currentUser.id, post: { isProduct: true } },
          select: { post: { select: { id: true, tags: { select: { name: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        database.productLike.findMany({
          where: { userId: currentUser.id, post: { isProduct: true } },
          select: { post: { select: { id: true, tags: { select: { name: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ])
    : [[], [], []];

  const activity = [...viewed, ...saved, ...liked];
  const excludedIds = [...new Set(activity.map((item) => item.post.id))];
  const interestTags = [...new Set(activity.flatMap((item) => item.post.tags.map((tag) => tag.name)))];

  const include = {
    connection: true,
    tags: true,
    likes: true,
    wishlistItems: true,
    _count: { select: { likes: true, wishlistItems: true } },
  } as const;

  let recommendations: any[] = [];
  if (interestTags.length) {
    recommendations = await database.instagramPost.findMany({
      where: {
        isProduct: true,
        id: { notIn: excludedIds },
        tags: { some: { name: { in: interestTags } } },
      },
      include,
      orderBy: [{ likes: { _count: "desc" } }, { instagramLikeCount: "desc" }, { timestamp: "desc" }],
      take: 12,
    });
  }

  if (recommendations.length < 12) {
    // Fill the carousel with popular listings, even if the shopper has already
    // viewed, liked or saved them. Excluding every interacted-with item can
    // leave the carousel empty for shoppers with a small catalogue.
    const alreadyRecommended = recommendations.map((item) => item.id);
    const fallback = await database.instagramPost.findMany({
      where: {
        isProduct: true,
        ...(alreadyRecommended.length ? { id: { notIn: alreadyRecommended } } : {}),
      },
      include,
      orderBy: [{ likes: { _count: "desc" } }, { instagramLikeCount: "desc" }, { timestamp: "desc" }],
      take: 12 - recommendations.length,
    });
    recommendations = [...recommendations, ...fallback];
  }

  const carouselProducts = JSON.parse(JSON.stringify(recommendations.map((product) => ({
    ...product,
    cardType: "product",
    likedByCurrentUser: Boolean(currentUser && product.likes?.some((like: any) => like.userId === currentUser.id)),
    wishlistedByCurrentUser: Boolean(currentUser && product.wishlistItems?.some((item: any) => item.userId === currentUser.id)),
  }))));

  const storeCandidates = await database.instagramConnection.findMany({
    where: { posts: { some: { isProduct: true } } },
    select: {
      id: true,
      username: true,
      name: true,
      biography: true,
      profileImageUrl: true,
      verifiedUntil: true,
      proUntil: true,
      posts: {
        where: { isProduct: true },
        select: { id: true, mediaUrl: true },
        orderBy: { timestamp: "desc" },
        take: 8,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  // Only recommend stores with at least one listing whose media is reachable.
  const carouselStores = (await Promise.all(storeCandidates.map(async (store) => {
    const availablePosts = await filterAvailableInstagramMedia(store.posts);
    return availablePosts.length
      ? { ...store, _count: { posts: availablePosts.length } }
      : null;
  }))).filter((store) => store !== null);

  const mixedCarouselItems = [
    ...carouselProducts,
    ...carouselStores.map((store) => ({
      id: store.id,
      username: store.username,
      name: store.name,
      biography: store.biography,
      profileImageUrl: store.profileImageUrl,
      verifiedUntil: store.verifiedUntil,
      proUntil: store.proUntil,
      _count: store._count,
      cardType: "store" as const,
    })),
  ].sort(() => Math.random() - 0.5).slice(0, 16);

  return (
    <main className="min-h-screen w-full">
      <section className="relative z-0 isolate grid min-h-0 w-full overflow-hidden border-b border-[#eeeef8] bg-[radial-gradient(ellipse_at_78%_42%,rgba(190,173,255,.42),transparent_34%),radial-gradient(ellipse_at_95%_88%,rgba(255,198,235,.42),transparent_30%),radial-gradient(ellipse_at_5%_95%,rgba(218,211,255,.5),transparent_28%),linear-gradient(115deg,#fff_0%,#fcfbff_48%,#faf7ff_75%,#fff7fc_100%)] px-4 pb-0 pt-1 sm:px-6 md:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] md:items-center md:gap-1 md:px-8 md:py-1 lg:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-28 h-64 w-64 rounded-full border border-[#d9d0ff]/60 bg-gradient-to-br from-white/80 to-[#dcd2ff]/30 blur-[1px] sm:h-80 sm:w-80" />
        <div aria-hidden="true" className="pointer-events-none absolute right-[8%] top-5 h-24 w-24 rounded-full bg-gradient-to-br from-white/70 to-[#d8ccff]/40 blur-2xl sm:h-36 sm:w-36" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-[-5rem] right-[28%] h-56 w-56 rounded-full bg-[#f4c9ed]/35 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute right-[12%] top-[16%] hidden rotate-12 text-3xl font-black text-[#9b80ff]/40 md:block">✦</div>
        <div aria-hidden="true" className="pointer-events-none absolute right-[44%] bottom-[18%] hidden text-xl text-[#d98be9]/50 md:block">✧</div>
        <div className="relative z-20 flex min-w-0 max-w-[470px] flex-col justify-center py-1.5 text-center sm:py-2 md:py-1 md:text-left">
          <p className="mx-auto inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#5945d6] sm:text-xs md:mx-0">
            <Sparkles size={15} fill="currentColor" /> Personalised for you
          </p>
          <h1 className="mt-2 mx-auto max-w-[440px] text-[clamp(2.35rem,4.2vw,4.1rem)] font-black leading-[.94] tracking-[-.085em] text-[#171526] md:mx-0">
            Made for <span className="bg-gradient-to-r from-[#472cff] via-[#7b2cff] to-[#b23bd1] bg-clip-text text-transparent">you.</span>
          </h1>
          <p className="mx-auto mt-2 max-w-[390px] text-[12px] leading-5 text-[#65657d] sm:text-sm sm:leading-7 md:mx-0">
            {currentUser
              ? "A living mix shaped by what you like, save and revisit. Discover products and services selected around your interests."
              : "A living mix of finds picked for you. Discover products and services, then make your feed more personal as you browse."}
          </p>
          <div className="mt-3 flex flex-col items-center gap-3 md:items-start">
            <span className="inline-flex items-center gap-2 text-[10px] font-extrabold tracking-[.14em] text-[#6b5bd2] sm:text-[11px]"><span aria-hidden="true" className="h-px w-5 rounded-full bg-gradient-to-r from-[#8b7aff] to-[#d6a6f0]" />EXPLORE CATEGORIES<span aria-hidden="true" className="h-px w-5 rounded-full bg-gradient-to-r from-[#d6a6f0] to-[#8b7aff]" /></span>
            <div className="flex max-w-full flex-wrap justify-center gap-2 md:justify-start">
              {(tags.length ? tags.slice(0, 5).map((tag) => tag.name) : ["Fashion", "Beauty", "Home", "Accessories", "Services"]).map((category, index) => (
                <Link
                  key={category}
                  href="/shop"
                  className={index === 0
                    ? "group inline-flex items-center gap-1.5 rounded-full border border-[#ded8ff] bg-white/80 px-2.5 py-1 text-[10px] font-bold text-[#5540c8] shadow-[0_4px_14px_rgba(86,64,200,.08)] transition duration-200 hover:-translate-y-0.5 hover:border-[#bdb0ff] hover:bg-[#f5f2ff] sm:text-[11px]"
                    : "group inline-flex items-center gap-1.5 rounded-full border border-[#e9e7f2] bg-white/55 px-2.5 py-1 text-[10px] font-semibold text-[#65627a] transition duration-200 hover:-translate-y-0.5 hover:border-[#d3caff] hover:bg-white hover:text-[#5540c8] sm:text-[11px]"}
                >
                  {category}
                  <ArrowRight size={11} className="opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="relative z-10 -mx-3 -mt-[4.5rem] flex min-h-[170px] w-full min-w-0 items-center justify-center sm:mx-0 md:-mt-[5.5rem] md:min-h-[220px] lg:min-h-[240px]">
          <ForYouProductCarousel products={mixedCarouselItems} personalized={interestTags.length > 0} compact />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-[#eeebff]/70 blur-3xl md:right-0 md:top-10 md:h-[28rem] md:w-[28rem]" />
      </section>

      <section id="your-interests" aria-label="Personalized product recommendations" className="shell relative z-10 bg-white py-8 md:py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#888]">Picked for your next find</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-[#1c1c1a] sm:text-3xl">Your For You feed</h2>
          </div>
          <span className="hidden rounded-full border border-black/10 px-3 py-2 text-[10px] font-bold text-[#777] sm:inline-flex">Endless discovery</span>
        </div>
        <ForYouFilters tags={tags.map((item) => item.name)} />
      </section>
    </main>
  );
}
