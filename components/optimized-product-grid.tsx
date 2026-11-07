"use client";

import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product-card";

function ViewportProduct({ product, editablePrice }: { product: any; editablePrice?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "220px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-w-0 break-inside-avoid">
      {visible ? (
        <ProductCard p={product} editablePrice={editablePrice} />
      ) : (
        <div className="overflow-hidden rounded-[22px] bg-[#f1f1ee] aspect-[4/5] animate-pulse" aria-hidden="true" />
      )}
    </div>
  );
}

export function OptimizedProductGrid({ products, editablePrice = false }: { products: any[]; editablePrice?: boolean }) {
  return (
    <div className="optimized-product-grid">
      {products.map((product) => <ViewportProduct key={product.id} product={product} editablePrice={editablePrice} />)}
    </div>
  );
}
