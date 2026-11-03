"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function FullscreenListingModal({ children, label }: { children: React.ReactNode; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigationLock = useRef(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateListing = useCallback((direction: number) => {
    if (navigationLock.current) return;
    const area = scrollRef.current?.querySelector<HTMLElement>(".product-detail-scroll-area");
    const links = Array.from(area?.querySelectorAll<HTMLAnchorElement>(".sokolink-recommendation-scroll a[href]") || []);
    const hrefs = Array.from(new Set(links.map(link => link.getAttribute("href") || "").filter(href => /^\/(product|service)\/[^/]+$/.test(href))));
    const currentPath = pathname || window.location.pathname;
    const historyKey = "sokolink-listing-navigation-history";
    const history = (() => { try { return JSON.parse(sessionStorage.getItem(historyKey) || "[]") as string[]; } catch { return []; } })();
    let target = "";

    if (direction > 0) {
      const next = hrefs.find(href => href !== currentPath);
      if (!next) return;
      try { sessionStorage.setItem(historyKey, JSON.stringify([...history, currentPath].slice(-30))); } catch {}
      target = next;
    } else {
      target = history[history.length - 1] || "";
      if (target) {
        try { sessionStorage.setItem(historyKey, JSON.stringify(history.slice(0, -1))); } catch {}
      } else {
        const index = hrefs.indexOf(currentPath);
        target = index > 0 ? hrefs[index - 1] : "";
      }
      if (!target) return;
    }

    navigationLock.current = true;
    setIsNavigating(true);
    router.replace(target);
  }, [pathname, router]);

  useEffect(() => {
    navigationLock.current = false;
    setIsNavigating(false);
  }, [pathname]);
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    body.classList.add("sokolink-modal-open");
    html.classList.add("sokolink-modal-open");

    // The listing overlay participates in document flow so the browser's
    // native page scrollbar is the only vertical scrollbar while it is open.
    const previousScrollY = window.scrollY;
    window.scrollTo({ top: 0, behavior: "instant" });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.back();
    };
    const closeListingModal = () => router.back();
    window.addEventListener("keydown", onKey);
    window.addEventListener("sokolink-close-listing-modal", closeListingModal);
    return () => {
      body.classList.remove("sokolink-modal-open");
      html.classList.remove("sokolink-modal-open");
      window.scrollTo({ top: previousScrollY, behavior: "instant" });
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("sokolink-close-listing-modal", closeListingModal);
    };
  }, [router]);

  return (
    <div className="sokolink-listing-overlay fixed inset-0 z-[10000] flex h-[100vh] items-center justify-center" role="dialog" aria-modal="true" aria-label={label}>
      <div
        ref={scrollRef}
        className="sokolink-listing-modal relative h-[calc(100vh-32px)] w-[min(1440px,calc(100vw-48px))] overflow-hidden rounded-[24px] bg-white shadow-2xl"
      >
      <div className="min-h-full">{children}</div>
        {isNavigating && <div className="sokolink-listing-navigation-progress" role="status" aria-label="Loading listing"><span /></div>}
      </div>
      <div className="sokolink-modal-control-rail fixed inset-0 z-[10003]">
        <button type="button" onClick={() => router.back()} aria-label="Close details" className="sokolink-listing-modal-close flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black hover:text-white"><X size={20} /></button>
        <div className="sokolink-modal-scroll-controls absolute top-1/2 flex -translate-y-1/2 items-center justify-between">
          <button type="button" onClick={() => navigateListing(-1)} aria-label="Previous product or service" className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-lg backdrop-blur"><ChevronLeft size={20}/></button>
          <button type="button" onClick={() => navigateListing(1)} aria-label="Next product or service" className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-lg backdrop-blur"><ChevronRight size={20}/></button>
        </div>
      </div>
    </div>
  );
}
