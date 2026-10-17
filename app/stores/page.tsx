import { db } from "@/lib/prisma";
import { StoreDirectory } from "@/components/store-directory";
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
          thumbnailUrl: true,
          productTitle: true,
          productSlug: true,
          category: true,
          subcategory: true,
          mediaType: true,
          listingType: true,
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

  const directoryStores = availableStores.map(({ store, posts, promoted, activeVerified, activePro }) => ({
    store: {
      id: store.id,
      username: store.username,
      biography: store.biography,
      profileImageUrl: store.profileImageUrl,
      verifiedAt: store.verifiedAt,
      verifiedUntil: store.verifiedUntil,
      proUntil: store.proUntil,
      paidPromotionActive: promoted,
    },
    posts,
    promoted,
    activeVerified,
    activePro,
  }));

  return (
    <main className="shell store-directory-page">
      <StoreDirectory stores={JSON.parse(JSON.stringify(directoryStores))} />
    </main>
  );
}
