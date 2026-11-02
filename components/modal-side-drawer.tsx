"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Compass, Store, ShoppingBag, Heart, UserRound } from "lucide-react";
const items = [
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/for-you", label: "For you", icon: Compass },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/", label: "Home", icon: Home },
  { href: "/account", label: "My account", icon: UserRound },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
];
export function ModalSideDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return <>
    <button type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(v => !v)}
      className="sokolink-modal-menu-trigger fixed left-4 top-4 z-[10003] flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-lg backdrop-blur transition hover:bg-black hover:text-white">
      {open ? <X size={20}/> : <Menu size={20}/>}
    </button>
    {open && <div className="fixed inset-0 z-[10004]">
      <button type="button" aria-label="Close navigation drawer" onClick={() => setOpen(false)} className="absolute inset-0 h-full w-full bg-black/45 backdrop-blur-[2px]"/>
      <aside aria-label="Main navigation" className="sokolink-modal-side-drawer absolute inset-y-0 left-0 flex w-[min(84vw,320px)] flex-col border-r border-black/10 bg-white px-5 pb-7 pt-20 shadow-2xl">
        <div className="mb-8 px-2"><div className="text-2xl font-black tracking-tight text-black">SokoLink</div><p className="mt-1 text-xs font-medium text-neutral-500">Discover. Connect. Shop.</p></div>
        <nav className="flex flex-col gap-1">
          {items.map(({href,label,icon:Icon}) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
            return <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-bold transition ${active ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-100 hover:text-black"}`}>
              <Icon size={19}/><span>{label}</span>
            </Link>;
          })}
        </nav>
        <div className="mt-auto border-t border-neutral-100 px-2 pt-5 text-xs text-neutral-400">SokoLink marketplace</div>
      </aside>
    </div>}
  </>;
}
