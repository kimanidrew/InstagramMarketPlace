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
      <section className="relative isolate grid min-h-[430px] w-full overflow-hidden border-b border-[#eeeef8] bg-[radial-gradient(ellipse_at_68%_48%,rgba(220,216,255,.58),transparent_42%),linear-gradient(110deg,#fff_0%,#fcfbff_55%,#fff_100%)] px-5 pb-5 pt-4 sm:min-h-[460px] sm:px-8 md:min-h-[500px] md:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] md:items-center md:gap-2 md:px-10 md:py-5 lg:px-12">
        <div className="relative z-20 min-w-0 max-w-[470px] py-5 sm:py-7 md:py-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#e5e0ff] bg-white/80 px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#5945d6] shadow-[0_8px_24px_rgba(83,65,190,.10)] backdrop-blur-md sm:text-xs">
            <Sparkles size={15} fill="currentColor" /> Personalised for you
          </p>
          <h1 className="mt-5 max-w-[440px] text-[clamp(2.7rem,4.8vw,4.8rem)] font-black leading-[.94] tracking-[-.085em] text-[#171526]">
            Made for <span className="bg-gradient-to-r from-[#472cff] via-[#7b2cff] to-[#b23bd1] bg-clip-text text-transparent">you.</span>
          </h1>
          <p className="mt-5 max-w-[390px] text-[14px] leading-7 text-[#65657d] sm:text-base sm:leading-8">
            {currentUser
              ? "A living mix shaped by what you like, save and revisit. Discover products and services selected around your interests."
              : "A living mix of finds picked for you. Discover products and services, then make your feed more personal as you browse."}
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link href="/for-you#your-interests" className="group flex w-full max-w-[320px] items-center gap-3 rounded-2xl border border-white/90 bg-white/65 p-2.5 pr-4 text-sm font-bold text-[#27243a] shadow-[0_6px_22px_rgba(38,28,92,.045)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#e2dcff] hover:bg-white hover:text-[#5945ff] hover:shadow-[0_12px_28px_rgba(80,61,190,.10)] sm:text-base">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ece9ff] to-[#f8eaff] text-[#5945ff] shadow-inner"><Heart size={20} /></span>
              <span className="flex-1 tracking-[-.02em]">Your interests</span><ArrowRight size={17} className="text-[#8b80c7] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#5945ff]" />
            </Link>
            <Link href="/shop" className="group flex w-full max-w-[320px] items-center gap-3 rounded-2xl border border-white/90 bg-white/65 p-2.5 pr-4 text-sm font-bold text-[#27243a] shadow-[0_6px_22px_rgba(38,28,92,.045)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#e2dcff] hover:bg-white hover:text-[#5945ff] hover:shadow-[0_12px_28px_rgba(80,61,190,.10)] sm:text-base">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ece9ff] to-[#f8eaff] text-[#5945ff] shadow-inner"><ShoppingBag size={20} /></span>
              <span className="flex-1 tracking-[-.02em]">Products &amp; services</span><ArrowRight size={17} className="text-[#8b80c7] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#5945ff]" />
            </Link>
          </div>
          <Link href="/shop" className="group relative mt-6 inline-flex min-h-[56px] items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#28213f] via-[#5540dc] to-[#9639d2] px-6 py-3.5 text-sm font-black tracking-[-.01em] text-white shadow-[0_16px_34px_rgba(91,65,210,.27)] ring-1 ring-white/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_42px_rgba(91,65,210,.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7564ff] focus-visible:ring-offset-2 sm:text-base">
            <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            <span className="relative">Explore the shop</span><span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white/25"><ArrowRight size={18} /></span>
          </Link>
        </div>
        <div className="relative z-10 -mx-3 mt-0 flex min-h-[340px] w-full min-w-0 items-center justify-center sm:mx-0 md:mt-0 md:min-h-[420px] lg:min-h-[450px]">
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
