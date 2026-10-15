"use client";

import { usePathname } from "next/navigation";
import { House, Search, Sparkles, Store, UserRound } from "lucide-react";

const items = [
  { label: "Home", href: "/", icon: House },
  { label: "Shop", href: "/shop", icon: Search },
  { label: "For You", href: "/for-you", icon: Sparkles },
  { label: "Stores", href: "/stores", icon: Store },
  { label: "Account", href: "/account", icon: UserRound, requiresUser: true },
];

export function MobileBottomNav({ user }: { user: any }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[70] lg:hidden"
    >
      <div className="mobile-bottom-nav-inner">
        {items.map(({ label, href, icon: Icon, requiresUser }) => {
          const destination = requiresUser && !user ? "/login" : href;
          const active = href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(href + "/");

          return (
            <a
              key={label}
              href={destination}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={"mobile-bottom-nav-item " + (active ? "is-active" : "")}
            >
              <span className="mobile-bottom-nav-icon">
                <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
              </span>
              <span className="mobile-bottom-nav-label">{label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
