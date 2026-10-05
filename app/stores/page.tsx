import { db } from "@/lib/prisma";
import Link from "next/link";
import { filterAvailableInstagramMedia } from "@/lib/instagram-media";

export const dynamic = "force-dynamic";

export default async function Stores() {
  const stores = await db().instagramConnection.findMany({
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
    orderBy: {
      username: "asc",
    },
  });

  const availableStores = (
    await Promise.all(
      stores.map(async (store) => ({
        store,
        posts: await filterAvailableInstagramMedia(store.posts),
      })),
    )
  ).filter(({ posts }) => posts.length > 0);

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
                <b>@{store.username}</b>
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
