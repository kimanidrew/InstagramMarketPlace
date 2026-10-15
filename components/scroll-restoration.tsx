"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type ScrollPosition = { x: number; y: number };
const STORAGE_PREFIX = "sokolink:scroll:";

function entryKey() {
  const state = window.history.state as Record<string, unknown> | null;
  const nextKey = state && typeof state.key === "string" ? state.key : null;
  if (nextKey) return nextKey;

  const existing = state && typeof state.__sokolinkScrollKey === "string"
    ? state.__sokolinkScrollKey
    : null;
  if (existing) return existing;

  const key = `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.history.replaceState({ ...(state || {}), __sokolinkScrollKey: key }, "");
  return key;
}

function savePosition() {
  try {
    const position: ScrollPosition = { x: window.scrollX, y: window.scrollY };
    window.sessionStorage.setItem(STORAGE_PREFIX + entryKey(), JSON.stringify(position));
  } catch {
    // Scroll restoration should never interrupt navigation if storage is unavailable.
  }
}

function restorePosition(key: string) {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) {
      window.scrollTo({ left: 0, top: 0, behavior: "instant" });
      return;
    }
    const position = JSON.parse(raw) as Partial<ScrollPosition>;
    window.scrollTo({
      left: typeof position.x === "number" ? position.x : 0,
      top: typeof position.y === "number" ? position.y : 0,
      behavior: "instant",
    });
  } catch {
    window.scrollTo({ left: 0, top: 0, behavior: "instant" });
  }
}

/** Forward navigation starts at the top; browser back/forward restores that history entry. */
export function ScrollRestoration() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);
  const isPopNavigation = useRef(false);

  useEffect(() => {
    entryKey();
    savePosition();

    const handleScroll = () => savePosition();
    const handlePopState = () => {
      isPopNavigation.current = true;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      savePosition();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (previousPathname.current === null) {
      previousPathname.current = pathname;
      return;
    }
    if (previousPathname.current === pathname) return;

    previousPathname.current = pathname;
    if (isPopNavigation.current) {
      isPopNavigation.current = false;
      const key = entryKey();
      // Let the App Router finish its own scroll work before restoring this history entry.
      requestAnimationFrame(() => requestAnimationFrame(() => restorePosition(key)));
    } else {
      isPopNavigation.current = false;
      window.scrollTo({ left: 0, top: 0, behavior: "instant" });
    }
  }, [pathname]);

  return null;
}
