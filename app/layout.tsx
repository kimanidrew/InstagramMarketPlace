import type { Metadata } from "next";
import "./globals.css";
import "./seller-modal.css";
import Link from "next/link";
import { user } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { BrandWordmark } from "@/components/brand-wordmark";
import { GlobalFeedbackProvider } from "@/components/global-feedback-provider";
import { NavigationProgress } from "@/components/navigation-progress";

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "Shlip";
const brandFont = (process.env.NEXT_PUBLIC_BRAND_FONT_FAMILY || "Space Grotesk").replace(/[^a-zA-Z0-9 -]/g, "").trim() || "Space Grotesk";
const brandFontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(brandFont).replace(/%20/g, "+")}:wght@400;500;600;700&display=swap`;

export const metadata: Metadata = {
  title: `${brandName} | Social Shopping`,
  description: "Discover products, connect with stores, and shop socially with " + brandName + ".",
};

export default async function Layout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  const u = await user();

  return (
    <html lang="en">
      <head><link rel="stylesheet" href={brandFontUrl} /></head>
      <body className="pb-24 lg:pb-0">
        <NavigationProgress />
        <GlobalFeedbackProvider>
          <SiteHeader user={u} />
          {children}
          {modal}

          <footer className="sokolink-footer">
            <div className="shell">
              <div className="sokolink-footer-main">
                <div className="sokolink-footer-brand-column">
                  <Link href="/" className="footer-brand-link" aria-label={brandName + " home"}>
                    <BrandWordmark />
                  </Link>
                  <span className="sokolink-footer-tagline">GOOD FINDS. REAL STORES.</span>
                  <p className="sokolink-footer-description">
                    Discover products from real Instagram stores, find your next favourite, and connect directly with the people behind every shop.
                  </p>
                </div>

                <div className="sokolink-footer-links">
                  <div className="sokolink-footer-link-group">
                    <p className="sokolink-footer-heading">Explore</p>
                    <Link href="/products">All products</Link>
                    <Link href="/stores">Stores</Link>
                    <Link href="/categories">Categories</Link>
                  </div>
                  <div className="sokolink-footer-link-group">
                    <p className="sokolink-footer-heading">Your Shlip</p>
                    <Link href="/wishlist">Saved favourites</Link>
                    <Link href="/how-it-works">How it works</Link>
                    <Link href="/signup">Create an account</Link>
                    <Link href="/account">My account</Link>
                  </div>
                </div>
              </div>

              <div className="sokolink-footer-bottom">
                <p>{brandName} © {new Date().getFullYear()} <span className="sokolink-footer-dot">·</span> Social shopping, connected.</p>
                <p className="sokolink-footer-note"><span aria-hidden="true">✦</span> Discover something worth sharing.</p>
              </div>
            </div>
          </footer>
          <MobileBottomNav user={u} />
        </GlobalFeedbackProvider>
      </body>
    </html>
  );
}
