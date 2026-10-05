"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Instagram } from "lucide-react";

type Store = {
  username: string;
  name?: string | null;
  biography?: string | null;
  profileImageUrl?: string | null;
  posts: { id: string }[];
};

export function StoreCarousel({ stores }: { stores: Store[] }) {
  if (!stores.length) return null;

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
          <Link href="/stores" className="hidden items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-bold text-white sm:inline-flex">
            View all stores <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-12 overflow-visible">
          <motion.div
            className="flex gap-5"
            drag="x"
            dragConstraints={{ left: -Math.max(0, stores.length * 260 - 900), right: 0 }}
            whileTap={{ cursor: "grabbing" }}
          >
            {stores.map((store, index) => (
              <motion.div
                key={store.username}
                className="w-[270px] shrink-0"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: .45, delay: index * .06 }}
              >
                <Link href={"/store/" + store.username} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-white shadow-sm">
                    {store.profileImageUrl ? (
                      <img src={store.profileImageUrl} alt={store.name || "@" + store.username} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-black text-white">
                        <Instagram size={42} />
                      </div>
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
          </motion.div>
        </div>

        <Link href="/stores" className="mt-7 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-bold text-white sm:hidden">
          View all stores <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
