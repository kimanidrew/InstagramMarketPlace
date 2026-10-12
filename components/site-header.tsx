"use client";

import Link from "next/link";
import { Bookmark, Store, User } from "lucide-react";

export function SiteHeader({ user }: { user: any }) {

  return (
    <header className="site-header sticky top-0 z-50">
      <div className="shell flex h-[74px] items-center gap-4">
        <Link href="/" className="brand shrink-0">
          instagram<span>market</span><sup>®</sup>
        </Link>

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
            <User size={19} />
          </Link>
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="icon-btn hidden md:flex" aria-label="Admin">
              <Store size={19} />
            </Link>
          )}

        </div>
      </div>

      <div className="mobile-menu-panel">
        <div className="shell py-5">
          <div className="menu-label">Explore</div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/shop" className="menu-card" >Shop all</Link>
            <Link href="/stores" className="menu-card">Stores</Link>
            <Link href="/categories" className="menu-card">Categories</Link>
            <Link href="/how-it-works" className="menu-card">How it works</Link>
            {user && <Link href="/account" className="menu-card">Grow your shop</Link>}
          </div>
        </div>
      </div>
 
    </header>
  );
}
