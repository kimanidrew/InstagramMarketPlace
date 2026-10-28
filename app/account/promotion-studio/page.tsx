import { redirect } from "next/navigation";
import Link from "next/link";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { PromotionStudio } from "@/components/promotion-studio";
export const dynamic = "force-dynamic";
export default async function PromotionStudioPage() {
 const current=await user(); if(!current) redirect("/login");
 const shops=await db().instagramConnection.findMany({where:{connectedByUserId:current.id},orderBy:{createdAt:"desc"},include:{posts:{where:{isProduct:true,OR:[{mediaUrl:{not:null}},{thumbnailUrl:{not:null}}]},select:{id:true,productTitle:true,mediaUrl:true,thumbnailUrl:true}}}});
 const projects=await db().aiPromotionProject.findMany({where:{userId:current.id},orderBy:{createdAt:"desc"},take:12,include:{connection:{select:{username:true}},post:{select:{productTitle:true}},assets:{where:{type:"VIDEO"},take:1,select:{id:true}}}});
 return <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6"><Link href="/account/analytics?tab=product-promotion" className="text-sm text-neutral-600">← Seller Growth Studio</Link><header className="my-7"><p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">SokoLink AI</p><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Promotion Studio</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">Create a vertical promotion brief for a product or your whole shop, then track rendering status.</p></header><PromotionStudio shops={shops.map(s=>({id:s.id,username:s.username,products:s.posts.map(p=>({id:p.id,title:p.productTitle||"Untitled product",image:p.thumbnailUrl||p.mediaUrl}))}))} history={projects.map(p=>({id:p.id,title:p.title,shop:p.connection.username,product:p.post?.productTitle||null,scope:p.scope,mode:p.mode,duration:p.durationSeconds,status:p.status,createdAt:p.createdAt.toISOString(),videoReady:p.assets.length>0}))}/></main>;
}