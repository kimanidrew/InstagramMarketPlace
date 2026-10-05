import { user, logout } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CheckCircle2, Instagram, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

async function out() {
  "use server";
  await logout();
  redirect("/");
}

export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ instagram?: string; instagram_error?: string; requested?: string; error?: string }>;
}) {
  const u = await user();
  if (!u) redirect("/");

  const q = await searchParams;
  const [rs, connections] = await Promise.all([
    db().storeRequest.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" } }),
    db().instagramConnection.findMany({
      where: { connectedByUserId: u.id },
      include: { posts: { where: { isProduct: true }, select: { id: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="shell py-14">
      <div className="flex justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#888]">Account</p>
          <h1 className="mt-2 text-4xl font-black">{u.name}</h1>
          <p className="text-sm text-[#777]">{u.email}</p>
        </div>
        <form action={out}><button className="rounded-full border px-4 py-2 text-sm">Sign out</button></form>
      </div>

      <section className="card mt-10 p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">Your Instagram shops</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666]">
              Register multiple Instagram Business shops under one marketplace account. Each approved Instagram account becomes its own shop and its posts become products automatically.
            </p>
          </div>
          <span className="w-fit rounded-full bg-[#f7f7f5] px-4 py-2 text-xs font-semibold">
            {rs.length} {rs.length === 1 ? "shop" : "shops"} registered
          </span>
        </div>

        {q.instagram === "connected" && <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700">Instagram shop connected and posts imported.</p>}
        {q.instagram_error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-600">{q.instagram_error}</p>}
        {q.error === "invalid" && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-600">Please enter a valid Instagram username.</p>}

        {rs.length > 0 ? (
          <div className="mt-6 space-y-4">
            {rs.map((request) => {
              const connection = connections.find((c) => c.username.toLowerCase() === request.username.toLowerCase());
              return (
                <div key={request.id} className="rounded-2xl border p-5">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.14em] text-[#999]">Instagram shop</p>
                      <b className="mt-1 block text-lg">@{request.username}</b>
                      <p className="mt-1 text-xs text-[#888]">
                        {connection ? connection.posts.length + " products imported" : "Instagram connection not completed yet"}
                      </p>
                    </div>
                    <span className={"inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold " + (connection ? "bg-green-50 text-green-700" : request.status === "APPROVED" ? "bg-green-50 text-green-700" : request.status === "REJECTED" ? "bg-red-50 text-red-600" : "bg-[#f7f7f5] text-[#666]")}>
                      {request.status === "APPROVED" && <CheckCircle2 size={16} />}
                      {connection ? "Connected" : request.status}
                    </span>
                  </div>

                  {request.status === "APPROVED" && !connection && (
                    <div className="mt-5 rounded-2xl bg-[#f7f7f5] p-5">
                      <p className="text-sm font-bold">Connect this shop</p>
                      <p className="mt-2 text-sm leading-6 text-[#666]">
                        Authorize @{request.username} through Instagram. You do not need to generate or paste an access token.
                      </p>
                      <a href={"/api/instagram/connect?requestId=" + encodeURIComponent(request.id)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
                        <Instagram size={16} /> Connect Instagram
                      </a>
                    </div>
                  )}

                  {request.status === "PENDING" && <p className="mt-4 text-sm text-[#777]">Waiting for marketplace admin approval. You can register other shops while this request is being reviewed.</p>}
                  {request.status === "REJECTED" && <p className="mt-4 text-sm text-[#777]">This shop request was rejected. You can submit another shop request below.</p>}
                  {connection && <div className="mt-5 rounded-2xl bg-green-50 p-5 text-sm text-green-800">This shop is connected and its Instagram posts are being used as marketplace products.</div>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-[#f7f7f5] p-5 text-sm text-[#666]">
            You have not registered a shop yet. Register your first Instagram shop below.
          </div>
        )}
      </section>

      <section className="card mt-8 p-7">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-black p-2 text-white"><Plus size={17} /></div>
          <div>
            <h2 className="text-xl font-black">Register another shop</h2>
            <p className="text-sm text-[#777]">Add another Instagram Business username to this same account.</p>
          </div>
        </div>
        <form action="/api/store-requests" method="post" className="mt-5 flex max-w-xl gap-2">
          <input name="username" required placeholder="@shopname" className="min-w-0 flex-1 rounded-full border px-5 py-3" />
          <button className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">Add shop</button>
        </form>
      </section>
    </main>
  );
}