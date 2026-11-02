import ReelPage from "@/app/reel/[slug]/page";

export const dynamic = "force-dynamic";

export default async function ReelInterceptModal({ params }: { params: Promise<{ slug: string }> }) {
  return <ReelPage params={params} />;
}
