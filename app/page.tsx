import Link from "next/link";
import { ArrowRight, BadgePercent, BriefcaseBusiness, ChevronRight, Clock3, Flame, Grid2X2, HeartHandshake, ShieldCheck, Sparkles, Store, Truck } from "lucide-react";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { SpotlightStoreCard } from "@/components/store-directory";
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

const productCategories = [
  { label: "Fashion & clothing", tag: "fashion", description: "Everyday style, statement pieces and wardrobe finds.", aliases: ["fashion", "clothing", "apparel", "wear", "shoes", "accessories"] },
  { label: "Beauty & skincare", tag: "beauty", description: "Beauty essentials, skincare and self-care favourites.", aliases: ["beauty", "skincare", "skin care", "makeup", "cosmetic", "hair", "fragrance"] },
  { label: "Home & living", tag: "home", description: "Thoughtful pieces to refresh your home and everyday spaces.", aliases: ["home", "living", "furniture", "decor", "kitchen", "household"] },
  { label: "Electronics", tag: "electronics", description: "Useful tech, gadgets and accessories worth a closer look.", aliases: ["electronic", "tech", "gadget", "phone", "computer", "device"] },
  { label: "Food & groceries", tag: "food", description: "Food, treats and everyday essentials from local sellers.", aliases: ["food", "grocery", "groceries", "drink", "snack", "bakery", "cake"] },
  { label: "Services", tag: "services", description: "Discover talented service providers and independent businesses.", aliases: ["service", "salon", "event", "photography", "repair", "cleaning", "design"] },
];

export default async function Home() {
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "SokoLink";
  const currentUser = await user();
  const now = new Date();
  const [rawProducts, rawStores, promotedRaw, activeProductCampaigns, activeStoreCampaigns] = await Promise.all([
    db().instagramPost.findMany({
      where: { isProduct: true, mediaUrl: { not: null } },
      include: { connection: true, tags: true, likes: true, wishlistItems: true, _count: { select: { likes: true, wishlistItems: true } } },
      orderBy: { timestamp: "desc" },
      take: 36,
    }),
    db().instagramConnection.findMany({
      where: { posts: { some: { isProduct: true, mediaUrl: { not: null } } } },
      include: { posts: { where: { isProduct: true, mediaUrl: { not: null } }, select: { id: true, mediaUrl: true, thumbnailUrl: true }, orderBy: { timestamp: "desc" }, take: 4 } },
      orderBy: [{ verifiedAt: "desc" }, { updatedAt: "desc" }],
      take: 16,
    }),
    db().instagramPost.findMany({
      where: { isProduct: true, boostUntil: { gt: now }, mediaUrl: { not: null } },
      include: { connection: true, tags: true, likes: true, wishlistItems: true, _count: { select: { likes: true, wishlistItems: true } } },
      orderBy: { boostUntil: "desc" },
      take: 12,
    }),
    db().promotionCampaign.findMany({
      where: {
        status: "ACTIVE",
        targetType: "PRODUCT",
        AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { endsAt: { gt: now } }],
        postId: { not: null },
      },
      include: { post: { include: { connection: true, tags: true, likes: true, wishlistItems: true, _count: { select: { likes: true, wishlistItems: true } } } } },
      orderBy: [{ endsAt: "desc" }, { createdAt: "desc" }],
      take: 12,
    }),
    db().promotionCampaign.findMany({
      where: {
        status: "ACTIVE",
        targetType: "STORE",
        AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { endsAt: { gt: now } }],
      },
      select: { connectionId: true },
      orderBy: [{ endsAt: "desc" }, { createdAt: "desc" }],
      take: 12,
    }),
  ]);

  const products = await filterAvailableInstagramMedia(rawProducts);
  const boosted = await filterAvailableInstagramMedia(promotedRaw);
  const campaignProducts = await filterAvailableInstagramMedia(activeProductCampaigns.map((campaign: any) => campaign.post).filter(Boolean));
  const promoted = [...campaignProducts, ...boosted].filter((product: any, index: number, all: any[]) => all.findIndex((candidate: any) => candidate.id === product.id) === index);
  const stores = (await Promise.all(rawStores.map(async (store) => ({
    ...store,
    posts: await filterAvailableInstagramMedia(store.posts),
  })))).filter((store) => store.posts.length > 0);
  const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);
  const activeStoreIds = new Set(activeStoreCampaigns.map((campaign: any) => campaign.connectionId));
  const paidPromotedStores = stores.filter((store: any) => activeStoreIds.has(store.id));
  const promotedStores = (paidPromotedStores.length ? paidPromotedStores : shuffle(stores)).slice(0, 8);
  const isProductPromotionFallback = promoted.length === 0;
  const promotionProductsSource = isProductPromotionFallback ? shuffle(products) : promoted;
  const prepare = (items: any[]) => items.map((p) => ({
    ...p,
    likedByCurrentUser: currentUser ? p.likes?.some((like: any) => like.userId === currentUser.id) : false,
    wishlistedByCurrentUser: currentUser ? p.wishlistItems?.some((item: any) => item.userId === currentUser.id) : false,
  }));
  const freshProducts = prepare(products).slice(0, 12);
  const promotedProducts = prepare(promotionProductsSource).slice(0, 10);
  const trendingProducts = prepare([...products].sort((a: any, b: any) =>
    (Number(b.instagramLikeCount || 0) + Number(b._count?.likes || 0) + Number(b._count?.wishlistItems || 0)) -
    (Number(a.instagramLikeCount || 0) + Number(a._count?.likes || 0) + Number(a._count?.wishlistItems || 0))
  )).slice(0, 8);
  const serviceProducts = prepare(products.filter((product: any) => String(product.listingType || "").toUpperCase() === "SERVICE")).slice(0, 8);
  const categoryMatches = (product: any, category: (typeof productCategories)[number]) => {
    if (category.tag === "services" && String(product.listingType || "").toUpperCase() === "SERVICE") return true;
    const values = [product.category, product.subcategory, ...(product.tags || []).map((tag: any) => tag.name)]
      .filter(Boolean).map((value: any) => String(value).toLowerCase().trim());
    return values.some((value: string) => category.aliases.some((alias) => value.includes(alias)));
  };
  const categorySections = productCategories.map((category) => ({
    ...category,
    products: prepare(products.filter((product: any) => categoryMatches(product, category)))
      .filter((product: any, index: number, all: any[]) => all.findIndex((candidate: any) => candidate.id === product.id) === index)
      .slice(0, 6),
  }));
  const storeBannerEntries = stores.map((store: any) => ({
    store: {
      id: store.id, username: store.username, name: store.name, biography: store.biography,
      profileImageUrl: store.profileImageUrl, profileAccentColor: store.profileAccentColor,
      verifiedAt: store.verifiedAt, verifiedUntil: store.verifiedUntil, proUntil: store.proUntil,
    },
    posts: store.posts,
    promoted: activeStoreIds.has(store.id),
    activeVerified: !!store.verifiedAt && (!store.verifiedUntil || store.verifiedUntil > now),
    activePro: !!store.proUntil && store.proUntil > now,
  }));

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
                <h1 className="max-w-2xl text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl xl:text-5xl">Discover great finds. <span className="text-[#ffcf70]">Meet the people behind them.</span></h1>
                <p className="mt-4 max-w-lg text-sm leading-6 text-white/85 sm:text-base">Shop products and services from real businesses, powered by their Instagram storefronts.</p>
                <div className="mt-6 flex flex-wrap gap-3"><Link href="/shop" className="inline-flex items-center gap-2 rounded-md bg-[#ff9900] px-4 py-2.5 text-sm font-extrabold text-[#17202a] shadow-md transition hover:-translate-y-0.5 hover:bg-[#ffb84d]">Start shopping <ArrowRight size={16}/></Link><Link href="/stores" className="inline-flex items-center gap-2 rounded-md border border-white/60 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">Meet the sellers</Link></div>
                <p className="mt-5 text-xs text-white/65">Find it on social. Discover it on {brandName}.</p>
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[43%] lg:block">
                <div className="absolute -right-10 -top-16 h-80 w-80 rounded-full border-[38px] border-white/10"/>
                <div className="absolute right-12 top-9 h-48 w-48 rotate-6 overflow-hidden rounded-2xl border-4 border-white/25 shadow-2xl xl:right-20 xl:h-56 xl:w-56"><img src={products[0]?.thumbnailUrl || products[0]?.mediaUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"} alt="Featured marketplace find" className="h-full w-full object-cover"/></div>
                <div className="absolute bottom-7 right-32 h-32 w-28 -rotate-6 overflow-hidden rounded-2xl border-4 border-white/25 shadow-2xl xl:right-44 xl:h-36 xl:w-32"><img src={products[1]?.thumbnailUrl || products[1]?.mediaUrl || "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=500&q=80"} alt="Marketplace selection" className="h-full w-full object-cover"/></div>
              </div>
            </section>


          </div>
        </section>

        <div className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
  <Link href="/for-you" className="group flex min-w-0 min-h-[180px] flex-col items-start gap-3 rounded-xl border border-[#c7e4f5] bg-gradient-to-r from-[#e6f6ff] to-[#c5e8fb] p-3 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#176b87] shadow-sm"><Sparkles size={22}/></span><span className="min-w-0 flex-1"><b className="block text-sm sm:text-base">Picked for you</b><span className="mt-1 block text-xs leading-5 text-[#526b79]">Recommendations picked around your taste.</span><span className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#176b87]">Explore picks <ArrowRight size={13}/></span></span></Link>
  <Link href="/categories" className="group flex min-w-0 min-h-[180px] flex-col items-start gap-3 rounded-xl border border-[#f2d5a7] bg-gradient-to-r from-[#fff5df] to-[#ffdfaa] p-3 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#a65b00] shadow-sm"><BadgePercent size={22}/></span><span className="min-w-0 flex-1"><b className="block text-sm sm:text-base">Explore categories</b><span className="mt-1 block text-xs leading-5 text-[#806454]">Browse all the things you love in one place.</span><span className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#a65b00]">Browse now <ArrowRight size={13}/></span></span></Link>
  <Link href="/stores" className="group flex min-w-0 min-h-[180px] flex-col items-start gap-3 rounded-xl border border-[#cce7d1] bg-gradient-to-r from-[#e8f8e9] to-[#c8edcf] p-3 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#267443] shadow-sm"><Store size={22}/></span><span className="min-w-0 flex-1"><b className="block text-sm sm:text-base">Shop local stores</b><span className="mt-1 block text-xs leading-5 text-[#4d7056]">Meet sellers and discover their latest drops.</span><span className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#267443]">Meet sellers <ArrowRight size={13}/></span></span></Link>
        </div>

        <section className="mt-6 rounded-2xl border border-[#e5e9eb] bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#8a2c45]">Shop with confidence</p><h2 className="mt-1 text-lg font-extrabold tracking-tight text-[#17202a] sm:text-xl">A better way to discover independent sellers</h2></div><Link href="/about" className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#d7dfe3] px-4 py-2 text-sm font-bold text-[#253543] transition hover:bg-[#f4f7f9]">About {brandName} <ArrowRight size={15}/></Link></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="flex items-center gap-3 rounded-xl bg-[#f8f8f8] p-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white"><ShieldCheck size={19}/></span><span><b className="block text-sm">Seller profiles</b><span className="text-xs text-[#777]">Explore the business behind each post</span></span></div><div className="flex items-center gap-3 rounded-xl bg-[#f8f8f8] p-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white"><HeartHandshake size={19}/></span><span><b className="block text-sm">Social discovery</b><span className="text-xs text-[#777]">Find products from real creators</span></span></div><div className="flex items-center gap-3 rounded-xl bg-[#f8f8f8] p-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white"><Truck size={19}/></span><span><b className="block text-sm">Direct connection</b><span className="text-xs text-[#777]">Continue with the seller directly</span></span></div></div>
        </section>

        {promotedProducts.length > 0 && <section className="mt-8 overflow-hidden rounded-2xl border border-[#f0d7ad] bg-gradient-to-br from-[#fffaf0] via-white to-[#fff1d6] p-4 shadow-sm sm:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#9a5700]"><BadgePercent size={14}/> {isProductPromotionFallback ? "Featured discovery" : "Promoted products"}</p><h2 className="mt-1 text-lg font-extrabold tracking-tight text-[#17202a] sm:text-xl">{isProductPromotionFallback ? "Worth a closer look" : "In the spotlight"}</h2><p className="mt-1 max-w-xl text-sm leading-6 text-[#69727c]">{isProductPromotionFallback ? "A rotating selection from shops across SokoLink." : "Discover businesses currently promoting their products."}</p></div><Link href="/shop?tab=featured" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d8a85c] bg-white px-4 py-2 text-sm font-bold text-[#754100] transition hover:bg-[#fff1d6]">View all <ArrowRight size={15}/></Link></div><div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:thin]">{promotedProducts.map((p:any)=><div key={p.id} className="relative w-[190px] shrink-0 snap-start sm:w-[220px] lg:w-[235px]"><span className={`absolute left-2 top-2 z-10 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${isProductPromotionFallback ? "bg-white/95 text-[#35424d]" : "bg-[#ff9900] text-[#17202a]"}`}>{isProductPromotionFallback ? "Featured" : "Promoted"}</span><ProductCard p={p}/></div>)}</div></section>}

        <section className="mt-8 rounded-2xl border border-[#e5e9eb] bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-3"><div><p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#8a2c45]"><Flame size={14}/> Fresh from the shops</p><h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Discover new finds</h2><p className="mt-1 text-sm text-[#777]">Explore the latest products and services from connected sellers.</p></div><Link href="/shop" className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#d7dfe3] bg-white px-4 py-2 text-sm font-bold text-[#253543] transition hover:bg-[#f4f7f9]">See all <ArrowRight size={15}/></Link></div>
          {freshProducts.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{freshProducts.slice(0,12).map((p:any)=><ProductCard key={p.id} p={p}/>)}</div> : <div className="rounded-xl border border-dashed border-[#ddd] px-5 py-12 text-center"><Store className="mx-auto mb-3 text-[#999]" size={28}/><h3 className="font-bold">Your next great find is waiting</h3><p className="mt-1 text-sm text-[#777]">Connected shops will appear here as their products sync.</p><Link href="/stores" className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">Explore stores <ArrowRight size={15}/></Link></div>}
        </section>

        {categorySections.map((category, index) => category.products.length > 0 ? (
          <div key={category.tag} className="mt-8 space-y-5">
            <section className="rounded-2xl border border-[#e5e9eb] bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0d6] text-lg text-[#9a5700]">{categories.find((item) => item.tag === category.tag)?.icon || "✦"}</span>
                  <div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#8a2c45]">Shop by category</p><h2 className="mt-1 text-lg font-extrabold tracking-tight text-[#17202a] sm:text-xl">{category.label}</h2><p className="mt-1 max-w-xl text-sm leading-5 text-[#71808a]">{category.description}</p></div>
                </div>
                <Link href={category.tag === "services" ? "/search?type=service" : "/search?tag=" + encodeURIComponent(category.tag)} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#d7dfe3] bg-white px-4 py-2 text-sm font-bold text-[#253543] transition hover:bg-[#f4f7f9]">Explore {category.tag === "services" ? "services" : "category"} <ArrowRight size={14}/></Link>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{category.products.map((p: any) => <ProductCard key={p.id} p={p}/>)}</div>
            </section>
            {(index === 1 || index === 3) && storeBannerEntries.length > 0 && <section className="store-directory-showcase-stage" aria-label="Shop spotlight"><SpotlightStoreCard entry={storeBannerEntries[(index === 1 ? 0 : 1) % storeBannerEntries.length]} /></section>}
          </div>
        ) : null)}

        {trendingProducts.length > 0 && <section className="mt-8 rounded-2xl border border-[#e7e7e7] bg-white p-4 sm:p-5"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#8a2c45]"><Clock3 size={14}/> Community favourites</p><h2 className="mt-1 text-lg font-extrabold sm:text-xl">Trending right now</h2></div><Link href="/shop?tab=trending" className="flex shrink-0 items-center gap-1 text-sm font-semibold">Explore trending <ArrowRight size={15}/></Link></div><div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{trendingProducts.map((p:any)=><ProductCard key={p.id} p={p}/>)}</div></section>}

        {promotedStores.length > 0 && <section className="mt-8 overflow-hidden rounded-2xl border border-[#cfe3e8] bg-gradient-to-br from-[#f2fbfc] via-white to-[#e8f5f8] p-4 shadow-sm sm:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#176b87]"><Store size={14}/> {paidPromotedStores.length ? "Promoted stores" : "Store spotlight"}</p><h2 className="mt-1 text-lg font-extrabold tracking-tight text-[#17202a] sm:text-xl">{paidPromotedStores.length ? "Stores in the spotlight" : "Meet your next favourite shop"}</h2><p className="mt-1 text-sm leading-6 text-[#667780]">{paidPromotedStores.length ? "Discover stores running an active promotion." : "A rotating mix of sellers and independent businesses to explore."}</p></div><Link href="/stores" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#9dcbd5] bg-white px-4 py-2 text-sm font-bold text-[#145b70] transition hover:bg-[#e8f5f8]">Explore stores <ArrowRight size={15}/></Link></div><div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:thin]">{promotedStores.map((store:any)=><Link key={store.id} href={"/stores/"+store.username} className="group w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#dce8eb] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:w-[250px]"><div className="relative aspect-[5/3] overflow-hidden bg-[#e9f1f3]">{store.posts[0]?.thumbnailUrl || store.posts[0]?.mediaUrl ? <img src={store.posts[0]?.thumbnailUrl || store.posts[0]?.mediaUrl} alt={store.name || "@"+store.username} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/> : store.profileImageUrl ? <img src={store.profileImageUrl} alt={store.name || "@"+store.username} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/> : <div className="flex h-full items-center justify-center"><Store size={32} className="text-[#176b87]"/></div>}<span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#145b70]">{paidPromotedStores.length ? "Promoted" : "Featured shop"}</span></div><div className="p-4"><b className="block truncate text-sm font-bold text-[#17202a]">{store.name || "@"+store.username}</b><span className="mt-1 block truncate text-sm text-[#697780]">@{store.username}</span><span className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-full bg-[#176b87] px-3.5 py-2 text-xs font-bold text-white transition group-hover:bg-[#124f63]">Visit store <ArrowRight size={13}/></span></div></Link>)}</div></section>}

        {stores.length > 0 && <section className="mt-8 rounded-2xl border border-[#e7e7e7] bg-white p-4 sm:p-5"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#8a2c45]">People behind the products</p><h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">More stores to discover</h2></div><Link href="/stores" className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#d7dfe3] bg-white px-4 py-2 text-sm font-bold text-[#253543] transition hover:bg-[#f4f7f9]">All stores <ArrowRight size={15}/></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{stores.filter((store:any)=>!promotedStores.some((featured:any)=>featured.id===store.id)).slice(0,6).map((store:any)=><Link key={store.id} href={"/stores/"+store.username} className="group overflow-hidden rounded-xl border border-[#e5e9eb] bg-white transition hover:-translate-y-0.5 hover:shadow-md"><div className="aspect-[4/3] overflow-hidden bg-[#f3f6f7]">{store.profileImageUrl ? <img src={store.profileImageUrl} alt={store.name || "@"+store.username} className="h-full w-full object-cover transition duration-300 group-hover:scale-105"/> : <div className="flex h-full items-center justify-center"><Store size={28} className="text-[#7b8a93]"/></div>}</div><div className="p-3.5"><b className="block truncate text-sm font-extrabold text-[#17202a]">{store.name || "@"+store.username}</b><span className="mt-1 block truncate text-xs text-[#71808a]">@{store.username}</span><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#176b87]">Visit shop <ArrowRight size={12}/></span></div></Link>)}</div></section>}

        {serviceProducts.length > 0 && <section className="mt-8 rounded-2xl border border-[#e5e9eb] bg-white p-4 shadow-sm sm:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#8a2c45]">Beyond shopping</p><h2 className="mt-1 text-lg font-extrabold tracking-tight text-[#17202a] sm:text-xl">Services worth discovering</h2><p className="mt-1 text-sm leading-6 text-[#71808a]">Find talented businesses and service providers in one place.</p></div><Link href="/search?type=service" className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#d7dfe3] px-4 py-2 text-sm font-bold text-[#253543] transition hover:bg-[#f4f7f9]">Explore services <ArrowRight size={15}/></Link></div><div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{serviceProducts.map((p:any)=><ProductCard key={p.id} p={p}/>)}</div></section>}

        <section className="mt-8 rounded-2xl border border-[#e5e9eb] bg-white p-4 shadow-sm sm:p-6"><div className="grid gap-5 md:grid-cols-3"><div className="rounded-xl bg-[#f2f8fb] p-4 sm:p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#176b87] shadow-sm"><ShieldCheck size={20}/></span><h3 className="mt-3 text-sm font-extrabold tracking-tight text-[#17202a]">Discover the seller</h3><p className="mt-1 text-sm leading-6 text-[#697780]">Open store profiles to learn more about the businesses behind each listing.</p></div><div className="rounded-xl bg-[#fff7e9] p-4 sm:p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#a65b00] shadow-sm"><HeartHandshake size={20}/></span><h3 className="mt-3 text-sm font-extrabold tracking-tight text-[#17202a]">Connect directly</h3><p className="mt-1 text-sm leading-6 text-[#697780]">Use the listing details to reach sellers and ask the right questions.</p></div><div className="rounded-xl bg-[#f2f8f3] p-4 sm:p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#267443] shadow-sm"><Truck size={20}/></span><h3 className="mt-3 text-sm font-extrabold tracking-tight text-[#17202a]">Shop with context</h3><p className="mt-1 text-sm leading-6 text-[#697780]">Explore a seller’s other products and services before deciding what works for you.</p></div></div></section>

        <section className="mt-8 flex flex-col items-start justify-between gap-5 rounded-2xl bg-gradient-to-r from-[#172b4d] via-[#176b87] to-[#e47911] p-6 text-white shadow-md sm:flex-row sm:items-center sm:p-9"><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-white/55">Have something to sell?</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Bring your Instagram shop to {brandName}.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Connect your Instagram Business account and make your posts easier for shoppers to discover.</p></div><Link href="/account" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#ff9900] px-6 py-3 text-sm font-extrabold text-[#17202a] shadow-md transition hover:-translate-y-0.5 hover:bg-[#ffb84d]">Start selling <ArrowRight size={15}/></Link></section>
      </div>
    </main>
  );
}
