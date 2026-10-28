"use client";
import { useEffect, useState } from "react";

type Config = {
  usdKesRate: number; marginPercent: number; fixedFeeKes: number; minPriceKes: number;
  override10SilentKes: number | null; override10AudioKes: number | null;
  override15SilentKes: number | null; override15AudioKes: number | null; enabled: boolean;
};
const defaults: Config = { usdKesRate: 130, marginPercent: 35, fixedFeeKes: 20, minPriceKes: 250, override10SilentKes: null, override10AudioKes: null, override15SilentKes: null, override15AudioKes: null, enabled: true };
const fields: {key: keyof Config; label: string; hint: string; nullable?: boolean}[] = [
  {key:"usdKesRate",label:"USD → KSh exchange rate",hint:"Used to convert estimated fal.ai provider cost."},
  {key:"marginPercent",label:"Profit margin (%)",hint:"Applied to provider cost before adding the operating fee."},
  {key:"fixedFeeKes",label:"Operating fee (KSh)",hint:"Added to the cost-plus amount."},
  {key:"minPriceKes",label:"Minimum selling price (KSh)",hint:"Minimum when no fixed override is set."},
  {key:"override10SilentKes",label:"10 seconds · silent override (KSh)",hint:"Leave blank for automatic cost-plus pricing.",nullable:true},
  {key:"override10AudioKes",label:"10 seconds · audio override (KSh)",hint:"Leave blank for automatic cost-plus pricing.",nullable:true},
  {key:"override15SilentKes",label:"15 seconds · silent override (KSh)",hint:"Leave blank for automatic cost-plus pricing.",nullable:true},
  {key:"override15AudioKes",label:"15 seconds · audio override (KSh)",hint:"Leave blank for automatic cost-plus pricing.",nullable:true},
];
export function AdminAiPromotionPricing() {
  const [config,setConfig]=useState<Config>(defaults);
  const [busy,setBusy]=useState(true);
  const [saving,setSaving]=useState(false);
  const [notice,setNotice]=useState("");
  useEffect(()=>{fetch("/api/admin/ai-promotion-pricing",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load pricing");setConfig({...defaults,...d.config});}).catch(e=>setNotice(e instanceof Error?e.message:"Could not load pricing")).finally(()=>setBusy(false));},[]);
  function change(key:keyof Config,value:string){setConfig(c=>({...c,[key]:value.trim()===""&&String(key).startsWith("override")?null:Number(value)}));}
  async function save(e:React.FormEvent){e.preventDefault();setSaving(true);setNotice("");try{const r=await fetch("/api/admin/ai-promotion-pricing",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(config)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not save");setConfig({...defaults,...d.config});setNotice("Pricing settings saved.");}catch(e){setNotice(e instanceof Error?e.message:"Could not save settings");}finally{setSaving(false);}}
  return <main className="mx-auto max-w-3xl px-4 py-8"><a href="/admin" className="text-sm text-neutral-500 underline">← Admin dashboard</a><h1 className="mt-4 text-3xl font-semibold">AI Promotion Pricing</h1><p className="mt-2 text-sm leading-6 text-neutral-600">Configure the selling price used before M-Pesa checkout. Automatic pricing is provider cost × exchange rate, plus margin and operating fee, rounded up to the nearest KSh 10. A fixed override takes precedence for that duration/audio combination.</p>
  {busy?<p className="mt-8 text-sm text-neutral-500">Loading pricing…</p>:<form onSubmit={save} className="mt-6 space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7">
    <label className="flex items-center justify-between gap-4 rounded-xl bg-neutral-50 p-4"><span><span className="block text-sm font-semibold">Accept new AI promotion payments</span><span className="mt-1 block text-xs text-neutral-500">Turn off to pause checkout while existing projects remain accessible.</span></span><input type="checkbox" checked={config.enabled} onChange={e=>setConfig(c=>({...c,enabled:e.target.checked}))} className="h-5 w-5 accent-black"/></label>
    <div className="grid gap-4 sm:grid-cols-2">{fields.map(f=><label key={f.key} className="block"><span className="block text-sm font-semibold">{f.label}</span><input type="number" min={0} step={f.key==="usdKesRate"||f.key==="marginPercent"?0.01:1} value={config[f.key]===null?"":String(config[f.key])} onChange={e=>change(f.key,e.target.value)} required={!f.nullable} className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"/><span className="mt-1 block text-xs text-neutral-500">{f.hint}</span></label>)}</div>
    {notice&&<p role="status" className="rounded-xl bg-neutral-100 p-3 text-sm">{notice}</p>}<button disabled={saving} className="w-full rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving?"Saving…":"Save pricing settings"}</button>
  </form>}<p className="mt-5 text-xs leading-5 text-neutral-500">A failed paid generation is flagged for refund review. Issue the M-Pesa refund through your approved business process, then record the refund reference in the payment reconciliation endpoint. Refunds are not automatically sent by this app.</p></main>;
}
