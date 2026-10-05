"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AccountLiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();
    const interval = window.setInterval(refresh, 1000);
    return () => window.clearInterval(interval);
  }, [router]);

  return null;
}
