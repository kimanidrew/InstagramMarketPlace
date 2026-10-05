import { user, logout } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ExternalLink, Instagram, LogOut, ShieldCheck, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const guideImages = {
  register: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1200&q=85",
  review: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85",
  tester: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=85",
  connect: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85",
};

async function out() {
  "use server";
  await logout();
  redirect("/");
}

function StepCard({
  number, title, text, image, state, children,
}: {
  number: number;
  title: string;
  text: string;
  image: string;
  state: "done" | "active" | "locked";
  children?: React.ReactNode;
}) {
  return (
    <article className={"seller-step-card seller-step-" + state}>
      <div className="seller-step-line" aria-hidden="true" />
      <div className="seller-step-media"><img src={image} alt="" /></div>
      <div className="seller-step-number">{state === "done" ? <Check size={17} /> : number}</div>
      <div className="seller-step-body">
        <div className="seller-step-top">
          <span>{state === "done" ? "DONE" : state === "active" ? "YOUR NEXT STEP" : "COMING NEXT"}</span>
          {state === "active" && <b>Step {number} of 4</b>}
        </div>
        <h2>{title}</h2>
        <p className="seller-step-text">{text}</p>
        {children}
      </div>
    </article>
  );
}

export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; instagram?: string; instagram_error?: string; requested?: string; error?: string }>;
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

  const latest = requests[0];
  const connection = latest
    ? connections.find(c => c.username.toLowerCase() === latest.username.toLowerCase())
    : connections[0];

  const isConnected = Boolean(connection);
  const currentStep = isConnected ? 4 : latest?.status === "APPROVED" ? 3 : latest?.status === "PENDING" ? 2 : 1;
  const requestedStep = Number(q.step || currentStep);
  const step = Math.min(4, Math.max(1, Number.isFinite(requestedStep) ? requestedStep : currentStep));
  const visibleStep = Math.min(step, currentStep);

  const stepHref = (n: number) => "/account?step=" + n;

  return (
    <main className="seller-onboarding">
      <section className="seller-onboarding-hero">
        <div className="shell">
          <div className="seller-hero-row">
            <div>
              <p className="seller-kicker"><Sparkles size={13} /> Seller setup</p>
              <h1>Let's get your<br /><span>Instagram shop ready.</span></h1>
              <p className="seller-hero-copy">
                Think of this like a little checklist. Do one step, tap Next, and we will remember where you stopped.
              </p>
            </div>
            <form action={out}>
              <button className="seller-signout"><LogOut size={15} /> Sign out</button>
            </form>
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

        <div className="seller-progress">
          <div className="seller-progress-head">
            <div>
              <p className="seller-kicker light">Your progress</p>
              <h2>{isConnected ? "All done! 🎉" : "You are on step " + currentStep + " of 4."}</h2>
            </div>
            <span>{isConnected ? "4 / 4" : currentStep + " / 4"}</span>
          </div>
          <div className="seller-progress-track">
            {[1, 2, 3, 4].map(n => <Link key={n} href={stepHref(Math.min(n, currentStep))} className={"seller-progress-dot " + (n < currentStep || isConnected ? "done" : n === currentStep ? "active" : "")}>{n < currentStep || isConnected ? <Check size={14} /> : n}</Link>)}
          </div>
        </div>

        <div className="seller-stepper">
          <StepCard number={1} title="Tell us your Instagram username" text="First, tell us which Instagram account you want to turn into your shop. That's it — no product list needed." image={guideImages.register} state={currentStep > 1 ? "done" : visibleStep === 1 ? "active" : "locked"}>
            {currentStep === 1 ? (
              <form action="/api/store-requests" method="post" className="seller-form">
                <label htmlFor="username">Your Instagram username</label>
                <div className="seller-input-wrap"><span>@</span><input id="username" name="username" required placeholder="yourshopname" autoComplete="off" /><button type="submit">Next <ArrowRight size={16} /></button></div>
                <small>Use the exact username. Example: <b>yourbrand</b> — do not type @.</small>
              </form>
            ) : (
              <div className="seller-done-note"><CheckCircle2 size={16} /> Username submitted</div>
            )}
          </StepCard>

          <StepCard number={2} title="Wait while we review it" text="Now our team checks your shop and sends the Instagram tester invitation through Meta. You do not need to do anything yet." image={guideImages.review} state={currentStep > 2 ? "done" : currentStep === 2 ? "active" : "locked"}>
            {latest?.status === "PENDING" && currentStep === 2 && (
              <div className="seller-status-box review">
                <div><ShieldCheck size={17} /><div><b>Request in review</b><span>We are reviewing @{latest.username}. This step is saved.</span></div></div>
                <Link href={stepHref(2)} className="seller-secondary-button">Continue registration <ArrowRight size={15} /></Link>
              </div>
            )}
            {latest?.status === "APPROVED" && <div className="seller-done-note"><CheckCircle2 size={16} /> Approved — next step unlocked</div>}
            {latest?.status === "REJECTED" && <div className="seller-status-box error"><b>This request was not approved.</b><span>You can start again with another Instagram username.</span><Link href={stepHref(1)} className="seller-primary-button">Start again <ArrowRight size={15} /></Link></div>}
          </StepCard>

          <StepCard number={3} title="Accept the Instagram invitation" text="When your shop is approved, Instagram will show you a tester invitation. Open Instagram, approve it, then come back here." image={guideImages.tester} state={currentStep > 3 ? "done" : currentStep === 3 ? "active" : "locked"}>
            {currentStep === 3 && latest?.status === "APPROVED" && !isConnected && (
              <div className="seller-action-stack">
                <div className="seller-numbered-tip"><b>1</b><span>Open Instagram and find the tester invitation.</span></div>
                <div className="seller-numbered-tip"><b>2</b><span>Tap the invitation and choose <strong>Approve</strong>.</span></div>
                <a href="https://www.instagram.com/accounts/manage_access/" target="_blank" rel="noopener noreferrer" className="seller-primary-button">Open Instagram <ExternalLink size={15} /></a>
                <Link href={stepHref(4)} className="seller-next-button">I approved it — Next <ArrowRight size={16} /></Link>
              </div>
            )}
          </StepCard>

          <StepCard number={4} title="Connect Instagram" text="Last step! Connect the approved Instagram account. Instagram handles the secure sign-in for you." image={guideImages.connect} state={isConnected ? "done" : currentStep === 4 ? "active" : "locked"}>
            {isConnected ? (
              <div className="seller-status-box success"><CheckCircle2 size={18} /><div><b>@{connection?.username} is connected</b><span>{connection?.posts.length || 0} marketplace products imported.</span></div></div>
            ) : currentStep === 4 && latest?.status === "APPROVED" ? (
              <div className="seller-action-stack">
                <Link href={"/api/instagram/connect?requestId=" + encodeURIComponent(latest.id)} className="seller-primary-button">Connect @{latest.username} <Instagram size={16} /></Link>
                <Link href={stepHref(3)} className="seller-back-button"><ArrowLeft size={14} /> Back to invitation step</Link>
              </div>
            ) : null}
          </StepCard>
        </div>

        {!isConnected && currentStep === 2 && (
          <div className="seller-help-card"><div className="seller-help-icon">💡</div><div><b>Nothing to do yet.</b><span>Leave this page or come back later. When an admin approves your request, step 3 will unlock automatically.</span></div><Link href={stepHref(2)}>Keep me on step 2 <ArrowRight size={14} /></Link></div>
        )}

        {requests.length > 0 && (
          <section className="seller-history">
            <div className="seller-section-heading"><div><p className="seller-kicker light">Saved progress</p><h2>Your shop requests</h2></div><span>{requests.length}</span></div>
            <div className="seller-history-list">
              {requests.map(request => {
                const connected = connections.some(c => c.username.toLowerCase() === request.username.toLowerCase());
                return <div className="seller-history-row" key={request.id}><div className="seller-history-icon"><Instagram size={18} /></div><div><b>@{request.username}</b><span>{connected ? "Connected" : request.status === "PENDING" ? "Request in review" : request.status === "APPROVED" ? "Approved — continue to step 3" : "Not approved"}</span></div><Link href={stepHref(connected ? 4 : request.status === "APPROVED" ? 3 : request.status === "PENDING" ? 2 : 1)}>Continue <ArrowRight size={14} /></Link></div>;
              })}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
