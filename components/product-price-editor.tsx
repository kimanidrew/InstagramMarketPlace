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
  return <div className="mt-2 rounded-xl border border-[#e7e7e7] bg-[#f7f7f7] p-3">
    <div className="mb-2">
      <p className="text-xs font-bold text-[#333]">Set your selling price</p>
      <p className="mt-0.5 text-[11px] leading-4 text-[#858585]">Add or update the price customers will see on this listing and in WhatsApp search results.</p>
    </div>
    <div className="flex items-stretch gap-2">
      <select aria-label="Price currency" value={unit} onChange={event => setUnit(event.target.value)} className="w-[76px] shrink-0 rounded-lg border border-[#dedede] bg-white px-2 text-xs font-semibold text-[#555] outline-none transition focus:border-[#e53935] focus:ring-2 focus:ring-[#e53935]/10">
        <option value="KES">KES</option><option value="USD">USD</option>
      </select>
      <input aria-label="Product price" type="number" min="0.01" step="0.01" value={value} onChange={event => setValue(event.target.value)} placeholder="Enter amount" className="min-w-0 flex-1 rounded-lg border border-[#dedede] bg-white px-3 py-2 text-sm font-semibold text-[#555] outline-none transition placeholder:font-normal placeholder:text-[#aaa] focus:border-[#e53935] focus:ring-2 focus:ring-[#e53935]/10" />
      <button type="button" onClick={save} disabled={busy} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#e53935] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#c92d2a] disabled:cursor-not-allowed disabled:opacity-55">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {busy ? "Saving" : "Save"}
      </button>
    </div>
    <div className="mt-2 flex items-center justify-between gap-2">
      <p className="text-[10px] leading-4 text-[#929292]">You can change this price anytime.</p>
      <button type="button" onClick={() => { setValue(""); setMessage(""); }} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[#858585] transition hover:bg-white hover:text-[#444]">
        <X size={12} /> Clear
      </button>
    </div>
    {message && <p role="status" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#777]">{message.startsWith("Your price") && <Check size={13} />}{message}</p>}
  </div>;
}
