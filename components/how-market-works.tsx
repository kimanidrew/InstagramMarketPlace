"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowDown, ArrowRight, Instagram, Search, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NAVBAR_HEIGHT = 74;

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
  const snapping = useRef(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(steps.length - 1, Math.floor(value * steps.length));
    setActive(next);
  });

  useEffect(() => {
    const section = ref.current;
    if (!section) return;

    const snapToStep = () => {
      if (snapping.current) return;

      const rect = section.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const sectionHeight = section.offsetHeight;
      const viewport = window.innerHeight - NAVBAR_HEIGHT;

      if (viewport <= 0 || rect.bottom < 0 || rect.top > window.innerHeight) return;

      const progress = Math.max(
        0,
        Math.min(1, (window.scrollY - sectionTop) / Math.max(1, sectionHeight - viewport)),
      );

      const index = Math.max(0, Math.min(steps.length - 1, Math.round(progress * (steps.length - 1))));
      const target = sectionTop + (sectionHeight - viewport) * (index / (steps.length - 1));

      if (Math.abs(window.scrollY - target) < 18) return;

      snapping.current = true;
      window.scrollTo({ top: target, behavior: "smooth" });

      window.setTimeout(() => {
        snapping.current = false;
      }, 650);
    };

    let timer: number | undefined;
    const onScrollEnd = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(snapToStep, 90);
    };

    window.addEventListener("scroll", onScrollEnd, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScrollEnd);
    };
  }, []);

  return (
    <section
      ref={ref}
      className="how-works-section relative bg-[#111] text-white"
      style={{ height: "300vh" }}
    >
      <div className="sticky top-0 flex h-[calc(100vh-74px)] min-h-[560px] max-h-[900px] items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_45%,rgba(255,255,255,.09),transparent_28%),linear-gradient(120deg,#090909,#181818)]" />

        <div className="shell relative z-10 w-full py-5 sm:py-7">
          <div className="mb-4 flex items-end justify-between gap-5 sm:mb-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.24em] text-white/40 sm:text-[10px]">
                How Instagram Market works
              </p>
              <h2 className="mt-2 max-w-3xl text-3xl font-black leading-[.9] tracking-[-.07em] sm:text-5xl lg:text-6xl">
                One post.
                <span className="text-white/35"> Three simple steps.</span>
              </h2>
            </div>

            <div className="hidden items-center gap-2 pb-1 text-[9px] font-black uppercase tracking-[.18em] text-white/35 sm:flex">
              <span>Scroll to explore</span>
              <ArrowDown size={12} className="animate-bounce" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr] lg:items-stretch">
            <div className="relative order-2 overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,.45)] lg:order-1">
              <div className="relative aspect-[1.35/1] sm:aspect-[1.65/1] lg:aspect-[1.35/1]">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = active === index;

                  return (
                    <motion.div
                      key={step.number}
                      animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 1.035 }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0"
                      aria-hidden={!isActive}
                    >
                      <img src={step.image} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/5" />
                      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] backdrop-blur-md sm:left-6 sm:top-6">
                        <Icon size={12} />
                        {step.tag}
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                        <p className="text-[10px] font-black uppercase tracking-[.16em] text-white/45">{step.number}</p>
                        <h3 className="mt-1 max-w-xl text-2xl font-black leading-[.94] tracking-[-.055em] sm:text-4xl lg:text-5xl">
                          {step.title}
                        </h3>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="order-1 flex min-h-0 flex-col justify-between rounded-[28px] border border-white/10 bg-white/[.035] p-4 sm:p-5 lg:order-2 lg:p-6">
              <div>
                <p className="max-w-xs text-sm leading-6 text-white/45 sm:text-base">
                  Instagram is where discovery starts. Instagram Market turns that discovery into a simple shopping journey.
                </p>

                <div className="mt-5 space-y-2 sm:mt-7">
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
                        className="relative overflow-hidden rounded-[20px] border border-white/10"
                      >
                        <div className={"absolute inset-0 transition-opacity duration-500 " + (isActive ? "bg-white/[.08] opacity-100" : "opacity-0")} />
                        <div className="relative flex gap-3 p-3.5 sm:p-4">
                          <div className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[10px] font-black " + (isActive ? "border-white bg-white text-black" : "border-white/15 bg-white/5 text-white/45")}>
                            {step.number}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Icon size={12} className="text-white/55" />
                              <span className="text-[8px] font-black uppercase tracking-[.18em] text-white/40 sm:text-[9px]">{step.label}</span>
                            </div>
                            <h3 className="mt-1 text-base font-black tracking-[-.045em] sm:text-lg">{step.title}</h3>
                            <motion.p
                              animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0, marginTop: isActive ? 6 : 0 }}
                              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden text-xs leading-5 text-white/50 sm:text-sm"
                            >
                              {step.text}
                            </motion.p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[.16em] text-white/30">
                  <span>Instagram content, reimagined</span>
                  <span>{String(active + 1).padStart(2, "0")} / 03</span>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {steps.map((step, index) => (
                    <div key={step.number} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        animate={{ width: index <= active ? "100%" : "0%" }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full bg-white"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.14em] text-white/25">
                  <ArrowRight size={11} />
                  <span>Keep scrolling — the section snaps to each step</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
