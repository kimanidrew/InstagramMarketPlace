"use client";

import { useEffect } from "react";
import { recordAnalytics } from "@/lib/analytics-client";

export function AnalyticsTracker({ connectionId, postId, type = "VIEW" }: { connectionId: string; postId?: string | null; type?: "VIEW" | "CLICK" }) {
  useEffect(() => {
    recordAnalytics({ connectionId, postId, type });
  }, [connectionId, postId, type]);
  return null;
}
