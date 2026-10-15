"use client";

import { useEffect } from "react";

export default function GlobalFeedbackTrigger({ type, title, message }: {
  type: "success" | "error";
  title: string;
  message: string;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("sokolink:feedback", {
        detail: { type, title, message },
      }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [type, title, message]);
  return null;
}
