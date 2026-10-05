"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

export default function AdminRemoveStore({
  requestId,
  username,
}: {
  requestId: string;
  username: string;
}) {
  const [removing, setRemoving] = useState(false);

  async function removeStore() {
    const confirmed = window.confirm(
      "Remove @" + username + " permanently? This will delete the store connection, all synced products, likes, tags, and this store request. This cannot be undone."
    );

    if (!confirmed) return;

    setRemoving(true);

    try {
      const response = await fetch("/api/admin/stores/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to remove the store.");
      }

      window.location.href = "/admin?removed=1";
    } catch (error) {
      setRemoving(false);
      window.alert(error instanceof Error ? error.message : "Unable to remove the store.");
    }
  }

  return (
    <button
      type="button"
      className="admin-remove-button"
      onClick={removeStore}
      disabled={removing}
      aria-label={"Remove @" + username}
    >
      {removing ? <Loader2 size={14} className="admin-remove-spinner" /> : <Trash2 size={14} />}
      {removing ? "Removing…" : "Remove store"}
    </button>
  );
}
