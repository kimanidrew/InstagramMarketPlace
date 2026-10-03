import { user, logout } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ExternalLink, Instagram, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function out() {
  "use server";
  await logout();
  redirect("/");
}

export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ instagram?: string; instagram_error?: string }>;
}) {
  const u = await user();
  if (!u) redirect("/");

  const q = await searchParams;
  const rs = await db().storeRequest.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: "desc" },
  });
  const connections = await db().instagramConnection.findMany({
    where: { connectedByUserId: u.id },
    orderBy: { createdAt: "desc" },
  });
  const approved = rs.find((r) => r.status === "APPROVED");

  return (
    <main className="shell py-14">
      <div className="flex justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#888]">
            Account
          </p>
          <h1 className="mt-2 text-4xl font-black">{u.name}</h1>
          <p className="text-sm text-[#777]">{u.email}</p>
        </div>

        <form action={out}>
          <button className="rounded-full border px-4 py-2 text-sm">
            Sign out
          </button>
        </form>
      </div>

      <section className="card mt-10 p-7">
        <h2 className="text-2xl font-black">Instagram store</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666]">
          Your Instagram account is connected by the marketplace admin. You do
          not need to paste an access token or connect through an OAuth button.
        </p>

        {q.instagram === "connected" && (
          <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700">
            Instagram account connected and posts imported.
          </p>
        )}

        {q.instagram_error && (
          <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {q.instagram_error}
          </p>
        )}

        {connections.length > 0 ? (
          <div className="mt-6 space-y-5">
            {connections.map((connection) => (
              <div key={connection.id} className="rounded-2xl border p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-[#777]">Connected Instagram</p>
                    <b className="text-lg">@{connection.username}</b>
                    <p className="mt-1 text-xs text-[#888]">
                      {connection.posts?.length ?? 0} products ·{" "}
                      {connection.lastSyncedAt
                        ? "Posts synced"
                        : "Ready to sync"}
                    </p>
                  </div>

                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                    <CheckCircle2 size={16} />
                    Approved
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-[#f7f7f5] p-5">
                  <p className="text-sm font-bold">
                    One final Instagram step
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#666]">
                    The marketplace has already added your Instagram account.
                    Open Instagram&apos;s access page and, under{" "}
                    <b>Tester invites</b>, click <b>Approve</b> for{" "}
                    <b>Marketplace-IG</b>.
                  </p>

                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://www.instagram.com/accounts/manage_access/"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
                  >
                    Open Instagram access
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : approved ? (
          <div className="mt-6 rounded-2xl border p-5">
            <p className="text-sm font-semibold">Store approved</p>
            <p className="mt-2 text-sm leading-6 text-[#666]">
              Your Instagram store request has been approved. The marketplace
              admin still needs to add your Instagram access token before your
              account will show as connected.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-[#f7f7f5] p-5 text-sm text-[#666]">
            Submit your Instagram username below. The store will show as
            approved after the marketplace admin adds the account access token.
          </div>
        )}
      </section>

      <section className="card mt-8 p-7">
        <h2 className="text-xl font-black">Request an Instagram store</h2>
        <form
          action="/api/store-requests"
          method="post"
          className="mt-5 flex max-w-xl gap-2"
        >
          <input
            name="username"
            required
            placeholder="@shopname"
            className="min-w-0 flex-1 rounded-full border px-5 py-3"
          />
          <button className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">
            Request
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-black">Your requests</h2>
        <div className="mt-5 space-y-3">
          {rs.map((r) => (
            <div
              key={r.id}
              className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <b>@{r.username}</b>
                <p className="text-xs text-[#888]">
                  {new Date(r.createdAt).toLocaleDateString("en-GB")}
                </p>
              </div>
              <span className="rounded-full bg-[#f4f4f4] px-3 py-1 text-xs">
                {connections.some(
                  (connection) =>
                    connection.username.toLowerCase() ===
                    r.username.toLowerCase().replace(/^@/, "")
                )
                  ? "APPROVED"
                  : r.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
