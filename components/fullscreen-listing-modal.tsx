"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronDown, ChevronUp } from "lucide-react";

export function FullscreenListingModal({ children, label }: { children: React.ReactNode; label: string }) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollModal = (direction: number) => scrollRef.current?.querySelector<HTMLElement>(".sokolink-recommendation-scroll")?.scrollBy({ top: direction * 420, behavior: "smooth" });
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.back();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [router]);

  return (
    <div className="sokolink-listing-overlay fixed inset-0 z-[10000] flex h-[100vh] items-center justify-center" role="dialog" aria-modal="true" aria-label={label}>
      <div ref={scrollRef} className="sokolink-listing-modal relative h-[calc(100vh-32px)] w-[min(1440px,calc(100vw-48px))] overflow-x-hidden overflow-y-auto rounded-[24px] bg-white shadow-2xl">
      <button type="button" onClick={() => router.back()} aria-label="Close details" className="sokolink-listing-modal-close fixed right-4 top-4 z-[10002] flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black hover:text-white sm:right-7 sm:top-6">
        <X size={20} />
      </button>
      <div className="min-h-full">{children}</div>
      </div>
      <div className="sokolink-modal-scroll-controls fixed right-5 top-1/2 z-[10003] flex -translate-y-1/2 flex-col gap-2">
        <button type="button" onClick={() => scrollModal(-1)} aria-label="Scroll modal up" className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-lg backdrop-blur"><ChevronUp size={20}/></button>
        <button type="button" onClick={() => scrollModal(1)} aria-label="Scroll modal down" className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-lg backdrop-blur"><ChevronDown size={20}/></button>
      </div>
    </div>
  );
}
