type SkeletonProps = { count?: number; variant?: "products" | "categories" | "stores" | "rows" };

export function LoadingSkeleton({ count = 8, variant = "products" }: SkeletonProps) {
  if (variant === "categories") {
    return <div className="loading-skeleton-categories" aria-label="Loading categories" aria-busy="true">
      {Array.from({ length: count }, (_, i) => <section className="loading-category-block" key={i}>
        <div className="loading-skeleton-line loading-skeleton-title" />
        <div className="loading-skeleton-grid">{Array.from({ length: 4 }, (_, j) => <SkeletonCard key={j} />)}</div>
      </section>)}
    </div>;
  }
  if (variant === "stores") return <div className="loading-skeleton-stores" aria-label="Loading stores" aria-busy="true">
    {Array.from({ length: count }, (_, i) => <div className="loading-store-card" key={i}><div className="loading-skeleton-circle" /><div className="loading-skeleton-line" /><div className="loading-skeleton-line short" /></div>)}
  </div>;
  if (variant === "rows") return <div className="loading-skeleton-rows" aria-label="Loading items" aria-busy="true">
    {Array.from({ length: count }, (_, i) => <div className="loading-row" key={i}><div className="loading-skeleton-square" /><div className="loading-row-copy"><div className="loading-skeleton-line" /><div className="loading-skeleton-line short" /></div></div>)}
  </div>;
  return <div className="loading-skeleton-grid" aria-label="Loading products" aria-busy="true">
    {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}
  </div>;
}

function SkeletonCard() {
  return <article className="loading-product-card">
    <div className="loading-product-media" />
    <div className="loading-skeleton-line loading-product-likes" />
    <div className="loading-skeleton-line loading-product-title" />
    <div className="loading-skeleton-line short loading-product-store" />
  </article>;
}

export function PageLoadingSkeleton({ title = true }: { title?: boolean }) {
  return <main className="shell loading-page" aria-busy="true" aria-label="Loading page">
    {title && <div className="loading-page-heading"><div className="loading-skeleton-line short" /><div className="loading-skeleton-line loading-heading-title" /><div className="loading-skeleton-line loading-heading-subtitle" /></div>}
    <LoadingSkeleton count={8} />
  </main>;
}
