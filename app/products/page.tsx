import Link from "next/link";
import { Grid2X2, LayoutList, Search, SlidersHorizontal } from "lucide-react";
import { db } from "@/lib/prisma";
import { ProductMasonry } from "@/components/product-masonry";

export const dynamic = "force-dynamic";

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const text = params.q?.trim();
  const tag = params.tag?.toLowerCase();

  const tags = await db().productTag.groupBy({
    by: ["name"],
    where: { post: { isProduct: true } },
    _count: { name: true },
    orderBy: { _count: { name: "desc" } },
    take: 14,
  });

  return (
    <main className="shell py-10 md:py-14">
      <div className="rounded-[30px] bg-[#f5f5f2] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow plain">The marketplace</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.055em] md:text-5xl">
              Shop the Instagram feed.
            </h1>
            <p className="mt-3 text-sm text-[#777]">
              Discover products as you scroll
            </p>
          </div>

          <form
            action="/products"
            className="flex w-full max-w-xl rounded-full border border-black/10 bg-white p-1 shadow-sm"
          >
            <Search className="ml-3 mt-2.5 shrink-0 text-[#888]" size={17} />
            <input
              name="q"
              defaultValue={text}
              placeholder="Search products, stores & captions..."
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
            />
            <button className="rounded-full bg-black px-5 py-2.5 text-xs font-bold text-white">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        <Link
          href="/products"
          className={"chip " + (!tag ? "chip-active" : "")}
        >
          All
        </Link>

        {tags.map((x) => (
          <Link
            key={x.name}
            href={"/products?tag=" + encodeURIComponent(x.name)}
            className={"chip " + (tag === x.name ? "chip-active" : "")}
          >
            #{x.name}
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-y border-black/5 py-4">
        <div className="flex items-center gap-2 text-xs font-bold">
          <SlidersHorizontal size={15} />
          Filters
          <span className="font-normal text-[#999]">· New products load automatically as you scroll</span>
        </div>

        <div className="hidden items-center gap-2 text-xs text-[#999] sm:flex">
          <Grid2X2 size={15} />
          Curated grid
          <LayoutList size={15} />
        </div>
      </div>

      <div className="mt-8">
        <ProductMasonry q={text || ""} tag={tag || ""} />
      </div>
    </main>
  );
}
