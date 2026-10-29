import { redirect } from "next/navigation";
import { ArrowRight, Clock3 } from "lucide-react";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { PromotionStudio } from "@/components/promotion-studio";
export const dynamic = "force-dynamic";
export default async function PromotionStudioPage() {
 const current=await user(); if(!current) redirect("/login");
 const shops=await db().instagramConnection.findMany({where:{connectedByUserId:current.id},orderBy:{createdAt:"desc"},include:{posts:{where:{isProduct:true,OR:[{mediaUrl:{not:null}},{thumbnailUrl:{not:null}}]},select:{id:true,productTitle:true,mediaUrl:true,thumbnailUrl:true}}}});
 return <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
  <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
   <div><p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Seller tools</p><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Promotion Studio</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">Create a video promotion in four simple steps. Choose what to feature, customize your video, and generate your promotion.</p></div>
   <a href="/account/promotion-studio/projects" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold shadow-sm transition hover:border-neutral-400"><Clock3 size={17}/> Recent projects <ArrowRight size={16}/></a>
  </header>
  <PromotionStudio skipPayment={process.env.AI_PROMOTIONS_SKIP_PAYMENT !== "false"} shops={shops.map(s=>({id:s.id,username:s.username,profileImageUrl:s.profileImageUrl||null,products:s.posts.map(p=>({id:p.id,title:p.productTitle||"Untitled product",image:p.thumbnailUrl||p.mediaUrl}))}))}/>
 </main>;
}