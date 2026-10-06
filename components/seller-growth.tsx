"use client";

import { useState } from "react";
import { BadgeCheck, BarChart3, Megaphone, Sparkles, Zap } from "lucide-react";

type Connection={id:string;username:string;verifiedAt?:string|null;proUntil?:string|null;posts:{id:string;productTitle:string|null}[]};
export function SellerGrowth({connections}:{connections:Connection[]}) {
  const [busy,setBusy]=useState("");
  const [message,setMessage]=useState("");
  async function request(type:"BOOST"|"VERIFIED"|"PRO",connectionId:string,postId?:string){
    setBusy(type+connectionId+(postId||""));setMessage("");
    const res=await fetch("/api/growth/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,connectionId,postId})});
    const data=await res.json();setMessage(res.ok?(type==="BOOST"?"Boost request sent.":"Upgrade request sent."):(data.error||"Something went wrong."));
    setBusy("");
  }
  if(!connections.length)return null;
  return <section className="seller-growth">
    <div className="seller-growth-head"><div><span className="seller-growth-kicker"><Sparkles size={13}/> Grow your shop</span><h2>Turn more attention into sales.</h2><p>Start free. Pay only when you want more reach, stronger trust or seller tools.</p></div><div className="seller-growth-mini"><BarChart3 size={18}/><span>Seller growth tools</span></div></div>
    {message&&<div className="seller-growth-message">{message}</div>}
    <div className="seller-growth-plans">
      <article className="seller-growth-card featured"><div className="seller-growth-icon"><Megaphone size={20}/></div><span className="seller-growth-price">From KSh 150</span><h3>Boost</h3><p>Put one product higher in discovery and give it extra visibility for 7 days.</p><ul><li>7-day product boost</li><li>Priority placement</li><li>Works with your existing Instagram posts</li></ul>{connections.map(c=><div key={c.id} className="seller-growth-product-list">{c.posts.slice(0,4).map(p=><button key={p.id} disabled={!!busy} onClick={()=>request("BOOST",c.id,p.id)}>{p.productTitle||"Untitled product"} <Zap size={13}/></button>)}</div>)}</article>
      <article className="seller-growth-card"><div className="seller-growth-icon"><BadgeCheck size={20}/></div><span className="seller-growth-price">KSh 999 / year</span><h3>Verified</h3><p>A visible trust signal for established businesses that pass your marketplace verification.</p><ul><li>Verified badge on your shop</li><li>Trust-focused seller profile</li><li>Verification review</li></ul>{connections.map(c=><button key={c.id} disabled={!!busy||!!c.verifiedAt} onClick={()=>request("VERIFIED",c.id)}>{c.verifiedAt?"Already verified":"Request verification"} <BadgeCheck size={13}/></button>)}</article>
      <article className="seller-growth-card"><div className="seller-growth-icon"><Sparkles size={20}/></div><span className="seller-growth-price">KSh 499 / month</span><h3>Pro Seller</h3><p>For sellers who want more control, visibility and insights as their shop grows.</p><ul><li>Pro seller badge</li><li>Seller analytics foundation</li><li>Priority growth features</li></ul>{connections.map(c=><button key={c.id} disabled={!!busy||!!c.proUntil&&new Date(c.proUntil)>new Date()} onClick={()=>request("PRO",c.id)}>{c.proUntil&&new Date(c.proUntil)>new Date()?"Pro is active":"Become a Pro Seller"} <Sparkles size={13}/></button>)}</article>
    </div>
  </section>;
}
