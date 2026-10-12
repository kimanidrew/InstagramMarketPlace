import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChartNoAxesCombined, Sparkles } from "lucide-react";
import { SellerAnalytics } from "@/components/seller-analytics";
import { SellerGrowth } from "@/components/seller-growth";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ shopId?: string; postId?: string }> }) {
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
  const safeConnections = connections.map(c => ({ id: c.id, username: c.username, name: c.name, profileImageUrl: c.profileImageUrl, posts: c.posts.map(p => ({ id: p.id, title: p.productTitle || "Untitled product", slug: p.productSlug, image: p.thumbnailUrl || p.mediaUrl, mediaType: p.mediaType })) }));
  return <main className="seller-analytics-page">
    <div className="seller-analytics-shell">
      <Link href="/account" className="seller-analytics-back"><ArrowLeft size={15}/> Back to account</Link>
      <section className="seller-analytics-hero">
        <div><span className="seller-analytics-kicker"><ChartNoAxesCombined size={14}/> SELLER DASHBOARD</span><h1>Analytics &amp; growth.<br/><span>All in one place.</span></h1><p>Track your shop performance, promote products or your whole shop, request verification, and manage Pro Seller upgrades from one dashboard.</p></div>
        <div className="seller-analytics-hero-art"><ChartNoAxesCombined size={35}/><span>Real activity.<br/><b>Smarter growth.</b></span></div>
      </section>
      {connections.length ? <SellerAnalytics connections={safeConnections} initialShopId={initialShopId} initialPostId={initialPostId}/> : <section className="seller-analytics-empty"><Sparkles size={28}/><h2>Connect a shop to see analytics</h2><p>Once your Instagram Business account is connected, this dashboard will record marketplace impressions, product views and clicks.</p><Link href="/account/setup">Connect Instagram <ArrowLeft size={14}/></Link></section>}
      {connections.length > 0 && <section className="combined-growth-section"><div className="combined-growth-heading"><span className="seller-analytics-kicker"><Sparkles size={14}/> SELLER GROWTH STUDIO</span><h2>Take the next step</h2><p>Manage product boosts, whole-shop growth, verification, and Pro Seller options without leaving this dashboard.</p></div><SellerGrowth embedded connections={connections.map(c => ({ id: c.id, username: c.username, name: c.name, profileImageUrl: c.profileImageUrl, verifiedAt: c.verifiedAt?.toISOString() || null, proUntil: c.proUntil?.toISOString() || null, posts: c.posts.map(p => ({ id: p.id, productTitle: p.productTitle, mediaUrl: p.mediaUrl, thumbnailUrl: p.thumbnailUrl, mediaType: p.mediaType, permalink: p.permalink })) }))}/></section>}
      <p className="seller-analytics-disclaimer">Analytics on this page measure activity recorded on Instagram Market. Instagram’s own reach and impressions are separate and are not included unless supported Instagram Insights data is connected.</p>
    </div>
  </main>;
}
