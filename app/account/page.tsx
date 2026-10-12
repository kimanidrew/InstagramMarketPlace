import { user, logout } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle2, Instagram, LogOut, Plus, Store, Zap, ChartNoAxesCombined } from "lucide-react";
import { AccountLiveRefresh } from "@/components/account-live-refresh";

export const dynamic = "force-dynamic";

async function out() {
  "use server";
  await logout();
  redirect("/");
}

export default async function Account({ searchParams }: { searchParams: Promise<{ instagram?: string; instagram_error?: string; requested?: string; error?: string }> }) {
  const u = await user();
  if (!u) redirect("/");
  const q = await searchParams;
  const [requests, connections] = await Promise.all([
    db().storeRequest.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" } }),
    db().instagramConnection.findMany({
      where: { connectedByUserId: u.id },
      include: { posts: { where: { isProduct: true }, select: { id: true, productTitle: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const connectedIds = new Set(connections.map(c => c.username.toLowerCase()));
  const pendingRequests = requests.filter(r => !connectedIds.has(r.username.toLowerCase()));
  const productCount = connections.reduce((sum, c) => sum + c.posts.length, 0);

  return <main className="account-hub">
    <AccountLiveRefresh />
    <section className="account-connect-banner">
      <div className="account-connect-glow" />
      <div className="account-connect-copy">
        <span className="account-hub-eyebrow"><Instagram size={14}/> YOUR SELLER SPACE</span>
        <h1>Your business,<br/><span>all in one place.</span></h1>
        <p>Connect your Instagram Business account, manage your shops, and give your best products more visibility — all from one simple dashboard.</p>
        <Link href="/account/setup" className="account-connect-cta"><Instagram size={17}/> Connect your Instagram <ArrowRight size={16}/></Link>
      </div>
      <div className="account-banner-art" aria-hidden="true"><div className="account-art-ring"/><div className="account-art-card"><Instagram size={30}/><span>INSTAGRAM</span><b>Shop connected</b><i><CheckCircle2 size={15}/> Ready to grow</i></div><div className="account-art-spark">✦</div></div>
      <form action={out} className="account-signout-form"><button className="account-signout"><LogOut size={15}/> Sign out</button></form>
    </section>

    {q.instagram === "connected" && <div className="seller-alert success"><CheckCircle2 size={19}/><div><b>Instagram connected!</b><span>Your account is linked. Eligible posts can become marketplace products.</span></div></div>}
    {q.instagram_error && <div className="seller-alert error"><Instagram size={19}/><div>{q.instagram_error}</div></div>}
    {q.error === "invalid" && <div className="seller-alert error"><Instagram size={19}/><div>Please enter a valid Instagram username.</div></div>}
    {q.requested && <div className="seller-alert success"><CheckCircle2 size={19}/><div><b>Request submitted.</b><span>Your Instagram shop request is waiting for review.</span></div></div>}

    <section className="account-overview-grid">
      <article><span className="account-overview-icon"><Store size={18}/></span><div><span>Connected shops</span><b>{connections.length}</b></div></article>
      <article><span className="account-overview-icon"><Instagram size={18}/></span><div><span>Marketplace products</span><b>{productCount}</b></div></article>
      <article><span className="account-overview-icon"><CheckCircle2 size={18}/></span><div><span>Requests in progress</span><b>{pendingRequests.length}</b></div></article>
    </section>

    <section className="account-section">
      <div className="account-section-heading"><div><span className="account-hub-eyebrow">YOUR BUSINESS</span><h2>Connected shops</h2><p>Choose a shop to view its public storefront, or visit Analytics & Growth to track performance, promote products, and unlock seller tools.</p></div><div className="account-section-actions"><Link href="/account/analytics" className="account-outline-button"><ChartNoAxesCombined size={16}/> Analytics &amp; Growth</Link><Link href="/account/setup" className="account-outline-button"><Plus size={16}/> Add a shop</Link></div></div>
      {connections.length ? <div className="account-connected-grid">{connections.map(c => <article className="account-connected-card" key={c.id}>
        <div className="account-store-avatar"><Instagram size={23}/><span><i/></span></div>
        <div className="account-store-info"><h3>@{c.username}</h3><p>{c.posts.length} marketplace {c.posts.length === 1 ? "product" : "products"}</p><span className="account-connected-status"><CheckCircle2 size={13}/> Instagram connected</span></div>
        <div className="account-store-actions"><Link href={"/store/"+encodeURIComponent(c.username)} className="account-manage-button">View store <ArrowRight size={14}/></Link><Link href="/account/analytics" className="account-grow-link"><Zap size={14}/> Analytics &amp; Growth</Link></div>
      </article>)}</div> : <div className="account-empty-state"><div className="account-empty-icon"><Instagram size={25}/></div><h3>Your connected shops will appear here</h3><p>Start by connecting an Instagram Business account. We’ll guide you through each step and save your progress.</p><Link href="/account/setup" className="account-primary-button">Connect your first shop <ArrowRight size={15}/></Link></div>}
    </section>

    {pendingRequests.length > 0 && <section className="account-section">
      <div className="account-section-heading"><div><span className="account-hub-eyebrow">SETUP STATUS</span><h2>Requests in progress</h2><p>Your progress is saved. Continue from the step where you left off.</p></div></div>
      <div className="account-request-list">{pendingRequests.map(r => <article key={r.id}><span className="account-request-icon"><Instagram size={19}/></span><div><b>@{r.username}</b><span>{r.status === "PENDING" ? "Waiting for our team to review your request" : r.status === "APPROVED" ? "Approved — ready for the next setup step" : "Needs attention — you can start a new request"}</span></div><Link href={"/account/setup?setup="+encodeURIComponent(r.id)+"&step="+(r.status === "APPROVED" ? 3 : r.status === "PENDING" ? 2 : 1)}>Continue setup <ArrowRight size={14}/></Link></article>)}</div>
    </section>}

    <footer className="account-help-note"><BadgeCheck size={16}/><p><b>Quick tip:</b> Your Instagram posts stay on Instagram. Boosts and seller upgrades are optional, and you can request them for individual connected shops from the Analytics & Growth dashboard.</p></footer>
  </main>;
}