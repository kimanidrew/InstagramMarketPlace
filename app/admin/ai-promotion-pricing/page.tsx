import { redirect } from "next/navigation";
import { admin } from "@/lib/auth";
import { AdminAiPromotionPricing } from "@/components/admin-ai-promotion-pricing";
export const dynamic = "force-dynamic";
export default async function AdminAiPromotionPricingPage() {
  try { await admin(); } catch { redirect("/login"); }
  return <AdminAiPromotionPricing />;
}
