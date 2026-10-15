import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Layers3 } from "lucide-react";
import { db } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { filterAvailableInstagramMedia } from "@/lib/instagram-media";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default async function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prisma = db();
  const groups = await prisma.instagramPost.groupBy({
    by: ["category"],
    where: { isProduct: true, category: { not: "" } },
    _count: { _all: true },
    orderBy: { _count: { category: "desc" } },
  });
  const category = groups.find((item) => item.category?.trim() && slugify(item.category) === slug);
  if (!category?.category) notFound();

  const rawProducts = await prisma.instagramPost.findMany({
    where: { isProduct: true, category: { equals: category.category, mode: "insensitive" } },
    include: { connection: true, tags: true, likes: true, wishlistItems: true },
    orderBy: [{ boostUntil: "desc" }, { timestamp: "desc" }, { id: "desc" }],
  });
  const products = await filterAvailableInstagramMedia(rawProducts);
  const groupedProducts = new Map<string, typeof products>();
  for (const product of products) {
    const subcategory = product.subcategory?.trim() || "";
    if (!subcategory) continue;
    const existing = groupedProducts.get(subcategory) ?? [];
    existing.push(product);
    groupedProducts.set(subcategory, existing);
  }
  const subcategories = Array.from(groupedProducts.keys()).sort((a, b) => a.localeCompare(b));

  return (
    <main className="min-h-screen bg-white pb-20">
      <section className="relative overflow-hidden bg-[#10110f] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border-[58px] border-[#d6ff63]/10 sm:right-[12%]" />
        <div className="shell relative py-12 sm:py-20">
          <Link href="/categories" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3.5 py-2.5 text-xs font-bold text-white/75 transition hover:bg-white/10 hover:text-white">
            <ArrowLeft size={14} /> All categories
          </Link>
          <p className="mt-8 text-[10px] font-black uppercase tracking-[.2em] text-[#d6ff63]">Shop by category</p>
          <div className="mt-3 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-5xl font-black leading-[.95] tracking-[-.07em] sm:text-7xl">{category.category}</h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
                Discover {category.category.toLowerCase()} products and services from marketplace sellers.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] px-5 py-4">
              <Layers3 size={19} className="text-[#d6ff63]" />
              <div>
                <span className="block text-2xl font-black">{products.length}</span>
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-white/55">Available listings</span>
              </div>
            </div>
          </div>
          {subcategories.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {subcategories.map((name) => (
                <a key={name} href={"#subcategory-" + slugify(name)} className="rounded-full border border-white/15 bg-white/[.06] px-3.5 py-2 text-[11px] font-bold text-white/80 transition hover:bg-[#d6ff63] hover:text-black">
                  {name}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="shell pt-9 sm:pt-12">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.17em] text-[#777]">The collection</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.055em] sm:text-4xl">Browse {category.category}</h2>
            <p className="mt-2 text-sm text-[#666]">Real listings from connected Instagram shops.</p>
          </div>
          <Link href="/shop" className="hidden items-center gap-2 rounded-full bg-black px-4 py-3 text-xs font-extrabold text-white sm:inline-flex">
            Discover more <ArrowRight size={14} />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-black/15 bg-[#f8f8f5] px-6 py-20 text-center">
            <Layers3 className="mx-auto text-[#777]" size={28} />
            <h2 className="mt-4 text-xl font-black">No available listings yet</h2>
            <p className="mt-2 text-sm text-[#777]">Check back soon for new finds in {category.category}.</p>
            <Link href="/categories" className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-xs font-bold text-white">Back to categories</Link>
          </div>
        ) : (
          <div className="space-y-12">
            {subcategories.map((subcategory) => {
              const items = groupedProducts.get(subcategory) ?? [];
              return (
                <section key={subcategory} id={"subcategory-" + slugify(subcategory)} className="scroll-mt-24">
                  <div className="mb-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#888]">{category.category}</p>
                      <h3 className="mt-1 text-2xl font-black tracking-[-.05em] sm:text-3xl">{subcategory}</h3>
                    </div>
                    <span className="text-xs font-bold text-[#777]">{items.length} {items.length === 1 ? "item" : "items"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
                    {items.map((product: any) => <ProductCard key={product.id} p={product} />)}
                  </div>
                </section>
              );
            })}
            {products.some((product) => !product.subcategory?.trim()) && (
              <section id="subcategory-other" className="scroll-mt-24">
                <div className="mb-5">
                  <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#888]">{category.category}</p>
                  <h3 className="mt-1 text-2xl font-black tracking-[-.05em] sm:text-3xl">More to explore</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
                  {products.filter((product) => !product.subcategory?.trim()).map((product: any) => <ProductCard key={product.id} p={product} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
