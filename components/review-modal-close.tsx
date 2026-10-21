"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export function ReviewModalClose({ href }: { href: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="review-product-close"
      aria-label="Close reviews modal"
      title="Close modal"
      onClick={() => router.push(href)}
    >
      <span>Close</span>
      <X size={17} strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}
