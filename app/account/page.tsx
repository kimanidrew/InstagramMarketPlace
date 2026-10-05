import { user, logout } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, ExternalLink, Instagram, LogOut, Plus, ShieldCheck, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const guideImages = {
  register: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=900&q=85",
  review: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85",
  tester: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=85",
  connect: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=85",
};

async function out() {
  "use server";
  await logout();
  redirect("/");
}

function Step({ number, title, text, image, active, done, children }: {
  number: string; title: string; text: string; image: string; active?: boolean; done?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className={"account-step " + (active ? "is-active" : "") + (done ? " is-done" : "")}>
      <div className="account-step-media"><img src={image} alt="" /></div>
      <div className="account-step-number">{done ? <Check size={16} /> : number}</div>
      <div className="account-step-body">
        <p className="account-step-label">{done ? "Completed" : active ? "Your next step" : "Step " + number}</p>
        <h3>{title}</h3>
        <p>{text}</p>
        {children}
      </div>
    </div>
  );
}

export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ instagram?: string; instagram_error?: string; requested?: string; error?: string }>;
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

  return (
    <main className="account-page">
      <section className="account-hero">
        <div className="shell">
          <div className="account-hero-top">
            <div>
              <p className="account-kicker"><Sparkles size={13} /> Seller account</p>
              <h1>Bring your Instagram<br /><span>into the marketplace.</span></h1>
              <p className="account-hero-copy">
                We keep the process simple. Register your Instagram username, wait for approval,
                accept the tester invitation, then connect your account securely.
              </p>
            </div>
            <form action={out}>
              <button className="account-signout"><LogOut size={15} /> Sign out</button>
            </form>
          </div>
          <div className="account-user-pill"><span>{u.name || "Seller"}</span><span>{u.email}</span></div>
        </div>
      </section>

      <section className="shell account-content">
        {q.instagram === "connected" && <div className="account-alert success"><CheckCircle2 size={19} /><span><b>You're connected.</b> Your Instagram shop is now linked and its eligible posts can flow into the marketplace.</span></div>}
        {q.instagram_error && <div className="account-alert error"><ShieldCheck size={19} /><span>{q.instagram_error}</span></div>}
        {q.error === "invalid" && <div className="account-alert error"><ShieldCheck size={19} /><span>Please enter a valid Instagram username.</span></div>}
        {q.requested && <div className="account-alert success"><CheckCircle2 size={19} /><span><b>Shop request received.</b> We'll review it and guide you through the next step here.</span></div>}

        <div className="account-intro">
          <div>
            <p className="account-kicker dark">How it works</p>
            <h2>Four friendly steps.</h2>
          </div>
          <p>Nothing complicated. Each step unlocks the next one so you always know what to do.</p>
        </div>

        <div className="account-guide">
          <Step number="01" title="Register your Instagram shop" image={guideImages.register} active={requests.length === 0} text="Enter the Instagram username you want to use as your marketplace shop. You don't need to add products separately — your Instagram posts become the content shoppers discover.">
            {requests.length === 0 && <p className="account-step-note"><Instagram size={14} /> Start below with your Instagram username.</p>}
          </Step>
          <Step number="02" title="Our team reviews your shop" image={guideImages.review} active={requests.some(r => r.status === "PENDING")} done={requests.some(r => r.status === "APPROVED")} text="After you submit the username, a marketplace admin reviews the request and requests the Instagram account as a tester through Meta for Developers.">
            <p className="account-step-note"><ShieldCheck size={14} /> This part is handled by our team.</p>
          </Step>
          <Step number="03" title="Accept the Instagram tester invitation" image={guideImages.tester} active={requests.some(r => r.status === "APPROVED" && !connections.some(c => c.username.toLowerCase() === r.username.toLowerCase()))} text="Once your shop is approved, open Instagram's access page in a new tab. Find the tester invitation, tap it, and choose Approve. Then come back here.">
            {requests.filter(r => r.status === "APPROVED" && !connections.some(c => c.username.toLowerCase() === r.username.toLowerCase())).map(r => (
              <div className="account-action-box" key={r.id}>
                <b>@{r.username} is ready</b>
                <p>Open Instagram in a new tab, switch to the Tester invitations tab, and approve the invitation for this app.</p>
                <a href="https://www.instagram.com/accounts/manage_access/" target="_blank" rel="noopener noreferrer" className="account-primary-button">
                  Open Instagram access <ExternalLink size={15} />
                </a>
              </div>
            ))}
          </Step>
          <Step number="04" title="Connect Instagram" image={guideImages.connect} done={connections.length > 0} text="After approving the tester invitation, return here and connect the approved Instagram account. Instagram handles the authorization securely — you don't need to paste an access token.">
            {requests.filter(r => r.status === "APPROVED" && !connections.some(c => c.username.toLowerCase() === r.username.toLowerCase())).map(r => (
              <Link key={r.id} href={"/api/instagram/connect?requestId=" + encodeURIComponent(r.id)} className="account-primary-button">
                Connect @{r.username} <Instagram size={15} />
              </Link>
            ))}
          </Step>
        </div>

        <section className="account-shops-card">
          <div className="account-section-head">
            <div>
              <p className="account-kicker dark">Your shops</p>
              <h2>Instagram shop requests</h2>
            </div>
            <span>{requests.length} {requests.length === 1 ? "shop" : "shops"}</span>
          </div>

          {requests.length > 0 ? <div className="account-shop-list">
            {requests.map((request) => {
              const connection = connections.find(c => c.username.toLowerCase() === request.username.toLowerCase());
              const connected = Boolean(connection);
              return (
                <div className="account-shop" key={request.id}>
                  <div className="account-shop-avatar"><Instagram size={19} /></div>
                  <div className="account-shop-main">
                    <b>@{request.username}</b>
                    <span>{connected ? connection!.posts.length + " marketplace products imported" : request.status === "PENDING" ? "Waiting for admin review and Meta tester invitation" : request.status === "REJECTED" ? "Request was not approved" : "Approved — ready for tester acceptance"}</span>
                  </div>
                  <div className={"account-status " + (connected ? "connected" : request.status.toLowerCase())}>
                    {connected ? <CheckCircle2 size={14} /> : request.status === "APPROVED" ? <CheckCircle2 size={14} /> : null}
                    {connected ? "Connected" : request.status}
                  </div>
                </div>
              );
            })}
          </div> : <div className="account-empty">Your first shop will appear here after you register it below.</div>}
        </section>

        <section className="account-register-card">
          <div>
            <div className="account-register-icon"><Plus size={20} /></div>
            <p className="account-kicker dark">Step 01</p>
            <h2>Register an Instagram shop</h2>
            <p>Use the exact Instagram username you want shoppers to see. Start with one shop and add more later.</p>
          </div>
          <form action="/api/store-requests" method="post" className="account-register-form">
            <label htmlFor="username">Instagram username</label>
            <div>
              <span>@</span>
              <input id="username" name="username" required placeholder="yourshopname" autoComplete="off" />
              <button type="submit">Register shop <ArrowRight size={16} /></button>
            </div>
            <small>Example: yourbrand — don't include the @ symbol.</small>
          </form>
        </section>
      </section>
    </main>
  );
}
