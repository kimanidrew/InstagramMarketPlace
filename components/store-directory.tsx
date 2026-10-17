"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Crown, ArrowUpRight, PackageOpen, Search, Sparkles } from "lucide-react";
import { CategoryFilterSection } from "@/components/category-filter-section";

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

function shuffleStores(items: StoreEntry[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function accentForStore(username: string) {
  const accents = ["#d9f0a5", "#f6c7a6", "#c9d8ff", "#f5bfdc", "#b9e7df", "#e8d4ff", "#f4df9b", "#c5e0b4"];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) | 0;
  return accents[Math.abs(hash) % accents.length];
}

const SEEN_STORES_KEY = "sokolink-stores-showcase-seen-v1";
const SHOWCASE_SIZE = 6;

function chooseShowcase(items: StoreEntry[], previouslySeen: string[]) {
  if (!items.length) return { selected: [] as StoreEntry[], seen: previouslySeen };
  const promoted = shuffleStores(items.filter((item) => item.promoted));
  const regular = shuffleStores(items.filter((item) => !item.promoted));
  const randomized = [...promoted, ...regular];
  const seen = new Set(previouslySeen);
  let fresh = randomized.filter((item) => !seen.has(item.store.id));
  if (!fresh.length) {
    seen.clear();
    fresh = randomized;
  }
  const selected = fresh.slice(0, SHOWCASE_SIZE);
  if (selected.length < SHOWCASE_SIZE) {
    const selectedIds = new Set(selected.map((item) => item.store.id));
    selected.push(...shuffleStores(randomized.filter((item) => !selectedIds.has(item.store.id))).slice(0, SHOWCASE_SIZE - selected.length));
  }
  selected.forEach((item) => seen.add(item.store.id));
  return { selected, seen: [...seen] };
}

export function StoreDirectory({ stores }: { stores: StoreEntry[] }) {
  const [category, setCategory] = useState("All stores");
  const [query, setQuery] = useState("");
  const [showcaseStores, setShowcaseStores] = useState<StoreEntry[]>([]);
  useEffect(() => {
    if (!stores.length) return;
    let previouslySeen: string[] = [];
    try {
      previouslySeen = JSON.parse(window.sessionStorage.getItem(SEEN_STORES_KEY) || "[]");
    } catch {
      previouslySeen = [];
    }
    const next = chooseShowcase(stores, previouslySeen);
    setShowcaseStores(next.selected);
    try {
      window.sessionStorage.setItem(SEEN_STORES_KEY, JSON.stringify(next.seen));
    } catch {
      // The showcase still works when session storage is unavailable.
    }
  }, [stores]);

  useEffect(() => {
    if (stores.length <= SHOWCASE_SIZE) return;
    const interval = window.setInterval(() => {
      let previouslySeen: string[] = [];
      try {
        previouslySeen = JSON.parse(window.sessionStorage.getItem(SEEN_STORES_KEY) || "[]");
      } catch {
        previouslySeen = [];
      }
      const next = chooseShowcase(stores, previouslySeen);
      setShowcaseStores(next.selected);
      try {
        window.sessionStorage.setItem(SEEN_STORES_KEY, JSON.stringify(next.seen));
      } catch {
        // The carousel can continue without session storage.
      }
    }, 5200);
    return () => window.clearInterval(interval);
  }, [stores]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    stores.forEach(({ posts }) => posts.forEach((post) => {
      const name = post.category?.trim();
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    }));
    return ["All stores", ...Array.from(counts.keys()).sort((a, b) => a.localeCompare(b))];
  }, [stores]);

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
      <section className="store-directory-hero store-directory-showcase" aria-label="Featured shops">
        <div className="store-directory-showcase-heading">
          <div>
            <span className="store-directory-eyebrow"><Sparkles size={12} /> THE SOKOLINK COMMUNITY</span>
            <h1>Meet your next<br /><span>favourite shops.</span></h1>
            <p>A rotating showcase of standout stores, with fresh finds picked just for your next browse.</p>
          </div>
          <div className="store-directory-showcase-count"><b>{stores.length}</b><span>shops to discover</span></div>
        </div>
        <div className="store-directory-showcase-stage" key={showcaseStores.map((item) => item.store.id).join("-")}>
          {showcaseStores.map(({ store, posts, promoted, activeVerified, activePro }, index) => {
            const firstPost = posts[0];
            const image = firstPost?.thumbnailUrl || firstPost?.mediaUrl;
            return (
              <Link
                key={store.id}
                href={"/stores/" + store.username}
                className="store-directory-showcase-card"
                style={{ "--store-accent": accentForStore(store.username), "--showcase-index": index } as React.CSSProperties}
              >
                <div className="store-directory-showcase-card-top">
                  <div className={"store-directory-showcase-avatar" + (activeVerified ? " is-verified" : "")}>
                    {store.profileImageUrl ? <img src={store.profileImageUrl} alt="" loading="lazy" /> : <span>{store.username.slice(0, 1).toUpperCase()}</span>}
                  </div>
                  <span className="store-directory-showcase-open"><ArrowUpRight size={14} /></span>
                </div>
                <div className="store-directory-showcase-image">
                  {image ? <img src={image} alt="" loading="lazy" /> : <span><PackageOpen size={24} /></span>}
                  <span className="store-directory-showcase-image-count">{posts.length} {posts.length === 1 ? "find" : "finds"}</span>
                </div>
                <div className="store-directory-showcase-card-bottom">
                  <div className="store-directory-showcase-name">@{store.username}{activeVerified && <BadgeCheck size={13} fill="currentColor" />}</div>
                  <div className="store-directory-showcase-badges">
                    {promoted && <span className="is-promoted">Promoted</span>}
                    {activePro && <span><Crown size={10} /> Pro</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="store-directory-showcase-footer"><span><i /> FRESH SHOPS, EVERY ROTATION</span><span>Curated for discovery <ArrowUpRight size={13} /></span></div>
      </section>

      <CategoryFilterSection
        eyebrow="BROWSE BY CATEGORY"
        title="Explore the shops"
        ariaLabel="Filter shops by category"
        selectedValue={category}
        onSelect={setCategory}
        items={categories.map((name) => ({ label: name, value: name, ...(name === "All stores" ? { count: stores.length } : {}) }))}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search shops or products"
        searchLabel="Search shops or products"
      />

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
