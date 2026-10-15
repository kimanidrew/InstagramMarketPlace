import Link from "next/link";
import { ArrowRight, ArrowUpRight, Layers3, Sparkles } from "lucide-react";
import { db } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { filterAvailableInstagramMedia } from "@/lib/instagram-media";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default async function CategoriesPage() {
  const prisma = db();
  const grouped = await prisma.instagramPost.groupBy({
    by: ["category"],
    where: { isProduct: true, category: { not: "" } },
    _count: { _all: true },
    orderBy: { _count: { category: "desc" } },
  });

  const categories = await Promise.all(grouped
    .filter((item): item is typeof item & { category: string } => Boolean(item.category?.trim()))
    .map(async (item) => {
      const products = await prisma.instagramPost.findMany({
        where: { isProduct: true, category: { equals: item.category, mode: "insensitive" } },
        include: { connection: true, tags: true, likes: true, wishlistItems: true },
        orderBy: [{ boostUntil: "desc" }, { timestamp: "desc" }],
        take: 5,
      });
      const available = await filterAvailableInstagramMedia(products);
      return { name: item.category, slug: slugify(item.category), count: item._count._all, products: available.slice(0, 4) };
    }));

  const visible = categories.filter((category) => category.products.length > 0);

  return (
    <main className="category-discovery-page min-h-screen bg-white pb-20">
      <section className="category-discovery-hero relative overflow-hidden bg-[#10110f] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-[360px] w-[360px] rounded-full border-[70px] border-[#d6ff63]/10 sm:right-[8%]" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-[-140px] left-[15%] h-[280px] w-[280px] rounded-full bg-[#d6ff63]/10 blur-3xl" />
        <div className="shell relative py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#d6ff63]">
            <Sparkles size={13} /> Browse by interest
          </div>
          <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_.7fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-5xl font-black leading-[.94] tracking-[-.07em] sm:text-7xl">Find your next <span className="text-[#d6ff63]">favourite.</span></h1>
              <p className="mt-6 max-w-xl text-sm leading-7 text-white/65 sm:text-base">Explore categories built around real products and services from Instagram shops. Start with a collection, then discover the sellers behind it.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <div className="rounded-2xl border border-white/10 bg-white/[.06] px-5 py-4"><span className="block text-3xl font-black">{visible.length}</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[.12em] text-white/55">Categories</span></div>
              <div className="rounded-2xl border border-white/10 bg-white/[.06] px-5 py-4"><span className="block text-3xl font-black">{visible.reduce((sum, category) => sum + category.products.length, 0)}+</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[.12em] text-white/55">Featured finds</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell pt-10 sm:pt-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#777]">Curated for discovery</p><h2 className="mt-2 text-3xl font-black tracking-[-.055em] sm:text-4xl">Explore categories</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#666]">A little preview from every corner of the marketplace.</p></div>
          <Link href="/shop" className="hidden shrink-0 items-center gap-2 rounded-full bg-[#171717] px-4 py-3 text-xs font-extrabold text-white transition hover:bg-[#333] sm:inline-flex">All listings <ArrowRight size={14}/></Link>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-black/15 bg-[#f8f8f5] px-6 py-20 text-center"><Layers3 className="mx-auto text-[#777]" size={28}/><h2 className="mt-4 text-xl font-black">Categories are taking shape</h2><p className="mt-2 text-sm text-[#777]">As shops publish products, their categories will appear here.</p><Link href="/shop" className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-xs font-bold text-white">Browse the marketplace</Link></div>
        ) : (
          <div className="space-y-12 sm:space-y-16">
            {visible.map((category, index) => (
              <section key={category.slug} className="category-preview-section">
                <div className="mb-5 flex items-end justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f0f1e9] text-sm font-black text-[#34372a] sm:h-12 sm:w-12">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0"><h3 className="text-2xl font-black tracking-[-.05em] sm:text-3xl">{category.name}</h3><p className="mt-1 text-xs font-semibold text-[#777]">{category.count} {category.count === 1 ? "listing" : "listings"} to explore</p></div>
                  </div>
                  <Link href={"/category/" + category.slug} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-2.5 text-[11px] font-extrabold transition hover:border-black hover:bg-black hover:text-white sm:px-4">View category <ArrowUpRight size={14}/></Link>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
                  {category.products.map((product: any) => <ProductCard key={product.id} p={product} />)}
                </div>
                <Link href={"/category/" + category.slug} className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-[#f5f5f1] px-4 py-3.5 text-xs font-extrabold transition hover:bg-[#e9e9e2]">Explore all {category.name} <ArrowRight size={14}/></Link>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
