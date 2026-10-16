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
    likedByCurrentUser: Boolean(currentUser && product.likes?.some((like: any) => like.userId === currentUser.id)),
    wishlistedByCurrentUser: Boolean(currentUser && product.wishlistItems?.some((item: any) => item.userId === currentUser.id)),
  }))));

  return (
    <main className="min-h-screen w-full">
      <section className="relative isolate grid min-h-[590px] w-full overflow-hidden border-b border-[#eeeef8] bg-[radial-gradient(ellipse_at_68%_48%,rgba(220,216,255,.58),transparent_42%),linear-gradient(110deg,#fff_0%,#fcfbff_55%,#fff_100%)] px-5 pb-8 pt-6 sm:px-8 md:min-h-[650px] md:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] md:items-center md:gap-2 md:px-10 md:py-8 lg:px-12">
        <div className="relative z-20 min-w-0 max-w-[470px]">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#e8e6ff] bg-[#f0efff] px-4 py-2.5 text-xs font-semibold text-[#5145ff] shadow-[0_5px_18px_rgba(89,75,255,.08)]">
            <Sparkles size={15} fill="currentColor" /> Personalised for you
          </p>
          <h1 className="mt-6 text-[clamp(2.8rem,5vw,5rem)] font-black leading-[.98] tracking-[-.075em] text-[#171d29]">
            Made for <span className="bg-gradient-to-r from-[#472cff] via-[#7b2cff] to-[#b23bd1] bg-clip-text text-transparent">you.</span>
          </h1>
          <p className="mt-6 max-w-[430px] text-base leading-7 text-[#68718a] sm:text-lg sm:leading-9">
            {currentUser
              ? "A living mix shaped by what you like, save and revisit. Discover products and services selected around your interests."
              : "A living mix of finds picked for you. Discover products and services, then make your feed more personal as you browse."}
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <Link href="/for-you#your-interests" className="group flex w-fit items-center gap-4 rounded-full pr-3 text-sm font-semibold text-[#171d29] transition hover:text-[#5945ff] sm:text-base">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0efff] text-[#5945ff] shadow-[0_4px_10px_rgba(74,60,255,.09)]"><Heart size={26} /></span>
              <span>Your interests</span><ArrowRight size={19} className="ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/shop" className="group flex w-fit items-center gap-4 rounded-full pr-3 text-sm font-semibold text-[#171d29] transition hover:text-[#5945ff] sm:text-base">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0efff] text-[#5945ff] shadow-[0_4px_10px_rgba(74,60,255,.09)]"><ShoppingBag size={26} /></span>
              <span>Products &amp; services</span>
            </Link>
          </div>
          <Link href="/shop" className="mt-7 inline-flex min-h-[58px] items-center gap-4 rounded-full bg-[#171d29] px-7 py-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(23,29,41,.12)] transition hover:-translate-y-0.5 hover:bg-[#2a3040] sm:text-base">
            Explore the shop <ArrowRight size={21} />
          </Link>
        </div>
        <div className="relative z-10 -mx-3 mt-2 flex min-h-[390px] w-full min-w-0 items-center justify-center sm:mx-0 md:mt-0 md:min-h-[500px] lg:min-h-[540px]">
          <ForYouProductCarousel products={carouselProducts} personalized={interestTags.length > 0} compact />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-[#eeebff]/70 blur-3xl md:right-0 md:top-10 md:h-[28rem] md:w-[28rem]" />
      </section>

      <section id="your-interests" aria-label="Personalized product recommendations" className="shell relative py-8 md:py-10">
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
