"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export function ReviewModalClose({ href, backFirst = false }: { href: string; backFirst?: boolean }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="review-product-close"
      aria-label="Close reviews drawer"
      title="Close drawer"
      onClick={() => (backFirst ? router.back() : router.push(href))}
    >
      <span>Close drawer</span>
      <X size={17} strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}
