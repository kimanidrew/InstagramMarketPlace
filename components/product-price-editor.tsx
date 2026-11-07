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
  return <div className="mt-3 rounded-2xl border border-[#e8e8e8] bg-gradient-to-b from-white to-[#fafafa] p-3.5 shadow-[0_5px_18px_rgba(0,0,0,0.035)] sm:p-4">
    <div className="mb-3">
      <p className="text-[13px] font-extrabold tracking-[-0.01em] text-[#262626]">Set your selling price</p>
      <p className="mt-1 text-[11px] leading-[1.5] text-[#858585]">Choose a currency and enter the amount customers will see on this listing and in WhatsApp search.</p>
    </div>
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-2">
      <label className="min-w-0">
        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#777]">Currency</span>
        <select aria-label="Price currency" value={unit} onChange={event => setUnit(event.target.value)} className="h-11 w-full rounded-xl border border-[#e2e2e2] bg-white px-3 text-xs font-bold text-[#444] shadow-[0_1px_2px_rgba(0,0,0,0.025)] outline-none transition duration-200 hover:border-[#cfcfcf] focus:border-[#e04444] focus:ring-[3px] focus:ring-[#e04444]/10">
          <option value="KES">KES</option><option value="USD">USD</option>
        </select>
      </label>
      <label className="min-w-0">
        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#777]">Amount</span>
        <input aria-label="Product price" type="number" min="0.01" step="0.01" value={value} onChange={event => setValue(event.target.value)} placeholder="e.g. 2,500" className="h-11 w-full min-w-0 rounded-xl border border-[#e2e2e2] bg-white px-3 text-sm font-bold tabular-nums text-[#333] shadow-[0_1px_2px_rgba(0,0,0,0.025)] outline-none transition duration-200 hover:border-[#cfcfcf] placeholder:font-normal placeholder:text-[#b0b0b0] focus:border-[#e04444] focus:ring-[3px] focus:ring-[#e04444]/10" />
      </label>
    </div>
    <button type="button" onClick={save} disabled={busy} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ed4545] to-[#d92f36] px-4 text-xs font-extrabold tracking-[0.01em] text-white shadow-[0_5px_12px_rgba(217,47,54,0.2)] transition duration-200 hover:-translate-y-px hover:shadow-[0_7px_16px_rgba(217,47,54,0.25)] active:translate-y-0 active:shadow-sm disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0">
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {busy ? "Saving price..." : "Save selling price"}
    </button>
    <div className="mt-2.5 flex items-center justify-between gap-2">
      <p className="text-[10px] leading-4 text-[#929292]">You can update this price anytime.</p>
      <button type="button" onClick={() => { setValue(""); setMessage(""); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-[10px] font-bold text-[#858585] transition duration-200 hover:border-[#e7e7e7] hover:bg-white hover:text-[#444]">
        <X size={12} /> Clear
      </button>
    </div>
    {message && <p role="status" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#777]">{message.startsWith("Your price") && <Check size={13} />}{message}</p>}
  </div>;
}
