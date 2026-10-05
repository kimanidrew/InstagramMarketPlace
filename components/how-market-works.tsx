"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Instagram, Search, ShoppingBag } from "lucide-react";
import { useRef, useState } from "react";

const steps = [
  { number: "01", label: "Connect", title: "Sellers connect once.", text: "Approved Instagram Business accounts connect securely to Instagram Market. There is no second product catalogue to maintain.", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1600&q=85", icon: Instagram, tag: "Instagram → Market" },
  { number: "02", label: "Sync", title: "Posts become products.", text: "When a seller publishes an Instagram post, it can flow into the marketplace with its image, caption, hashtags and original Instagram link.", image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=85", icon: ShoppingBag, tag: "Post → Product" },
  { number: "03", label: "Discover", title: "Shoppers find what feels right.", text: "Browse stores, search products, explore categories and save favourites — then jump straight back to the original Instagram post.", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=85", icon: Search, tag: "Discover → Shop" },
];

export function HowMarketWorks() {
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function move(direction: "left" | "right") {
    railRef.current?.scrollBy({ left: direction === "right" ? railRef.current.clientWidth * 0.86 : -railRef.current.clientWidth * 0.86, behavior: "smooth" });
  }

  function onScroll() {
    const rail = railRef.current;
    if (!rail) return;
    const index = Math.round(rail.scrollLeft / Math.max(1, rail.clientWidth * 0.86));
    setActive(Math.max(0, Math.min(steps.length - 1, index)));
  }

  return (
    <section className="how-works-section relative overflow-hidden bg-[#0d0d0d] text-white">
      <div className="how-works-glow how-works-glow-a" />
      <div className="how-works-glow how-works-glow-b" />
      <div className="shell relative z-10 py-20 sm:py-24">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="how-works-kicker">How Instagram Market works</p>
            <h2 className="how-works-heading mt-4">One post.<br /><span>Three simple steps.</span></h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/45 sm:text-base">From Instagram inspiration to marketplace discovery, everything follows the content sellers already create.</p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <button type="button" onClick={() => move("left")} aria-label="Previous step" className="how-works-arrow"><ArrowLeft size={16} /></button>
            <button type="button" onClick={() => move("right")} aria-label="Next step" className="how-works-arrow"><ArrowRight size={16} /></button>
          </div>
        </div>

      </div>

      <div ref={railRef} onScroll={onScroll} className="how-works-rail mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.number} className={"how-works-slide group relative shrink-0 snap-center overflow-hidden rounded-[30px] border border-white/10 bg-white/5 " + (active === index ? "is-active" : "")}>
                <img src={step.image} alt="" className="how-works-slide-image" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-2 text-[9px] font-black uppercase tracking-[.15em] backdrop-blur-md"><Icon size={12} /> {step.tag}</div>
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                  <div className="flex items-end justify-between gap-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.2em] text-white/40">{step.number} / 03</p>
                      <h3 className="mt-2 max-w-xl text-3xl font-black leading-[.9] tracking-[-.06em] sm:text-5xl">{step.title}</h3>
                      <p className="mt-4 max-w-lg text-xs leading-5 text-white/55 sm:text-sm sm:leading-6">{step.text}</p>
                    </div>
                    <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 sm:flex"><ArrowRight size={16} /></div>
                  </div>
                </div>
              </article>
            );
          })}
      </div>

      <div className="shell relative z-10 mt-4 flex items-center justify-between gap-4">
          <div className="flex gap-1.5">
            {steps.map((step, index) => <button key={step.number} type="button" onClick={() => { const rail=railRef.current; if(rail) rail.scrollTo({ left: index * rail.clientWidth * .86, behavior: "smooth" }); }} aria-label={"Go to step " + (index + 1)} className={"how-works-dot " + (active === index ? "is-active" : "")} />)}
          </div>
          <span className="text-[8px] font-black uppercase tracking-[.18em] text-white/25">Swipe or use the arrows</span>
        </div>
      </div>
    </section>
  );
}
