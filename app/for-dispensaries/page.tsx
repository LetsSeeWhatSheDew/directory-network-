// app/for-dispensaries/page.tsx — the pitch for store managers, plus the
// "Find your store" list that leads to each store's free report.
// Every number here is computed from the DB at render; nothing hardcoded.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import StoreAvatar from "../components/StoreAvatar";
import { brand } from "../../lib/brand";
import { storeImageUrl } from "../../lib/storeImage";
import { getRegionStores, REGION_CITIES } from "../../lib/waysToBuy";
import { STORE_CAP } from "../../lib/storeCap";

export const revalidate = 3600;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export const metadata: Metadata = {
  title: "For Dispensaries — Free, Accurate, Nobody Pays to Rank",
  description:
    "Central Illinois dispensaries: your deals, shown accurately and free. We read what you publish for shoppers, link back, and correct mistakes the same day. Nobody can pay to rank, including you.",
  alternates: { canonical: `${brand.url}/for-dispensaries` },
};

/** Live deals in the region right now (the same view shoppers' pages read). */
async function getLiveDeals(): Promise<Array<{ listing_slug: string | null; city: string | null }>> {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=listing_slug,city&limit=2000`,
      { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, next: { revalidate: 3600, tags: ["deals"] } }
    );
    const rows = r.ok ? await r.json() : [];
    return Array.isArray(rows) ? rows.filter((d) => REGION_CITIES.includes(String(d.city || ""))) : [];
  } catch {
    return [];
  }
}

const FAQ: { q: string; a: string; link?: { href: string; label: string } }[] = [
  {
    q: "Where do your deals come from? Did we agree to this?",
    a: "We only read what you already publish for shoppers: the deals and specials pages on your own website and your official social accounts. We never use aggregators and never log in to anything. Every deal links back to your site. If we get something wrong, we fix it the same day. If you'd rather not be listed, email hi@puffprice.com and we'll take your deals down.",
  },
  {
    q: "Can we pay to rank higher?",
    a: "No. Not with money, ads or a partnership, and that includes you. Deals are ordered by the deal itself: the size of the saving, then freshness. Each list also shows only a few deals per store so a long specials page can't bury a smaller shop. Your store page always shows all of them.",
    link: { href: "/how-we-rank", label: "How we rank" },
  },
  {
    q: "How often do you check our site?",
    a: "Every morning. A deal we can't find again shows as \"verification pending\" after three days and comes down after seven, or the same day if you tell us it's over.",
  },
  {
    q: "Something's wrong or missing. How do we fix it?",
    a: "Use the claim form or email hi@puffprice.com with the page on your site that shows the change. We verify it and update the same day.",
    link: { href: "/claim", label: "Claim your listing" },
  },
  {
    q: "How does PuffPrice make money?",
    a: "Shoppers fund it with Pro, an optional $0.99-a-month plan for shoppers. Later, stores may be able to buy market reports. Nobody will ever be able to buy position.",
  },
];

export default async function ForDispensariesPage() {
  const [stores, live] = await Promise.all([getRegionStores(), getLiveDeals()]);
  const cities = new Set(stores.map((s) => s.city)).size;
  const storesWithDeals = new Set(live.map((d) => d.listing_slug).filter(Boolean)).size;

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <GuideShell
      eyebrow="For dispensaries"
      title="Your deals, shown accurately, free."
      lede={<>Nobody can pay to rank, including you. Every morning we read the deals on your own site and show them next to every other store in your city, with a link back to you.</>}
      jsonLd={faqLd}
    >
      <h2 className="gp-h2">What shoppers see</h2>
      <div className="gp-grid">
        <div className="gp-card"><span>Stores tracked</span><span className="gp-big">{stores.length}</span><span>checked every morning on their own sites</span></div>
        <div className="gp-card"><span>Deals live now</span><span className="gp-big">{live.length}</span><span>at {storesWithDeals} {storesWithDeals === 1 ? "store" : "stores"}</span></div>
        <div className="gp-card"><span>Cities</span><span className="gp-big">{cities}</span><span>across Central Illinois</span></div>
      </div>
      <p className="gp-p" style={{ marginTop: 14 }}>
        Your deals appear on your city page, the all-deals page and your own store page, biggest everyday saving first, with the price after tax where you post a price.
        Shared lists show up to {STORE_CAP.cityList} deals per store with a link to the rest; your store page shows every one.
      </p>

      <h2 className="gp-h2">Why it&apos;s free</h2>
      <p className="gp-p">
        Shoppers fund it with <Link href="/upgrade">Pro</Link>. Stores can buy market reports later, never position.
        That&apos;s the whole model, so there&apos;s nothing to sell you today.
      </p>

      <h2 className="gp-h2">Three free things that help</h2>
      <div className="gp-grid">
        <div className="gp-card"><b>1. Keep deals current on your site</b><span>We read your own deals page every morning. Fix it there and it&apos;s fixed here by the next morning.</span></div>
        <div className="gp-card"><b>2. Tell us the day you add something</b><span>Drive-thru, curbside or medical: <Link href="/claim">send us the page</Link> that says so and we&apos;ll list it the same day.</span></div>
        <div className="gp-card"><b>3. Put a counter card by the register</b><span>A free 4×6 card with a code to your page. Find yours on your report below, or print the <Link href="/for-dispensaries/card">general card</Link>.</span></div>
      </div>

      <h2 className="gp-h2">Find your store</h2>
      <p className="gp-note">Your free report: live deals, how your discounts compare with your city, and what we could confirm on your site.</p>
      <div className="gp-list">
        {stores.map((s) => (
          <Link key={s.slug} href={`/for-dispensaries/${s.slug}`} className="gp-row">
            <StoreAvatar src={storeImageUrl(s.logo_url, s.slug)} name={s.name} size={36} />
            <span className="gp-row-main"><span className="gp-row-title">{s.name}</span><span className="gp-row-sub">{s.city}</span></span>
            <span className="gp-src">Report →</span>
          </Link>
        ))}
      </div>

      <h2 className="gp-h2">Questions stores ask</h2>
      <div className="gp-list">
        {FAQ.map((f) => (
          <details key={f.q} className="gp-row" style={{ display: "block" }}>
            <summary className="gp-row-title" style={{ cursor: "pointer" }}>{f.q}</summary>
            <p className="gp-p" style={{ margin: "8px 0 0" }}>
              {f.a}
              {f.link && <> <Link href={f.link.href}>{f.link.label} →</Link></>}
            </p>
          </details>
        ))}
      </div>

      <div className="gp-cta">
        <b>Something missing or wrong?</b>
        <span>Send us the page on your site that shows it (a new deal, a drive-thru, medical sales) and we&apos;ll verify and update the same day. Or email hi@puffprice.com.</span>
        <Link href="/claim" style={{ background: "var(--pp-signal-fill)", color: "var(--pp-on-dark)", fontWeight: 700, padding: "10px 16px", borderRadius: 10, textDecoration: "none", alignSelf: "flex-start" }}>Claim your listing</Link>
      </div>
    </GuideShell>
  );
}
