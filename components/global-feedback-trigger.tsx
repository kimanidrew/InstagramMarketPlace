"use client";

import { useEffect } from "react";

export default function GlobalFeedbackTrigger({ type, title, message }: {
  type: "success" | "error";
  title: string;
  message: string;
}) {
  useEffect(() => {
    if (!message) return;
    window.dispatchEvent(new CustomEvent("sokolink:feedback", {
      detail: { type, title, message },
    }));
  }, [type, title, message]);
  return null;
}
