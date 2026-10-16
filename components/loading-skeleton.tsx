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
    <span className="activity-loader-orbit" aria-hidden="true"><span className="activity-loader-core" /><span className="activity-loader-spark activity-loader-spark-one" /><span className="activity-loader-spark activity-loader-spark-two" /></span>
    <span className="activity-loader-dots" aria-hidden="true"><i /><i /><i /></span>
    <span className="activity-loader-label">{label}<span className="activity-loader-ellipsis">...</span></span>
  </div>
}
