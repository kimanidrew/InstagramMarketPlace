"use client";

import { usePathname } from "next/navigation";

const COPY: Array<{ match: RegExp; eyebrow: string; title: string; description: string; tone: string }> = [
  { match: /^\/for-you(?:\/|$)/, eyebrow: "PERSONALISED DISCOVERY", title: "Made for you.", description: "We’re bringing your next finds into view.", tone: "from-[#f0eaff] via-[#fff8ff] to-[#ffeef8]" },
  { match: /^\/(?:shop|products?)(?:\/|$)/, eyebrow: "DISCOVER SOKOLINK", title: "Find something you love.", description: "The best shops and listings are getting ready.", tone: "from-[#f2f7e9] via-white to-[#f4f0ff]" },
  { match: /^\/stores?(?:\/|$)/, eyebrow: "MEET THE SELLERS", title: "Discover great shops.", description: "We’re getting the store showcase ready.", tone: "from-[#f2f7e9] via-white to-[#fff2e8]" },
];

function Shimmer({ className = "" }: { className?: string }) {
  return <div className={"animate-pulse rounded-2xl bg-black/[0.055] " + className} />;
}

/** Keep the banner-sized region first in the loading stream; defer below-the-fold placeholders visually. */
export function BannerFirstLoader() {
  const pathname = usePathname() || "/";
  const copy = COPY.find((item) => item.match.test(pathname)) ?? COPY[1];

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-3 sm:px-6 md:px-8" aria-busy="true" aria-label="Loading page">
      <section className={"relative isolate grid min-h-[280px] overflow-hidden rounded-[24px] bg-gradient-to-br p-5 sm:min-h-[320px] sm:p-8 md:min-h-[350px] md:grid-cols-[.9fr_1.1fr] md:items-center md:gap-6 md:p-10 " + copy.tone}>
        <div className="relative z-10 flex flex-col justify-center">
          <p className="text-[10px] font-black tracking-[.16em] text-black/40 sm:text-xs">{copy.eyebrow}</p>
          <Shimmer className="mt-4 h-9 w-[min(82%,360px)] sm:h-12 md:h-14" />
          <Shimmer className="mt-3 h-3 w-[min(92%,340px)]" />
          <Shimmer className="mt-2 h-3 w-[min(72%,280px)]" />
          <div className="mt-5 flex gap-2">
            <Shimmer className="h-8 w-20 rounded-xl" />
            <Shimmer className="h-8 w-24 rounded-xl" />
            <Shimmer className="h-8 w-16 rounded-xl" />
          </div>
        </div>
        <div className="relative mt-4 grid min-h-[130px] grid-cols-3 items-center gap-2 md:mt-0 md:min-h-[230px]">
          <Shimmer className="h-[115px] w-full rotate-[-5deg] rounded-[18px] sm:h-[155px] md:h-[205px]" />
          <Shimmer className="h-[135px] w-full rounded-[18px] sm:h-[175px] md:h-[235px]" />
          <Shimmer className="h-[105px] w-full rotate-[5deg] rounded-[18px] sm:h-[145px] md:h-[190px]" />
          <span className="sr-only">{copy.title} {copy.description}</span>
        </div>
      </section>

      <div className="mt-6 space-y-7" style={{ animation: "banner-first-reveal 420ms ease-out 650ms both" }}>
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <Shimmer className="h-5 w-44" />
            <Shimmer className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => <Shimmer key={index} className="aspect-[4/5] rounded-[20px]" />)}
          </div>
        </section>
        <section>
          <Shimmer className="mb-4 h-5 w-36" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 6 }, (_, index) => <Shimmer key={index} className="h-9 w-24 shrink-0 rounded-full" />)}
          </div>
        </section>
      </div>
      <style jsx>{`
        @keyframes banner-first-reveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          div[style] { animation: none !important; }
        }
      `}</style>
    </main>
  );
}
