"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ExternalLink, Instagram, X } from "lucide-react";

const guideImages = {
  register: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1200&q=85",
  review: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85",
  tester: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=85",
  connect: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85",
};

type Request = { id:string; username:string; status:"PENDING"|"APPROVED"|"REJECTED" };
type Connection = { username:string; postsCount:number };

function StepCard({ number,title,text,image,state,children }:{number:number;title:string;text:string;image:string;state:"done"|"active"|"locked";children?:React.ReactNode}){
  return <article className={"seller-step-card seller-step-"+state}>
    <div className="seller-step-media"><img src={image} alt="" /></div>
    <div className="seller-step-number">{state==="done"?<Check size={17}/>:number}</div>
    <div className="seller-step-body">
      <div className="seller-step-top"><span>{state==="done"?"DONE":state==="active"?"YOUR NEXT STEP":"COMING NEXT"}</span>{state==="active"&&<b>Step {number} of 4</b>}</div>
      <h2>{title}</h2><p className="seller-step-text">{text}</p>{children}
    </div>
  </article>
}

export default function SellerSetupModal({request,connection,initialStep=1}:{request:Request;connection?:Connection;initialStep?:number}){
  const connected=Boolean(connection);
  const currentStep=connected?4:request.status==="APPROVED"?3:request.status==="PENDING"?2:1;
  const step=Math.min(4,Math.max(1,initialStep));
  const visibleStep=step===4&&request.status==="APPROVED"&&!connected?4:Math.min(step,currentStep);
  const displayStep=visibleStep;
  const href=(n:number)=>"/account?setup="+encodeURIComponent(request.id)+"&step="+n;

  useEffect(()=>{
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=previous};
  },[]);

  return <div className="seller-setup-modal" role="dialog" aria-modal="true" aria-label={"Setup @"+request.username}>
    <div className="seller-setup-backdrop" />
    <div className="seller-setup-window">
      <div className="seller-setup-topbar">
        <div><span className="seller-setup-eyebrow">SHOP SETUP</span><b>@{request.username}</b></div>
        <Link href="/account" className="seller-setup-close" aria-label="Close setup"><X size={19}/></Link>
      </div>
      <div className="seller-setup-scroll">
        <div className="seller-setup-progress">
          <div className="seller-setup-progress-copy"><span>Setup progress</span><b>{connected?"Complete":"Step "+displayStep+" of 4"}</b></div>
          <div className="seller-setup-progress-line"><i style={{width:(connected?100:((displayStep-1)/3)*100)+"%"}} /></div>
          <div className="seller-setup-progress-steps">{[1,2,3,4].map(n=><span key={n} className={n<displayStep||connected?"done":n===displayStep?"active":""}>{n<currentStep||connected?<Check size={12}/>:n}</span>)}</div>
        </div>

        <div className="seller-stepper">
          {visibleStep===1&&<StepCard number={1} title="Tell us your Instagram username" text="First, tell us which Instagram account you want to turn into your shop. That's it — no product list needed." image={guideImages.register} state={currentStep>1?"done":"active"}>
            <form action="/api/store-requests" method="post" className="seller-form">
              <input type="hidden" name="modal" value="1"/><label htmlFor="setup-username">Your Instagram username</label>
              <div className="seller-input-wrap"><span>@</span><input id="setup-username" name="username" required placeholder="yourshopname" autoComplete="off"/><button type="submit">Next <ArrowRight size={16}/></button></div>
              <small>Use the exact username. Example: <b>yourbrand</b> — do not type @.</small>
            </form>
          </StepCard>}

          {visibleStep===2&&<StepCard number={2} title="Wait while we review it" text="Our team checks your shop and sends the Instagram tester invitation through Meta. You do not need to do anything yet." image={guideImages.review} state={currentStep>2?"done":"active"}>
            {request.status==="PENDING"&&<div className="seller-status-box review"><div><CheckCircle2 size={17}/><div><b>Request in review</b><span>We are reviewing @{request.username}. This step is saved.</span></div></div></div>}
            {request.status==="APPROVED"&&<div className="seller-done-note"><CheckCircle2 size={16}/> Approved — next step unlocked</div>}
            {request.status==="REJECTED"&&<div className="seller-status-box error"><b>This request was not approved.</b><span>You can start again with another Instagram username.</span><Link href={href(1)} className="seller-primary-button">Start again <ArrowRight size={15}/></Link></div>}
            {!connected&&request.status==="PENDING"&&<Link href={href(2)} className="seller-secondary-button seller-modal-next">Keep me on step 2 <ArrowRight size={15}/></Link>}
          </StepCard>}

          {visibleStep===3&&<StepCard number={3} title="Accept the Instagram invitation" text="When your shop is approved, Instagram will show you a tester invitation. Open Instagram, approve it, then come back here." image={guideImages.tester} state="active">
            {request.status==="APPROVED"&&!connected&&<div className="seller-action-stack">
              <div className="seller-numbered-tip"><b>1</b><span>Open Instagram and find the tester invitation.</span></div>
              <div className="seller-numbered-tip"><b>2</b><span>Tap the invitation and choose <strong>Approve</strong>.</span></div>
              <a href="https://www.instagram.com/accounts/manage_access/" target="_blank" rel="noopener noreferrer" className="seller-primary-button">Open Instagram <ExternalLink size={15}/></a>
              <Link href={href(4)} className="seller-next-button">I approved it — Next <ArrowRight size={16}/></Link>
            </div>}
          </StepCard>}

          {visibleStep===4&&<StepCard number={4} title="Connect Instagram" text="Last step! Connect the approved Instagram account. Instagram handles the secure sign-in for you." image={guideImages.connect} state={connected?"done":"active"}>
            {connected?<div className="seller-status-box success"><CheckCircle2 size={18}/><div><b>@{connection?.username} is connected</b><span>{connection?.postsCount||0} marketplace products imported.</span></div></div>:
            request.status==="APPROVED"?<div className="seller-action-stack"><Link href={"/api/instagram/connect?requestId="+encodeURIComponent(request.id)} className="seller-primary-button">Connect @{request.username} <Instagram size={16}/></Link><Link href={href(3)} className="seller-back-button"><ArrowLeft size={14}/> Back to invitation step</Link></div>:null}
          </StepCard>}
        </div>
      </div>
    </div>
  </div>
}