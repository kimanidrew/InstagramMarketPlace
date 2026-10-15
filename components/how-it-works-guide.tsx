"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, Bookmark, CheckCircle2, CircleHelp, Compass, ExternalLink, Instagram, LayoutGrid, Play, Search, ShieldCheck, ShoppingBag, Store, Tags, Video } from "lucide-react";

const sections = [
  { id: "overview", label: "How SokoLink works", icon: Compass },
  { id: "shopper", label: "Browse & shop", icon: ShoppingBag },
  { id: "seller", label: "Become a seller", icon: Store },
  { id: "connect", label: "Connect Instagram", icon: Instagram },
  { id: "listings", label: "Publish products", icon: Tags },
  { id: "discover", label: "Discover & save", icon: Bookmark },
  { id: "growth", label: "Grow your shop", icon: LayoutGrid },
  { id: "help", label: "Help & requirements", icon: CircleHelp },
];

function Step({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return <div className="how-step"><span className="how-step-number">{number}</span><div><h3>{title}</h3><p>{children}</p></div></div>;
}

export default function HowItWorksGuide() {
  const [active, setActive] = useState("overview");
  const [showLiveDemo, setShowLiveDemo] = useState(false);

  function jump(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="how-guide">
      <aside className="how-guide-sidebar">
        <div className="how-sidebar-heading"><span className="how-sidebar-mark"><Compass size={18} /></span><div><b>Help centre</b><small>THE SOKOLINK GUIDE</small></div></div>
        <p className="how-sidebar-label">GETTING STARTED</p>
        <nav aria-label="How it works sections">
          {sections.map((section) => { const Icon = section.icon; return <button key={section.id} type="button" onClick={() => jump(section.id)} className={active === section.id ? "active" : ""}><Icon size={17}/><span>{section.label}</span>{active === section.id && <span className="how-sidebar-active-dot"/>}</button>; })}
        </nav>
        <div className="how-sidebar-help"><span>Need a starting point?</span><p>Explore the live marketplace, then come back here for each step.</p><Link href="/shop">Open marketplace <ArrowUpRight size={14}/></Link></div>
      </aside>

      <div className="how-guide-content">
        <section id="overview" className="how-guide-hero how-guide-section">
          <div className="how-guide-hero-copy"><span className="how-eyebrow"><span/> YOUR GUIDE TO SOKOLINK</span><h1>From Instagram posts to a marketplace people can explore.</h1><p>SokoLink brings products from connected Instagram shops into one searchable place. Learn how shoppers discover listings and how sellers connect their shops.</p><div className="how-hero-actions"><Link href="/shop" className="how-primary-action">Explore the live marketplace <ArrowUpRight size={16}/></Link><button type="button" className="how-secondary-action" onClick={() => setShowLiveDemo(v => !v)}><Play size={15}/>{showLiveDemo ? "Hide live preview" : "Preview the live site"}</button></div></div>
          <div className="how-hero-art"><div className="how-art-window"><div className="how-art-window-top"><span/><span/><span/><small>instagram-market-place.vercel.app</small></div><div className="how-art-content"><div className="how-art-badge"><Instagram size={15}/> INSTAGRAM-POWERED DISCOVERY</div><div className="how-art-title">Find your next<br/><em>favourite thing.</em></div><div className="how-art-pills"><span>Fashion</span><span>Beauty</span><span>Home</span></div><div className="how-art-products"><div className="how-art-product art-product-one"/><div className="how-art-product art-product-two"/><div className="how-art-product art-product-three"/></div></div></div><div className="how-art-sticker"><CheckCircle2 size={15}/> Real shop posts</div></div>
          {showLiveDemo && <div className="how-live-preview"><div className="how-live-preview-head"><span><span className="how-live-dot"/> LIVE WEBSITE PREVIEW</span><a href="https://instagram-market-place.vercel.app/shop" target="_blank" rel="noreferrer">Open in new tab <ExternalLink size={13}/></a></div><iframe src="https://instagram-market-place.vercel.app/shop" title="Live SokoLink marketplace preview" loading="lazy"/></div>}
        </section>

        <section id="shopper" className="how-guide-section how-guide-block">
          <div className="how-section-kicker">01 / FOR SHOPPERS</div><h2>Discover products without searching through dozens of profiles.</h2><p className="how-section-intro">Browse a shared catalogue of items sourced from connected Instagram shops, then open the original post when you want to learn more from the seller.</p>
          <div className="how-feature-grid"><div className="how-feature-card"><span><Search size={20}/></span><h3>Search & explore</h3><p>Use the Shop page, category pages, search and For You feed to find relevant products and services.</p><Link href="/shop">Browse listings <ArrowUpRight size={14}/></Link></div><div className="how-feature-card"><span><Bookmark size={20}/></span><h3>Save favourites</h3><p>Sign in to save listings to your wishlist and return to them later.</p><Link href="/wishlist">View wishlist <ArrowUpRight size={14}/></Link></div><div className="how-feature-card"><span><Instagram size={20}/></span><h3>Visit the source</h3><p>Open a listing’s original Instagram post to view the source content and contact the seller through Instagram.</p><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Open Instagram <ExternalLink size={14}/></a></div></div>
        </section>

        <section id="seller" className="how-guide-section how-guide-block how-guide-tinted">
          <div className="how-section-kicker">02 / FOR SELLERS</div><h2>Bring your Instagram shop to SokoLink.</h2><p className="how-section-intro">Seller onboarding starts on the website. In development mode, the marketplace administrator reviews requests and manages the Instagram connection.</p>
          <div className="how-steps"><Step number="01" title="Create your account">Sign up or log in, then open your account setup page to begin the shop request.</Step><Step number="02" title="Submit your Instagram username">Enter the exact handle for the account you want to connect. Make sure it is a professional account supported by the current Instagram API setup.</Step><Step number="03" title="Wait for review">The admin checks the request and, while the app is in development mode, may need to add the account as an app tester in Meta for Developers.</Step><Step number="04" title="Accept the invitation">Open Instagram and accept the tester invitation if one is sent. Return to the marketplace and follow the connection steps shown in your account.</Step></div>
          <Link href="/account/setup" className="how-primary-action">Start seller setup <ArrowUpRight size={16}/></Link>
        </section>

        <section id="connect" className="how-guide-section how-guide-block">
          <div className="how-section-kicker">03 / INSTAGRAM CONNECTION</div><h2>How the Instagram connection works.</h2><p className="how-section-intro">The current site uses an administrator-managed Instagram Graph API connection. The seller requests access, accepts any required tester invite, and the admin completes the token-backed connection.</p>
          <div className="how-connection-callout"><ShieldCheck size={22}/><div><b>Important: the seller does not paste an access token into the public website.</b><p>Access tokens are sensitive. The administrator manages the connection from the protected admin area; never share tokens in chat or public forms.</p></div></div>
          <div className="how-steps"><Step number="01" title="Switch to a professional account">Instagram API access requires an eligible professional account (Business or Creator, depending on the API setup). Meta's requirements can vary by login method.</Step><Step number="02" title="Submit the username on SokoLink">The store request appears in the admin dashboard for review.</Step><Step number="03" title="Accept Meta's tester invitation">If the app is in development mode, the account must be added to the app's roles/testers and accept the invitation before access can be granted.</Step><Step number="04" title="Admin connects and syncs">The admin saves the access token in the protected admin connection workflow and syncs eligible Instagram posts into the marketplace.</Step></div>
          <div className="how-video-card"><div className="how-video-heading"><span className="how-video-icon"><Video size={18}/></span><div><span className="how-section-kicker">VIDEO WALKTHROUGH</span><h3>Understand the Meta / Instagram API setup</h3></div></div><p>This external tutorial explains the Meta developer app, permissions, access tokens and the Graph API concepts behind Instagram integrations. Meta’s screens may differ from the current SokoLink admin workflow.</p><div className="how-video-frame"><iframe src="https://www.youtube-nocookie.com/embed/BuF9g9_QC04?rel=0" title="Facebook and Instagram Graph API setup tutorial" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div><a className="how-text-link" href="https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api" target="_blank" rel="noreferrer">Read Meta’s Instagram API documentation <ExternalLink size={14}/></a></div>
        </section>

        <section id="listings" className="how-guide-section how-guide-block how-guide-tinted">
          <div className="how-section-kicker">04 / PRODUCTS & CATEGORIES</div><h2>How Instagram posts become marketplace listings.</h2><p className="how-section-intro">SokoLink syncs media from connected accounts and organizes eligible posts into browsable listings.</p>
          <div className="how-steps"><Step number="01" title="Publish on Instagram as usual">Keep creating product or service posts on the Instagram account connected to the marketplace.</Step><Step number="02" title="Use the marketplace hashtag">In the current setup, posts containing <code>#instamart</code> are intended to be treated as listings. Check the latest seller guidance in your account, since the configured hashtag is what the sync logic recognizes.</Step><Step number="03" title="Sync and categorize">After syncing, listings appear with their available media, title/details and category information. Other hashtags may be used as discovery tags.</Step><Step number="04" title="Keep the source accurate">If you delete a source post, the marketplace may remove it during a subsequent sync/availability check. Keep product details accurate on Instagram.</Step></div>
          <div className="how-note"><Tags size={18}/><p><b>Tip:</b> hashtags and eligibility depend on the current application configuration. Use the seller account setup instructions if a post is not appearing.</p></div>
        </section>

        <section id="discover" className="how-guide-section how-guide-block">
          <div className="how-section-kicker">05 / DISCOVERY TOOLS</div><h2>Find, filter and save the things you like.</h2><div className="how-discovery-list"><div><span><LayoutGrid size={18}/></span><div><b>Shop & category pages</b><p>Browse the catalogue, explore category-specific pages and narrow your search by the type of item you want.</p></div></div><div><span><Search size={18}/></span><div><b>Search suggestions</b><p>Use the search bar to explore matching products, stores and tags, then open a result to view the listing.</p></div></div><div><span><Bookmark size={18}/></span><div><b>Wishlist & browsing history</b><p>Save items you want to revisit. Your available account tools depend on whether you are signed in.</p></div></div><div><span><Instagram size={18}/></span><div><b>Original Instagram content</b><p>SokoLink helps with discovery; product questions, stock confirmation and purchases are handled with the seller using their available contact channels.</p></div></div></div><Link href="/categories" className="how-secondary-action">Explore categories <ArrowUpRight size={15}/></Link>
        </section>

        <section id="growth" className="how-guide-section how-guide-block how-guide-tinted">
          <div className="how-section-kicker">06 / SELLER GROWTH</div><h2>Tools to help shops get discovered.</h2><p className="how-section-intro">Eligible sellers can find growth options from their account and shop analytics areas. Availability and approval depend on the request and current marketplace setup.</p><div className="how-feature-grid"><div className="how-feature-card"><span><Tags size={20}/></span><h3>Boost</h3><p>Request additional visibility for selected listings where the boost feature is available.</p></div><div className="how-feature-card"><span><ShieldCheck size={20}/></span><h3>Verified</h3><p>Submit a verification request if the option is offered for your shop.</p></div><div className="how-feature-card"><span><Store size={20}/></span><h3>Pro Seller</h3><p>Explore the Pro Seller growth option and review the terms displayed in your account.</p></div></div><Link href="/account/analytics" className="how-primary-action">Open shop analytics <ArrowUpRight size={16}/></Link>
        </section>

        <section id="help" className="how-guide-section how-guide-block how-guide-faq">
          <div className="how-section-kicker">07 / TROUBLESHOOTING</div><h2>Quick answers before you get started.</h2><details><summary>Can I connect a personal Instagram account?</summary><p>The Instagram Graph API generally requires an eligible professional account. Check the API login method and Meta's current requirements for your account.</p></details><details><summary>Why is my shop request waiting?</summary><p>In development mode, an admin may need to review your request, add your account as a tester in Meta, and ensure the invitation is accepted before connecting the account.</p></details><details><summary>Why are my posts not showing?</summary><p>Confirm the correct Instagram account is connected, the post meets the marketplace hashtag/configuration rules, and the account has been synced recently. The admin can review sync status.</p></details><details><summary>Does SokoLink process my payment?</summary><p>This marketplace experience focuses on discovery and linking to original Instagram content. Confirm price, availability, delivery and payment directly with the seller using their provided channels.</p></details><div className="how-help-bottom"><div><h3>Ready to explore?</h3><p>Browse the live catalogue or start your seller setup.</p></div><div><Link href="/shop" className="how-primary-action">Explore the shop <ArrowUpRight size={15}/></Link><Link href="/account/setup" className="how-secondary-action">Seller setup <ArrowUpRight size={15}/></Link></div></div>
        </section>
        <footer className="how-guide-end">SokoLink · A marketplace experience powered by Instagram shop content.</footer>
      </div>
    </main>
  );
}
