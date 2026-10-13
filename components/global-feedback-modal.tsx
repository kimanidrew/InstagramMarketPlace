"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";

export function GlobalFeedbackModal({ open, type, title, message, onClose }: {
  open: boolean;
  type: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;
  const success = type === "success";
  return <div className="global-feedback-backdrop" role="presentation" onClick={onClose}>
    <section className="global-feedback-modal" role="alertdialog" aria-modal="true" aria-labelledby="global-feedback-title" aria-describedby="global-feedback-message" onClick={event => event.stopPropagation()}>
      <button type="button" className="global-feedback-close" onClick={onClose} aria-label="Close message"><X size={19}/></button>
      <span className={"global-feedback-icon " + (success ? "success" : "error")}>{success ? <CheckCircle2 size={30}/> : <CircleAlert size={30}/>}</span>
      <span className="global-feedback-eyebrow">{success ? "SOKOLINK UPDATE" : "ACTION NEEDED"}</span>
      <h2 id="global-feedback-title">{title}</h2>
      <p id="global-feedback-message">{message}</p>
      <button type="button" className="global-feedback-confirm" onClick={onClose}>Got it</button>
    </section>
  </div>;
}
