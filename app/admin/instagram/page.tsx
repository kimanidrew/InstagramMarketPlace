import { admin } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { connect, replaceConnectionToken, sync } from "@/lib/instagram";
import Link from "next/link";
import { RefreshCw, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

async function go(formData: FormData) {
  "use server";
  await admin();
  try {
    await sync(String(formData.get("id")));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    redirect("/admin/instagram?error=" + encodeURIComponent(message));
  }
  redirect("/admin/instagram?synced=1");
}

async function replaceToken(formData: FormData) {
  "use server";
  await admin();
  const id = String(formData.get("id") || "");
  const token = String(formData.get("token") || "").trim();
  if (!id || !token) redirect("/admin/instagram?error=" + encodeURIComponent("A connection and access token are required."));
  try {
    await replaceConnectionToken(id, token);
    await sync(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not replace the Instagram access token.";
    redirect("/admin/instagram?error=" + encodeURIComponent(message));
  }
  redirect("/admin/instagram?updated=1");
}

async function addToken(formData: FormData) {
  "use server";
  await admin();

  const token = String(formData.get("token") || "").trim();
  const sellerEmail = String(formData.get("sellerEmail") || "").trim().toLowerCase();

  if (!token) {
    redirect("/admin/instagram?error=" + encodeURIComponent("Paste an Instagram access token."));
  }

  try {
    const seller = sellerEmail
      ? await db().user.findUnique({ where: { email: sellerEmail } })
      : null;

    if (sellerEmail && !seller) {
      throw new Error("No marketplace user was found with that email.");
    }

    const connection = await connect(token, seller?.id);
    await sync(connection.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save Instagram connection.";
    redirect("/admin/instagram?error=" + encodeURIComponent(message));
  }

  redirect("/admin/instagram?connected=1");
}

export default async function IG({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    synced?: string;
    connected?: string;
    updated?: string;
  }>;
}) {
  try {
    await admin();
  } catch {
    redirect("/login");
  }

  const query = await searchParams;
  const connections = await db().instagramConnection.findMany({
    include: {
      posts: {
        where: { isProduct: true },
        select: { id: true },
      },
      connectedBy: {
        select: { email: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="shell py-12">
      <Link href="/admin">← Admin</Link>

      <div className="mt-7 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#888]">
          Instagram connections
        </p>
        <h1 className="mt-2 text-4xl font-black">
          Connected seller accounts
        </h1>
        <p className="mt-4 text-sm leading-7 text-[#666]">
          Each store can have multiple Instagram connections. Add the access token for each connection below; tokens are encrypted in Neon and are never exposed to sellers. The token is validated
          against Instagram, encrypted on the server, and saved in Neon. Once
          saved, the marketplace can sync that account without asking the seller
          to paste the token again.
        </p>
      </div>

      {query.error && (
        <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {query.error}
        </p>
      )}

      {query.synced && (
        <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700">
          Instagram posts synced.
        </p>
      )}

      {query.connected && <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700">Instagram account connected, token encrypted, and posts imported.</p>}
      {query.updated && <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700">Connection token replaced, encrypted, and posts re-synced.</p>}

      <div className="card mt-7 max-w-3xl p-7">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-green-50 p-2 text-green-700">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-lg font-black">Add Instagram account manually</h2>
            <p className="mt-2 text-sm leading-6 text-[#666]">
              Paste the access token generated for this Instagram account. The
              server will first call Instagram to identify the account, then
              encrypt and save the token in the database.
            </p>
          </div>
        </div>

        <form action={addToken} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold">Instagram access token</label>
            <input
              name="token"
              type="password"
              required
              autoComplete="off"
              placeholder="Paste the long-lived Instagram access token"
              className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-black"
            />
            <p className="mt-2 text-xs leading-5 text-[#888]">
              Never put this token in GitHub, frontend code, or a public env
              variable. It is encrypted before it is stored.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Marketplace seller email <span className="font-normal text-[#999]">(optional)</span>
            </label>
            <input
              name="sellerEmail"
              type="email"
              autoComplete="off"
              placeholder="seller@example.com"
              className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-black"
            />
            <p className="mt-2 text-xs leading-5 text-[#888]">
              If supplied, this connection is attached to that marketplace
              account. Leave it empty for an admin-managed Instagram account.
            </p>
          </div>

          <button className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">
            Save & import Instagram account
          </button>
        </form>

        <div className="mt-6 rounded-2xl bg-[#f7f7f5] p-4 text-xs leading-5 text-[#666]">
          <b className="text-black">About “permanent” tokens:</b> the database
          connection is permanent until you replace or remove it, but Meta can
          expire, revoke, or invalidate an access token. If that happens, add
          the new token here.
        </div>
      </div>

      <div className="card mt-7 max-w-3xl p-7">
        <h2 className="text-lg font-black">Meta app configuration</h2>
        <p className="mt-2 text-sm leading-6 text-[#666]">
          Set <b>INSTAGRAM_APP_ID</b>, <b>INSTAGRAM_APP_SECRET</b>, and{" "}
          <b>INSTAGRAM_REDIRECT_URI</b> in Vercel. The App Secret stays
          server-side.
        </p>
        <p className="mt-4 rounded-xl bg-[#f7f7f5] p-4 text-xs leading-5 text-[#666]">
          Redirect URI: <code>/api/instagram/callback</code>
        </p>
      </div>

      <h2 className="mt-12 text-2xl font-black">Connected stores</h2>

      <div className="mt-5 space-y-3">
        {connections.map((connection) => (
          <div
            key={connection.id}
            className="card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-[#eee]">
                {connection.profileImageUrl && (
                  <img
                    src={connection.profileImageUrl}
                    className="h-full w-full object-cover"
                    alt=""
                  />
                )}
              </div>

              <div>
                <b>@{connection.username}</b>
                <p className="text-xs text-[#888]">
                  {connection.posts.length} products ·{" "}
                  {connection.connectedBy?.name ||
                    connection.connectedBy?.email ||
                    "admin-managed"}{" "}
                  · {connection.lastSyncedAt ? "synced" : "never synced"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <form action={go}>
                <input type="hidden" name="id" value={connection.id} />
                <button className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
                  <RefreshCw size={14} />
                  Sync posts
                </button>
              </form>
              <form action={replaceToken} className="flex w-full max-w-sm gap-2">
                <input type="hidden" name="id" value={connection.id} />
                <input name="token" type="password" required autoComplete="off" placeholder="Replace access token" className="min-w-0 flex-1 rounded-full border px-4 py-2 text-xs outline-none focus:border-black" />
                <button className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">Save token</button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-[#f7f7f5] p-6 text-sm leading-6 text-[#666]">
        <b className="text-black">How products work:</b> there is no separate
        seller product upload. Each Instagram post imported from a connected
        account is automatically represented as a marketplace product, with
        its image/video, caption, Instagram likes/comments, permalink, and
        hashtags. Hashtags become marketplace categories.
      </div>
    </main>
  );
}
