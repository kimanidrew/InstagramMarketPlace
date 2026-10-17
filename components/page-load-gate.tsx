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
  const targetPath = useRef(pathname);
  const finishing = useRef(false);

  const finishWhenReady = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;

    try {
      if ("fonts" in document) await document.fonts.ready;

      // Wait for the page's banner/hero to be present and its non-lazy images to settle.
      const main = document.querySelector("main");
      const hero = main?.querySelector(
        '[data-page-hero], .store-directory-showcase, .store-directory-showcase-stage, .shop-promo-carousel, .for-you-hero, main > section:first-of-type, main > section:first-child'
      );
      if (hero) {
        const images = Array.from(hero.querySelectorAll("img"));
        // Banner imagery is critical to the first impression, so promote lazy hero images
        // while the overlay is visible and wait for either load or error.
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

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;

      targetPath.current = destination.pathname;
      finishing.current = false;
      setVisible(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    targetPath.current = pathname;
    if (!visible) return;
    let cancelled = false;

    // Let Next.js commit the destination page before checking its fonts and hero assets.
    const frame = window.requestAnimationFrame(() => {
      if (!cancelled) void finishWhenReady();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [pathname, visible, finishWhenReady]);

  if (!visible) return null;

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
