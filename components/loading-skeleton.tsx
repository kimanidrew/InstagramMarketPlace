type SkeletonProps = { count?: number; variant?: "products" | "categories" | "stores" | "rows" };

export function LoadingSkeleton({ variant = "products" }: SkeletonProps) {
  const label = variant === "categories" ? "Loading categories" : variant === "stores" ? "Loading stores" : variant === "rows" ? "Loading items" : "Loading products";
  return <ActivityLoader label={label} />;
}

export function PageLoadingSkeleton({ title = true }: { title?: boolean }) {
  return <main className="shell loading-page" aria-busy="true" aria-label="Loading page">
    {title && <div className="loading-page-heading" aria-hidden="true" />}
    <ActivityLoader label="Loading page" />
  </main>;
}

function ActivityLoader({ label }: { label: string }) {
  return <div className="activity-loader-wrap" role="status" aria-live="polite" aria-label={label}>
    <span className="activity-loader-spinner" aria-hidden="true" />
    <span className="activity-loader-label">{label}…</span>
  </div>;
}
