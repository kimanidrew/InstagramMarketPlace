import { Sparkles, Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { user } from "@/lib/auth";
import { ProductMasonry } from "@/components/product-masonry";

export const dynamic = "force-dynamic";

export default async function ForYouPage() {
  const currentUser = await user();

  return (
    <main className="shell min-h-screen py-8 md:py-12">
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

      <section aria-label="Personalized product recommendations">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#888]">Picked for your next find</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-[#1c1c1a] sm:text-3xl">Your For You feed</h2>
          </div>
          <span className="hidden rounded-full border border-black/10 px-3 py-2 text-[10px] font-bold text-[#777] sm:inline-flex">Endless discovery</span>
        </div>
        <ProductMasonry personalized />
      </section>
    </main>
  );
}
