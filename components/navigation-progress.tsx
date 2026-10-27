"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const previousPath = useRef(pathname);
  const fallbackTimer = useRef<number | null>(null);
  const finishTimer = useRef<number | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
      if (finishTimer.current !== null) window.clearTimeout(finishTimer.current);
      fallbackTimer.current = null;
      finishTimer.current = null;
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
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute("download") || anchor.target === "_blank") return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;

      // Observe navigation, but never take ownership of it. Next <Link> must
      // handle its own router transition; plain anchors must retain native navigation.
      start();
    };

    const handlePopState = () => start();

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, [router]);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;

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
