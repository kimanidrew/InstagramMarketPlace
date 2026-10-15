"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bookmark, Search, X, Sparkles, Store, UserRound } from "lucide-react";
import { NotificationBell } from "@/components/notification-center";
import { BrandWordmark } from "@/components/brand-wordmark";

export function SiteHeader({ user }: { user: any }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingTags, setTrendingTags] = useState<Array<{ name: string; productCount: number }>>([]);
  const [trendingTagsLoading, setTrendingTagsLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
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
    setTrendingTagsLoading(true);
    fetch("/api/trending-tags")
      .then((response) => response.ok ? response.json() : { tags: [] })
      .then((data) => {
        if (!cancelled) setTrendingTags(Array.isArray(data.tags) ? data.tags : []);
      })
      .catch(() => {
        if (!cancelled) setTrendingTags([]);
      })
      .finally(() => {
        if (!cancelled) setTrendingTagsLoading(false);
      });
    return () => { cancelled = true; };
  }, [searchOpen, trendingTags.length]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!searchOpen || query.length < 2) {
      setSearchSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const response = await fetch(`/api/products?q=${encodeURIComponent(query)}&page=0&limit=6`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Search suggestions request failed");
        const data = await response.json();
        if (!cancelled) setSearchSuggestions(Array.isArray(data.products) ? data.products.slice(0, 6) : []);
      } catch (error) {
        if (!cancelled && (error as Error).name !== "AbortError") setSearchSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, searchOpen]);

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
            {searchOpen ? <X size={20} strokeWidth={2.2} /> : <Search size={19} />}
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
            {searchQuery.length > 0 && (
              <button
                type="button"
                className="header-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search"
                title="Clear search"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            )}
            <button type="submit" disabled={!searchQuery.trim()} aria-label="Submit search">
              <span>Search</span><ArrowRight size={15} />
            </button>
          </form>
          {searchOpen && searchQuery.trim().length >= 2 && (
            <div className="header-search-suggestions" role="listbox" aria-label="Search suggestions">
              <div className="header-suggestions-label">{suggestionsLoading ? "Finding matches…" : searchSuggestions.length ? "SUGGESTED FOR YOU" : "No matching products yet"}</div>
              {suggestionsLoading ? (
                <div className="header-suggestions-loading"><span /><span /><span /></div>
              ) : searchSuggestions.map((item: any) => {
                const image = item.thumbnailUrl || item.mediaUrl;
                const username = item.connection?.username || item.username || "Instagram shop";
                const profileImage = item.connection?.profileImageUrl;
                const title = item.productTitle || item.caption?.split("\n")[0] || "View product";
                return (
                  <Link key={item.id} href={`/archive/${encodeURIComponent(item.id)}`} className="header-suggestion-item" onClick={() => setSearchOpen(false)}>
                    <span className="header-suggestion-image">{image ? <img src={image} alt="" loading="lazy" /> : <span className="header-suggestion-placeholder"><Store size={18} /></span>}</span>
                    <span className="header-suggestion-copy"><strong>{title}</strong><small><span className="header-suggestion-avatar">{profileImage ? <img src={profileImage} alt="" loading="lazy" /> : (username[0] || "S").toUpperCase()}</span>@{username}</small></span>
                    <ArrowRight size={16} className="header-suggestion-arrow" />
                  </Link>
                );
              })}
              {!suggestionsLoading && searchSuggestions.length === 0 && <p className="header-suggestions-empty">Try a product name, shop username or category.</p>}
            </div>
          )}
          {(trendingTagsLoading || trendingTags.length > 0) && (
            <div className="header-trending-tags" aria-busy={trendingTagsLoading}>
              <div className="header-trending-list">
                {trendingTagsLoading ? (
                  Array.from({ length: 6 }, (_, index) => (
                    <span key={index} className="header-trending-tag-skeleton" aria-hidden="true">
                      <span className={`header-trending-shimmer header-trending-shimmer-${index % 3}`} />
                      <span className="header-trending-count-shimmer" />
                    </span>
                  ))
                ) : trendingTags.map((tag) => (
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
