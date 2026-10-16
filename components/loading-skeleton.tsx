"use client";

import { usePathname } from "next/navigation";

type SkeletonProps = { count?: number; variant?: "products" | "categories" | "stores" | "rows" };

const PAGE_LOADING_COPY: Array<{ match: RegExp; eyebrow: string; title: string; description: string }> = [
  { match: /^\/for-you(?:\/|$)/, eyebrow: "Made for your taste", title: "Your next great find is loading", description: "We’re bringing your personal picks together." },
  { match: /^\/shop(?:\/|$)/, eyebrow: "Good finds ahead", title: "The shop is getting ready", description: "A little moment while we line up the good stuff." },
  { match: /^\/categories(?:\/|$)/, eyebrow: "Find your thing", title: "Categories are on their way", description: "We’re getting every corner of the shop ready to explore." },
  { match: /^\/category(?:\/|$)/, eyebrow: "Explore your interests", title: "Your category is loading", description: "We’re gathering the finds that belong here." },
  { match: /^\/products?(?:\/|$)/, eyebrow: "Worth a closer look", title: "Products are getting ready", description: "Just a moment while we bring the details together." },
  { match: /^\/stores?(?:\/|$)/, eyebrow: "Meet the sellers", title: "Discovering great stores", description: "We’re getting shop profiles ready for you." },
  { match: /^\/store(?:\/|$)/, eyebrow: "Meet the makers", title: "This shop is getting ready", description: "We’re bringing this seller’s collection into view." },
  { match: /^\/search(?:\/|$)/, eyebrow: "Let’s find it", title: "Your results are loading", description: "We’re looking for something you’ll love." },
  { match: /^\/wishlist(?:\/|$)/, eyebrow: "Saved for later", title: "Your favourites are loading", description: "All the things you’ve saved, gathered in one place." },
  { match: /^\/account(?:\/|$)/, eyebrow: "Your space", title: "Getting your account ready", description: "We’re bringing your seller tools together." },
  { match: /^\/notifications(?:\/|$)/, eyebrow: "You’re in the loop", title: "Checking your updates", description: "Your latest activity will be right here." },
  { match: /^\/login(?:\/|$)/, eyebrow: "Welcome back", title: "Getting things ready", description: "One moment and you’ll be on your way." },
  { match: /^\/signup(?:\/|$)/, eyebrow: "Your next chapter", title: "Making room for you", description: "We’re getting your sign-up page ready." },
  { match: /^\/how-it-works(?:\/|$)/, eyebrow: "Simple by design", title: "Here’s how it all comes together", description: "We’re getting the SokoLink guide ready for you." },
  { match: /^\/service(?:\/|$)/, eyebrow: "Services worth discovering", title: "Getting this service ready", description: "We’re bringing the details into view." },
  { match: /^\/admin(?:\/|$)/, eyebrow: "Seller control centre", title: "Preparing your dashboard", description: "Your management tools are on their way." },
];

export function LoadingSkeleton({ variant = "products" }: SkeletonProps) {
  const label = variant === "categories" ? "Loading categories" : variant === "stores" ? "Loading stores" : variant === "rows" ? "Loading items" : "Loading products";
  return <ActivityLoader label={label} />;
}

export function PageLoadingSkeleton({ title = true }: { title?: boolean }) {
  const pathname = usePathname() || "/";
  // Keep the homepage free of a full-page overlay; its content can appear progressively as it enters view.
  if (pathname === "/") return null;

  const pageCopy = PAGE_LOADING_COPY.find((item) => item.match.test(pathname));
  const heading = typeof title === "string" ? title : pageCopy?.title ?? "Good things are on the way";
  const eyebrow = pageCopy?.eyebrow ?? "A MOMENT, PLEASE";
  const description = pageCopy?.description ?? "We’re getting this page ready for you.";

  return <main className="shell loading-page" aria-busy="true" aria-label={`Loading ${pathname === "/" ? "homepage" : pathname.replace(/^\//, "").replaceAll("/", " ")}`}>
    <div className="page-loader-content">
      <span className="page-loader-eyebrow">{eyebrow}</span>
      {title !== false && <h1 className="page-loader-headline">{heading}</h1>}
      <p className="page-loader-description">{description}</p>
      <ActivityLoader label="Loading" />
    </div>
  </main>;
}

function ActivityLoader({ label }: { label: string }) {
  return <div className="activity-loader-wrap" role="status" aria-live="polite" aria-label={label}>
    <span className="activity-loader-orbit" aria-hidden="true"><span className="activity-loader-core" /><span className="activity-loader-spark activity-loader-spark-one" /><span className="activity-loader-spark activity-loader-spark-two" /></span>
    <span className="activity-loader-dots" aria-hidden="true"><i /><i /><i /></span>
    <span className="activity-loader-label">{label}<span className="activity-loader-ellipsis">...</span></span>
  </div>;
}
