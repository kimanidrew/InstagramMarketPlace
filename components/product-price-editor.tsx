"use client";

import { useState } from "react";
import { Check, Loader2, Save, X } from "lucide-react";

export function ProductPriceEditor({ postId, amount, currency }: { postId: string; amount: number | null; currency: string | null }) {
  const [value, setValue] = useState(amount === null ? "" : String(amount));
  const [unit, setUnit] = useState(currency || "KES");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    if (!value.trim() || !Number.isFinite(Number(value)) || Number(value) <= 0) {
      setMessage("Enter a price greater than zero.");
      return;
    }
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
      setMessage("Your price has been saved.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the price.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="mt-2 rounded-xl border border-[#e9e9e9] bg-[#fafafa] p-3">
    <div className="mb-3">
      <p className="text-xs font-bold tracking-[0.01em] text-[#333]">Set your selling price</p>
      <p className="mt-1 text-[11px] leading-[1.45] text-[#858585]">Choose a currency and enter the amount customers will see on this listing and in WhatsApp search.</p>
    </div>
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-2">
      <label className="min-w-0">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-[#888]">Currency</span>
        <select aria-label="Price currency" value={unit} onChange={event => setUnit(event.target.value)} className="h-10 w-full rounded-lg border border-[#e2e2e2] bg-white px-2 text-xs font-semibold text-[#555] outline-none transition focus:border-[#e53935] focus:ring-2 focus:ring-[#e53935]/10">
          <option value="KES">KES</option><option value="USD">USD</option>
        </select>
      </label>
      <label className="min-w-0">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-[#888]">Amount</span>
        <input aria-label="Product price" type="number" min="0.01" step="0.01" value={value} onChange={event => setValue(event.target.value)} placeholder="e.g. 2,500" className="h-10 w-full min-w-0 rounded-lg border border-[#e2e2e2] bg-white px-3 text-sm font-semibold text-[#444] outline-none transition placeholder:font-normal placeholder:text-[#b0b0b0] focus:border-[#e53935] focus:ring-2 focus:ring-[#e53935]/10" />
      </label>
    </div>
    <button type="button" onClick={save} disabled={busy} className="mt-2.5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#e53935] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#c92d2a] disabled:cursor-not-allowed disabled:opacity-55">
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {busy ? "Saving price..." : "Save selling price"}
    </button>
    <div className="mt-2 flex items-center justify-between gap-2">
      <p className="text-[10px] leading-4 text-[#929292]">You can update this price anytime.</p>
      <button type="button" onClick={() => { setValue(""); setMessage(""); }} className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[#858585] transition hover:bg-white hover:text-[#444]">
        <X size={12} /> Clear
      </button>
    </div>
    {message && <p role="status" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#777]">{message.startsWith("Your price") && <Check size={13} />}{message}</p>}
  </div>;
}
