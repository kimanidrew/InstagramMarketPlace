"use client";

import Link from "next/link";
import { Bookmark, Store, PersonStanding } from "lucide-react";

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
          {user && <Link href="/account/grow" className="nav-link">Grow your shop</Link>}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link href={user ? "/wishlist" : "/login"} className="icon-btn hidden sm:flex" aria-label="Wishlist" title="Wishlist">
            <Bookmark size={19} />
          </Link>
          <Link href={user ? "/account" : "/login"} className="icon-btn" aria-label="Account">
            <PersonStanding size={19} />
          </Link>
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="icon-btn hidden md:flex" aria-label="Admin">
              <Store size={19} />
            </Link>
          )}

        </div>
      </div>


 
    </header>
  );
}
