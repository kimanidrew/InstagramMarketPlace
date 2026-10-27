"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Bookmark, Search, X, Sparkles, Store, UserRound, Compass, Heart, CircleHelp, ShoppingBag, BriefcaseBusiness } from "lucide-react";
import { NotificationBell } from "@/components/notification-center";
import { BrandWordmark } from "@/components/brand-wordmark";

export function SiteHeader({ user }: { user: any }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingTags, setTrendingTags] = useState<Array<{ name: string; productCount: number }>>([]);
  const [trendingTagsLoading, setTrendingTagsLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [activeSuggestionTab, setActiveSuggestionTab] = useState<"Products" | "Services" | "Categories" | "Stores" | "Pages">("Products");
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setHeaderHidden(false);
      return;
    }

    let previousY = window.scrollY;
    const handleScroll = () => {
      const currentY = Math.max(0, window.scrollY);
      setAtTop(currentY <= 0);
      const difference = currentY - previousY;

      if (currentY < 80) {
        setHeaderHidden(false);
      } else if (difference > 6) {
        setHeaderHidden(true);
      } else if (difference < -6) {
        setHeaderHidden(false);
      }

      previousY = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [searchOpen]);

  useEffect(() => {
    const lockPageScroll = searchOpen && searchQuery.trim().length >= 2;
    if (!lockPageScroll) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [searchOpen, searchQuery]);

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

  const productSuggestions = searchSuggestions.filter((item: any) => String(item.listingType || "").toUpperCase() !== "SERVICE");
  const serviceSuggestions = searchSuggestions.filter((item: any) => String(item.listingType || "").toUpperCase() === "SERVICE");

  const searchablePages = [
    { title: "Shop", description: "Browse all products and listings", href: "/shop", terms: "shop products marketplace listings browse", icon: ShoppingBag },
    { title: "For You", description: "Personalised picks and recommendations", href: "/for-you", terms: "for you personalised recommendations interests", icon: Compass },
    { title: "Stores", description: "Discover Instagram shops and sellers", href: "/stores", terms: "stores shops sellers instagram businesses", icon: Store },
    { title: "Categories", description: "Explore products by category", href: "/categories", terms: "categories types collections explore", icon: Sparkles },
    { title: "How it works", description: "Learn how SokoLink works", href: "/how-it-works", terms: "help guide how it works about getting started", icon: CircleHelp },
    { title: "Wishlist", description: "Return to your saved listings", href: "/wishlist", terms: "wishlist saved favourites favorites", icon: Heart },
    ...(user ? [{ title: "Grow your own shop", description: "Manage your shop growth and analytics", href: "/account/analytics", terms: "grow shop seller analytics promotions insights", icon: BriefcaseBusiness }] : []),
  ];
  const pageSuggestions = searchablePages.filter((page) => (page.title + " " + page.description + " " + page.terms).toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 6);

  const categoryMap = new Map<string, { name: string }>();
  searchSuggestions.forEach((item: any) => {
    (item.tags || []).forEach((tag: any) => {
      const name = String(tag.name || "").replace(/^#/, "");
      if (name && !categoryMap.has(name.toLowerCase())) categoryMap.set(name.toLowerCase(), { name });
    });
  });
  const categorySuggestions = Array.from(categoryMap.values()).slice(0, 6);

  const storeMap = new Map<string, any>();
  searchSuggestions.forEach((item: any) => {
    const store = item.connection;
    if (store?.username && !storeMap.has(String(store.username).toLowerCase())) {
      storeMap.set(String(store.username).toLowerCase(), store);
    }
  });
  const storeSuggestions = Array.from(storeMap.values()).slice(0, 6);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className={"site-header sticky top-0 z-50 " + (searchOpen ? "search-overlay-open" : headerHidden ? "is-hidden" : "") + (atTop ? " is-at-top" : "")}>
      <div className="shell flex h-[74px] items-center gap-4">
        <Link href="/" className="brand shrink-0">
          <BrandWordmark />
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {[
            ["/shop", "Shop"],
            ["/for-you", "For You"],
            ["/stores", "Stores"],
            ["/categories", "Categories"],
            ["/how-it-works", "How it works"],
          ].map(([href, label]) => {
            const active = pathname === href || (href !== "/shop" && pathname.startsWith(href + "/"));
            return (
              <Link key={href} href={href} className={"nav-link" + (active ? " is-active" : "")} aria-current={active ? "page" : undefined}>{label}</Link>
            );
          })}
          {user && (() => {
            const active = pathname === "/account/analytics" || pathname.startsWith("/account/analytics/");
            return <Link href="/account/analytics" className={"nav-link" + (active ? " is-active" : "")} aria-current={active ? "page" : undefined}>Grow your own shop</Link>;
          })()}
        </nav>

        <div className="ml-auto flex items-center gap-1">
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

          <button type="button" onClick={() => setSearchOpen((open) => !open)} className={"icon-btn " + (searchOpen ? "active" : "")} aria-label={searchOpen ? "Close search" : "Open search"} aria-expanded={searchOpen} aria-controls="header-search-panel" title="Search">
            {searchOpen ? <X size={20} strokeWidth={2.2} /> : <Search size={19} />}
          </button>
        </div>
      </div>

      {searchOpen && searchQuery.trim().length >= 2 && <div className="header-suggestions-backdrop" aria-hidden="true" />}

      <div id="header-search-panel" className={"header-search-panel " + (searchOpen ? "is-open" : "") + (searchOpen && searchQuery.trim().length >= 2 ? " has-suggestions" : "")} aria-hidden={!searchOpen}>
        <div className="shell header-search-content">
          <form action="/search" className="header-search-form" onSubmit={() => setSearchOpen(false)}>
            <Search size={19} className="shrink-0 text-[#888]" />
            <input
              ref={searchInputRef}
              type="search"
              name="q"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search anything on SokoLink..."
              aria-label="Search anything on SokoLink"
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
          {(trendingTagsLoading || trendingTags.length > 0) && (
            <div className="header-trending-tags" aria-busy={trendingTagsLoading}>
              <div className="header-trending-list">
                {trendingTagsLoading ? (
<span className="header-trending-loading-dots" role="status" aria-label="Loading trending categories"><i /><i /><i /></span>
                ) : trendingTags.map((tag) => (
                  <a key={tag.name} href={`/search?tag=${encodeURIComponent(tag.name)}`} onClick={() => setSearchOpen(false)} className="header-trending-tag">
                    <span>{tag.name.startsWith("#") ? tag.name : `#${tag.name}`}</span>
                    <small>{tag.productCount}</small>
                  </a>
                ))}
              </div>
            </div>
          )}
          {searchOpen && searchQuery.trim().length >= 2 && (
            <div className="header-search-suggestions" role="region" aria-label="Search suggestions">
              <div className="header-suggestion-layout">
                <aside className="header-suggestion-sidebar" aria-label="Suggestion categories">
                  <div className="header-suggestion-tabs" role="tablist" aria-label="Suggestion type">
                    {(["Products", "Services", "Categories", "Stores", "Pages"] as const).map((tab) => {
                      const count = tab === "Products" ? productSuggestions.length : tab === "Services" ? serviceSuggestions.length : tab === "Categories" ? categorySuggestions.length : tab === "Stores" ? storeSuggestions.length : pageSuggestions.length;
                      return (
                        <button
                          key={tab}
                          type="button"
                          role="tab"
                          aria-selected={activeSuggestionTab === tab}
                          className={"header-suggestion-tab " + (activeSuggestionTab === tab ? "active" : "")}
                          onClick={() => setActiveSuggestionTab(tab)}
                        >
                          {tab}<span>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </aside>
                <div className="header-suggestion-results">
              <div className="header-suggestions-label">
                {suggestionsLoading ? "Finding matches…" : activeSuggestionTab === "Products" ? "PRODUCT MATCHES" : activeSuggestionTab === "Services" ? "SERVICE MATCHES" : activeSuggestionTab === "Categories" ? "MATCHING CATEGORIES" : activeSuggestionTab === "Stores" ? "MATCHING STORES" : "SOKOLINK PAGES"}
              </div>
              {suggestionsLoading ? (
                <div className="header-suggestions-loading"><span /><span /><span /></div>
              ) : activeSuggestionTab === "Products" ? (
                productSuggestions.length ? <div className="header-suggestion-product-grid">{productSuggestions.map((item: any) => {
                  const image = item.thumbnailUrl || item.mediaUrl;
                  const username = item.connection?.username || item.username || "Instagram shop";
                  const profileImage = item.connection?.profileImageUrl;
                  const title = item.productTitle || item.caption?.split("\\n")[0] || "View product";
                  return (
                    <a key={item.id} href={`/${String(item.listingType || "").toUpperCase() === "SERVICE" ? "service" : "product"}/${item.productSlug}`} className="header-suggestion-item" onClick={() => setSearchOpen(false)}>
                      <span className="header-suggestion-image">{image ? <img src={image} alt="" loading="lazy" /> : <span className="header-suggestion-placeholder"><Store size={18} /></span>}</span>
                      <span className="header-suggestion-copy"><strong>{title}</strong><small><span className="header-suggestion-avatar">{profileImage ? <img src={profileImage} alt="" loading="lazy" /> : (username[0] || "S").toUpperCase()}</span>@{username}</small></span>
                      <ArrowRight size={16} className="header-suggestion-arrow" />
                    </a>
                  );
                })}</div> : <p className="header-suggestions-empty">No matching products yet. Try another search.</p>
              ) : activeSuggestionTab === "Services" ? (
                serviceSuggestions.length ? <div className="header-suggestion-product-grid">{serviceSuggestions.map((item: any) => {
                  const image = item.thumbnailUrl || item.mediaUrl;
                  const username = item.connection?.username || item.username || "Instagram shop";
                  const profileImage = item.connection?.profileImageUrl;
                  const title = item.productTitle || item.caption?.split("\\n")[0] || "View service";
                  return (
                    <a key={item.id} href={`/service/${item.productSlug}`} className="header-suggestion-item header-suggestion-service-card" onClick={() => setSearchOpen(false)}>
                      <span className="header-suggestion-image">{image ? <img src={image} alt="" loading="lazy" /> : <span className="header-suggestion-placeholder"><BriefcaseBusiness size={18} /></span>}</span>
                      <span className="header-suggestion-copy"><strong>{title}</strong><small><span className="header-suggestion-avatar">{profileImage ? <img src={profileImage} alt="" loading="lazy" /> : (username[0] || "S").toUpperCase()}</span>@{username}<em>Service</em></small></span>
                      <ArrowRight size={16} className="header-suggestion-arrow" />
                    </a>
                  );
                })}</div> : <p className="header-suggestions-empty">No matching services yet. Try another search.</p>
              ) : activeSuggestionTab === "Pages" ? (
                pageSuggestions.length ? pageSuggestions.map((page: any) => { const Icon = page.icon; return <a key={page.href} href={page.href} className="header-suggestion-item header-suggestion-category" onClick={() => setSearchOpen(false)}><span className="header-suggestion-image header-suggestion-category-icon"><Icon size={19} /></span><span className="header-suggestion-copy"><strong>{page.title}</strong><small>{page.description}</small></span><ArrowRight size={16} className="header-suggestion-arrow" /></a>; }) : <p className="header-suggestions-empty">No matching SokoLink pages. Try another search.</p>
              ) : activeSuggestionTab === "Categories" ? (
                categorySuggestions.length ? categorySuggestions.map((category: any) => (
                  <a key={category.name} href={`/search?tag=${encodeURIComponent(category.name)}`} className="header-suggestion-item header-suggestion-category" onClick={() => setSearchOpen(false)}>
                    <span className="header-suggestion-image header-suggestion-category-icon"><Sparkles size={19} /></span>
                    <span className="header-suggestion-copy"><strong>#{category.name}</strong><small>Browse products in this category</small></span>
                    <ArrowRight size={16} className="header-suggestion-arrow" />
                  </a>
                )) : <p className="header-suggestions-empty">No matching categories in these results yet.</p>
              ) : (
                storeSuggestions.length ? storeSuggestions.map((store: any) => (
                  <a key={store.id || store.username} href={`/stores/${encodeURIComponent(store.username)}`} className="header-suggestion-item header-suggestion-store" onClick={() => setSearchOpen(false)}>
                    <span className="header-suggestion-image header-suggestion-store-image">{store.profileImageUrl ? <img src={store.profileImageUrl} alt="" loading="lazy" /> : <Store size={19} />}</span>
                    <span className="header-suggestion-copy"><strong>@{store.username}</strong><small>View Instagram shop</small></span>
                    <ArrowRight size={16} className="header-suggestion-arrow" />
                  </a>
                )) : <p className="header-suggestions-empty">No matching stores in these results yet.</p>
              )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
