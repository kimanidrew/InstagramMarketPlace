import { db } from "@/lib/prisma";
import { user } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { ProductEditForm } from "@/components/product-edit-form";

export const dynamic = "force-dynamic";

export default async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const current = await user();
  if (!current) redirect("/login");
  const { id } = await params;
  const listing = await db().instagramPost.findUnique({ where: { id }, include: { connection: { select: { connectedByUserId: true, username: true } } } });
  if (!listing || !listing.isProduct) notFound();
  if (current.role !== "ADMIN" && listing.connection.connectedByUserId !== current.id) notFound();

  return <main className="min-h-screen bg-[#f7f7f5] px-4 py-8 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-2xl">
      <Link href={listing.listingType === "SERVICE" ? "/service/"+listing.productSlug : "/product/"+listing.productSlug} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#666] transition hover:text-black"><ArrowLeft size={16}/> Back to listing</Link>
      <section className="overflow-hidden rounded-[26px] border border-[#eaeae7] bg-white shadow-[0_14px_45px_rgba(0,0,0,0.045)]">
        <header className="border-b border-[#efefed] px-5 py-6 sm:px-8"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f0] text-[#dc3e3e]"><Pencil size={18}/></span><p className="mt-4 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#999]">SELLER TOOLS · @{listing.connection.username}</p><h1 className="mt-1 text-2xl font-black tracking-[-.04em] text-[#171717]">Edit {listing.listingType === "SERVICE" ? "service" : "product"}</h1><p className="mt-2 text-sm leading-6 text-[#777]">Keep your listing accurate and make it easy for shoppers to understand what you offer.</p></header>
        <div className="p-5 sm:p-8"><ProductEditForm listing={{id:listing.id,slug:listing.productSlug||"",type:listing.listingType,title:listing.productTitle||"",description:listing.caption||"",category:listing.category||"",subcategory:listing.subcategory||"",amount:listing.priceAmount===null?"":String(listing.priceAmount),currency:listing.priceCurrency||"KES",image:listing.thumbnailUrl||listing.mediaUrl}}/></div>
      </section>
    </div>
  </main>;
}
