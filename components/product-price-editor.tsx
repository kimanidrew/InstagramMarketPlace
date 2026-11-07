"use client";

import { useState } from "react";

export function ProductPriceEditor({ postId, amount, currency }: { postId: string; amount: number | null; currency: string | null }) {
  const [value, setValue] = useState(amount === null ? "" : String(amount));
  const [unit, setUnit] = useState(currency || "KES");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/products/" + encodeURIComponent(postId) + "/price", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, currency: unit }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not save the price.");
      setMessage("Price saved.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the price.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="mt-4 rounded-xl border border-dashed border-neutral-300 p-3">
    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Seller price</p>
    <div className="flex flex-wrap gap-2">
      <select aria-label="Price currency" value={unit} onChange={event => setUnit(event.target.value)} className="rounded-lg border px-2 py-2 text-sm">
        <option value="KES">KES</option><option value="USD">USD</option>
      </select>
      <input aria-label="Product price" type="number" min="0.01" step="0.01" value={value} onChange={event => setValue(event.target.value)} placeholder="Enter price" className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm" />
      <button type="button" onClick={save} disabled={busy} className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save price"}</button>
      <button type="button" onClick={() => { setValue(""); setMessage(""); }} className="rounded-lg border px-3 py-2 text-sm">Clear</button>
    </div>
    {message && <p role="status" className="mt-2 text-xs text-neutral-500">{message}</p>}
  </div>;
}
