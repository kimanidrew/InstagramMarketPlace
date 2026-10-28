"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname() || "/";
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const previousPath = useRef(pathname);
  const fallbackTimer = useRef<number | null>(null);
  const finishTimer = useRef<number | null>(null);
  const navigationFallbackTimer = useRef<number | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
      if (finishTimer.current !== null) window.clearTimeout(finishTimer.current);
      fallbackTimer.current = null;
      finishTimer.current = null;
      if (navigationFallbackTimer.current !== null) window.clearTimeout(navigationFallbackTimer.current);
      navigationFallbackTimer.current = null;
    };

    const start = () => {
      clearTimers();
      setVisible(true);
      setProgress(18);
      window.requestAnimationFrame(() => setProgress(68));
      fallbackTimer.current = window.setTimeout(() => {
        setProgress(100);
        finishTimer.current = window.setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 220);
      }, 8000);
    };

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute("download") || anchor.target === "_blank") return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;

      // Observe navigation first. If a client-side transition started from /for-you
      // stalls, fall back to a normal browser navigation to the same destination.
      const sourcePath = window.location.pathname + window.location.search;
      start();
      if (window.location.pathname === "/for-you") {
        navigationFallbackTimer.current = window.setTimeout(() => {
          const currentPath = window.location.pathname + window.location.search;
          if (currentPath === sourcePath) window.location.assign(destination.href);
        }, 1200);
      }
    };

    const handlePopState = () => start();

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    if (navigationFallbackTimer.current !== null) window.clearTimeout(navigationFallbackTimer.current);
    navigationFallbackTimer.current = null;

    if (!visible) return;
    if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
    fallbackTimer.current = null;
    setProgress(100);
    if (finishTimer.current !== null) window.clearTimeout(finishTimer.current);
    finishTimer.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 240);
  }, [pathname, visible]);

  return (
    <div
      className={"navigation-progress" + (visible ? " is-visible" : "")}
      role="progressbar"
      aria-label="Loading page"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-hidden={!visible}
    >
      <span className="navigation-progress-bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
