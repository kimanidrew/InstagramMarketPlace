"use client";

import { usePathname } from "next/navigation";

type SkeletonProps = { count?: number; variant?: "products" | "categories" | "stores" | "rows" };

const PAGE_LOADING_COPY: Array<{ match: RegExp; eyebrow: string; title: string; description: string }> = [
  { match: /^\/for-you(?:\/|$)/, eyebrow: "MADE FOR YOUR TASTE", title: "YOUR NEXT GREAT FIND IS LOADING", description: "We’re bringing your personal picks together." },
  { match: /^\/shop(?:\/|$)/, eyebrow: "GOOD FINDS AHEAD", title: "THE SHOP IS GETTING READY", description: "A little moment while we line up the good stuff." },
  { match: /^\/categories(?:\/|$)/, eyebrow: "FIND YOUR THING", title: "CATEGORIES ARE ON THEIR WAY", description: "We’re getting every corner of the shop ready to explore." },
  { match: /^\/category(?:\/|$)/, eyebrow: "EXPLORE YOUR INTERESTS", title: "YOUR CATEGORY IS LOADING", description: "We’re gathering the finds that belong here." },
  { match: /^\/products?(?:\/|$)/, eyebrow: "WORTH A CLOSER LOOK", title: "PRODUCTS ARE GETTING READY", description: "Just a moment while we bring the details together." },
  { match: /^\/stores?(?:\/|$)/, eyebrow: "MEET THE SELLERS", title: "DISCOVERING GREAT STORES", description: "We’re getting shop profiles ready for you." },
  { match: /^\/store(?:\/|$)/, eyebrow: "MEET THE MAKERS", title: "THIS SHOP IS GETTING READY", description: "We’re bringing this seller’s collection into view." },
  { match: /^\/search(?:\/|$)/, eyebrow: "LET’S FIND IT", title: "YOUR RESULTS ARE LOADING", description: "We’re looking for something you’ll love." },
  { match: /^\/wishlist(?:\/|$)/, eyebrow: "SAVED FOR LATER", title: "YOUR FAVOURITES ARE LOADING", description: "All the things you’ve saved, gathered in one place." },
  { match: /^\/account(?:\/|$)/, eyebrow: "YOUR SPACE", title: "GETTING YOUR ACCOUNT READY", description: "We’re bringing your seller tools together." },
  { match: /^\/notifications(?:\/|$)/, eyebrow: "YOU’RE IN THE LOOP", title: "CHECKING YOUR UPDATES", description: "Your latest activity will be right here." },
  { match: /^\/login(?:\/|$)/, eyebrow: "WELCOME BACK", title: "GETTING THINGS READY", description: "One moment and you’ll be on your way." },
  { match: /^\/signup(?:\/|$)/, eyebrow: "YOUR NEXT CHAPTER", title: "MAKING ROOM FOR YOU", description: "We’re getting your sign-up page ready." },
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
  const heading = typeof title === "string" ? title : pageCopy?.title ?? "GOOD THINGS ARE ON THE WAY";
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
