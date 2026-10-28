import { admin } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, ShieldCheck, Users, CheckCircle2, Store, Package, UserRound } from "lucide-react";
import AdminRemoveStore from "@/components/admin-remove-store";
import AdminGrowthActions from "@/components/admin-growth-actions";
import AdminDashboardTabs from "@/components/admin-dashboard-tabs";
import AdminWorkspaceNav from "@/components/admin-workspace-nav";
import GlobalFeedbackTrigger from "@/components/global-feedback-trigger";
import AdminOfferingsManager from "@/components/admin-offerings-manager";

export const dynamic = "force-dynamic";

async function review(formData: FormData) {
  "use server";
  await admin();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["APPROVED", "REJECTED"].includes(status)) {
    redirect("/admin?error=" + encodeURIComponent("Invalid store request action."));
  }

  const prisma = db();
  const request = await prisma.storeRequest.findUnique({ where: { id } });
  if (!request) redirect("/admin?error=" + encodeURIComponent("Store request not found."));
  if (request.status !== "PENDING") {
    redirect("/admin?error=" + encodeURIComponent("This store request has already been reviewed."));
  }

  const approved = status === "APPROVED";
  await prisma.$transaction([
    prisma.storeRequest.update({
      where: { id },
      data: { status: approved ? "APPROVED" : "REJECTED", reviewedAt: new Date() },
    }),
    prisma.notification.create({
      data: {
        userId: request.userId,
        type: approved ? "STORE_REQUEST_APPROVED" : "STORE_REQUEST_REJECTED",
        title: approved ? "Your shop request was approved" : "Your shop request was declined",
        message: approved
          ? `Your request for @${request.username} was approved. You can now accept the Instagram tester invitation and connect your shop.`
          : `Your request for @${request.username} was not approved. You can review your setup and submit another request if needed.`,
        href: approved ? `/account/setup?setup=${encodeURIComponent(request.id)}&step=3` : "/account/setup",
      },
    }),
  ]);
  redirect(approved ? "/admin?approved=1" : "/admin?rejected=1");
}

export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; approved?: string; rejected?: string; removed?: string }>;
}) {
  try {
    await admin();
  } catch {
    redirect("/login");
  }

  const q = await searchParams;
  const p = db();
  const [requests, connections, products, users, growth, offerings, audienceSize] = await Promise.all([
    p.storeRequest.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } }),
    p.instagramConnection.findMany({ include: { posts: { where: { isProduct: true }, select: { id: true } } } }),
    p.instagramPost.count({ where: { isProduct: true } }),
    p.user.count({ where: { role: "USER" } }),
    p.growthRequest.findMany({
      where: { status: "PENDING" },
      include: { user: true, connection: true, post: true, offering: true },
      orderBy: { createdAt: "desc" },
    }),
    p.growthOffering.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }] }),
    p.user.count({ where: { role: "USER" } }),
  ]);

  const pending = requests.filter((request) => request.status === "PENDING");
  const approved = requests.filter((request) => request.status === "APPROVED");
  const rejected = requests.filter((request) => request.status === "REJECTED");

  function renderRequest(request: (typeof requests)[number]) {
    return (
      <article className="admin-request-card" key={request.id}>
        <div className="admin-request-top">
          <div className="admin-user-icon"><Users size={18} /></div>
          <div className="admin-request-main">
            <b>@{request.username}</b>
            <span>{request.user.email}</span>
            <small>
              {request.status === "PENDING"
                ? "Send the tester invitation first, then approve this store request."
                : request.status === "APPROVED"
                  ? "Approved — seller can accept the tester invitation and connect."
                  : "Request rejected."}
            </small>
          </div>
          <span className={"account-status " + request.status.toLowerCase()}>{request.status}</span>
        </div>

        {request.status === "PENDING" && (
          <div className="admin-request-actions">
            <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="admin-secondary-button">
              <ExternalLink size={14} /> 1. Request tester on Meta
            </a>
            <form action={review}>
              <input type="hidden" name="id" value={request.id} />
              <input type="hidden" name="status" value="APPROVED" />
              <button className="admin-primary-button">2. Approve store <CheckCircle2 size={14} /></button>
            </form>
            <form action={review}>
              <input type="hidden" name="id" value={request.id} />
              <input type="hidden" name="status" value="REJECTED" />
              <button className="admin-reject-button">Reject</button>
            </form>
          </div>
        )}

        {request.status === "APPROVED" && (
          <div className="admin-approved-note">
            <CheckCircle2 size={15} /> Tester request should already be sent. The seller now sees the tester acceptance and connection steps on their Account page.
          </div>
        )}

        <div className="admin-request-danger">
          <div>
            <b>Danger zone</b>
            <span>Remove this store and delete everything synced from Instagram.</span>
          </div>
          <AdminRemoveStore requestId={request.id} username={request.username} />
        </div>
      </article>
    );
  }

  return (
    <div className="admin-workspace">
      <AdminWorkspaceNav />
      <main className="admin-page">
      <div className="shell py-12">
        <header className="admin-head">
          <div>
            <p className="account-kicker dark">Admin control room</p>
            <h1>Marketplace management</h1>
            <p>Manage seller onboarding, review requests, and handle store growth from one organized workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2"><Link href="/admin/ai-promotion-pricing" className="admin-top-button">AI video pricing</Link><Link href="/admin/instagram" className="admin-top-button">Instagram connections</Link></div>
        </header>

        <div className="admin-stats">
          {[
            { value: pending.length, label: "Pending requests", icon: <Users size={18} /> },
            { value: connections.length, label: "Connected stores", icon: <Store size={18} /> },
            { value: products, label: "Products", icon: <Package size={18} /> },
            { value: users, label: "Customers", icon: <UserRound size={18} /> },
          ].map((stat) => (
            <div className="admin-stat" key={stat.label}>
              <span className="admin-stat-icon">{stat.icon}</span>
              <b>{stat.value}</b>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        {q.error && <GlobalFeedbackTrigger type="error" title="Admin action failed" message={q.error} />}
        {q.approved && <GlobalFeedbackTrigger type="success" title="Store approved" message="The seller can now accept the tester invitation and connect." />}
        {q.rejected && <GlobalFeedbackTrigger type="success" title="Store request rejected" message="The store request was rejected successfully." />}
        {q.removed && <GlobalFeedbackTrigger type="success" title="Store removed" message="The store connection and its marketplace data have been removed." />}

        <AdminDashboardTabs
          tabs={[
            {
              id: "overview",
              label: "Overview",
              count: connections.length,
              content: (
                <div className="admin-overview-grid">
                  <div className="admin-meta-card">
                    <div className="admin-meta-icon"><ShieldCheck size={22} /></div>
                    <div>
                      <p className="account-kicker dark">Seller onboarding workflow</p>
                      <h2>Request the seller as a tester in Meta</h2>
                      <p>Before approving a pending store, open Meta for Developers, go to your app’s Instagram tester/access area, search for the exact Instagram username, and send the tester invitation. Keep this dashboard open in another tab.</p>
                      <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="admin-meta-button">Open Meta Developers <ExternalLink size={15} /></a>
                    </div>
                  </div>
                  <div className="admin-overview-note">
                    <span className="admin-overview-note-icon"><ShieldCheck size={20} /></span>
                    <h3>Everything is organized by status</h3>
                    <p>Use the tabs to review pending store applications, revisit approved stores, check rejected requests, and process paid Boost, Verified, or Pro Seller requests without scrolling through one long list.</p>
                    <div className="admin-overview-counts">
                      <span><b>{pending.length}</b> Pending</span>
                      <span><b>{approved.length}</b> Approved</span>
                      <span><b>{rejected.length}</b> Rejected</span>
                      <span><b>{growth.length}</b> Growth</span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              id: "pending",
              label: "Pending stores",
              count: pending.length,
              content: <div className="admin-request-list">{pending.length ? pending.map(renderRequest) : <div className="admin-tab-empty"><Clock3Fallback /> <b>No pending store requests</b><span>New seller applications will appear here.</span></div>}</div>,
            },
            {
              id: "approved",
              label: "Approved stores",
              count: approved.length,
              content: <div className="admin-request-list">{approved.length ? approved.map(renderRequest) : <div className="admin-tab-empty"><CheckCircle2 size={22} /> <b>No approved requests yet</b><span>Approved sellers will be listed here.</span></div>}</div>,
            },
            {
              id: "rejected",
              label: "Rejected",
              count: rejected.length,
              content: <div className="admin-request-list">{rejected.length ? rejected.map(renderRequest) : <div className="admin-tab-empty"><Users size={22} /> <b>No rejected requests</b><span>Rejected applications will appear here.</span></div>}</div>,
            },
            {
              id: "offerings",
              label: "Plans & pricing",
              count: offerings.length,
              content: <AdminOfferingsManager initialOfferings={offerings.map((item) => ({ ...item, features: item.features }))} audienceSize={audienceSize} />,
            },
            {
              id: "growth",
              label: "Growth requests",
              count: growth.length,
              content: (
                <div className="admin-growth-list">
                  {growth.length === 0 && <div className="admin-tab-empty"><Package size={22} /><b>No pending growth requests</b><span>Boost, Verified and Pro Seller requests will appear here.</span></div>}
                  {growth.map((item) => (
                    <article className="admin-growth-card" key={item.id}>
                      <div>
                        <span className="admin-growth-type">{item.type}</span>
                        <h3>@{item.connection.username}{item.post?.productTitle ? " · " + item.post.productTitle : ""}</h3>
                        <p>{item.user.email} · KSh {item.amount.toLocaleString()} · {item.offeringName || item.offering?.name || item.type} · {item.durationDays || item.offering?.durationDays || (item.type === "PRO" ? 30 : item.type === "VERIFIED" ? 365 : 7)} days</p>
                      </div>
                      <AdminGrowthActions id={item.id} />
                    </article>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </div>
      </main>
    </div>
  );
}

function Clock3Fallback() {
  return <span className="admin-empty-clock">◷</span>;
}
