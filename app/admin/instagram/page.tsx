import { admin } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { sync } from "@/lib/instagram";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

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

export default async function IG({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; synced?: string }>;
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
          Sellers authorize Instagram through your Meta app. Their access
          tokens are never pasted into the dashboard; the server encrypts each
          token and saves it in Neon. Instagram posts are automatically
          imported as marketplace products.
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
                    "seller"}{" "}
                  · {connection.lastSyncedAt ? "synced" : "never synced"}
                </p>
              </div>
            </div>

            <form action={go}>
              <input type="hidden" name="id" value={connection.id} />
              <button className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
                <RefreshCw size={14} />
                Sync posts
              </button>
            </form>
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
