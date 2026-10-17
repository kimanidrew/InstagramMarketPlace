import type { Metadata } from "next";
import "./globals.css";
import "./seller-modal.css";
import Link from "next/link";
import { user } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { BrandWordmark } from "@/components/brand-wordmark";
import { GlobalFeedbackProvider } from "@/components/global-feedback-provider";
import { PageLoadGate } from "@/components/page-load-gate";

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "SokoLink";
const brandFont = (process.env.NEXT_PUBLIC_BRAND_FONT_FAMILY || "Montserrat").replace(/[^a-zA-Z0-9 -]/g, "").trim() || "Space Grotesk";
const brandFontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(brandFont).replace(/%20/g, "+")}:ital,wght@1,400;1,500;1,600;1,700;1,800&display=swap`;

export const metadata: Metadata = {
  title: `${brandName} | Social Shopping`,
  description: "Discover products, connect with stores, and shop socially with " + brandName + ".",
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const u = await user();

  return (
    <html lang="en">
      <head><link rel="stylesheet" href={brandFontUrl} /></head>
      <body className="pb-24 lg:pb-0">
        <PageLoadGate />
        <GlobalFeedbackProvider>
          <SiteHeader user={u} />
          {children}

        <footer className="mt-24 border-t border-black/5 bg-[#fafaf8]">
          <div className="shell grid gap-10 py-14 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link href="/" className="footer-brand-link"><BrandWordmark /></Link>
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
            {brandName} © 2026 · Social shopping, connected
          </div>
        </footer>
          <MobileBottomNav user={u} />
        </GlobalFeedbackProvider>
      </body>
    </html>
  );
}
