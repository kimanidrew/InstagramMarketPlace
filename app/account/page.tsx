import { user, logout } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Instagram, LogOut, ShieldCheck, Sparkles, Plus } from "lucide-react";
import SellerSetupModal from "@/components/seller-setup-modal";
import { AccountLiveRefresh } from "@/components/account-live-refresh";

export const dynamic = "force-dynamic";

async function out() {
  "use server";
  await logout();
  redirect("/");
}

export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; instagram?: string; instagram_error?: string; requested?: string; error?: string; setup?: string; new?: string }>;
}) {
  const u = await user();
  if (!u) redirect("/");

  const q = await searchParams;
  const [requests, connections] = await Promise.all([
    db().storeRequest.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" } }),
    db().instagramConnection.findMany({
      where: { connectedByUserId: u.id },
      include: { posts: { where: { isProduct: true }, select: { id: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const connectedIds = new Set(connections.map(c => c.username.toLowerCase()));
  const activeRequest = requests.find(r => !connectedIds.has(r.username.toLowerCase()));
  const activeConnection = activeRequest ? connections.find(c => c.username.toLowerCase() === activeRequest.username.toLowerCase()) : undefined;
  const activeStep = activeRequest ? (activeRequest.status === "APPROVED" ? 3 : activeRequest.status === "PENDING" ? 2 : 1) : 0;

  const setupRequest = q.setup && q.setup !== "new" ? requests.find(r => r.id === q.setup) : undefined;
  const setupConnection = setupRequest ? connections.find(c => c.username.toLowerCase() === setupRequest.username.toLowerCase()) : undefined;
  const requestedStep = Number(q.step || (setupRequest?.status === "APPROVED" ? 3 : setupRequest?.status === "PENDING" ? 2 : 1));
  const setupStep = Math.min(4, Math.max(1, Number.isFinite(requestedStep) ? requestedStep : 1));

  return (
    <main className="seller-onboarding">
      <AccountLiveRefresh />
      <section className="seller-onboarding-hero">
        <div className="shell">
          <div className="seller-hero-row">
            <div>
              <p className="seller-kicker"><Sparkles size={13} /> Seller setup</p>
              <h1>Let's get your<br /><span>Instagram shop ready.</span></h1>
              <p className="seller-hero-copy">Think of this like a little checklist. Do one step, tap Next, and we will remember where you stopped.</p>
            </div>
            <form action={out}><button className="seller-signout"><LogOut size={15} /> Sign out</button></form>
          </div>
          <div className="seller-trust-row">
            <span><ShieldCheck size={14} /> Simple 4-step setup</span>
            <span><Instagram size={14} /> Instagram seller</span>
            <span><CheckCircle2 size={14} /> Your progress is saved</span>
          </div>
        </div>
      </section>

      <section className="shell seller-onboarding-content">
        {q.instagram === "connected" && <div className="seller-alert success"><CheckCircle2 size={19} /><div><b>You are connected!</b><span>Your Instagram shop is now linked and eligible posts can become marketplace products.</span></div></div>}
        {q.instagram_error && <div className="seller-alert error"><ShieldCheck size={19} /><div>{q.instagram_error}</div></div>}
        {q.error === "invalid" && <div className="seller-alert error"><ShieldCheck size={19} /><div>Please enter a valid Instagram username.</div></div>}
        {q.requested && <div className="seller-alert success"><CheckCircle2 size={19} /><div><b>Step 1 is complete.</b><span>Your request is now waiting for review.</span></div></div>}

        {activeRequest && !activeConnection ? (
          <div className="seller-progress">
            <div className="seller-progress-head">
              <div><p className="seller-kicker light">Your progress · @{activeRequest.username}</p><h2>You are on step {activeStep} of 4.</h2></div>
              <span>{activeStep} / 4</span>
            </div>
            <div className="seller-progress-track">
              {[1,2,3,4].map(n => <Link key={n} href={"/account?setup="+encodeURIComponent(activeRequest.id)+"&step="+Math.min(n,activeStep)} className={"seller-progress-dot "+(n<activeStep?"done":n===activeStep?"active":"")}>{n<activeStep?<CheckCircle2 size={14}/>:n}</Link>)}
            </div>
            <Link href={"/account?setup="+encodeURIComponent(activeRequest.id)+"&step="+activeStep} className="seller-progress-open">Open setup <ArrowRight size={14}/></Link>
          </div>
        ) : (
          <div className="seller-empty-progress"><div><p className="seller-kicker light">Setup progress</p><h2>All your connected shops are ready. 🎉</h2><p>Add another Instagram shop below whenever you are ready.</p></div></div>
        )}

        <div className="seller-shop-switcher">
          <div><p className="seller-kicker light">Your Instagram shops</p><h2>{activeRequest ? "Shop: @"+activeRequest.username : "Your connected shops"}</h2></div>
          <Link href="/account?setup=new&step=1" className="seller-new-shop"><Plus size={15} /> Add another shop</Link>
        </div>

        <section className="seller-history">
          <div className="seller-section-heading"><div><p className="seller-kicker light">Saved progress</p><h2>Your shop requests</h2></div><span>{requests.length}</span></div>
          <div className="seller-history-list">
            {requests.length === 0 && <div className="seller-empty-history"><Instagram size={18}/><span>You have not added an Instagram shop yet.</span><Link href="/account?setup=new&step=1">Add your first shop <ArrowRight size={14}/></Link></div>}
            {requests.map(request => {
              const connected = connectedIds.has(request.username.toLowerCase());
              const nextStep = connected ? 4 : request.status === "APPROVED" ? 3 : request.status === "PENDING" ? 2 : 1;
              return <div className={"seller-history-row "+(connected?"is-connected":"")} key={request.id}>
                <div className="seller-history-icon"><Instagram size={18}/></div>
                <div><b>@{request.username}</b><span>{connected ? "Connected · setup complete" : request.status === "PENDING" ? "Request in review" : request.status === "APPROVED" ? "Approved — continue to step 3" : "Not approved"}</span></div>
                <Link href={"/account?setup="+encodeURIComponent(request.id)+"&step="+nextStep}>Continue <ArrowRight size={14}/></Link>
              </div>;
            })}
          </div>
        </section>
      </section>

      {setupRequest && <SellerSetupModal request={setupRequest} connection={setupConnection ? {username:setupConnection.username,postsCount:setupConnection.posts.length} : undefined} initialStep={setupStep} />}
      {q.setup === "new" && <SellerSetupModal request={{id:"new",username:"new shop",status:"REJECTED"}} initialStep={1} />}
    </main>
  );
}
