import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChartNoAxesCombined, Sparkles } from "lucide-react";
import { SellerAnalytics } from "@/components/seller-analytics";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const current = await user();
  if (!current) redirect("/login");
  const connections = await db().instagramConnection.findMany({
    where: { connectedByUserId: current.id },
    include: { posts: { where: { isProduct: true, OR: [{ mediaUrl: { not: null } }, { thumbnailUrl: { not: null } }] }, select: { id: true, productTitle: true, productSlug: true, mediaUrl: true, thumbnailUrl: true, mediaType: true } } },
    orderBy: { createdAt: "desc" },
  });
  const safeConnections = connections.map(c => ({ id: c.id, username: c.username, name: c.name, profileImageUrl: c.profileImageUrl, posts: c.posts.map(p => ({ id: p.id, title: p.productTitle || "Untitled product", slug: p.productSlug, image: p.thumbnailUrl || p.mediaUrl, mediaType: p.mediaType })) }));
  return <main className="seller-analytics-page">
    <div className="seller-analytics-shell">
      <Link href="/account" className="seller-analytics-back"><ArrowLeft size={15}/> Back to account</Link>
      <section className="seller-analytics-hero">
        <div><span className="seller-analytics-kicker"><ChartNoAxesCombined size={14}/> SELLER INSIGHTS</span><h1>Know what’s working.<br/><span>Grow with clarity.</span></h1><p>Track real activity on Instagram Market, compare your products, and pay to promote a shop or product to a measurable reach target.</p></div>
        <div className="seller-analytics-hero-art"><ChartNoAxesCombined size={35}/><span>Real activity.<br/><b>Smarter growth.</b></span></div>
      </section>
      {connections.length ? <SellerAnalytics connections={safeConnections}/> : <section className="seller-analytics-empty"><Sparkles size={28}/><h2>Connect a shop to see analytics</h2><p>Once your Instagram Business account is connected, this dashboard will record marketplace impressions, product views and clicks.</p><Link href="/account/setup">Connect Instagram <ArrowLeft size={14}/></Link></section>}
      <p className="seller-analytics-disclaimer">Analytics on this page measure activity recorded on Instagram Market. Instagram’s own reach and impressions are separate and are not included unless supported Instagram Insights data is connected.</p>
    </div>
  </main>;
}
