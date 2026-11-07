"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function InstagramSyncButton({ connectionId, label = "Sync now" }: { connectionId: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function run() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/instagram/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not sync this shop.");
      setMessage("Synced " + Number(result.products || 0) + " posts.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sync this shop.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="flex flex-col items-start gap-1">
    <button type="button" onClick={run} disabled={busy} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm disabled:opacity-50">
      <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> {busy ? "Syncing…" : label}
    </button>
    {message && <span role="status" className="max-w-64 text-xs text-neutral-500">{message}</span>}
  </div>;
}
