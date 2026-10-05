"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { ArrowDown, Instagram, Search, ShoppingBag } from "lucide-react";
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
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(steps.length - 1, Math.floor(value * steps.length));
    setActive(next);
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1.05, 1]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["-2%", "2%"]);

  return (
    <section
      ref={ref}
      className="how-works-section relative bg-[#111] text-white"
      style={{ height: "300vh" }}
    >
      <div className="sticky top-0 flex h-[calc(100vh-74px)] min-h-[560px] max-h-[900px] items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_48%,rgba(255,255,255,.12),transparent_30%),linear-gradient(135deg,#090909,#171717)]" />

        <div className="shell relative z-10 w-full py-5 sm:py-7">
          <div className="mb-4 flex items-end justify-between gap-5 sm:mb-5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.24em] text-white/40 sm:text-[10px]">
                How Instagram Market works
              </p>
              <h2 className="mt-2 max-w-3xl text-3xl font-black leading-[.9] tracking-[-.07em] sm:text-5xl lg:text-6xl">
                From your feed
                <span className="text-white/35"> to your shop.</span>
              </h2>
            </div>

            <div className="hidden items-center gap-2 pb-1 text-[9px] font-black uppercase tracking-[.18em] text-white/35 sm:flex">
              <span>Keep scrolling</span>
              <ArrowDown size={12} className="animate-bounce" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[.72fr_1.28fr] lg:items-stretch">
            <div className="flex min-h-0 flex-col justify-between rounded-[24px] border border-white/10 bg-white/[.035] p-2.5 sm:rounded-[26px] sm:p-3">
              <div className="space-y-1.5">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = active === index;

                  return (
                    <motion.div
                      key={step.number}
                      animate={{
                        opacity: isActive ? 1 : 0.38,
                        x: isActive ? 4 : 0,
                      }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="relative overflow-hidden rounded-[18px] border border-white/10"
                    >
                      <div
                        className={
                          "absolute inset-0 transition-opacity duration-500 " +
                          (isActive ? "bg-white/[.09] opacity-100" : "opacity-0")
                        }
                      />

                      <div className="relative flex gap-3 p-3 sm:p-3.5">
                        <div
                          className={
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-black transition sm:h-9 sm:w-9 " +
                            (isActive
                              ? "border-white bg-white text-black"
                              : "border-white/15 bg-white/5 text-white/45")
                          }
                        >
                          {step.number}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon size={12} className="text-white/55" />
                            <span className="text-[8px] font-black uppercase tracking-[.18em] text-white/40 sm:text-[9px]">
                              {step.label}
                            </span>
                          </div>
                          <h3 className="mt-1 text-base font-black tracking-[-.045em] sm:text-xl">
                            {step.title}
                          </h3>
                          <motion.p
                            animate={{
                              height: isActive ? "auto" : 0,
                              opacity: isActive ? 1 : 0,
                              marginTop: isActive ? 6 : 0,
                            }}
                            transition={{ duration: 0.4 }}
                            className="overflow-hidden text-xs leading-5 text-white/55 sm:text-sm sm:leading-5"
                          >
                            {step.text}
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="hidden px-2 pb-1 pt-3 text-[9px] font-bold uppercase tracking-[.16em] text-white/25 lg:block">
                <span>{String(active + 1).padStart(2, "0")}</span>
                <span className="mx-2">/</span>
                <span>03</span>
              </div>
            </div>

            <div className="relative min-w-0">
              <motion.div
                className="relative aspect-[1.55/1] max-h-[min(55vh,500px)] overflow-hidden rounded-[26px] border border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,.5)] sm:aspect-[1.7/1] sm:rounded-[28px]"
              >
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = active === index;

                  return (
                    <motion.div
                      key={step.number}
                      animate={{
                        opacity: isActive ? 1 : 0,
                        scale: isActive ? 1 : 1.035,
                      }}
                      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0"
                      aria-hidden={!isActive}
                    >
                      <motion.img
                        src={step.image}
                        alt=""
                        style={isActive ? { scale: imageScale, y: imageY } : undefined}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/5" />

                      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] backdrop-blur-md sm:left-6 sm:top-6 sm:px-4 sm:py-2 sm:text-[10px]">
                        <Icon size={12} />
                        {step.tag}
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-black text-white/45 sm:text-xs">
                              {step.number}
                            </span>
                            <h3 className="mt-1 max-w-2xl text-2xl font-black leading-[.95] tracking-[-.055em] sm:text-4xl lg:text-5xl">
                              {step.title}
                            </h3>
                          </div>
                          <div className="hidden rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.16em] text-white/65 backdrop-blur-md sm:block">
                            {step.label}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              <div className="mt-2 flex items-center justify-between text-[8px] font-bold uppercase tracking-[.15em] text-white/25 sm:text-[9px]">
                <span>Instagram content, reimagined for discovery</span>
                <span>{String(active + 1).padStart(2, "0")} / 03</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
