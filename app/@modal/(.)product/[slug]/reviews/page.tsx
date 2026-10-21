import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { ReviewModalClose } from "@/components/review-modal-close";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import { user } from "@/lib/auth";
import { ReviewSection } from "@/components/review-section";

export const dynamic = "force-dynamic";

export default async function ProductReviewsModal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const currentUser = await user();
  const database = db();
  const product = await database.instagramPost.findUnique({ where: { productSlug: slug } });
  if (!product || !product.isProduct) notFound();

  const [connection, reviews] = await Promise.all([
    database.instagramConnection.findUnique({
      where: { id: product.connectionId },
      select: { username: true, connectedByUserId: true, profileImageUrl: true },
    }),
    database.productReview.findMany({
      where: { postId: product.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!connection) notFound();

  return (
    <main className="review-product-page" role="dialog" aria-modal="true" aria-label="Product reviews">
      <Link href={"/product/" + slug} className="review-product-backdrop" aria-label="Close product reviews" />
      <section className="review-product-dialog">
        <ReviewModalClose href={"/product/" + slug} />
        <div className="review-product-dialog-inner">
          <div className="review-modal-heading">
            <span className="review-modal-heading-icon"><MessageCircle size={21} /></span>
            <div className="review-modal-heading-copy">
              <p className="review-modal-kicker">Product discussion</p>
              <h1>Reviews</h1>
              <p className="review-modal-product">{product.productTitle?.trim() || "Product"} · @{connection.username}</p>
            </div>
          </div>
          <ReviewSection type="product" presentation="page" targetId={product.id} reviews={reviews} currentUserId={currentUser?.id} title="Shopper reviews" storeUsername={connection.username} storeOwnerUserId={connection.connectedByUserId} storeProfileImageUrl={connection.profileImageUrl} hideWriteButton />
        </div>
      </section>
    </main>
  );
}
