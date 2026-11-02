import ProductPage from "@/app/product/[slug]/page";
import { FullscreenListingModal } from "@/components/fullscreen-listing-modal";

export const dynamic = "force-dynamic";

export default async function ProductInterceptModal({ params }: { params: Promise<{ slug: string }> }) {
  return <FullscreenListingModal label="Product details"><ProductPage params={params} /></FullscreenListingModal>;
}
