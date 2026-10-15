"use client";

import { useEffect, useRef } from "react";
import { recordAnalytics } from "@/lib/analytics-client";

export function AnalyticsImpression({ connectionId, postId, onImpression }: { connectionId: string; postId?: string | null; onImpression?: () => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !connectionId || typeof IntersectionObserver === "undefined") return;
    let sent = false;
    const observer = new IntersectionObserver(entries => {
      if (!sent && entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.3)) {
        sent = true;
        recordAnalytics({ connectionId, postId, type: "IMPRESSION" });
        onImpression?.();
        observer.disconnect();
      }
    }, { threshold: [0.3] });
    observer.observe(element);
    return () => observer.disconnect();
  }, [connectionId, postId, onImpression]);
  return <span ref={ref} className="analytics-impression-anchor" aria-hidden="true" />;
}
