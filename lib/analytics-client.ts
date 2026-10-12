"use client";

export function analyticsVisitorId() {
  try {
    const key = "imarket_analytics_visitor";
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      window.localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export function recordAnalytics(input: { connectionId: string; postId?: string | null; type: "IMPRESSION" | "VIEW" | "CLICK" }) {
  if (typeof window === "undefined" || !input.connectionId) return;
  const payload = { ...input, visitorId: analyticsVisitorId() };
  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}
