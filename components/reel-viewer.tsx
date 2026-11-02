"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Reel = { id: string; productSlug: string; productTitle: string | null; mediaUrl: string | null; thumbnailUrl: string | null; listingType: string | null; connection: { username: string; profileImageUrl: string | null } };

export function ReelViewer({ reels, initialId }: { reels: Reel[]; initialId: string }) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const index = Math.max(0, reels.findIndex(item => item.id === initialId));
  const move = (direction: number) => {
    const current = refs.current.findIndex(el => el && Math.abs(el.getBoundingClientRect().top) < window.innerHeight * .6);
    const next = Math.min(reels.length - 1, Math.max(0, (current < 0 ? index : current) + direction));
    refs.current[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  useEffect(() => {
    refs.current[index]?.scrollIntoView({ block: "start" });
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowRight"].includes(event.key)) { event.preventDefault(); move(1); }
      if (["ArrowUp", "ArrowLeft"].includes(event.key)) { event.preventDefault(); move(-1); }
      if (event.key === "Escape") router.back();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);
  return <div ref={container} className="sokolink-reel-feed fixed inset-0 z-[10000] h-[100vh] min-h-[100vh] max-h-[100vh] overflow-y-auto bg-black text-white snap-y snap-mandatory">
    <button onClick={() => router.back()} aria-label="Close reels" className="fixed right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur"><X size={20}/></button>
    <div className="fixed right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
      <button onClick={() => move(-1)} aria-label="Previous reel" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25"><ChevronUp/></button>
      <button onClick={() => move(1)} aria-label="Next reel" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25"><ChevronDown/></button>
    </div>
    {reels.map((reel, i) => <section ref={el => { refs.current[i] = el; }} key={reel.id} className="relative flex h-[100dvh] w-full snap-start snap-always items-center justify-center overflow-hidden">
      <video src={reel.mediaUrl || undefined} poster={reel.thumbnailUrl || undefined} autoPlay={i === index} muted loop playsInline controls className="absolute inset-0 h-full w-full object-contain"/>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 to-transparent"/>
      <div className="absolute bottom-8 left-5 z-10 max-w-[min(78%,520px)] sm:bottom-12 sm:left-10">
        <Link href={"/stores/"+reel.connection.username} className="pointer-events-auto mb-3 inline-flex items-center gap-2 text-sm font-bold"><span className="h-9 w-9 overflow-hidden rounded-full bg-white/20">{reel.connection.profileImageUrl && <img src={reel.connection.profileImageUrl} className="h-full w-full object-cover" alt=""/>}</span>@{reel.connection.username}</Link>
        <h2 className="mb-4 text-xl font-black sm:text-2xl">{reel.productTitle || "Explore this listing"}</h2>
        <Link href={"/"+(reel.listingType === "SERVICE" ? "service" : "product")+"/"+reel.productSlug} className="pointer-events-auto inline-flex rounded-full bg-white px-5 py-3 text-sm font-extrabold text-black shadow-lg">View {reel.listingType === "SERVICE" ? "service" : "product"} details ↗</Link>
      </div>
      <span className="absolute bottom-5 right-5 z-10 text-xs font-bold text-white/70">{i+1} / {reels.length}</span>
    </section>)}
  </div>;
}
