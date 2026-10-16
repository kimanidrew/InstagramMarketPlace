"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Instagram } from "lucide-react";
import { useRef } from "react";

type Store = {
  username: string;
  name?: string | null;
  biography?: string | null;
  profileImageUrl?: string | null;
  posts: { id: string }[];
};

export function StoreCarousel({ stores }: { stores: Store[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  if (!stores.length) return null;

  function move(direction: "left" | "right") {
    railRef.current?.scrollBy({
      left: direction === "right" ? 310 : -310,
      behavior: "smooth",
    });
  }

  return (
    <section className="overflow-hidden bg-[#f6f6f3] py-24">
      <div className="shell">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow plain">Meet the community</p>
            <h2 className="mt-4 max-w-2xl text-5xl font-black leading-[.95] tracking-[-.06em] sm:text-6xl">
              Stores worth
              <br />
              discovering.
            </h2>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <button type="button" onClick={() => move("left")} aria-label="Previous stores" className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition hover:-translate-y-0.5 hover:bg-black hover:text-white">
              <ArrowLeft size={17} />
            </button>
            <button type="button" onClick={() => move("right")} aria-label="Next stores" className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition hover:-translate-y-0.5 hover:bg-black hover:text-white">
              <ArrowRight size={17} />
            </button>
            <Link href="/stores" className="ml-2 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-bold text-white">
              View all stores <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div ref={railRef} className="hide-scrollbar mt-12 flex gap-5 overflow-x-auto scroll-smooth overscroll-x-contain">
          {stores.map((store, index) => (
            <motion.div key={store.username} className="w-[270px] shrink-0" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: .45, delay: index * .06 }}>
              <Link href={"/stores/" + store.username} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-white shadow-sm">
                  {store.profileImageUrl ? (
                    <img src={store.profileImageUrl} alt={store.name || "@" + store.username} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-black text-white"><Instagram size={42} /></div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-5 pt-20 text-white">
                    <p className="text-xs font-bold text-white/70">@{store.username}</p>
                    <h3 className="mt-1 text-xl font-black">{store.name || "Instagram Store"}</h3>
                    <p className="mt-2 text-xs text-white/75">{store.posts.length} {store.posts.length === 1 ? "product" : "products"}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <Link href="/stores" className="mt-7 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-bold text-white sm:hidden">
          View all stores <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
