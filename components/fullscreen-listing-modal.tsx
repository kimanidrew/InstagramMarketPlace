"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { ModalSideDrawer } from "@/components/modal-side-drawer";

export function FullscreenListingModal({ children, label }: { children: React.ReactNode; label: string }) {
  const router = useRouter();
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
    <div className="sokolink-listing-modal fixed inset-0 z-[10000] h-[100vh] min-h-[100vh] max-h-[100vh] overflow-x-hidden overflow-y-auto bg-white/95" role="dialog" aria-modal="true" aria-label={label}>
      <ModalSideDrawer />
      <button type="button" onClick={() => router.back()} aria-label="Close details" className="sokolink-listing-modal-close fixed right-4 top-4 z-[10002] flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black hover:text-white sm:right-7 sm:top-6">
        <X size={20} />
      </button>
      <div className="min-h-full">{children}</div>
    </div>
  );
}
