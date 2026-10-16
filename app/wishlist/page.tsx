import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { OptimizedProductGrid } from "@/components/optimized-product-grid";

export const dynamic = "force-dynamic";

export default async function Wishlist() {
  const u = await user();

  if (!u) {
    return (
      <main className="shell py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5f2]">
            <Heart />
          </div>
          <h1 className="mt-6 text-3xl font-black">Your wishlist is waiting.</h1>
          <p className="mt-3 text-sm leading-7 text-[#777]">
            Sign in to save products you love and come back to them anytime.
          </p>
          <Link
            href="/login?next=/wishlist"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold text-white"
          >
            Sign in <ArrowRight size={15} />
          </Link>
        </div>
      </main>
    );
  }

  const ps = await db().instagramPost.findMany({
    where: {
      isProduct: true,
      wishlistItems: { some: { userId: u.id } },
    },
    include: {
      connection: true,
      tags: true,
      likes: true,
      wishlistItems: { where: { userId: u.id } },
    },
    orderBy: { timestamp: "desc" },
  });

  return (
    <main className="shell py-12 md:py-16">
      <div>
        <p className="eyebrow plain">Saved for later</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">
          Your wishlist.
        </h1>
        <p className="mt-3 text-sm text-[#777]">
          {ps.length} saved {ps.length === 1 ? "listing" : "listings"}
        </p>
      </div>

      {ps.length > 0 ? (
        <div className="mt-10">
          <OptimizedProductGrid products={ps} />
        </div>
      ) : (
        <div className="mt-10 rounded-[30px] bg-[#f6f6f3] py-20 text-center">
          <Heart className="mx-auto" size={25} />
          <h2 className="mt-5 text-xl font-black">No saved listings yet</h2>
          <p className="mt-2 text-sm text-[#777]">
            Tap the bookmark on a product or service to keep it here.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold text-white"
          >
            Start shopping <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </main>
  );
}
