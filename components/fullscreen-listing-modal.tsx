"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, ChevronDown, ChevronUp } from "lucide-react";

export function FullscreenListingModal({ children, label }: { children: React.ReactNode; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const navigationLock = useRef(false);

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
    const modal = scrollRef.current;
    modal?.classList.remove("sokolink-page-next", "sokolink-page-previous");
    void modal?.offsetWidth;
    modal?.classList.add(direction > 0 ? "sokolink-page-next" : "sokolink-page-previous");
    window.setTimeout(() => router.push(target), 150);
    window.setTimeout(() => { navigationLock.current = false; }, 650);
  }, [pathname, router]);
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    body.classList.add("sokolink-modal-open");
    html.classList.add("sokolink-modal-open");

    // Keep the app's vertical scrollbar visible, but prevent the page behind
    // the modal from responding to wheel/touch scrolling.
    const preventBackgroundScroll = (event: WheelEvent | TouchEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".sokolink-listing-overlay")) return;
      event.preventDefault();
    };
    document.addEventListener("wheel", preventBackgroundScroll, { capture: true, passive: false });
    document.addEventListener("touchmove", preventBackgroundScroll, { capture: true, passive: false });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.back();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      body.classList.remove("sokolink-modal-open");
      html.classList.remove("sokolink-modal-open");
      document.removeEventListener("wheel", preventBackgroundScroll, true);
      document.removeEventListener("touchmove", preventBackgroundScroll, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [router]);

  return (
    <div className="sokolink-listing-overlay fixed inset-0 z-[10000] flex h-[100vh] items-center justify-center" role="dialog" aria-modal="true" aria-label={label}>
      <div
        ref={scrollRef}
        className="sokolink-listing-modal relative h-[calc(100vh-32px)] w-[min(1440px,calc(100vw-48px))] overflow-hidden rounded-[24px] bg-white shadow-2xl"
        onTouchStart={(event) => { touchStartY.current = event.target instanceof Element && event.target.closest(".product-detail-scroll-area") ? (event.touches[0]?.clientY ?? null) : null; }}
        onTouchEnd={(event) => {
          if (touchStartY.current === null) return;
          const delta = touchStartY.current - (event.changedTouches[0]?.clientY ?? touchStartY.current);
          touchStartY.current = null;
          if (Math.abs(delta) > 75) navigateListing(delta > 0 ? 1 : -1);
        }}
        onWheel={(event) => {
          if (!(event.target instanceof Element) || !event.target.closest(".product-detail-scroll-area")) return;
          if (Math.abs(event.deltaY) < 55) return;
          event.preventDefault();
          navigateListing(event.deltaY > 0 ? 1 : -1);
        }}
      >
      <button type="button" onClick={() => router.back()} aria-label="Close details" className="sokolink-listing-modal-close fixed right-4 top-4 z-[10002] flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black hover:text-white sm:right-7 sm:top-6">
        <X size={20} />
      </button>
      <div className="min-h-full">{children}</div>
      </div>
      <div className="sokolink-modal-scroll-controls fixed right-5 top-1/2 z-[10003] flex -translate-y-1/2 flex-col gap-2">
        <button type="button" onClick={() => navigateListing(-1)} aria-label="Previous product or service" className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-lg backdrop-blur"><ChevronUp size={20}/></button>
        <button type="button" onClick={() => navigateListing(1)} aria-label="Next product or service" className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-lg backdrop-blur"><ChevronDown size={20}/></button>
      </div>
    </div>
  );
}
