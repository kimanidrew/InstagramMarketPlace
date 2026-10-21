import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import { user } from "@/lib/auth";
import { ReviewSection } from "@/components/review-section";

export const dynamic = "force-dynamic";

export default async function ProductReviewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const currentUser = await user();
  const product = await db().instagramPost.findUnique({
    where: { productSlug: slug },
    include: {
      connection: { select: { username: true, connectedByUserId: true, profileImageUrl: true } },
      reviews: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product || !product.isProduct) notFound();

  return (
    <main className="min-h-screen bg-white">
      <div className="shell py-7 sm:py-10">
        <Link href={"/product/" + slug} className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#555] transition hover:text-black">
          <ArrowLeft size={16} /> Back to product
        </Link>
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-6 flex items-center gap-3 border-b border-[#ededed] pb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f4f1]"><MessageCircle size={21} /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#888]">Product discussion</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-.04em] text-black sm:text-3xl">Reviews</h1>
              <p className="mt-1 truncate text-sm text-[#777]">{product.productTitle?.trim() || "Product"} · @{product.connection.username}</p>
            </div>
          </div>
          <ReviewSection type="product" presentation="page" targetId={product.id} reviews={product.reviews} currentUserId={currentUser?.id} title="Shopper reviews" storeUsername={product.connection.username} storeOwnerUserId={product.connection.connectedByUserId} storeProfileImageUrl={product.connection.profileImageUrl} />
        </div>
      </div>
    </main>
  );
}
