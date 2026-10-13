import { redirect } from "next/navigation";
import { user } from "@/lib/auth";
import { NotificationsPageClient } from "@/components/notification-center";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const current = await user();
  if (!current) redirect("/login");
  return <NotificationsPageClient />;
}
