"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type CommonModalKind = "error" | "success" | "info";

export function CommonModal({ open, kind = "info", title, message, onClose }: {
  open: boolean;
  kind?: CommonModalKind;
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;
  const Icon = kind === "error" ? AlertCircle : kind === "success" ? CheckCircle2 : Info;
  return (
    <div className="common-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="common-modal-card" role="alertdialog" aria-modal="true" aria-labelledby="common-modal-title">
        <button type="button" className="common-modal-close" aria-label="Close message" onClick={onClose}><X size={18} /></button>
        <span className={"common-modal-icon is-" + kind}><Icon size={25} /></span>
        <h2 id="common-modal-title">{title}</h2>
        <p>{message}</p>
        <button type="button" className="common-modal-confirm" onClick={onClose}>Got it</button>
      </section>
    </div>
  );
}
