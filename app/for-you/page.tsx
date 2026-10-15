import { Sparkles, Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { user } from "@/lib/auth";
import { ForYouFilters } from "@/components/for-you-filters";
import { ForYouProductCarousel } from "@/components/for-you-product-carousel";
import { db } from "@/lib/prisma";
import { filterAvailableInstagramMedia } from "@/lib/instagram-media";

export const dynamic = "force-dynamic";

export default async function ForYouPage() {
  const currentUser = await user();
  const tags = await db().productTag.groupBy({
    by: ["name"],
    where: { post: { isProduct: true } },
    _count: { name: true },
    orderBy: { _count: { name: "desc" } },
    take: 14,
  });

  const recentActivity = currentUser
    ? await Promise.all([
        db().recentlyViewedProduct.findMany({
          where: { userId: currentUser.id, post: { isProduct: true } },
          include: { post: { select: { id: true, tags: { select: { name: true } } } } },
          orderBy: { lastViewedAt: "desc" },
          take: 10,
        }),
        db().wishlistItem.findMany({
          where: { userId: currentUser.id, post: { isProduct: true } },
          include: { post: { select: { id: true, tags: { select: { name: true } } } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        db().productLike.findMany({
          where: { userId: currentUser.id, post: { isProduct: true } },
          include: { post: { select: { id: true, tags: { select: { name: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ])
    : [[], [], []];

  const [viewed, saved, liked] = recentActivity;
  const activity = [...viewed, ...saved, ...liked] as any[];
  const excludedIds = [...new Set(activity.map((item) => item.post.id))];
  const interestTags = [...new Set(activity.flatMap((item) => item.post.tags.map((tag: { name: string }) => tag.name)))];

  let recommendations: any[] = [];
  if (interestTags.length) {
    recommendations = await db().instagramPost.findMany({
      where: {
        isProduct: true,
        id: { notIn: excludedIds },
        tags: { some: { name: { in: interestTags } } },
      },
      include: { connection: true, tags: true, likes: true, wishlistItems: true, _count: { select: { likes: true, wishlistItems: true } } },
      orderBy: [{ likes: { _count: "desc" } }, { instagramLikeCount: "desc" }, { timestamp: "desc" }],
      take: 12,
    });
  }

  if (recommendations.length < 6) {
    const fallback = await db().instagramPost.findMany({
      where: { isProduct: true, ...(excludedIds.length ? { id: { notIn: [...excludedIds, ...recommendations.map((item) => item.id)] } } : recommendations.length ? { id: { notIn: recommendations.map((item) => item.id) } } : {}) },
      include: { connection: true, tags: true, likes: true, wishlistItems: true, _count: { select: { likes: true, wishlistItems: true } } },
      orderBy: [{ likes: { _count: "desc" } }, { instagramLikeCount: "desc" }, { timestamp: "desc" }],
      take: 12,
    });
    recommendations = [...recommendations, ...fallback].slice(0, 12);
  }

  const availableRecommendations = await filterAvailableInstagramMedia(recommendations);
  const carouselProducts = JSON.parse(JSON.stringify(availableRecommendations.map((product: any) => ({
    ...product,
    likedByCurrentUser: currentUser ? product.likes?.some((like: any) => like.userId === currentUser.id) : false,
    wishlistedByCurrentUser: currentUser ? product.wishlistItems?.some((item: any) => item.userId === currentUser.id) : false,
  }))));

  return (
    <main className="shell min-h-screen py-5 md:py-8">
      <section className="relative mb-8 overflow-hidden rounded-[30px] border border-black/5 bg-[#f7f7f4] px-5 py-8 sm:px-8 md:mb-10 md:px-12 md:py-12">
        <div className="relative z-10 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-[#666]">
            <Sparkles size={13} /> Your personal shopping feed
          </p>
          <h1 className="mt-5 text-4xl font-black leading-[.98] tracking-[-.06em] text-[#171717] sm:text-5xl md:text-6xl">
            Made for <span className="text-[#777]">you.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6b6b66] sm:text-base">
            {currentUser
              ? "A living mix shaped by what you like, save and revisit. Promoted listings are clearly prioritized, with more relevant finds as your shopping interests grow."
              : "Explore a curated mix of marketplace finds. Sign in and like, save or revisit listings to make your feed more personal across devices."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#444]"><Heart size={14} /> Your interests</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#444]"><ShoppingBag size={14} /> Products & services</span>
            <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-[#171717] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#383838]">Explore the shop</Link>
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[36px] border-white/70 sm:right-6 sm:top-[-7rem] sm:h-80 sm:w-80" />
      </section>

      <ForYouProductCarousel products={carouselProducts} personalized={interestTags.length > 0} />

      <section aria-label="Personalized product recommendations">
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
