"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export function ReviewModalClose({ href }: { href: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="review-product-close"
      aria-label="Close product reviews"
      title="Close reviews"
      onClick={() => router.push(href)}
    >
      <X size={20} strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}
