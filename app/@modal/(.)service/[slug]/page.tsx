import ServicePage from "@/app/service/[slug]/page";
import { FullscreenListingModal } from "@/components/fullscreen-listing-modal";

export const dynamic = "force-dynamic";

export default async function ServiceInterceptModal({ params }: { params: Promise<{ slug: string }> }) {
  return <FullscreenListingModal label="Service details"><ServicePage params={params} /></FullscreenListingModal>;
}
