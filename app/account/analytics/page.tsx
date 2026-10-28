import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ChartNoAxesCombined, Clapperboard, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SellerDashboardTabs } from "@/components/seller-dashboard-tabs";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ shopId?: string; postId?: string; tab?: string }> }) {
  const current = await user();
  if (!current) redirect("/login");
  const connections = await db().instagramConnection.findMany({
    where: { connectedByUserId: current.id },
    include: { posts: { where: { isProduct: true, OR: [{ mediaUrl: { not: null } }, { thumbnailUrl: { not: null } }] }, select: { id: true, productTitle: true, productSlug: true, mediaUrl: true, thumbnailUrl: true, mediaType: true, permalink: true } } },
    orderBy: { createdAt: "desc" },
  });
  const query = await searchParams;
  const initialShopId = connections.some(c => c.id === query.shopId) ? query.shopId! : connections[0]?.id || "";
  const selectedConnection = connections.find(c => c.id === initialShopId);
  const initialPostId = selectedConnection?.posts.some(p => p.id === query.postId) ? query.postId! : "";
  const analyticsConnections = connections.map(c => ({ id: c.id, username: c.username, name: c.name, profileImageUrl: c.profileImageUrl, posts: c.posts.map(p => ({ id: p.id, title: p.productTitle || "Untitled product", slug: p.productSlug, image: p.thumbnailUrl || p.mediaUrl, mediaType: p.mediaType })) }));
  const growthConnections = connections.map(c => ({ id: c.id, username: c.username, name: c.name, profileImageUrl: c.profileImageUrl, verifiedAt: c.verifiedAt?.toISOString() || null, verifiedUntil: c.verifiedUntil?.toISOString() || null, proUntil: c.proUntil?.toISOString() || null, posts: c.posts.map(p => ({ id: p.id, productTitle: p.productTitle, mediaUrl: p.mediaUrl, thumbnailUrl: p.thumbnailUrl, mediaType: p.mediaType, permalink: p.permalink })) }));
  return <main className="seller-analytics-page">
    <div className="seller-analytics-shell">
      <section className="seller-analytics-hero">
        <div><span className="seller-analytics-kicker"><ChartNoAxesCombined size={14}/> YOUR SELLER SPACE</span><h1>Grow your<br/><span>own shop.</span></h1><p>Understand your shop’s performance and take action from one place. Track marketplace activity, boost products, request verification, and explore Pro Seller tools.</p></div>
        <div className="seller-analytics-hero-art"><ChartNoAxesCombined size={35}/><span>Real activity.<br/><b>Smarter growth.</b></span></div>
      </section>
      <div className="my-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e7e2ee] bg-[#faf7ff] p-4 sm:p-5">
        <div><span className="text-[10px] font-extrabold tracking-[.14em] text-[#8057b1]">NEW CREATIVE TOOL</span><h2 className="mt-1 text-base font-extrabold text-[#201b28]">Turn your products into promotional videos</h2><p className="mt-1 text-xs leading-5 text-[#716a7a]">Create a 15-second vertical ad for a product or your whole store.</p></div>
        <Link href="/account/ai-promotions" className="inline-flex items-center gap-2 rounded-xl bg-[#17151b] px-4 py-3 text-xs font-bold text-white no-underline">Open AI Promotion Studio <Clapperboard size={15}/><ArrowRight size={14}/></Link>
      </div>
      <SellerDashboardTabs analyticsConnections={analyticsConnections} growthConnections={growthConnections} initialShopId={initialShopId} initialPostId={initialPostId} initialTab={query.tab}/>
      <p className="seller-analytics-disclaimer">Analytics on this page measure activity recorded on Instagram Market. Instagram’s own reach and impressions are separate and are not included unless supported Instagram Insights data is connected.</p>
    </div>
  </main>;
}
