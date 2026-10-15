"use client";

import { useCallback, useEffect, useState } from "react";
import { GlobalFeedbackModal } from "@/components/global-feedback-modal";

type Feedback = { type: "success" | "error"; title: string; message: string };

declare global {
  interface Window {
    showGlobalFeedback?: (feedback: Feedback) => void;
  }
}

export function GlobalFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const close = useCallback(() => setFeedback(null), []);

  useEffect(() => {
    const show = (event: Event) => {
      const detail = (event as CustomEvent<Feedback>).detail;
      if (detail?.message) setFeedback({
        type: detail.type === "success" ? "success" : "error",
        title: detail.title || (detail.type === "success" ? "Success" : "Something went wrong"),
        message: detail.message,
      });
    };
    const originalAlert = window.alert;
    window.showGlobalFeedback = (value) => setFeedback(value);
    window.addEventListener("sokolink:feedback", show);
    window.alert = (message?: unknown) => setFeedback({
      type: "error",
      title: "Notice",
      message: String(message ?? ""),
    });
    return () => {
      window.removeEventListener("sokolink:feedback", show);
      window.alert = originalAlert;
      delete window.showGlobalFeedback;
    };
  }, []);

  return <>
    {children}
    <GlobalFeedbackModal
      open={Boolean(feedback)}
      type={feedback?.type || "error"}
      title={feedback?.title || ""}
      message={feedback?.message || ""}
      onClose={close}
    />
  </>;
}
