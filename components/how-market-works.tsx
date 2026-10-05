"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { Instagram, Search, ShoppingBag, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";

const steps = [
  {
    number: "01",
    label: "Connect",
    title: "Sellers connect once.",
    text: "Approved Instagram Business accounts connect securely to Instagram Market. There is no second product catalogue to maintain.",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1600&q=85",
    icon: Instagram,
    tag: "Instagram → Market",
  },
  {
    number: "02",
    label: "Sync",
    title: "Posts become products.",
    text: "When a seller publishes an Instagram post, it can flow into the marketplace with its image, caption, hashtags and original Instagram link.",
    image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=85",
    icon: ShoppingBag,
    tag: "Post → Product",
  },
  {
    number: "03",
    label: "Discover",
    title: "Shoppers find what feels right.",
    text: "Browse stores, search products, explore categories and save favourites — then jump straight back to the original Instagram post.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=85",
    icon: Search,
    tag: "Discover → Shop",
  },
];

export function HowMarketWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(steps.length - 1, Math.floor(value * steps.length));
    setActive(next);
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "-7%"]);

  return (
    <section ref={ref} className="how-works-section relative bg-[#111] text-white" style={{ height: "300vh" }}>
      <div className="sticky top-0 flex h-screen min-h-[680px] items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,rgba(255,255,255,.12),transparent_32%),linear-gradient(120deg,#0b0b0b,#171717)]" />

        <div className="shell relative z-10 w-full py-12">
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-white/40">
                How Instagram Market works
              </p>
              <h2 className="mt-5 max-w-xl text-5xl font-black leading-[.9] tracking-[-.07em] sm:text-6xl xl:text-7xl">
                From scroll
                <br />
                to <span className="text-white/35">shop.</span>
              </h2>
              <p className="mt-7 max-w-md text-sm leading-7 text-white/55 sm:text-base">
                Keep scrolling. The experience stays with you while each step
                changes — so you can see exactly how Instagram content becomes
                a simple marketplace journey.
              </p>

              <div className="mt-9 flex gap-2">
                {steps.map((step, index) => (
                  <div
                    key={step.number}
                    className="flex items-center gap-2"
                    aria-label={step.label}
                  >
                    <span className={"h-1 rounded-full transition-all duration-500 " + (active === index ? "w-14 bg-white" : "w-6 bg-white/20")} />
                    <span className={"hidden text-[10px] font-bold uppercase tracking-[.14em] transition sm:block " + (active === index ? "text-white" : "text-white/30")}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[650px]">
              <div className="relative aspect-[1.02/1] overflow-hidden rounded-[34px] border border-white/10 bg-white/5 shadow-[0_35px_100px_rgba(0,0,0,.45)]">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.number}
                      animate={{
                        opacity: active === index ? 1 : 0,
                        scale: active === index ? 1 : 1.04,
                      }}
                      transition={{ duration: .6, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0"
                      aria-hidden={active !== index}
                    >
                      <motion.img
                        src={step.image}
                        alt=""
                        style={active === index ? { y: imageY } : undefined}
                        className="h-[108%] w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/10" />

                      <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[10px] font-black uppercase tracking-[.14em] backdrop-blur-md">
                        <Icon size={13} />
                        {step.tag}
                      </div>

                      <div className="absolute inset-x-6 bottom-6 sm:inset-x-8 sm:bottom-8">
                        <span className="text-xs font-black text-white/45">{step.number}</span>
                        <h3 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-4xl">
                          {step.title}
                        </h3>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                          {step.text}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                <div className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/25 p-3 backdrop-blur-md sm:block">
                  <ArrowRight size={17} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-[.15em] text-white/30">
                <span>Keep scrolling</span>
                <span>{String(active + 1).padStart(2, "0")} / 03</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
