import { LoadingSkeleton } from "@/components/loading-skeleton";

export default function Loading() {
  return <main className="category-discovery-page min-h-screen bg-white pb-20"><section className="shell pt-10 sm:pt-14"><div className="loading-page-heading"><div className="loading-skeleton-line short" /><div className="loading-skeleton-line loading-heading-title" /><div className="loading-skeleton-line loading-heading-subtitle" /></div><LoadingSkeleton variant="categories" count={5} /></section></main>;
}
