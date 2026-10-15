"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Instagram, Store, ArrowLeft, ShieldCheck } from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/instagram", label: "Instagram connections", icon: Instagram, exact: false },
];

export default function AdminWorkspaceNav() {
  const pathname = usePathname();
  return (
    <header className="admin-workspace-nav">
      <Link href="/admin" className="admin-workspace-brand">
        <span className="admin-workspace-brand-mark"><ShieldCheck size={19} /></span>
        <span><b>SokoLink</b><small>ADMIN WORKSPACE</small></span>
      </Link>
      <nav className="admin-workspace-links" aria-label="Admin navigation">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}><Icon size={17} /><span>{item.label}</span></Link>;
        })}
      </nav>
      <Link href="/shop" className="admin-workspace-exit"><ArrowLeft size={15} /><span>View marketplace</span></Link>
    </header>
  );
}
