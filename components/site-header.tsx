"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bookmark, Search, Sparkles, Store, UserRound, X } from "lucide-react";
import { NotificationBell } from "@/components/notification-center";
import { BrandWordmark } from "@/components/brand-wordmark";

export function SiteHeader({ user }: { user: any }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingTags, setTrendingTags] = useState<Array<{ name: string; productCount: number }>>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen || trendingTags.length > 0) return;
    let cancelled = false;
    fetch("/api/trending-tags")
      .then((response) => response.ok ? response.json() : { tags: [] })
      .then((data) => {
        if (!cancelled) setTrendingTags(Array.isArray(data.tags) ? data.tags : []);
      })
      .catch(() => {
        if (!cancelled) setTrendingTags([]);
      });
    return () => { cancelled = true; };
  }, [searchOpen, trendingTags.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="site-header sticky top-0 z-50">
      <div className="shell flex h-[74px] items-center gap-4">
        <Link href="/" className="brand shrink-0">
          <BrandWordmark />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {[
            ["/shop", "Shop"],
            ["/for-you", "For You"],
            ["/stores", "Stores"],
            ["/categories", "Categories"],
            ["/how-it-works", "How it works"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="nav-link">{label}</Link>
          ))}
          {user && <Link href="/account/analytics" className="nav-link">Grow your own shop</Link>}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => setSearchOpen((open) => !open)} className={"icon-btn " + (searchOpen ? "active" : "")} aria-label={searchOpen ? "Close search" : "Open search"} aria-expanded={searchOpen} aria-controls="header-search-panel" title="Search">
            {searchOpen ? <X size={19} /> : <Search size={19} />}
          </button>
          <Link href={user ? "/wishlist" : "/login"} className="icon-btn hidden sm:flex" aria-label="Wishlist" title="Wishlist">
            <Bookmark size={19} />
          </Link>
          {user && <NotificationBell userId={user.id} />}
          <Link href={user ? "/account" : "/login"} className="icon-btn" aria-label="Account">
            <UserRound size={19} />
          </Link>
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="icon-btn hidden md:flex" aria-label="Admin">
              <Store size={19} />
            </Link>
          )}

        </div>
      </div>

      <div id="header-search-panel" className={"header-search-panel " + (searchOpen ? "is-open" : "")} aria-hidden={!searchOpen}>
        <div className="shell header-search-content">
          <div className="header-search-intro">
            <span className="header-search-mark"><Sparkles size={14} /></span>
            <div>
              <p>YOUR NEXT FAVOURITE FIND</p>
              <span>Search across products, stores and categories.</span>
            </div>
          </div>
          <form action="/shop" className="header-search-form" onSubmit={() => setSearchOpen(false)}>
            <Search size={19} className="shrink-0 text-[#888]" />
            <input
              ref={searchInputRef}
              type="search"
              name="q"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products, stores or categories..."
              aria-label="Search products, stores or categories"
              tabIndex={searchOpen ? 0 : -1}
            />
            <button type="submit" disabled={!searchQuery.trim()} aria-label="Submit search">
              <span>Search</span><ArrowRight size={15} />
            </button>
          </form>
          {trendingTags.length > 0 && (
            <div className="header-trending-tags">
              <div className="header-trending-heading"><span>Trending tags</span><span>Most products first</span></div>
              <div className="header-trending-list">
                {trendingTags.map((tag) => (
                  <Link key={tag.name} href={`/shop?tag=${encodeURIComponent(tag.name)}`} onClick={() => setSearchOpen(false)} className="header-trending-tag">
                    <span>{tag.name.startsWith("#") ? tag.name : `#${tag.name}`}</span>
                    <small>{tag.productCount}</small>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
