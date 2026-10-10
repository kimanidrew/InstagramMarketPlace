import type { Metadata } from "next";
import "./globals.css";
import "./seller-modal.css";
import Link from "next/link";
import { user } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export const metadata: Metadata = {
  title: "Instagram Market",
  description: "Shop products discovered from Instagram stores.",
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const u = await user();

  return (
    <html lang="en">
      <body className="pb-24 lg:pb-0">
        <ScrollToTop />
        <SiteHeader user={u} />
        {children}

        <footer className="mt-24 border-t border-black/5 bg-[#fafaf8]">
          <div className="shell grid gap-10 py-14 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link href="/" className="text-2xl font-black tracking-[-.06em]">
                instagram<span className="text-[#777]">market</span><sup className="text-[8px]">®</sup>
              </Link>
              <p className="mt-4 max-w-md text-sm leading-7 text-[#777]">
                A curated shopping experience built from real Instagram stores. Discover products, explore shops and jump straight to the original post.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em]">Shop</p>
              <div className="mt-4 space-y-3 text-sm text-[#666]">
                <Link className="block" href="/products">All products</Link>
                <Link className="block" href="/stores">Stores</Link>
                <Link className="block" href="/categories">Categories</Link>
                <Link className="block" href="/wishlist">Wishlist</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em]">About</p>
              <div className="mt-4 space-y-3 text-sm text-[#666]">
                <Link className="block" href="/how-it-works">How it works</Link>
                <Link className="block" href="/signup">Create account</Link>
                <Link className="block" href="/account">My account</Link>
              </div>
            </div>
          </div>
          <div className="shell border-t border-black/5 py-5 text-xs text-[#999]">
            Instagram Market © 2026 · Instagram-powered marketplace
          </div>
        </footer>
        <MobileBottomNav user={u} />
      </body>
    </html>
  );
}
