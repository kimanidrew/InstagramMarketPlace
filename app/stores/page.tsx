import { db } from "@/lib/prisma";
import Link from "next/link";
import { filterAvailableInstagramMedia } from "@/lib/instagram-media";
import { user } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Stores() {
  const currentUser = await user();
  const now = new Date();
  const [stores, activeStoreCampaigns, tastePosts] = await Promise.all([db().instagramConnection.findMany({
    include: {
      posts: {
        where: {
          isProduct: true,
          mediaUrl: { not: null },
        },
        select: {
          id: true,
          mediaUrl: true,
        },
      },
    },
    orderBy: [{ verifiedAt: "desc" }, { proUntil: "desc" }, { username: "asc" }],
  }), db().promotionCampaign.findMany({ where: { status: "ACTIVE", targetType: "STORE" }, select: { connectionId: true } }), currentUser ? db().instagramPost.findMany({ where: { isProduct: true, OR: [{ likes: { some: { userId: currentUser.id } } }, { wishlistItems: { some: { userId: currentUser.id } } }] }, select: { connectionId: true }, take: 200 }) : Promise.resolve([])]);

  const paidStoreIds = new Set(activeStoreCampaigns.map((campaign) => campaign.connectionId));
  const affinity = new Map<string, number>();
  for (const post of tastePosts) affinity.set(post.connectionId, (affinity.get(post.connectionId) || 0) + 1);
  const availableStores = (
    await Promise.all(
      stores.map(async (store) => ({
        store,
        posts: await filterAvailableInstagramMedia(store.posts),
        promoted: paidStoreIds.has(store.id),
        activePro: !!store.proUntil && store.proUntil > now,
        activeVerified: !!store.verifiedAt && (!store.verifiedUntil || store.verifiedUntil > now),
        personalAffinity: affinity.get(store.id) || 0,
      })),
    )
  ).filter(({ posts }) => posts.length > 0).sort((a, b) => Number(b.promoted) - Number(a.promoted) || Number(b.activeVerified) - Number(a.activeVerified) || Number(b.activePro) - Number(a.activePro) || b.personalAffinity - a.personalAffinity || a.store.username.localeCompare(b.store.username));

  return (
    <main className="shell py-16">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-[#888]">
        Stores
      </p>

      <h1 className="mt-3 text-5xl font-black tracking-[-.06em]">
        Find a shop by Instagram account.
      </h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {availableStores.map(({ store, posts }) => (
          <Link
            key={store.id}
            href={"/store/" + store.username}
            className="card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-[#eee]">
                {store.profileImageUrl && (
                  <img
                    src={store.profileImageUrl}
                    className="h-full w-full object-cover"
                    alt=""
                  />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2"><b>@{store.username}</b>{store.promoted && <span className="rounded-full bg-black px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white">Promoted</span>}{store.activeVerified && <span className="rounded-full border border-black/10 px-2 py-1 text-[9px] font-bold">Verified</span>}{store.activePro && <span className="rounded-full bg-[#f1e9ff] px-2 py-1 text-[9px] font-bold">Pro Seller</span>}</div>
                <p className="text-sm text-[#777]">
                  {posts.length} products
                </p>
              </div>
            </div>

            {store.biography && (
              <p className="mt-5 line-clamp-2 text-sm text-[#666]">
                {store.biography}
              </p>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
