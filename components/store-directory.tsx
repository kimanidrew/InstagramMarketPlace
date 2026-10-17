"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Crown, Search, ArrowUpRight, PackageOpen, SlidersHorizontal, ArrowLeft, ArrowRight } from "lucide-react";

type StorePost = {
  id: string;
  mediaUrl: string | null;
  thumbnailUrl?: string | null;
  productTitle?: string | null;
  productSlug?: string | null;
  category?: string | null;
  subcategory?: string | null;
  mediaType?: string | null;
  listingType?: string | null;
};
type StoreEntry = {
  store: {
    id: string;
    username: string;
    biography?: string | null;
    profileImageUrl?: string | null;
    verifiedAt?: string | Date | null;
    verifiedUntil?: string | Date | null;
    proUntil?: string | Date | null;
    paidPromotionActive?: boolean;
  };
  posts: StorePost[];
  activeVerified: boolean;
  activePro: boolean;
  promoted: boolean;
};

export function StoreDirectory({ stores }: { stores: StoreEntry[] }) {
  const [category, setCategory] = useState("All stores");
  const [query, setQuery] = useState("");
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [headerHidden, setHeaderHidden] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const updateScrollEdges = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth);
    setAtStart(element.scrollLeft <= 2);
    setAtEnd(maxScroll <= 2 || element.scrollLeft >= maxScroll - 2);
  }, []);
  const scrollCategories = (direction: "left" | "right") => {
    const element = scrollRef.current;
    if (!element) return;
    const amount = Math.max(element.clientWidth * 0.72, 220);
    element.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    stores.forEach(({ posts }) => posts.forEach((post) => {
      const name = post.category?.trim();
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    }));
    return ["All stores", ...Array.from(counts.keys()).sort((a, b) => a.localeCompare(b))];
  }, [stores]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    updateScrollEdges();
    const observer = new ResizeObserver(updateScrollEdges);
    observer.observe(element);
    window.addEventListener("resize", updateScrollEdges);
    const handleScroll = () => setHeaderHidden(!!document.querySelector(".site-header")?.classList.contains("is-hidden"));
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => { observer.disconnect(); window.removeEventListener("resize", updateScrollEdges); window.removeEventListener("scroll", handleScroll); };
  }, [updateScrollEdges, categories.length]);

  const filtered = useMemo(() => stores.filter(({ store, posts }) => {
    const matchingPosts = category === "All stores" || posts.some((post) => post.category?.trim() === category);
    const text = query.trim().toLowerCase();
    const matchingText = !text || store.username.toLowerCase().includes(text) ||
      (store.biography || "").toLowerCase().includes(text) ||
      posts.some((post) => [post.productTitle, post.category, post.subcategory].some((value) => value?.toLowerCase().includes(text)));
    return matchingPosts && matchingText;
  }), [stores, category, query]);

  return (
    <div className="store-directory">
      <section className="store-directory-hero">
        <div className="store-directory-hero-copy">
          <span className="store-directory-eyebrow">THE SOKOLINK COMMUNITY</span>
          <h1>Find your next<br /><span>favourite shop.</span></h1>
          <p>Explore independent Instagram shops, browse their latest finds, and discover something worth keeping.</p>
          <div className="store-directory-summary">
            <span><b>{stores.length}</b> shops to explore</span>
            <i />
            <span><b>{stores.reduce((total, item) => total + item.posts.length, 0)}</b> listings to discover</span>
          </div>
        </div>
        <div className="store-directory-hero-art" aria-hidden="true">
          <div className="store-directory-art-card store-directory-art-card-back"><span>DISCOVER</span><b>Good finds.<br />Great shops.</b><div className="store-directory-art-swatch" /></div>
          <div className="store-directory-art-card store-directory-art-card-front"><span>YOUR NEXT FIND</span><div className="store-directory-art-shapes"><i /><i /><i /></div><b>Made to be<br />discovered.</b></div>
        </div>
      </section>

      <section className={`store-directory-tools${headerHidden ? " is-header-hidden" : ""}`} aria-label="Filter shops">
        <div className="store-directory-filter-bar">
          <div className="store-directory-tools-top">
            <div>
              <span className="store-directory-eyebrow">BROWSE BY CATEGORY</span>
              <h2>Explore the shops</h2>
            </div>
            <label className="store-directory-search">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shops or products" aria-label="Search shops or products" />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
            </label>
          </div>
          <div className={`store-directory-category-scroller${atStart ? " is-at-start" : ""}`}>
            {!atStart && <span className="store-directory-category-fade store-directory-category-fade-left" aria-hidden="true" />}
            {!atEnd && <span className="store-directory-category-fade store-directory-category-fade-right" aria-hidden="true" />}
            {!atStart && <button type="button" onClick={() => scrollCategories("left")} aria-label="Scroll categories left" className="for-you-filter-scroll-button left-2"><ArrowLeft size={16} /></button>}
            {!atEnd && <button type="button" onClick={() => scrollCategories("right")} aria-label="Scroll categories right" className="for-you-filter-scroll-button right-2"><ArrowRight size={16} /></button>}
            <div ref={scrollRef} onScroll={updateScrollEdges} className="store-directory-category-row hide-scrollbar" role="group" aria-label="Shop categories">
              {categories.map((name) => (
                <button type="button" key={name} onClick={() => setCategory(name)} className={"store-directory-category" + (category === name ? " is-active" : "")} aria-pressed={category === name}>
                  {name}
                  {name === "All stores" && <span>{stores.length}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="store-directory-results">
        <div className="store-directory-results-head">
          <div><span className="store-directory-eyebrow">{category === "All stores" ? "CURATED FOR YOU" : "SHOP BY CATEGORY"}</span><h2>{category === "All stores" ? "Shops worth a look" : category}</h2></div>
          <span className="store-directory-result-count">{filtered.length} {filtered.length === 1 ? "shop" : "shops"}</span>
        </div>
        {filtered.length ? (
          <div className="store-directory-grid">
            {filtered.map(({ store, posts, activeVerified, activePro, promoted }) => {
              const visiblePosts = category === "All stores" ? posts.slice(0, 4) : posts.filter((post) => post.category?.trim() === category).slice(0, 4);
              return (
                <article key={store.id} className="store-directory-card">
                  <Link href={"/stores/" + store.username} className="store-directory-card-head">
                    <div className={"store-directory-avatar" + (activeVerified ? " is-verified" : "")}>
                      {store.profileImageUrl ? <img src={store.profileImageUrl} alt={"@" + store.username} loading="lazy" /> : <span>{store.username.slice(0, 1).toUpperCase()}</span>}
                      {activeVerified && <BadgeCheck className="store-directory-avatar-check" size={19} fill="white" />}
                    </div>
                    <div className="store-directory-store-copy">
                      <div className="store-directory-username">@{store.username}{activeVerified && <BadgeCheck size={15} className="store-directory-verified-icon" fill="currentColor" />}</div>
                      <div className="store-directory-store-meta">{posts.length} {posts.length === 1 ? "listing" : "listings"}{activePro && <span className="store-directory-pro"><Crown size={11} /> Pro</span>}</div>
                    </div>
                    <span className="store-directory-open"><ArrowUpRight size={16} /></span>
                  </Link>
                  {store.biography && <p className="store-directory-bio">{store.biography}</p>}
                  <div className="store-directory-products">
                    {visiblePosts.map((post) => {
                      const image = post.thumbnailUrl || post.mediaUrl;
                      const href = "/" + (String(post.listingType).toUpperCase() === "SERVICE" ? "service" : "product") + "/" + (post.productSlug || post.id);
                      return (
                        <Link href={href} key={post.id} className="store-directory-product" title={post.productTitle || "View listing"}>
                          {image ? <img src={image} alt={post.productTitle || "Shop listing"} loading="lazy" /> : <span className="store-directory-product-empty"><PackageOpen size={20} /></span>}
                          <span className="store-directory-product-shade" />
                          <span className="store-directory-product-title">{post.productTitle || post.category || "View listing"}</span>
                        </Link>
                      );
                    })}
                    {visiblePosts.length === 0 && <div className="store-directory-no-products">No listings in this category yet.</div>}
                  </div>
                  <div className="store-directory-card-foot">
                    <span>{visiblePosts.length} featured {visiblePosts.length === 1 ? "listing" : "listings"}</span>
                    {promoted && <span className="store-directory-promoted">Promoted</span>}
                    <Link href={"/stores/" + store.username}>Visit shop <ArrowUpRight size={13} /></Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="store-directory-empty"><Search size={24} /><h3>No shops found</h3><p>Try another search or choose a different category.</p><button type="button" onClick={() => { setCategory("All stores"); setQuery(""); }}>Clear filters</button></div>
        )}
      </section>
    </div>
  );
}
