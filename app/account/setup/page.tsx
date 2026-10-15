import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SellerSetupPage from "@/components/seller-setup-page";
import GlobalFeedbackTrigger from "@/components/global-feedback-trigger";
export const dynamic = "force-dynamic";
export default async function AccountSetup({searchParams}:{searchParams:Promise<{setup?:string;step?:string;error?:string}>}) {
 const u=await user(); if(!u) redirect("/"); const q=await searchParams;
 const requests=await db().storeRequest.findMany({where:{userId:u.id},orderBy:{createdAt:"desc"}});
 const request=q.setup?requests.find(r=>r.id===q.setup):undefined;
 const connection=request?await db().instagramConnection.findFirst({where:{connectedByUserId:u.id,username:{equals:request.username,mode:"insensitive"}},include:{posts:{where:{isProduct:true},select:{id:true}}}}):undefined;
 const requestedStep=Number(q.step|| (request?.status==="APPROVED"?3:request?.status==="PENDING"?2:1));
 const step=Math.min(4,Math.max(1,Number.isFinite(requestedStep)?requestedStep:1));
 const active=request||{id:"new",username:"new shop",status:"REJECTED" as const};
 return <><SellerSetupPage request={active} connection={connection?{username:connection.username,postsCount:connection.posts.length,profileImageUrl:connection.profileImageUrl}:undefined} initialStep={step}/>{q.error==="invalid"&&<GlobalFeedbackTrigger type="error" title="Invalid Instagram username" message="Please enter a valid Instagram username." />}</>;
}
