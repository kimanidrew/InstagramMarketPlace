import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, Store } from "lucide-react";
import { SellerGrowth } from "@/components/seller-growth";

export const dynamic = "force-dynamic";

export default async function GrowYourShop() {
  const u = await user();
  if (!u) redirect("/login");
  const connections = await db().instagramConnection.findMany({
    where: { connectedByUserId: u.id },
    include: { posts: { where: { isProduct: true }, select: { id: true, productTitle: true, mediaUrl: true, thumbnailUrl: true, mediaType: true, permalink: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <main className="grow-shop-page">
    <section className="grow-shop-hero">
      <Link href="/account" className="grow-shop-back"><ArrowLeft size={15}/> Back to account</Link>
      <div className="grow-shop-hero-inner">
        <span className="grow-shop-eyebrow"><Sparkles size={14}/> SELLER GROWTH STUDIO</span>
        <h1>Give your shop<br/><span>room to grow.</span></h1>
        <p>Choose the tools that fit your business — boost product visibility, build customer trust, and unlock more seller features as you grow.</p>
        <div className="grow-shop-summary"><span><Store size={15}/>{connections.length} connected {connections.length === 1 ? "shop" : "shops"}</span><span>Boost · Verified · Pro Seller</span></div>
      </div>
      <div className="grow-shop-orbit" aria-hidden="true"><div/><div/><div/><Sparkles size={28}/></div>
    </section>
    <section className="grow-shop-content">
      {connections.length ? <SellerGrowth connections={connections.map(c => ({ id: c.id, username: c.username, name: c.name, profileImageUrl: c.profileImageUrl, verifiedAt: c.verifiedAt?.toISOString() || null, proUntil: c.proUntil?.toISOString() || null, posts: c.posts }))}/> :
        <div className="grow-shop-empty"><span><Store size={25}/></span><h2>Connect a shop to get started</h2><p>Your growth options will appear here once you connect an Instagram Business account.</p><Link href="/account/setup">Connect your Instagram <ArrowRight size={15}/></Link></div>}
      <div className="grow-shop-footnote"><Sparkles size={16}/><p>Product and shop reach promotions are paid directly from Analytics. Verified and Pro Seller upgrades still go through marketplace review.</p></div>
    </section>
  </main>;
}
