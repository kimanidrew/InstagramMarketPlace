import { Products } from "@/app/products/page";

export const dynamic = "force-dynamic";

export default function TrendingPage() {
  return Products({ searchParams: Promise.resolve({ tab: "trending" }) });
}
