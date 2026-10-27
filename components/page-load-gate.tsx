"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

function waitForImage(image: HTMLImageElement) {
  if (image.complete) return Promise.resolve();
  return new Promise<void>((resolve) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => resolve(), { once: true });
  });
}

export function PageLoadGate() {
  const pathname = usePathname() || "/";
  const [visible, setVisible] = useState(true);
  const finishing = useRef(false);

  const finishWhenReady = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;

    try {
      if ("fonts" in document) await document.fonts.ready;

      // Wait for the initial page's hero imagery before dismissing the loader.
      const main = document.querySelector("main");
      const hero = main?.querySelector(
        '[data-page-hero], .store-directory-showcase, .store-directory-showcase-stage, .shop-promo-carousel, .for-you-hero, main > section:first-of-type, main > section:first-child'
      );
      if (hero) {
        const images = Array.from(hero.querySelectorAll("img"));
        images.forEach((image) => {
          if (image.loading === "lazy") image.loading = "eager";
        });
        await Promise.all(images.map(waitForImage));
      }
    } catch {
      // A failed font or image should never trap the page behind the loader.
    } finally {
      setVisible(false);
      finishing.current = false;
    }
  }, []);

  // Run once when the app shell first mounts. Internal route changes do not
  // re-open the full-page loader; Next.js handles those transitions normally.
  useEffect(() => {
    if (!visible || pathname.endsWith("/reviews")) {
      if (pathname.endsWith("/reviews")) setVisible(false);
      return;
    }

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (!cancelled) void finishWhenReady();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
    // Deliberately run only on the first mount, not on pathname changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible || pathname.endsWith("/reviews")) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex min-h-screen items-center justify-center bg-white/95 px-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-xl font-black italic tracking-tight text-white shadow-lg">
          S
        </span>
        <span className="text-[10px] font-black uppercase tracking-[.2em] text-black/40">SokoLink</span>
        <span className="mt-5 h-9 w-9 animate-spin rounded-full border-[3px] border-black/10 border-t-black" aria-hidden="true" />
        <span className="mt-4 text-sm font-semibold text-black/60">Getting everything ready…</span>
      </div>
    </div>
  );
}
