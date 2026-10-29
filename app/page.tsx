import Link from "next/link";
import { ArrowRight, BadgePercent, BriefcaseBusiness, ChevronRight, Clock3, Flame, Grid2X2, HeartHandshake, ShieldCheck, Sparkles, Store, Truck } from "lucide-react";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { filterAvailableInstagramMedia } from "@/lib/instagram-media";

export const dynamic = "force-dynamic";

const categories = [
  { label: "Fashion & clothing", tag: "fashion", icon: "✦" },
  { label: "Beauty & skincare", tag: "beauty", icon: "✧" },
  { label: "Home & living", tag: "home", icon: "⌂" },
  { label: "Electronics", tag: "electronics", icon: "⌁" },
  { label: "Food & groceries", tag: "food", icon: "❋" },
  { label: "Services", tag: "services", icon: "↗" },
];

export default async function Home() {
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "SokoLink";
  const currentUser = await user();
  const now = new Date();
  const [rawProducts, rawStores, promotedRaw] = await Promise.all([
    db().instagramPost.findMany({
      where: { isProduct: true, mediaUrl: { not: null } },
      include: { connection: true, tags: true, likes: true, wishlistItems: true, _count: { select: { likes: true, wishlistItems: true } } },
      orderBy: { timestamp: "desc" },
      take: 32,
    }),
    db().instagramConnection.findMany({
      where: { posts: { some: { isProduct: true, mediaUrl: { not: null } } } },
      include: { posts: { where: { isProduct: true, mediaUrl: { not: null } }, select: { id: true, mediaUrl: true, thumbnailUrl: true }, orderBy: { timestamp: "desc" }, take: 4 } },
      orderBy: [{ verifiedAt: "desc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    db().instagramPost.findMany({
      where: { isProduct: true, boostUntil: { gt: now }, mediaUrl: { not: null } },
      include: { connection: true, tags: true, likes: true, wishlistItems: true, _count: { select: { likes: true, wishlistItems: true } } },
      orderBy: { boostUntil: "desc" },
      take: 12,
    }),
  ]);

  const products = await filterAvailableInstagramMedia(rawProducts);
  const promoted = await filterAvailableInstagramMedia(promotedRaw);
  const stores = (await Promise.all(rawStores.map(async (store) => ({
    ...store,
    posts: await filterAvailableInstagramMedia(store.posts),
  })))).filter((store) => store.posts.length > 0);
  const prepare = (items: any[]) => items.map((p) => ({
    ...p,
    likedByCurrentUser: currentUser ? p.likes?.some((like: any) => like.userId === currentUser.id) : false,
    wishlistedByCurrentUser: currentUser ? p.wishlistItems?.some((item: any) => item.userId === currentUser.id) : false,
  }));
  const freshProducts = prepare(products).slice(0, 12);
  const promotedProducts = prepare(promoted).slice(0, 8);
  const trendingProducts = prepare([...products].sort((a: any, b: any) =>
    (Number(b.instagramLikeCount || 0) + Number(b._count?.likes || 0) + Number(b._count?.wishlistItems || 0)) -
    (Number(a.instagramLikeCount || 0) + Number(a._count?.likes || 0) + Number(a._count?.wishlistItems || 0))
  )).slice(0, 8);

  return (
    <main className="min-h-screen bg-[#eaeff2] text-[#17202a]">
      <div className="bg-[#131921] text-white">
        <div className="shell flex flex-wrap items-center justify-between gap-2 py-2 text-xs sm:text-sm">
          <p className="font-medium"><span className="mr-2 inline-block rounded bg-[#ff9900] px-2 py-0.5 font-black text-[#131921]">SOKOLINK</span> Great finds from businesses worth discovering.</p>
          <div className="flex items-center gap-4 text-white/80"><Link href="/stores" className="hover:text-[#ffb84d]">Shop local stores</Link><Link href="/account" className="hover:text-[#ffb84d]">Sell with us <ArrowRight size={12} className="ml-1 inline"/></Link></div>
        </div>
      </div>
      <div className="border-b border-[#d5d9d9] bg-[#232f3e] text-white">
        <div className="shell flex items-center gap-2 overflow-x-auto py-2.5 text-sm sm:gap-3">
          <Link href="/categories" className="flex shrink-0 items-center gap-2 rounded-md bg-[#ff9900] px-3 py-2 font-bold text-[#17202a]"><Grid2X2 size={16}/> All categories</Link>
          {categories.map((category) => <Link key={category.tag} href={category.tag === "services" ? "/search?type=service" : "/search?tag=" + encodeURIComponent(category.tag)} className="shrink-0 rounded-md px-3 py-2 text-white/90 transition hover:bg-white/10 hover:text-[#ffb84d]">{category.label}</Link>)}
          <Link href="/stores" className="ml-auto hidden shrink-0 items-center gap-1 font-semibold text-[#ffb84d] sm:flex">Explore stores <ArrowRight size={14}/></Link>
        </div>
      </div>

      <div className="shell py-4 md:py-6">
        <section className="grid items-stretch gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden rounded-xl border border-[#d5d9d9] bg-white p-3 shadow-sm lg:block">
            <div className="px-2 pb-2"><h2 className="flex items-center gap-2 whitespace-nowrap text-sm font-extrabold"><Grid2X2 size={16} className="shrink-0"/> Shop by category</h2></div>
            {categories.map((category, index) => <Link key={category.tag} href={category.tag === "services" ? "/search?type=service" : "/search?tag=" + encodeURIComponent(category.tag)} className={`group flex items-center gap-3 rounded-lg px-2 py-3 text-sm transition hover:bg-[#fff3e0] hover:text-[#9a4e00] ${index % 2 === 0 ? "text-[#45515d]" : "text-[#263746]"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${["bg-[#e2f3ff]","bg-[#fff0d6]","bg-[#e7f6e8]","bg-[#f3e8ff]","bg-[#ffe7e7]","bg-[#e7f4f1]"][index]}`}>{category.icon}</span><span className="min-w-0 flex-1">{category.label}</span><ChevronRight size={15} className="text-[#aaa] group-hover:text-black"/></Link>)}
            <div className="mt-2 border-t border-[#eee] pt-2"><Link href="/stores" className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm font-bold hover:bg-[#f4f7f9]"><Store size={16} className="text-[#176b87]"/> Browse all stores</Link><Link href="/account" className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm font-bold hover:bg-[#fff3e0]"><HeartHandshake size={16} className="text-[#b45a00]"/> Sell on {brandName}</Link></div>
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <section className="relative isolate flex min-h-[340px] overflow-hidden rounded-xl bg-gradient-to-br from-[#172b4d] via-[#176b87] to-[#e47911] text-white shadow-sm sm:min-h-[390px] xl:min-h-[420px]">
              <div className="relative z-10 flex w-full flex-col items-start justify-center p-6 sm:p-9 lg:w-[65%] lg:p-11">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#ff9900] px-3 py-1.5 text-[11px] font-black uppercase tracking-[.12em] text-[#17202a]"><Sparkles size={13}/> Your everyday discovery store</span>
                <h1 className="max-w-2xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl xl:text-6xl">Discover great finds. <span className="text-[#ffcf70]">Meet the people behind them.</span></h1>
                <p className="mt-4 max-w-lg text-sm leading-6 text-white/85 sm:text-base">Shop products and services from real businesses, powered by their Instagram storefronts.</p>
                <div className="mt-6 flex flex-wrap gap-3"><Link href="/shop" className="inline-flex items-center gap-2 rounded-md bg-[#ff9900] px-5 py-3 text-sm font-black text-[#17202a] shadow-md transition hover:-translate-y-0.5 hover:bg-[#ffb84d]">Start shopping <ArrowRight size={16}/></Link><Link href="/stores" className="inline-flex items-center gap-2 rounded-md border border-white/60 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20">Meet the sellers</Link></div>
                <p className="mt-5 text-xs text-white/65">Find it on social. Discover it on {brandName}.</p>
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[43%] lg:block">
                <div className="absolute -right-10 -top-16 h-80 w-80 rounded-full border-[38px] border-white/10"/>
                <div className="absolute right-12 top-9 h-48 w-48 rotate-6 overflow-hidden rounded-2xl border-4 border-white/25 shadow-2xl xl:right-20 xl:h-56 xl:w-56"><img src={products[0]?.thumbnailUrl || products[0]?.mediaUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"} alt="Featured marketplace find" className="h-full w-full object-cover"/></div>
                <div className="absolute bottom-7 right-32 h-32 w-28 -rotate-6 overflow-hidden rounded-2xl border-4 border-white/25 shadow-2xl xl:right-44 xl:h-36 xl:w-32"><img src={products[1]?.thumbnailUrl || products[1]?.mediaUrl || "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=500&q=80"} alt="Marketplace selection" className="h-full w-full object-cover"/></div>
              </div>
            </section>

            <div className="flex flex-col gap-3">
              <Link href="/for-you" className="group flex min-h-[132px] items-center gap-4 rounded-xl border border-[#c7e4f5] bg-gradient-to-r from-[#e6f6ff] to-[#c5e8fb] p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#176b87] shadow-sm"><Sparkles size={22}/></span><span className="min-w-0 flex-1"><b className="block text-base sm:text-lg">Picked for you</b><span className="mt-1 block text-xs leading-5 text-[#526b79]">Recommendations picked around your taste.</span><span className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#176b87]">Explore picks <ArrowRight size={13}/></span></span></Link>
              <Link href="/categories" className="group flex min-h-[132px] items-center gap-4 rounded-xl border border-[#f2d5a7] bg-gradient-to-r from-[#fff5df] to-[#ffdfaa] p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#a65b00] shadow-sm"><BadgePercent size={22}/></span><span className="min-w-0 flex-1"><b className="block text-base sm:text-lg">Explore categories</b><span className="mt-1 block text-xs leading-5 text-[#806454]">Browse all the things you love in one place.</span><span className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#a65b00]">Browse now <ArrowRight size={13}/></span></span></Link>
              <Link href="/stores" className="group flex min-h-[132px] items-center gap-4 rounded-xl border border-[#cce7d1] bg-gradient-to-r from-[#e8f8e9] to-[#c8edcf] p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#267443] shadow-sm"><Store size={22}/></span><span className="min-w-0 flex-1"><b className="block text-base sm:text-lg">Shop local stores</b><span className="mt-1 block text-xs leading-5 text-[#4d7056]">Meet sellers and discover their latest drops.</span><span className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#267443]">Meet sellers <ArrowRight size={13}/></span></span></Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-[#d5d9d9] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8a2c45]">Shop with confidence</p><h2 className="mt-1 text-lg font-bold">A better way to discover independent sellers</h2></div><Link href="/about" className="inline-flex items-center gap-1 text-sm font-semibold">About {brandName} <ArrowRight size={15}/></Link></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="flex items-center gap-3 rounded-xl bg-[#f8f8f8] p-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white"><ShieldCheck size={19}/></span><span><b className="block text-sm">Seller profiles</b><span className="text-xs text-[#777]">Explore the business behind each post</span></span></div><div className="flex items-center gap-3 rounded-xl bg-[#f8f8f8] p-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white"><HeartHandshake size={19}/></span><span><b className="block text-sm">Social discovery</b><span className="text-xs text-[#777]">Find products from real creators</span></span></div><div className="flex items-center gap-3 rounded-xl bg-[#f8f8f8] p-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white"><Truck size={19}/></span><span><b className="block text-sm">Direct connection</b><span className="text-xs text-[#777]">Continue with the seller directly</span></span></div></div>
        </section>

        {promotedProducts.length > 0 && <section className="mt-8 rounded-xl border border-[#d5d9d9] bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.16em] text-[#8a2c45]"><BadgePercent size={14}/> Promoted picks</p><h2 className="mt-1 text-xl font-black sm:text-2xl">In the spotlight</h2></div><Link href="/shop?tab=featured" className="flex shrink-0 items-center gap-1 text-sm font-semibold">View all <ArrowRight size={15}/></Link></div><div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">{promotedProducts.slice(0,5).map((p:any)=><ProductCard key={p.id} p={p}/>)}</div></section>}

        <section className="mt-8 rounded-2xl border border-[#e7e7e7] bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-end justify-between gap-3"><div><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.16em] text-[#8a2c45]"><Flame size={14}/> Fresh from the shops</p><h2 className="mt-1 text-xl font-black sm:text-2xl">Discover new finds</h2><p className="mt-1 text-sm text-[#777]">Explore the latest products and services from connected sellers.</p></div><Link href="/shop" className="flex shrink-0 items-center gap-1 text-sm font-semibold">See all <ArrowRight size={15}/></Link></div>
          {freshProducts.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{freshProducts.slice(0,12).map((p:any)=><ProductCard key={p.id} p={p}/>)}</div> : <div className="rounded-xl border border-dashed border-[#ddd] px-5 py-12 text-center"><Store className="mx-auto mb-3 text-[#999]" size={28}/><h3 className="font-bold">Your next great find is waiting</h3><p className="mt-1 text-sm text-[#777]">Connected shops will appear here as their products sync.</p><Link href="/stores" className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">Explore stores <ArrowRight size={15}/></Link></div>}
        </section>

        {trendingProducts.length > 0 && <section className="mt-8 rounded-2xl border border-[#e7e7e7] bg-white p-4 sm:p-5"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.16em] text-[#8a2c45]"><Clock3 size={14}/> Community favourites</p><h2 className="mt-1 text-xl font-black sm:text-2xl">Trending right now</h2></div><Link href="/shop?tab=trending" className="flex shrink-0 items-center gap-1 text-sm font-semibold">Explore trending <ArrowRight size={15}/></Link></div><div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{trendingProducts.map((p:any)=><ProductCard key={p.id} p={p}/>)}</div></section>}

        {stores.length > 0 && <section className="mt-8 rounded-2xl border border-[#e7e7e7] bg-white p-4 sm:p-5"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8a2c45]">People behind the products</p><h2 className="mt-1 text-xl font-black sm:text-2xl">Meet the stores</h2></div><Link href="/stores" className="flex shrink-0 items-center gap-1 text-sm font-semibold">All stores <ArrowRight size={15}/></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{stores.slice(0,6).map((store:any)=><Link key={store.id} href={"/stores/"+store.username} className="group overflow-hidden rounded-xl border border-[#eee] transition hover:-translate-y-0.5 hover:shadow-md"><div className="aspect-[4/3] overflow-hidden bg-[#f3f3f3]">{store.profileImageUrl ? <img src={store.profileImageUrl} alt={store.name || "@"+store.username} className="h-full w-full object-cover transition group-hover:scale-105"/> : <div className="flex h-full items-center justify-center"><Store size={28}/></div>}</div><div className="p-3"><b className="block truncate text-sm">{store.name || "@"+store.username}</b><span className="mt-1 block truncate text-xs text-[#777]">@{store.username}</span><span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold">Visit shop <ArrowRight size={12}/></span></div></Link>)}</div></section>}

        <section className="mt-8 flex flex-col items-start justify-between gap-4 rounded-xl bg-gradient-to-r from-[#172b4d] via-[#176b87] to-[#e47911] p-6 text-white shadow-sm sm:flex-row sm:items-center sm:p-8"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-white/55">Have something to sell?</p><h2 className="mt-2 text-2xl font-black">Bring your Instagram shop to {brandName}.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Connect your Instagram Business account and make your posts easier for shoppers to discover.</p></div><Link href="/account" className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#ff9900] px-5 py-3 text-sm font-black text-[#17202a] hover:bg-[#ffb84d]">Start selling <ArrowRight size={15}/></Link></section>
      </div>
    </main>
  );
}
