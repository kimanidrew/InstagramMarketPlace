import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { PromotionProjects } from "@/components/promotion-studio";
export const dynamic = "force-dynamic";
export default async function PromotionProjectsPage() {
 const current=await user(); if(!current) redirect("/login");
 const [shops, projects]=await Promise.all([
  db().instagramConnection.findMany({where:{connectedByUserId:current.id},orderBy:{createdAt:"desc"},include:{posts:{where:{isProduct:true,OR:[{mediaUrl:{not:null}},{thumbnailUrl:{not:null}}]},select:{id:true,productTitle:true,mediaUrl:true,thumbnailUrl:true}}}}),
  db().aiPromotionProject.findMany({where:{userId:current.id,status:{not:"ARCHIVED"}},orderBy:{createdAt:"desc"},take:50,include:{connection:{select:{username:true}},post:{select:{productTitle:true}},assets:{where:{type:"VIDEO"},take:1,select:{id:true,storageKey:true}},payments:{orderBy:{createdAt:"desc"},take:1,select:{status:true,amountKes:true,phoneNumber:true,receiptNumber:true,resultDescription:true}}}})
 ]);
 return <main className="mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
  <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
   <div><p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Seller tools</p><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Recent projects</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">Your promotion history, payment updates and completed videos in one place.</p></div>
   <a href="/account/promotion-studio" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold shadow-sm transition hover:border-neutral-400"><ArrowLeft size={16}/> Back to Promotion Studio</a>
  </header>
  <PromotionProjects shops={shops.map(s=>({id:s.id,username:s.username,profileImageUrl:s.profileImageUrl||null,products:s.posts.map(p=>({id:p.id,title:p.productTitle||"Untitled product",image:p.thumbnailUrl||p.mediaUrl}))}))} projects={projects.map(p=>({id:p.id,title:p.title,shop:p.connection.username,product:p.post?.productTitle||null,scope:p.scope,mode:p.mode,duration:p.durationSeconds,status:p.status,createdAt:p.createdAt.toISOString(),videoReady:p.assets.length>0,videoUrl:p.assets[0]?.storageKey||null,errorMessage:p.errorMessage||null,payment:p.payments[0]?{status:p.payments[0].status,amountKes:p.payments[0].amountKes,phoneNumber:p.payments[0].phoneNumber,receiptNumber:p.payments[0].receiptNumber,message:p.payments[0].resultDescription}:null}))}/>
 </main>;
}