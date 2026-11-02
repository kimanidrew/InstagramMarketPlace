import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import { ReelViewer } from "@/components/reel-viewer";

export const dynamic = "force-dynamic";

export default async function ReelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const current = await db().instagramPost.findUnique({ where: { productSlug: slug }, select: { id: true, connectionId: true, isProduct: true } });
  if (!current || !current.isProduct) notFound();
  const items = await db().instagramPost.findMany({
    where: { isProduct: true, mediaType: "VIDEO", mediaUrl: { not: null } },
    select: { id: true, productSlug: true, productTitle: true, mediaUrl: true, thumbnailUrl: true, listingType: true, connection: { select: { username: true, profileImageUrl: true } } },
    orderBy: [{ timestamp: "desc" }, { createdAt: "desc" }],
    take: 60,
  });
  if (!items.some(item => item.id === current.id)) notFound();
  return <ReelViewer reels={JSON.parse(JSON.stringify(items))} initialId={current.id} />;
}
