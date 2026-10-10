"use client";

import Link from "next/link";
import { Bookmark, Menu, Search, ShoppingBag, Store, UserCircle, X, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export function SiteHeader({ user }: { user: any }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [bagCount, setBagCount] = useState(0);

  useEffect(() => {
    const readBag = () => {
      try {
        const raw = localStorage.getItem("instagram-market-bag");
        const bag = raw ? JSON.parse(raw) : [];
        setBagCount(Array.isArray(bag) ? bag.reduce((sum, item) => sum + Number(item?.quantity || 1), 0) : 0);
      } catch { setBagCount(0); }
    };
    readBag();
    window.addEventListener("storage", readBag);
    window.addEventListener("bag-updated", readBag);
    return () => { window.removeEventListener("storage", readBag); window.removeEventListener("bag-updated", readBag); };
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    window.location.href = q ? "/shop?q=" + encodeURIComponent(q) : "/shop";
  }

  return (
    <header className="site-header sticky top-0 z-50">
      <div className="shell flex h-[74px] items-center gap-4">
        <Link href="/" className="brand shrink-0">
          instagram<span>market</span><sup>®</sup>
        </Link>

        <div className={"desktop-search-wrap " + (searchOpen ? "is-open" : "")}>
          <form onSubmit={submitSearch} className="desktop-search">
            <span className="search-icon-wrap"><Search size={16} strokeWidth={2.5} /></span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, stores & categories..."
              aria-label="Search products, stores and categories"
            />
            <span className="search-shortcut">⌘ K</span>
          </form>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {[
            ["/shop", "Shop"],
            ["/stores", "Stores"],
            ["/categories", "Categories"],
            ["/how-it-works", "How it works"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="nav-link">{label}</Link>
          ))}
          {user && <Link href="/account" className="nav-link">Grow your shop</Link>}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link href={user ? "/wishlist" : "/login"} className="icon-btn hidden sm:flex" aria-label="Wishlist" title="Wishlist">
            <Bookmark size={19} />
          </Link>
          <Link href={user ? "/account" : "/login"} className="icon-btn" aria-label="Account">
            <UserCircle size={19} />
          </Link>
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="icon-btn hidden md:flex" aria-label="Admin">
              <Store size={19} />
            </Link>
          )}
          <Link href="/shop" className="bag-btn" aria-label="Shop">
            <ShoppingBag size={18} />
          </Link>
          <button
            type="button"
            onClick={() => { setMenuOpen((v) => !v); setSearchOpen(false); }}
            className={"icon-btn lg:hidden " + (menuOpen ? "active" : "")}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      <div className={"mobile-search-panel " + (searchOpen ? "is-open" : "")}>
        <form onSubmit={submitSearch} className="shell">
          <div className="mobile-search-box">
            <Search size={20} />
            <input
              autoFocus={searchOpen}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for?"
              aria-label="Search"
            />
            <button type="submit" aria-label="Submit search"><ArrowRight size={19} /></button>
          </div>
          <div className="search-hints">
            <span>Try</span><Link href="/shop?tag=fashion">Fashion</Link>
            <Link href="/shop?tag=beauty">Beauty</Link>
            <Link href="/shop?tag=home">Home</Link>
            <Link href="/stores">Stores</Link>
          </div>
        </form>
      </div>

      <div className={"mobile-menu-panel " + (menuOpen ? "is-open" : "")}>
        <div className="shell py-5">
          <div className="menu-label">Explore</div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/shop" className="menu-card" onClick={() => setMenuOpen(false)}>Shop all</Link>
            <Link href="/stores" className="menu-card" onClick={() => setMenuOpen(false)}>Stores</Link>
            <Link href="/categories" className="menu-card" onClick={() => setMenuOpen(false)}>Categories</Link>
            <Link href="/how-it-works" className="menu-card" onClick={() => setMenuOpen(false)}>How it works</Link>
            {user && <Link href="/account" className="menu-card" onClick={() => setMenuOpen(false)}>Grow your shop</Link>}
          </div>
        </div>
      </div>
 
    </header>
  );
}
