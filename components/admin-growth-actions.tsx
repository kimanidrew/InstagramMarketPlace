"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

export default function AdminGrowthActions({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function act(status: "APPROVED" | "REJECTED") {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/growth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update this growth request.");
      window.dispatchEvent(new CustomEvent("sokolink:feedback", {
        detail: {
          type: "success",
          title: status === "APPROVED" ? "Growth request activated" : "Growth request rejected",
          message: status === "APPROVED" ? "The growth request has been activated successfully." : "The growth request has been rejected successfully.",
        },
      }));
      router.refresh();
    } catch (error) {
      window.dispatchEvent(new CustomEvent("sokolink:feedback", {
        detail: {
          type: "error",
          title: "Could not update growth request",
          message: error instanceof Error ? error.message : "Please try again.",
        },
      }));
    } finally {
      setBusy(false);
    }
  }

  return <div className="admin-growth-actions">
    <button disabled={busy} onClick={() => void act("APPROVED")}><Check size={13}/> Activate</button>
    <button disabled={busy} onClick={() => void act("REJECTED")}><X size={13}/> Reject</button>
  </div>;
}
