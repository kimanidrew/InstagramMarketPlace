import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Heart,
  Instagram,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Zap,
} from "lucide-react";
import { db } from "@/lib/prisma";
import { HowMarketWorks } from "@/components/how-market-works";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

const editorialImages = {
  hero: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=85",
  people: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=85",
  seller: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85",
  shopping: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85",
};

export default async function Home() {
  const prisma = db();

  const [products, stores] = await Promise.all([
    prisma.instagramPost.findMany({
      where: { isProduct: true, mediaType: "IMAGE" },
      include: { connection: true, tags: true, likes: true },
      orderBy: { timestamp: "desc" },
      take: 4,
    }),
    prisma.instagramConnection.findMany({
      include: { posts: { where: { isProduct: true }, select: { id: true, mediaUrl: true }, orderBy: { timestamp: "desc" }, take: 4 } },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
  ]);

  return (
    <main className="home-page bg-white">
      <section className="editorial-grid overflow-hidden border-b border-black/5">
        <div className="shell grid min-h-[720px] items-center gap-12 py-20 lg:grid-cols-[1.02fr_.98fr]">
          <Reveal y={34}>
            <div className="eyebrow">
              <Instagram size={13} /> Instagram marketplace
            </div>
            <h1 className="mt-7 max-w-4xl text-6xl font-black leading-[.88] tracking-[-.075em] sm:text-7xl lg:text-[88px]">
              Discover it.
              <br />
              <span className="text-[#777]">Shop it.</span>
              <br />
              <span>Support it.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-[#666] sm:text-lg">
              Instagram Market connects the inspiration you find on Instagram
              with a simple way to discover and shop from the people and
              businesses behind it.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-4 text-sm font-bold text-white transition hover:scale-[1.02]"
              >
                Start exploring <ArrowRight size={16} />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-7 py-4 text-sm font-bold"
              >
                How it works <ArrowDown size={15} />
              </Link>
            </div>
          </Reveal>

          <Reveal className="relative min-h-[560px] overflow-visible" y={42}>
            <div className="hero-float hero-float-a absolute left-[8%] top-10 z-10 w-[34%] rotate-[-7deg] overflow-hidden rounded-[22px] border-[7px] border-white bg-[#f2f2ef] shadow-[0_24px_60px_rgba(0,0,0,.18)] sm:left-[4%] sm:w-[36%]">
              <img
                src={products[1]?.mediaUrl || editorialImages.people}
                alt={products[1]?.productTitle || "Instagram marketplace discovery"}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>

            <div className="hero-float hero-float-b absolute right-[4%] top-2 z-20 w-[42%] rotate-[6deg] overflow-hidden rounded-[24px] border-[7px] border-white bg-[#f2f2ef] shadow-[0_28px_70px_rgba(0,0,0,.2)] sm:right-[7%] sm:w-[41%]">
              <img
                src={products[0]?.mediaUrl || editorialImages.hero}
                alt={products[0]?.productTitle || "Marketplace product"}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>

            <div className="hero-float hero-float-c absolute bottom-5 left-[27%] z-30 w-[43%] -rotate-[2deg] overflow-hidden rounded-[24px] border-[7px] border-white bg-[#f2f2ef] shadow-[0_30px_80px_rgba(0,0,0,.22)] sm:left-[27%] sm:w-[42%]">
              <img
                src={products[2]?.mediaUrl || editorialImages.shopping}
                alt={products[2]?.productTitle || "Marketplace product"}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>

            <div className="hero-float hero-float-d absolute bottom-10 left-0 z-40 hidden w-[27%] rotate-[5deg] overflow-hidden rounded-[18px] border-[6px] border-white bg-[#f2f2ef] shadow-[0_20px_50px_rgba(0,0,0,.16)] sm:block">
              <img
                src={products[3]?.mediaUrl || editorialImages.seller}
                alt={products[3]?.productTitle || "Instagram store"}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>

            <div className="hero-pill absolute right-0 bottom-20 z-50 rounded-full border border-black/10 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[.13em] shadow-xl">
              Discover · Shop · Support
            </div>
          </Reveal>
        </div>
      </section>

      <section className="shell py-24">
        <Reveal>
        <div className="grid gap-14 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
          <div>
            <p className="eyebrow plain">Why we exist</p>
            <h2 className="mt-4 text-5xl font-black leading-[.95] tracking-[-.06em] sm:text-6xl">
              Shopping should feel human.
            </h2>
          </div>
          <div>
            <p className="text-lg leading-8 text-[#555]">
              Social media has already changed how people discover things.
              Instagram Market takes that discovery one step further — making
              it easier to find the product, understand who made or sells it,
              and go directly to the original Instagram story.
            </p>
            <p className="mt-5 text-lg leading-8 text-[#555]">
              We are building a marketplace around <b>real people, real
              businesses and real content</b>, rather than anonymous product
              catalogues.
            </p>
          </div>
        </div>
        </Reveal>
      </section>

      <section className="shell pb-24">
        <Reveal className="grid overflow-hidden rounded-[36px] bg-[#f4f4f1] lg:grid-cols-[1fr_1fr]" y={36}>
          <div className="min-h-[460px]">
            <img
              src={editorialImages.people}
              alt="Friends discovering and sharing products"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <p className="eyebrow plain">The idea</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-.05em] sm:text-5xl">
              Inspiration belongs with discovery.
            </h2>
            <p className="mt-6 text-base leading-8 text-[#666]">
              A post can make you stop scrolling. A product can make you want
              to learn more. A great seller can make you want to come back.
              Instagram Market brings those moments together in one experience.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-5">
                <Heart size={19} />
                <b className="mt-7 block">Save what you love</b>
                <span className="mt-2 block text-xs leading-5 text-[#777]">
                  Keep favourites close while you explore.
                </span>
              </div>
              <div className="rounded-2xl bg-white p-5">
                <Search size={19} />
                <b className="mt-7 block">Find it faster</b>
                <span className="mt-2 block text-xs leading-5 text-[#777]">
                  Discover products through stores and categories.
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <HowMarketWorks />


      <section className="connect-instagram-section">
        <div className="shell">
          <Reveal y={28}>
            <div className="connect-instagram-card">
              <div className="connect-instagram-icon">
                <Instagram size={22} />
              </div>
              <div className="connect-instagram-copy">
                <p className="connect-instagram-kicker">For Instagram sellers</p>
                <h2>Turn your Instagram into a shop.</h2>
                <p>
                  Connect your approved Instagram Business account and your posts can
                  become products on Instagram Market. No second catalogue to build.
                </p>
              </div>
              <Link href="/account" className="connect-instagram-button">
                Connect to Instagram <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="community-showcase relative overflow-hidden py-24 sm:py-28">
        <div className="community-orb community-orb-a" />
        <div className="community-orb community-orb-b" />
        <div className="community-ring community-ring-a" />
        <div className="community-ring community-ring-b" />
        <div className="shell relative z-10">
          <div className="community-layout">
            <Reveal className="community-collage-wrap" y={38}>
              <div className="community-collage">
                {stores.filter((store) => store.profileImageUrl).slice(0, 4).map((store, index) => ({
                  store,
                  index,
                  src: store.profileImageUrl as string,
                  alt: store.name || "Instagram store",
                })).map(({ store, index, src, alt }) => (
                  <Link
                    key={index}
                    href={"/store/" + store.username}
                    className={"community-photo community-photo-" + (index === 0 ? "main" : index === 1 ? "top" : index === 2 ? "bottom" : "side")}
                  >
                    <img src={src} alt={alt} />
                  </Link>
                ))}
              </div>
            </Reveal>

            <Reveal className="community-copy-panel" y={38} delay={0.08}>
              <div className="community-kicker"><Store size={14} /> Meet the stores</div>
              <h2 className="community-title mt-6">Discover the people<br /><span>behind the posts.</span></h2>
              <p className="mt-7 max-w-xl text-base leading-8 text-white/80 sm:text-lg">
                Every store on Instagram Market starts with a real Instagram presence. Explore the businesses behind the products, discover their stories and shop from the people already creating things worth sharing.
              </p>
              <Link href="/stores" className="community-stores-button mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-xs font-black transition hover:-translate-y-1">
                Explore all stores <ArrowRight size={14} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="seller-showcase relative overflow-hidden py-24 sm:py-28">
        <div className="seller-orb seller-orb-a" /><div className="seller-orb seller-orb-b" />
        <div className="shell relative z-10">
          <div className="grid gap-10 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
            <Reveal y={42}>
              <div className="seller-kicker"><Store size={14} /> For sellers</div>
              <h2 className="seller-title mt-6">Keep creating.<br /><span>We handle the storefront.</span></h2>
              <p className="mt-7 max-w-xl text-base leading-8 text-white/65 sm:text-lg">Your Instagram already tells your story. Connect your approved account and let your posts flow into a searchable marketplace while you keep doing what you do best: creating.</p>
              <div className="seller-points mt-8 grid gap-3 sm:grid-cols-2">
                {["Your Instagram content stays at the centre.","New posts can automatically appear as products.","Hashtags help shoppers discover your products.","Customers can open the original Instagram post."].map((item) => <div key={item} className="seller-point"><span><Check size={13} /></span>{item}</div>)}
              </div>
            </Reveal>
            <Reveal className="relative" y={52}>
              <div className="seller-image-wrap"><img src={editorialImages.seller} alt="Small business team working together" /><div className="seller-image-glow" /><div className="seller-floating-card"><div className="flex items-center justify-between"><span className="seller-mini-label">LIVE FROM INSTAGRAM</span><Zap size={15} /></div><b>One post → marketplace</b><span>Your content. Your identity.</span></div></div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="shopper-showcase relative overflow-hidden py-24 sm:py-28">
        <div className="shopper-grid" /><div className="shopper-orb shopper-orb-a" /><div className="shopper-orb shopper-orb-b" />
        <div className="shell relative z-10">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <Reveal className="order-2 lg:order-1" y={50}>
              <div className="shopper-image-wrap"><img src={editorialImages.shopping} alt="Modern retail and shopping experience" /><div className="shopper-image-glow" /><div className="shopper-floating-card"><Heart size={15} fill="currentColor" /><div><span>Saved for later</span><b>Find something you love.</b></div></div></div>
            </Reveal>
            <Reveal className="order-1 lg:order-2" y={42}>
              <div className="shopper-kicker"><Sparkles size={14} /> For shoppers</div>
              <h2 className="shopper-title mt-6">Discover more.<br /><span>Shop with feeling.</span></h2>
              <p className="mt-7 max-w-xl text-base leading-8 text-[#555] sm:text-lg">Find products through the people who share them, the stores behind them and the communities around them.</p>
              <div className="shopper-points mt-8">
                {[[Users,"Meet the stores behind the posts."],[Heart,"Save products you want to remember."],[ShieldCheck,"Discover approved connected sellers."]].map(([Icon,text]) => { const ItemIcon=Icon as typeof Users; return <div key={text as string} className="shopper-point"><span><ItemIcon size={17}/></span><b>{text as string}</b><ArrowRight size={14}/></div>; })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="shell pb-24">
        <Reveal className="rounded-[36px] border border-black/10 bg-white p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,.06)] sm:p-14" y={30}>
          <Sparkles className="mx-auto" size={24} />
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-black tracking-[-.055em] sm:text-6xl">
            A new way to turn social discovery into meaningful shopping.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#777]">
            Instagram Market is designed to make the journey from “I love
            this” to “I want to know more” simple, visual and human.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-4 text-sm font-bold text-white"
            >
              Explore the marketplace <ArrowRight size={16} />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-7 py-4 text-sm font-bold"
            >
              Learn more
            </Link>
          </div>
        </Reveal>
      </section>


      {(products.length > 0 || stores.length > 0) && (
        <section className="border-t border-black/5 py-14">
          <div className="shell flex flex-wrap items-center justify-between gap-4 text-xs text-[#888]">
            <span>
              {products.length > 0 ? "Fresh marketplace content is waiting for you." : "Discover connected Instagram stores."}
            </span>
            <Link href="/products" className="font-bold text-black">
              Browse marketplace →
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
