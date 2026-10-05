import Link from "next/link";
import { ArrowDown, ArrowRight, Compass, Instagram, Play, ShieldCheck, Store, Tag, Zap } from "lucide-react";
import { db } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const prisma = db();

  const [products, stores, tags] = await Promise.all([
    prisma.instagramPost.findMany({
      where: { isProduct: true },
      include: { connection: true, tags: true, likes: true },
      orderBy: { timestamp: "desc" },
      take: 8,
    }),
    prisma.instagramConnection.findMany({
      include: { posts: { where: { isProduct: true }, select: { id: true } } },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.productTag.groupBy({
      by: ["name"],
      where: { post: { isProduct: true } },
      _count: { name: true },
      orderBy: { _count: { name: "desc" } },
      take: 8,
    }),
  ]);

  return (
    <main className="bg-white">
      <section className="editorial-grid overflow-hidden border-b border-black/5">
        <div className="shell grid min-h-[720px] items-center gap-12 py-20 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="eyebrow">
              <Instagram size={13} /> Instagram marketplace
            </div>
            <h1 className="mt-7 max-w-4xl text-6xl font-black leading-[.88] tracking-[-.075em] sm:text-7xl lg:text-[88px]">
              Instagram posts.
              <br />
              <span className="text-[#777]">Ready to shop.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-[#666] sm:text-lg">
              Instagram Market turns posts from approved Instagram stores into
              beautiful, searchable products — automatically.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-4 text-sm font-bold text-white transition hover:scale-[1.02]"
              >
                Start shopping <ArrowRight size={16} />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-7 py-4 text-sm font-bold"
              >
                How it works <ArrowDown size={15} />
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-5 text-xs font-semibold text-[#777]">
              <span className="inline-flex items-center gap-2"><Zap size={14}/> Automatic product sync</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck size={14}/> Approved stores</span>
            </div>
          </div>

          <div className="relative min-h-[520px]">
            <div className="absolute left-4 top-10 h-64 w-48 rotate-[-7deg] rounded-[28px] bg-[#ecece8] p-2 shadow-xl sm:left-10">
              {products[0]?.mediaUrl && (
                <img src={products[0].thumbnailUrl || products[0].mediaUrl} alt="" className="h-full w-full rounded-[22px] object-cover" />
              )}
            </div>
            <div className="absolute right-2 top-2 h-72 w-52 rotate-[7deg] rounded-[28px] bg-[#111] p-2 shadow-2xl sm:right-8">
              {products[1]?.mediaUrl && (
                <img src={products[1].thumbnailUrl || products[1].mediaUrl} alt="" className="h-full w-full rounded-[22px] object-cover" />
              )}
            </div>
            <div className="absolute bottom-2 left-1/2 h-72 w-56 -translate-x-1/2 rotate-[2deg] rounded-[28px] bg-white p-2 shadow-2xl">
              {products[2]?.mediaUrl && (
                <img src={products[2].thumbnailUrl || products[2].mediaUrl} alt="" className="h-full w-full rounded-[22px] object-cover" />
              )}
            </div>
            <div className="absolute bottom-20 right-0 hidden rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs font-bold shadow-xl sm:block">
              <span className="block text-[#888]">LIVE FEED</span>
              {products.length} products discovered
            </div>
            <div className="absolute bottom-5 left-0 rounded-2xl bg-black px-5 py-4 text-white shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold"><Play size={13} fill="currentColor"/> SHOP THE POST</div>
              <div className="mt-1 text-[10px] text-white/55">Open a product and discover its original Instagram post.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-20">
        <div className="max-w-2xl">
          <p className="eyebrow plain">What is Instagram Market?</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-6xl">
            A storefront built from the content sellers already create.
          </h2>
          <p className="mt-6 text-base leading-8 text-[#666]">
            Sellers connect an approved Instagram Business account. When they
            publish a post, Instagram Market imports the media, caption,
            engagement and hashtags. That post becomes a product shoppers can
            discover without the seller manually rebuilding a catalogue.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Connect", "An approved Instagram store connects its Business account securely."],
            ["02", "Discover", "Posts are synced into the marketplace and hashtags become searchable categories."],
            ["03", "Shop", "Customers browse products, save favourites and open the original Instagram post."],
          ].map(([n, title, text]) => (
            <div key={n} className="card p-7">
              <span className="text-xs font-black text-[#999]">{n}</span>
              <h3 className="mt-14 text-2xl font-black">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#777]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-black/5 bg-[#f8f8f6] py-20">
        <div className="shell">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow plain">Built for easy discovery</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">
                Shop the way you browse Instagram.
              </h2>
            </div>
            <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold">
              Explore everything <ArrowRight size={15}/>
            </Link>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/products" className="card group p-6">
              <Compass size={22}/>
              <h3 className="mt-12 text-xl font-black">All products</h3>
              <p className="mt-2 text-sm text-[#777]">Search and browse the full marketplace.</p>
              <ArrowRight className="mt-6 transition group-hover:translate-x-1" size={18}/>
            </Link>
            <Link href="/stores" className="card group p-6">
              <Store size={22}/>
              <h3 className="mt-12 text-xl font-black">Stores</h3>
              <p className="mt-2 text-sm text-[#777]">Discover connected Instagram sellers.</p>
              <ArrowRight className="mt-6 transition group-hover:translate-x-1" size={18}/>
            </Link>
            <Link href="/categories" className="card group p-6">
              <Tag size={22}/>
              <h3 className="mt-12 text-xl font-black">Categories</h3>
              <p className="mt-2 text-sm text-[#777]">Hashtags become shopping categories.</p>
              <ArrowRight className="mt-6 transition group-hover:translate-x-1" size={18}/>
            </Link>
            <Link href="/wishlist" className="card group p-6">
              <ShieldCheck size={22}/>
              <h3 className="mt-12 text-xl font-black">Wishlist</h3>
              <p className="mt-2 text-sm text-[#777]">Save products and return to them later.</p>
              <ArrowRight className="mt-6 transition group-hover:translate-x-1" size={18}/>
            </Link>
          </div>
        </div>
      </section>

      <section className="shell py-20">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow plain">Fresh from connected stores</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-.05em]">New & noteworthy.</h2>
          </div>
          <Link href="/products" className="hidden text-sm font-bold sm:block">View all →</Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-6">
          {products.map((x) => <ProductCard key={x.id} p={x}/>)}
        </div>
      </section>

      {tags.length > 0 && (
        <section className="shell pb-20">
          <div className="rounded-[32px] border border-black/5 bg-[#111] p-7 text-white sm:p-10">
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-white/45">Explore the edit</p>
            <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
              {tags.map((x) => (
                <Link key={x.name} href={"/products?tag=" + encodeURIComponent(x.name)} className="min-w-[170px] rounded-[22px] bg-white/10 p-5 transition hover:bg-white/15">
                  <Tag size={16}/>
                  <b className="mt-8 block">#{x.name}</b>
                  <span className="mt-1 block text-xs text-white/45">{x._count.name} products</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {stores.length > 0 && (
        <section className="shell pb-24">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow plain">The people behind the posts</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-.05em]">Featured stores.</h2>
            </div>
            <Link href="/stores" className="text-sm font-bold">View stores →</Link>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stores.map((s) => (
              <Link href={"/store/" + s.username} key={s.id} className="card group p-5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-full bg-[#eee]">
                    {s.profileImageUrl && <img src={s.profileImageUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-105"/>}
                  </div>
                  <div className="min-w-0">
                    <b className="block truncate">@{s.username}</b>
                    <span className="text-xs text-[#888]">{s.posts.length} products</span>
                  </div>
                </div>
                <p className="mt-5 line-clamp-2 text-xs leading-5 text-[#777]">{s.biography || "Explore products from this Instagram store."}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
