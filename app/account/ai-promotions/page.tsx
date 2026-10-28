import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clapperboard, Sparkles } from "lucide-react";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { AiPromotionStudio } from "@/components/ai-promotion-studio";

export const dynamic = "force-dynamic";

export default async function AiPromotionsPage() {
  const current = await user();
  if (!current) redirect("/login");
  const connections = await db().instagramConnection.findMany({
    where: { connectedByUserId: current.id },
    orderBy: { createdAt: "desc" },
    include: { posts: { where: { isProduct: true, OR: [{ mediaUrl: { not: null } }, { thumbnailUrl: { not: null } }] }, select: { id: true, productTitle: true, category: true, listingType: true, mediaUrl: true, thumbnailUrl: true, mediaType: true }, orderBy: { createdAt: "desc" } } },
  });
  const options = connections.map((c) => ({ id: c.id, username: c.username, name: c.name, profileImageUrl: c.profileImageUrl, products: c.posts.map(p => ({ id: p.id, title: p.productTitle || p.category || "Untitled product", image: p.thumbnailUrl || p.mediaUrl, mediaType: p.mediaType, listingType: p.listingType })) }));
  return <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <Link href="/account" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-950"><ArrowLeft size={16}/> Back to your account</Link>
    <section className="relative overflow-hidden rounded-[28px] bg-neutral-950 p-6 text-white sm:p-10">
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl"/>
      <div className="pointer-events-none absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"/>
      <div className="relative z-10 max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-white/80"><Sparkles size={14}/> SokoLink AI Studio</span>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Turn your products into <span className="text-fuchsia-300">scroll-stopping</span> promotions.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">Create a short vertical video concept from your connected shop and product. Track every generation in one place.</p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-white/10 px-3 py-2">15 seconds</span><span className="rounded-full bg-white/10 px-3 py-2">Vertical 9:16</span><span className="rounded-full bg-white/10 px-3 py-2">MP4 output via provider</span></div>
      </div>
      <Clapperboard className="absolute bottom-8 right-8 hidden h-24 w-24 rotate-6 text-white/10 sm:block" strokeWidth={1}/>
    </section>
    <AiPromotionStudio connections={options}/>
  </main>;
}
