import {db} from "@/lib/prisma";
import {ProductCard} from "@/components/product-card";
import Link from "next/link";
import {Instagram,ArrowRight} from "lucide-react";
export const dynamic="force-dynamic";
export default async function Home(){
 const p=db();
 const products=await p.instagramPost.findMany({where:{isProduct:true},include:{connection:true,tags:true,likes:true},orderBy:{timestamp:"desc"},take:8});
 return <main>
  <section className="bg-[#f7f7f5] border-b border-[#eee]"><div className="shell grid min-h-[560px] items-center gap-10 py-16 md:grid-cols-2">
   <div><span className="inline-flex items-center gap-2 rounded-full border border-[#ddd] bg-white px-4 py-2 text-xs font-semibold"><Instagram size={14}/> Connected Instagram stores</span>
   <h1 className="mt-7 text-5xl font-black leading-[.94] tracking-[-.065em] sm:text-7xl">Shop what Instagram is <span className="text-[#777]">already talking about.</span></h1>
   <p className="mt-7 max-w-xl text-lg leading-8 text-[#666]">Approved Instagram accounts become stores. Posts tagged <b>#InstagramMarket</b> become products, while other hashtags become categories shoppers can browse.</p>
   <div className="mt-8 flex gap-3"><Link href="/products" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">Explore products <ArrowRight className="ml-1 inline" size={15}/></Link><Link href="/how-it-works" className="rounded-full border border-[#ddd] bg-white px-6 py-3 text-sm font-semibold">How it works</Link></div></div>
   <div className="rounded-[32px] bg-black p-8 text-white sm:p-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-white/40">The marketplace loop</p><div className="mt-8 space-y-7">{[["01","Connect","A seller requests an Instagram store by username."],["02","Review","Admin reviews the request and approves access."],["03","Discover","Posts with #InstagramMarket become searchable products."]].map(x=><div className="flex gap-5" key={x[0]}><span className="text-xs text-white/40">{x[0]}</span><div><b>{x[1]}</b><p className="mt-1 text-sm leading-6 text-white/55">{x[2]}</p></div></div>)}</div></div>
  </div></section>
  <section className="shell py-16"><div className="flex justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#888]">Fresh</p><h2 className="mt-2 text-3xl font-black">Latest products</h2></div><Link href="/products" className="text-sm font-semibold">View all →</Link></div><div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-6">{products.map(x=><ProductCard key={x.id} p={x}/>)}</div>{!products.length&&<div className="card mt-8 p-10 text-center"><h3 className="text-xl font-bold">Marketplace ready.</h3><p className="mt-2 text-sm text-[#777]">Connect an Instagram account in Admin and sync its posts.</p></div>}</section>
 </main>;
}