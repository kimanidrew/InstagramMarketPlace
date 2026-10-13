"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, ChevronRight, Inbox, MessageCircle, ShieldCheck } from "lucide-react";

type NotificationItem = { id:string; type:string; title:string; message:string; href:string|null; readAt:string|null; createdAt:string };
type Payload = { notifications:NotificationItem[]; unreadCount:number };
function relativeTime(value:string) {
  const seconds=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/1000));
  if(seconds<60)return "Just now";
  if(seconds<3600)return Math.floor(seconds/60)+"m ago";
  if(seconds<86400)return Math.floor(seconds/3600)+"h ago";
  if(seconds<604800)return Math.floor(seconds/86400)+"d ago";
  return new Date(value).toLocaleDateString(undefined,{month:"short",day:"numeric"});
}
function NoticeIcon({type}:{type:string}) {
  const isReview = type.startsWith("STORE_REVIEW");
  return <span className="notification-item-icon">{isReview ? <MessageCircle size={17}/> : type.includes("APPROVED") ? <Check size={17}/> : type.includes("REJECTED") ? <ShieldCheck size={17}/> : <Bell size={17}/>}</span>;
}
function EmptyNotifications() {
  return <div className="notification-empty"><span className="notification-empty-icon"><Inbox size={22}/></span><strong>You’re all caught up</strong><span>Important shop updates and account activity will appear here.</span></div>;
}
export function NotificationBell({userId}:{userId:string}) {
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [payload,setPayload]=useState<Payload>({notifications:[],unreadCount:0});
  const [loading,setLoading]=useState(false);
  const load=useCallback(async()=>{setLoading(true);try{const r=await fetch("/api/notifications?limit=8",{cache:"no-store"});if(r.ok)setPayload(await r.json());}catch{}finally{setLoading(false)}},[]);
  useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),30000);return()=>window.clearInterval(timer)},[load,userId]);
  useEffect(()=>{if(!open)return;const close=(event:MouseEvent)=>{const target=event.target as HTMLElement;if(!target.closest(".notification-bell-wrap"))setOpen(false)};const key=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};document.addEventListener("mousedown",close);document.addEventListener("keydown",key);return()=>{document.removeEventListener("mousedown",close);document.removeEventListener("keydown",key)}},[open]);
  const markAll=async()=>{const r=await fetch("/api/notifications",{method:"POST"});if(r.ok)setPayload(p=>({...p,unreadCount:0,notifications:p.notifications.map(n=>({...n,readAt:n.readAt||new Date().toISOString()}))}))};
  const openNotice=async(n:NotificationItem)=>{if(!n.readAt){const r=await fetch("/api/notifications/"+encodeURIComponent(n.id),{method:"POST"});if(r.ok)setPayload(p=>({...p,unreadCount:Math.max(0,p.unreadCount-1),notifications:p.notifications.map(x=>x.id===n.id?{...x,readAt:new Date().toISOString()}:x)}))}setOpen(false);router.push(n.href||"/notifications")};
  return <div className="notification-bell-wrap">
    <button className="notification-bell" type="button" aria-label={payload.unreadCount?payload.unreadCount+" unread notifications":"Notifications"} aria-expanded={open} onClick={()=>{setOpen(v=>!v);if(!open)void load()}}>
      <Bell size={19}/>{payload.unreadCount>0&&<span className="notification-bell-count">{payload.unreadCount>99?"99+":payload.unreadCount}</span>}
    </button>
    {open&&<section className="notification-popover" aria-label="Notifications">
      <header className="notification-popover-head"><div><small>Your updates</small><h3>Notifications</h3><span className="notification-unread-summary"><i/>{payload.unreadCount?payload.unreadCount+" unread":"You're up to date"}</span></div><button className="notification-mark-all" type="button" onClick={()=>void markAll()} disabled={!payload.unreadCount}>Mark all read</button></header>
      <div className="notification-items">{loading&&payload.notifications.length===0?<div className="notification-loading">Loading your notifications…</div>:payload.notifications.length===0?<EmptyNotifications/>:payload.notifications.map(n=><button type="button" key={n.id} className={"notification-item "+(!n.readAt?"unread":"")} onClick={()=>void openNotice(n)}><NoticeIcon type={n.type}/><span className="notification-item-copy"><strong>{n.title}</strong><span>{n.message}</span><time>{relativeTime(n.createdAt)}</time></span><i className={"notification-item-status "+(n.readAt?"read":"")} aria-label={n.readAt?"Read":"Unread"}/></button>)}</div>
      <footer className="notification-popover-foot"><span>Notifications are kept for 30 days</span><Link href="/notifications" onClick={()=>setOpen(false)}>View all <ChevronRight size={15}/></Link></footer>
    </section>}
  </div>;
}
export function NotificationsPageClient() {
  const router=useRouter();
  const [payload,setPayload]=useState<Payload>({notifications:[],unreadCount:0});
  const [loading,setLoading]=useState(true);
  const load=useCallback(async()=>{try{const r=await fetch("/api/notifications?all=1",{cache:"no-store"});if(r.ok)setPayload(await r.json())}finally{setLoading(false)}},[]);
  useEffect(()=>{void load()},[load]);
  const markAll=async()=>{const r=await fetch("/api/notifications",{method:"POST"});if(r.ok){setPayload(p=>({...p,unreadCount:0,notifications:p.notifications.map(n=>({...n,readAt:n.readAt||new Date().toISOString()}))}))}};
  const markOne=async(n:NotificationItem)=>{if(n.readAt)return;const r=await fetch("/api/notifications/"+encodeURIComponent(n.id),{method:"POST"});if(r.ok)setPayload(p=>({...p,unreadCount:Math.max(0,p.unreadCount-1),notifications:p.notifications.map(x=>x.id===n.id?{...x,readAt:new Date().toISOString()}:x)}))};
  return <main className="notification-page"><div className="shell"><header className="notification-page-header"><div><span className="notification-page-kicker">YOUR ACCOUNT</span><h1>Notifications</h1><p>Shop approvals, account updates and growth request decisions — all in one place.</p></div><div className="notification-page-actions"><Link href="/account">Back to account</Link><button type="button" onClick={()=>void markAll()} disabled={!payload.unreadCount}><CheckCheck size={15}/> Mark all as read</button></div></header>
    <div className="notification-page-list">{loading?<div className="notification-loading">Loading your notifications…</div>:payload.notifications.length===0?<EmptyNotifications/>:payload.notifications.map(n=><Link href={n.href||"/notifications"} key={n.id} className={"notification-item "+(!n.readAt?"unread":"")} onClick={event=>{event.preventDefault();void markOne(n).finally(()=>router.push(n.href||"/notifications"))}}><NoticeIcon type={n.type}/><span className="notification-item-copy"><strong>{n.title}</strong><span>{n.message}</span><time>{relativeTime(n.createdAt)}</time></span><i className={"notification-item-status "+(n.readAt?"read":"")} aria-label={n.readAt?"Read":"Unread"}/></Link>)}</div>
  </div></main>;
}
