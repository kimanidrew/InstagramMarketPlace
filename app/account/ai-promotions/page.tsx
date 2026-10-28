import { redirect } from "next/navigation";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { AiPromotionStudio } from "@/components/ai-promotion-studio";

export const dynamic = "force-dynamic";

export default async function AiPromotionStudioPage() {
  const current = await user();
  if (!current) redirect("/login");

  const connections = await db().instagramConnection.findMany({
    where: { connectedByUserId: current.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, username: true, name: true, profileImageUrl: true,
      posts: {
        where: { isProduct: true, OR: [{ mediaUrl: { not: null } }, { thumbnailUrl: { not: null } }] },
        orderBy: { createdAt: "desc" },
        select: { id: true, productTitle: true, productSlug: true, thumbnailUrl: true, mediaUrl: true, mediaType: true },
      },
    },
  });

  const serialized = connections.map((connection) => ({
    id: connection.id,
    username: connection.username,
    name: connection.name,
    profileImageUrl: connection.profileImageUrl,
    products: connection.posts.map((post) => ({
      id: post.id,
      title: post.productTitle || "Untitled product",
      slug: post.productSlug,
      image: post.thumbnailUrl || post.mediaUrl,
      mediaType: post.mediaType,
    })),
  }));

  return <AiPromotionStudio connections={serialized} />;
}
