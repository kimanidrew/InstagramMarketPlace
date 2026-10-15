"use client";
import { useState } from "react";\nimport { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
export default function AdminGrowthActions({id}:{id:string}){
 const [busy,setBusy]=useState(false);
 async function act(status:"APPROVED"|"REJECTED"){setBusy(true);const r=await fetch("/api/admin/growth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});if(r.ok)window.location.reload();else setBusy(false);}
 return <div className="admin-growth-actions"><button disabled={busy} onClick={()=>act("APPROVED")}><Check size={13}/> Activate</button><button disabled={busy} onClick={()=>act("REJECTED")}><X size={13}/> Reject</button></div>;
}
