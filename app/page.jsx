import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import LocationAware from "./components/LocationAware";
import TrackedLink from "./components/TrackedLink";
import HomeDealCards from "./components/HomeDealCards";
import HeroDealCard from "./components/HeroDealCard";
import SavingsCallout from "./components/SavingsCallout";
import SearchTracker from "./components/SearchTracker";
import FourTwentyBanner from "./components/FourTwentyBanner";
import RecentlyViewedRow from "./components/RecentlyViewedRow";
import EndingSoonRow from "./components/EndingSoonRow";
import PuffPriceIndexCard from "./components/PuffPriceIndexCard";
import StickyMobileCTA from "./components/StickyMobileCTA";
import { CategoryIcon, HOME_HERO_CATEGORIES } from "../lib/categoryIcons";
import { brand } from "../lib/brand";
import { estimateSavings, formatSavingsDollars } from "../lib/dealScoring";
import { getServerLocation } from "../lib/location";
import { getLiveDealsValueThisMonth, getDealsRunThisMonth } from "../lib/stats";
import {
  CENTRAL_IL_CITIES,
  CENTRAL_IL_PUBLIC_CITIES,
} from "../lib/constants/regions";

// Metadata — Central IL framing. The full IL footprint stays discoverable
// via the "Browse all Illinois" link below; out-of-scope city pages keep
// their own city-specific metadata for SEO retention.
export const metadata = {
  title: `Cannabis Deals in Central Illinois | ${brand.name}`,
  description:
    "Live dispensary deals across Peoria, Bloomington-Normal, Champaign-Urbana, Springfield, and the rest of Central Illinois — updated continuously and always free to browse.",
  alternates: { canonical: brand.url },
};

// The homepage "Browse by city" section now renders all 9 public cities
// directly from CENTRAL_IL_PUBLIC_CITIES (see Section 3 in the JSX), so
// the prior 6-shortcut list is no longer needed.

// ============================================================
// PUFFPRICE HOMEPAGE — Cannabis visual identity overhaul
//
// Design philosophy:
// - Unmistakably cannabis within 1 second of landing
// - Real SVG icons, not emoji fallbacks
// - Botanical plant illustrations in hero background (low opacity)
// - Dark navy + green = authority + cannabis without cliché
// - Georgia serif = trustworthy local guide, not tech startup
// ============================================================

// ---------- SVG ICON COMPONENTS ----------
// All cartoon category icons (gummy bear, vape pen, concentrate crystal,
// flame) were retired 2026-05-04 in favor of Lucide line-art per
// docs/brand-system.md. The category mapping now lives in
// lib/categoryIcons.tsx and is rendered via <CategoryIcon slug="..." />.

// PlantSilhouette helper retired 2026-05-04 — the hero now uses the
// .pp-leaf watermark utility from globals.css instead of a per-page
// inline SVG. Kept commit history intact for future reference.

// ---------- DATA ----------

// Category data is now sourced from lib/categoryIcons.tsx so the
// homepage and the rest of the site stay in sync. The hero surfaces
// six categories: flower, edibles, vapes, concentrates, topicals,
// accessories.
const CATEGORIES = HOME_HERO_CATEGORIES;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

// PostgREST `in.()` value list of Central IL city names. Keeps the
// homepage deal feed + stats scoped to the 12 publicly-visible cities;
// any deal attached to a non-CIL dispensary stays in the DB but never
// appears here. Matches CENTRAL_IL_CITIES in lib/constants/regions.ts.
const CIL_CITY_IN_LIST = `("Peoria","East Peoria","Peoria Heights","Pekin","Bartonville","Morton","Washington","Bloomington","Normal","Champaign","Urbana","Springfield")`;

export const revalidate = 300;

// View's name column often mirrors the slug. Humanize anything that
// looks slug-shaped (lowercase + hyphens, no spaces).
function slugToName(slug) {
  if (!slug) return "";
  return String(slug)
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function displayName(d) {
  const name = d?.name;
  const slug = d?.slug || d?.listing_slug;
  if (!name || name === slug || /^[a-z0-9-]+$/.test(name)) {
    return slugToName(slug || name || "Illinois dispensary");
  }
  return name;
}

// Defensive filter: strip any deal whose expires_at has already passed.
// The view already filters is_active=true, but if the flag wasn't flipped
// promptly we still render an expired deal — this guards the UI.
function filterExpired(list) {
  const now = Date.now();
  return list.filter((d) => {
    if (!d?.expires_at) return true;
    const t = new Date(d.expires_at).getTime();
    return !Number.isFinite(t) || t > now;
  });
}

// Composite hero ranking: discount × freshness multiplier. Heroing the
// largest discount alone produced "Ivy Hall 30% off" with a freshness
// badge reading "Last checked 23 days ago" — accurate per the badge,
// but a bad first impression. After the daily-verification sweep is
// active (post-migration), every active deal will be fresh enough that
// the multiplier collapses to 1.0 and ranking is back to pure discount.
// Until then, this transition function keeps the hero feeling live.
function rankFreshDealFirst(d, now) {
  const discount = Number(d?.discount_value) || 0;
  const t = d?.verified_at ? new Date(d.verified_at).getTime() : 0;
  const ageDays = Number.isFinite(t) && t > 0 ? (now - t) / 86_400_000 : 9999;
  let mult;
  if (ageDays < 1) mult = 1.0;
  else if (ageDays < 3) mult = 0.92;
  else if (ageDays < 7) mult = 0.78;
  else mult = 0.40;
  return discount * mult;
}

async function getTopDeals() {
  // ISR: cache the Supabase response for 60s. Cold starts and repeat
  // visitors both read the cached payload instead of round-tripping
  // to Supabase, dropping TTFB from ~10s to <2s. Deals only need to
  // refresh roughly once a minute.
  try {
    const res = await fetch(
      // Pull a wider candidate pool (20) so the freshness re-rank below
      // has room to move a fresh-but-smaller-discount deal to the top
      // when an older-but-bigger deal would otherwise hero it.
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=*&city=in.${encodeURIComponent(CIL_CITY_IN_LIST)}&order=discount_value.desc&limit=20`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 60, tags: ["deals"] },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    const now = Date.now();
    return filterExpired(data)
      .map((d) => ({ ...d, _heroScore: rankFreshDealFirst(d, now) }))
      .sort((a, b) => (b._heroScore || 0) - (a._heroScore || 0))
      .slice(0, 3);
  } catch {
    return [];
  }
}

function formatDiscount(d) {
  if (d.discount_unit === "percent") return `${Math.round(d.discount_value)}% off ${d.category || ""}`.trim();
  if (d.discount_unit === "dollars") {
    if (d.discount_type === "fixed_price") return `$${d.discount_value} flat`;
    return `$${d.discount_value} off`;
  }
  return d.deal_title || "Deal available";
}

// formatSavings is now sourced from lib/dealScoring (formatSavingsDollars)

function isLikelyOpen() {
  // Simple CT hour heuristic (9am-9pm CT). Server-side so no client jitter.
  const utcHour = new Date().getUTCHours();
  const ctHour = (utcHour + 24 - 5) % 24; // rough CT (ignores DST)
  return ctHour >= 9 && ctHour < 21;
}

// NOTE: getTotalSavings() removed 2026-04-18. The per-deal "Save $X" on
// each card carries the savings signal — the aggregate was misleading
// and added noise. Do not re-add without a product conversation.

/** MAX(updated_at) across active, unexpired deals — powers the freshness
 * indicator on the deal feed. Previously read created_at of the first row,
 * which drifted stale fast and left "Updated 3 days ago" showing on
 * genuinely fresh data. We filter expires_at > now() so that deals kept
 * alive by touching updated_at don't anchor the indicator.
 * Cached 60s with the 'deals' tag. */
async function getMostRecentDealTs() {
  try {
    const nowIso = new Date().toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/deals?select=updated_at&is_active=eq.true&project_tag=eq.green&or=(expires_at.gt.${nowIso},expires_at.is.null)&order=updated_at.desc&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 60, tags: ["deals"] },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows[0]?.updated_at ? rows[0].updated_at : null;
  } catch {
    return null;
  }
}

/** Wider active deal pool (up to 20) used by TopDealsRow to rank by
 *  computed savings. Separate from getTopDeals() so the hero card still
 *  uses a tight top-3 fetch while the social-proof row sees more. */
async function getDealPool() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=*&city=in.${encodeURIComponent(CIL_CITY_IN_LIST)}&order=discount_value.desc&limit=20`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 60, tags: ["deals"] },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? filterExpired(data) : [];
  } catch {
    return [];
  }
}

/** Deals whose expires_at is between now() and now()+24h.
 *  Uses the active_deals_with_listings view so dispensary name + city
 *  come back in the same roundtrip. Cached 60s with 'deals' tag — when
 *  is_active flips or expires_at is updated, revalidateTag('deals') will
 *  flush this. Returns [] when nothing qualifies so the UI hides. */
async function getEndingSoonDeals() {
  const now = new Date();
  const cutoff = new Date(now.getTime() + 24 * 3600 * 1000);
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=deal_id,id,listing_slug,slug,name,city,deal_title,title,expires_at&city=in.${encodeURIComponent(CIL_CITY_IN_LIST)}&expires_at=gt.${encodeURIComponent(now.toISOString())}&expires_at=lt.${encodeURIComponent(cutoff.toISOString())}&order=expires_at.asc&limit=5`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 60, tags: ["deals"] },
      }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((r) => r.expires_at && (r.deal_id || r.id) && (r.listing_slug || r.slug))
      .map((r) => ({
        id: r.deal_id || r.id,
        listing_slug: r.listing_slug || r.slug,
        dispensary_name: r.name || r.listing_slug || r.slug || "Dispensary",
        city: r.city || "",
        title: r.deal_title || r.title || "Active deal",
        expires_at: r.expires_at,
      }));
  } catch {
    return [];
  }
}

async function getActiveDealCount() {
  // Count deals from the `active_deals_with_listings` view so we can
  // filter by dispensary city — the raw `deals` table has no city column.
  // Scoped to Central IL only; the stats line must match what the user
  // actually sees in the deal feed above it.
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=deal_id&city=in.${encodeURIComponent(CIL_CITY_IN_LIST)}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "count=exact",
          "Range-Unit": "items",
          Range: "0-0",
        },
        next: { revalidate: 300, tags: ["deals"] },
      }
    );
    const range = res.headers.get("content-range");
    if (range) {
      const total = range.split("/")[1];
      const n = Number.parseInt(total, 10);
      if (Number.isFinite(n)) return n;
    }
  } catch {}
  return null;
}

// Per-city deal + listing counts for the "Browse deals by city" grid.
// Returns a map of city-name (lower-cased) → { deals, listings }. Pulls
// the raw lists from the same view + table the rest of the page already
// reads, then aggregates client-side rather than hitting Supabase nine
// times in a row. Cached 5 minutes — counts move with each cron, not by
// the second.
async function getCityCounts() {
  const cityList = `("Peoria","East Peoria","Peoria Heights","Pekin","Normal","Bloomington","Champaign","Urbana","Springfield")`;
  const result = new Map();
  try {
    const [dealRes, listingRes] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=city&city=in.${encodeURIComponent(cityList)}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          next: { revalidate: 300, tags: ["deals"] },
        }
      ),
      fetch(
        `${SUPABASE_URL}/rest/v1/master_listings?select=city&state=eq.IL&project_tag=eq.green&is_active=eq.true&type=eq.dispensary&city=in.${encodeURIComponent(cityList)}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          next: { revalidate: 600, tags: ["listings"] },
        }
      ),
    ]);
    const dealRows = dealRes.ok ? await dealRes.json() : [];
    const listingRows = listingRes.ok ? await listingRes.json() : [];
    const tally = (rows, key) => {
      for (const r of rows || []) {
        const c = typeof r?.city === "string" ? r.city.toLowerCase() : null;
        if (!c) continue;
        const slot = result.get(c) || { deals: 0, listings: 0 };
        slot[key] += 1;
        result.set(c, slot);
      }
    };
    tally(dealRows, "deals");
    tally(listingRows, "listings");
  } catch {}
  return result;
}

// Live count of active Central IL dispensaries. Drives the homepage
// stats line — never hard-code "N dispensaries" when the DB can answer.
async function getCentralILListingCount() {
  try {
    // PostgREST `in.()` with spaces needs double-quoted values.
    const cityList = `("Peoria","East Peoria","Peoria Heights","Pekin","Bartonville","Morton","Washington","Bloomington","Normal","Champaign","Urbana","Springfield")`;
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?select=id&state=eq.IL&project_tag=eq.green&is_active=eq.true&city=in.${encodeURIComponent(cityList)}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "count=exact",
          "Range-Unit": "items",
          Range: "0-0",
        },
        next: { revalidate: 3600, tags: ["listings"] },
      }
    );
    const range = res.headers.get("content-range");
    if (range) {
      const total = range.split("/")[1];
      const n = Number.parseInt(total, 10);
      if (Number.isFinite(n)) return n;
    }
  } catch {}
  return null;
}

// FAQPage schema. Google requires the Q&A text here to be visibly
// rendered on the page — the FAQ section below mirrors these entries
// verbatim. GSC flagged items as invalid while the schema existed
// without matching visible content; keeping these strings aligned is
// what makes the markup eligible for rich results.
const FAQ_ENTRIES = [
  {
    q: "How do I find dispensary deals near me in Central Illinois?",
    a: "Allow location access or select your city and you'll see the cheapest active dispensary deals in your area. Every deal is tagged with how much you save and the exact Central Illinois dispensary running it.",
  },
  {
    q: "How often are deals updated?",
    a: "Deals are reviewed and refreshed daily. Expired deals are removed automatically the moment their expiry time passes, so what you see is what's live today.",
  },
  {
    q: "Is PuffPrice free to use?",
    a: "Yes. Browsing deals is always free with no account required. Pro is $0.99 a month and adds SMS alerts, a daily digest, price history, and a savings dashboard.",
  },
  {
    q: "Which Central Illinois cities does PuffPrice cover?",
    a: "Peoria and East Peoria, Bloomington-Normal, Champaign-Urbana, Pekin, Peoria Heights, and Springfield — the Central Illinois markets where licensed dispensaries are operating today. If you're in a smaller Central IL town, the nearest licensed dispensary is usually 5–15 minutes from one of those metros.",
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ENTRIES.map((e) => ({
    "@type": "Question",
    name: e.q,
    acceptedAnswer: { "@type": "Answer", text: e.a },
  })),
};

// Prefer user-city deals when we know the city; otherwise fall back to the
// statewide list. Haversine scoring would be ideal but only 1 of 61 IL
// dispensaries has lat/lng populated — city-match is the strongest signal
// we have until the Google Places backfill runs.
function preferLocalDeals(deals, userCity) {
  if (!userCity) return deals;
  const target = userCity.toLowerCase();
  const local = deals.filter(
    (d) => typeof d?.city === "string" && d.city.toLowerCase() === target
  );
  return local.length > 0 ? local : deals;
}

export default async function HomePage() {
  const [dealCount, listingCount, topDeals, mostRecentTs, endingSoon, dealPool, userLoc, liveValue, dealsThisMonth, cityCounts] = await Promise.all([
    getActiveDealCount(),
    getCentralILListingCount(),
    getTopDeals(),
    getMostRecentDealTs(),
    getEndingSoonDeals(),
    getDealPool(),
    getServerLocation(),
    getLiveDealsValueThisMonth().catch(() => null),
    getDealsRunThisMonth().catch(() => null),
    getCityCounts(),
  ]);
  const userCity = userLoc?.city || null;
  const localizedTopDeals = preferLocalDeals(topDeals, userCity);
  const localizedDealPool = preferLocalDeals(dealPool, userCity);
  // Featured deal: top-ranked active deal in the user's localized pool.
  // The hero used to gate on a 7-day verified_at window, but that gate
  // produced an empty state ("No featured deal today") on every day
  // where the daily cron couldn't independently re-confirm a particular
  // dispensary. With the new daily-verification sweep
  // (lib/scraper/dailyVerification.ts), no active deal can be older than
  // 7 days without independent verification — they auto-deactivate at
  // that point — so the gate has become redundant. The hero now picks
  // whichever deal is top-ranked and the per-card freshness badge tells
  // the truth at the row level.
  const featuredDeal = localizedTopDeals[0] || null;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:Georgia,serif;background:#F7F4ED;min-height:100vh;color:#1F3D2B}

        /* The 4px green top-stripe was removed 2026-04-30 — it read as an
           orphan green line above the nav rather than a "money signal", per
           Matthew's user-walkthrough. Brand identity now lives in the
           nav-bar logo and the per-deal green pricing accents instead. */

        /* NAV */
        .nav{
          display:flex;justify-content:space-between;align-items:center;
          padding:14px 28px;background:#fff;
          position:sticky;top:0;z-index:100;
          border-bottom:1px solid #e8e4da;
        }
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none}
        /* Logo sizing — desktop 60px tall, mobile 46px tall.
           !important overrides Logo.tsx's inline style so the canonical
           PNG (272×299) keeps its real aspect ratio at every breakpoint. */
        .nav .logo img{width:auto!important;height:60px!important}
        @media(max-width:768px){.nav .logo img{height:46px!important}}
        .footer .footer-logo img{width:auto!important;height:40px!important}
        .logo-mark{position:relative;width:28px;height:28px;display:inline-block;flex-shrink:0}
        .logo-mark-dot{position:absolute;top:-2px;right:-2px;width:10px;height:10px;border-radius:50%;background:#7DBA47;border:2px solid #fff;animation:pulse 2.5s infinite}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:#7DBA47;animation:pulse 2.5s infinite}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.9)}}
        .logo-text{font-size:1.15rem;font-weight:700;color:#1F3D2B;letter-spacing:-.02em}
        .logo-text span{color:#7DBA47}
        .nav-links{display:flex;align-items:center;gap:20px}
        .nav-link{font-size:.82rem;color:#6b7280;text-decoration:none;font-family:system-ui,sans-serif}
        .nav-link:hover{color:#1F3D2B}
        .nav-cta{
          font-size:.82rem;font-family:system-ui,sans-serif;font-weight:600;
          color:#fff;background:#7DBA47;padding:6px 14px;border-radius:6px;
          text-decoration:none;
        }
        .nav-cta:hover{background:#6BA63B}

        /* 4/20 PROMO BANNER */
        .promo-banner{background:#6BA63B;color:#fff}
        .promo-inner{max-width:1100px;margin:0 auto;padding:8px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
        .promo-left{display:flex;align-items:center;gap:10px;font-family:system-ui,sans-serif;font-size:.82rem;font-weight:600}
        .promo-dot{width:7px;height:7px;border-radius:50%;background:#93CB5C;animation:pulse 2s infinite;flex-shrink:0}
        .promo-text{line-height:1.3}
        .promo-cta{color:#fff;text-decoration:none;font-family:system-ui,sans-serif;font-size:.82rem;font-weight:600;white-space:nowrap}
        .promo-cta:hover{text-decoration:underline}
        @media(max-width:520px){.promo-inner{padding:8px 14px}.promo-text{font-size:.75rem}}

        /* HERO — photo backdrop (Central IL place) + cream gradient
           overlay to keep the headline legible. The pp-hero-bg fallback
           class still provides the warm radial-gradient if the photo
           fails to load. */
        .hero{
          padding:36px 28px 56px;
          position:relative;
          overflow:hidden;
          border-bottom:1px solid #e8e4da;
          isolation:isolate;
        }
        .hero-photo{position:absolute;inset:0;z-index:0;pointer-events:none}
        .hero-photo img{
          object-fit:cover;
          object-position:center 35%;
        }
        /* The legibility scrim: cream fade on the left so the headline
           reads navy-on-cream, plus a subtle 5–6% navy tint over the
           whole photo per brand spec 2.4 ("5–8% navy-tinted overlay
           pulls the image into the brand without recoloring it"). */
        .hero-photo-overlay{
          position:absolute;inset:0;z-index:0;pointer-events:none;
          background:
            linear-gradient(to right,
              rgba(245,244,240,0.96) 0%,
              rgba(245,244,240,0.78) 35%,
              rgba(245,244,240,0.35) 65%,
              rgba(245,244,240,0.05) 100%),
            linear-gradient(to bottom,
              rgba(15,31,61,0.06),
              rgba(15,31,61,0.06));
        }
        @media(max-width:900px){
          /* On mobile we lose the right column, so cream needs to
             extend further across to keep the headline legible against
             the right side of the photo. */
          .hero-photo-overlay{
            background:
              linear-gradient(to bottom,
                rgba(245,244,240,0.92) 0%,
                rgba(245,244,240,0.55) 60%,
                rgba(245,244,240,0.30) 100%),
              linear-gradient(rgba(15,31,61,0.08), rgba(15,31,61,0.08));
          }
        }
        .hero-inner{position:relative;z-index:1;max-width:1100px;margin:0 auto}
        .hero-grid{
          display:grid;grid-template-columns:1fr;gap:20px;
          align-items:start;
        }
        @media(min-width:900px){
          .hero-grid{grid-template-columns:1.6fr 1fr;gap:32px}
        }
        .hero-left{display:flex;flex-direction:column;gap:12px}

        /* LOCATION LINE */
        .hero-loc-line{
          font-size:.8rem;color:#7DBA47;font-family:system-ui,sans-serif;
          font-weight:500;margin-bottom:2px;
        }

        .hero h1{
          /* Spec 2.3 hero: 56-72px Geist Display 700, tight tracking. */
          font-family:var(--font-display, var(--font-geist-sans));
          font-size:clamp(2.5rem, 6vw + 1rem, 4.25rem);
          font-weight:700;color:#1F3D2B;
          letter-spacing:-.04em;line-height:1.02;
          margin-bottom:10px;
        }
        .hero h1 em{color:#7DBA47;font-style:normal}
        .hero-sub{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:1.05rem;color:#4B5563;
          line-height:1.55;margin-bottom:22px;
          max-width:520px;
        }

        /* HERO DEAL CARD — THE hero element */
        .hero-deal-card{
          background:#fff;
          border:1px solid #e8e4da;
          border-left:4px solid #7DBA47;
          border-radius:14px;
          padding:22px 22px 18px;
          box-shadow:0 4px 16px rgba(15,31,61,.06);
          display:flex;flex-direction:column;
          max-width:560px;
        }
        .hero-deal-label{
          font-size:.7rem;color:#6b7280;
          font-family:system-ui,sans-serif;
          font-weight:500;letter-spacing:.02em;
          margin-bottom:4px;
        }
        .hero-deal-savings{
          font-size:clamp(2.4rem,9vw,3.4rem);
          font-weight:700;color:#7DBA47;
          letter-spacing:-.04em;line-height:1;
        }
        .hero-deal-vs{
          font-size:.72rem;color:#9ca3af;
          font-family:system-ui,sans-serif;
          margin-top:2px;margin-bottom:16px;
        }
        .hero-deal-name{
          font-size:1.1rem;font-weight:700;
          color:#1F3D2B;line-height:1.2;
        }
        .hero-deal-title{
          font-size:.9rem;color:#374151;
          font-family:system-ui,sans-serif;
          margin-top:2px;margin-bottom:18px;
          line-height:1.4;
        }
        .hero-deal-row{
          display:flex;align-items:center;
          justify-content:space-between;gap:12px;
          flex-wrap:wrap;
        }
        .hero-deal-meta{
          display:flex;gap:12px;flex-wrap:wrap;
          font-size:.8rem;color:#6b7280;
          font-family:system-ui,sans-serif;font-weight:500;
        }
        .hero-deal-urgent{color:#991b1b;font-weight:700}
        .hero-deal-cta{
          background:#7DBA47;color:#fff;
          padding:12px 22px;border-radius:10px;
          text-decoration:none;font-family:var(--font-ui, system-ui, sans-serif);
          font-weight:700;font-size:.92rem;letter-spacing:.02em;
          transition:background 150ms ease, transform 150ms ease;
          white-space:nowrap;
          min-height:44px;display:inline-flex;align-items:center;
        }
        .hero-deal-cta:hover{background:#6BA63B;transform:translateY(-1px)}
        .hero-deal-more{
          margin-top:14px;align-self:flex-start;
          font-size:.82rem;color:#6b7280;
          font-family:system-ui,sans-serif;
          text-decoration:none;
        }
        .hero-deal-more:hover{color:#7DBA47}
        .skeleton{pointer-events:none}

        /* HERO RIGHT — desktop category stack */
        .hero-right{display:flex;flex-direction:column;gap:10px}
        .hero-right-label{
          font-size:.68rem;font-weight:700;letter-spacing:.14em;
          text-transform:uppercase;color:#9ca3af;
          font-family:system-ui,sans-serif;margin-bottom:2px;
        }
        @media(max-width:899px){
          .hero-right{display:none}
        }

        /* CATEGORY BUTTONS (used by desktop right column) */
        .cat-btn{
          display:flex;align-items:center;justify-content:center;gap:8px;
          background:#fff;
          border:1px solid #e8e4da;
          border-radius:10px;padding:11px 14px;
          font-size:.85rem;font-family:system-ui,sans-serif;font-weight:500;
          color:#1F3D2B;cursor:pointer;text-decoration:none;
          transition:all .15s;
        }
        .cat-btn:hover{background:#F2F8E9;border-color:#7DBA47;color:#1F3D2B}
        .cat-btn svg{flex-shrink:0;width:24px;height:24px}

        /* STATS STRIP — minimal credibility line */
        .stats{background:#F7F4ED;padding:22px 28px;text-align:center}
        .stats-inner{max-width:900px;margin:0 auto}
        .stats-line{font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif;letter-spacing:.01em}
        .stats-line strong{color:#7DBA47;font-weight:700}
        @media(max-width:520px){.stats-line{font-size:.78rem}}

        /* DEALS SECTION */
        .deals-section{max-width:1100px;margin:0 auto;padding:52px 28px}

        .section-eyebrow{
          font-size:.7rem;font-weight:700;letter-spacing:.14em;
          text-transform:uppercase;color:#7DBA47;
          font-family:system-ui,sans-serif;margin-bottom:6px;
        }
        .section-title{
          font-size:clamp(1.4rem,3vw,1.8rem);font-weight:700;
          color:#1F3D2B;letter-spacing:-.03em;margin-bottom:4px;
        }
        .section-sub{
          font-size:.875rem;color:#6b7280;
          font-family:system-ui,sans-serif;margin-bottom:28px;
        }

        /* DEAL CARDS */
        .deal-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
        .deal-card{
          background:#fff;border:1px solid #e8e4da;border-radius:14px;
          padding:18px;position:relative;
          transition:border-color .15s;
        }
        .deal-card:hover{border-color:#7DBA47}
        .deal-card.top-pick{
          border:2px solid #7DBA47;
          background:linear-gradient(135deg,#F2F8E9 0%,#fff 60%);
        }
        .top-pick-badge{
          position:absolute;top:-10px;left:16px;
          background:#7DBA47;color:#fff;
          font-size:.68rem;font-family:system-ui,sans-serif;
          font-weight:700;letter-spacing:.08em;text-transform:uppercase;
          padding:3px 10px;border-radius:100px;
        }
        .deal-grade{
          position:absolute;top:12px;right:12px;
          min-width:36px;height:36px;padding:0 8px;
          display:inline-flex;align-items:center;justify-content:center;
          border-radius:10px;
          font-family:system-ui,sans-serif;font-weight:800;font-size:.95rem;
          letter-spacing:-.01em;
          box-shadow:0 1px 3px rgba(0,0,0,.12);
        }
        .deal-card-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
        .deal-name{font-size:.95rem;font-weight:700;color:#1F3D2B}
        .deal-city{font-size:.75rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-top:2px}
        .open-badge{
          font-size:.68rem;font-weight:600;
          padding:2px 8px;border-radius:100px;
          font-family:system-ui,sans-serif;
          white-space:nowrap;
        }
        .open-badge.open{color:#3F6B1F;background:#dcfce7}
        .open-badge.closed{color:#6b7280;background:#f1f5f9}
        .deal-highlight{
          font-size:.95rem;font-weight:700;color:#7DBA47;
          margin-bottom:6px;
        }
        .deal-reason{
          font-size:.78rem;color:#6b7280;
          font-family:system-ui,sans-serif;margin-bottom:12px;
          line-height:1.5;
        }
        .deal-attrs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px}
        .deal-attr{
          font-size:.68rem;color:#6b7280;
          background:#F7F4ED;border-radius:100px;
          padding:2px 9px;font-family:system-ui,sans-serif;
        }
        .deal-savings{
          display:flex;align-items:center;justify-content:space-between;
          gap:10px;background:#F2F8E9;border:1px solid #C7E5A8;border-radius:10px;
          padding:14px 16px;margin-top:auto;
        }
        .savings-copy{display:flex;flex-direction:column}
        .savings-label{font-size:.65rem;font-weight:700;color:#3F6B1F;font-family:system-ui,sans-serif;text-transform:uppercase;letter-spacing:.12em}
        .savings-sub{font-size:.68rem;color:rgba(22,101,52,.7);font-family:system-ui,sans-serif;margin-top:2px}
        .savings-num{font-size:2rem;font-weight:700;color:#7DBA47;letter-spacing:-.03em;line-height:1}

        /* FOOTER */
        .footer{
          background:#fff;border-top:1px solid #e8e4da;
          padding:20px 28px;
          display:flex;justify-content:space-between;align-items:center;
          flex-wrap:wrap;gap:12px;
        }
        .footer-logo{font-size:.9rem;font-weight:700;color:#1F3D2B}
        .footer-logo span{color:#7DBA47}
        .footer-links{display:flex;gap:18px}
        .footer-link{font-size:.75rem;color:#6b7280;font-family:system-ui,sans-serif;text-decoration:none}
        .footer-link:hover{color:#1F3D2B}
        .footer-copy{font-size:.72rem;color:#9ca3af;font-family:system-ui,sans-serif}

        /* TAX CALCULATOR CALLOUT — sits between deals and cities. Navy
           bg with a single CTA; the differentiator we lead with. */
        .tax-callout{background:#1F3D2B;color:#FAFAF7;padding:64px 28px}
        .tax-callout-inner{max-width:760px;margin:0 auto;text-align:center}
        .tax-callout .pp-eyebrow{color:#93CB5C}
        .tax-callout-h2{
          font-family:var(--font-display, var(--font-geist-sans));
          font-size:clamp(1.5rem, 3vw, 2rem);font-weight:600;
          letter-spacing:-.03em;line-height:1.2;
          color:#FAFAF7;margin:8px 0 14px;
        }
        .tax-callout-body{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:1.0625rem;line-height:1.6;color:#cbd5e1;
          max-width:560px;margin:0 auto 24px;
        }
        .tax-callout-cta{
          display:inline-flex;align-items:center;
          background:#7DBA47;color:#fff;
          padding:13px 26px;border-radius:10px;
          font-family:var(--font-ui, system-ui, sans-serif);
          font-weight:700;font-size:.95rem;
          text-decoration:none;min-height:44px;
          transition:background 150ms ease, transform 150ms ease;
        }
        .tax-callout-cta:hover{background:#6BA63B;transform:translateY(-1px)}
        @media(max-width:520px){
          .tax-callout{padding:52px 18px}
        }

        /* SECTION 3 — CITIES GRID (Phase 4 layout consolidation) */
        .cities-section{background:#fff;border-top:1px solid #e8e4da;border-bottom:1px solid #e8e4da;padding:0 0 64px;position:relative}
        /* Banner photo above the city grid — positions us geographically. */
        .cities-banner{
          position:relative;
          width:100%;
          height:clamp(180px, 22vw, 320px);
          overflow:hidden;
          margin-bottom:48px;
        }
        .cities-banner img{object-fit:cover;object-position:center 60%}
        .cities-banner-tint{
          position:absolute;inset:0;
          background:
            linear-gradient(to bottom,
              rgba(245,244,240,0) 60%,
              rgba(255,255,255,0.85) 100%),
            linear-gradient(rgba(15,31,61,0.06), rgba(15,31,61,0.06));
          pointer-events:none;
        }
        .cities-inner{max-width:1100px;margin:0 auto;padding:0 28px}
        .cities-h2{margin:8px 0 28px}
        .cities-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
        @media(min-width:720px){.cities-grid{grid-template-columns:repeat(3,1fr);gap:18px}}
        @media(min-width:1080px){.cities-grid{grid-template-columns:repeat(3,1fr);gap:20px}}
        .city-card{
          display:flex;justify-content:space-between;align-items:center;
          padding:18px 22px;text-decoration:none;color:inherit;
          min-height:64px;
        }
        .city-card-name{
          font-family:var(--font-display, var(--font-geist-sans));
          font-weight:600;font-size:1.125rem;letter-spacing:-.01em;
          color:#1F3D2B;
        }
        .city-card-count{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.78rem;font-weight:600;letter-spacing:.01em;
          color:#7DBA47;background:#F2F8E9;
          padding:4px 10px;border-radius:100px;
          font-variant-numeric:tabular-nums;
        }
        .city-card-count-quiet{
          color:#9ca3af;background:transparent;border:1px solid #e8e4da;
        }
        .cities-foot{margin-top:28px;text-align:center}
        .cities-all-link{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.92rem;font-weight:600;color:#7DBA47;
          text-decoration:none;
        }
        .cities-all-link:hover{text-decoration:underline}

        /* SECTION 4 — TRUST + BRAND */
        .trust-section{
          background:linear-gradient(180deg, #F7F4ED 0%, #FFFFFF 100%);
          padding:72px 28px;
        }
        .trust-grid{
          max-width:1100px;margin:0 auto;
          display:grid;grid-template-columns:1fr;gap:36px;
          align-items:center;
        }
        @media(min-width:900px){
          .trust-grid{grid-template-columns:1.1fr 1fr;gap:56px}
        }
        .trust-photo{
          position:relative;
          aspect-ratio:4/3;
          border-radius:14px;
          overflow:hidden;
          box-shadow:0 1px 3px rgba(15,31,61,0.06), 0 8px 24px rgba(15,31,61,0.08);
        }
        .trust-photo img{object-fit:cover}
        .trust-inner{max-width:560px;margin:0 auto;text-align:left}
        @media(max-width:900px){
          .trust-inner{text-align:center;margin:0 auto}
          .trust-photo{order:-1;max-width:560px;margin:0 auto}
        }
        .trust-h2{margin:8px 0 18px;letter-spacing:-.03em}
        .trust-body{
          font-family:var(--font-serif, Georgia, serif);
          font-size:clamp(1.05rem, 1.5vw + .8rem, 1.2rem);
          line-height:1.7;color:#374151;
          max-width:560px;margin:0 auto 24px;
        }
        .trust-cta-row{display:flex;gap:18px;justify-content:center;align-items:center;flex-wrap:wrap}
        .trust-cta{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.92rem;font-weight:700;color:#fff;background:#7DBA47;
          text-decoration:none;padding:11px 22px;border-radius:10px;
          min-height:44px;display:inline-flex;align-items:center;
          transition:background 150ms ease, transform 150ms ease;
        }
        .trust-cta:hover{background:#6BA63B;transform:translateY(-1px)}
        .trust-cta-muted{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.92rem;font-weight:600;color:#374151;
          text-decoration:none;padding:11px 4px;
          min-height:44px;display:inline-flex;align-items:center;
        }
        .trust-cta-muted:hover{color:#1F3D2B}

        /* RESPONSIVE */
        @media(max-width:768px){
          .nav{padding:12px 16px}
          .hero{padding:40px 16px 36px}
          .deals-section{padding:36px 16px}
          .cities-section{padding:48px 16px}
          .trust-section{padding:56px 16px}
          .footer{padding:16px;flex-direction:column;text-align:center}
          .footer-links{justify-content:center}
        }
        @media(max-width:480px){
          .hero{padding:16px 16px 32px}
          .hero h1{font-size:2rem;max-width:100%}
          .hero-deal-card{padding:20px 18px 16px}
          .hero-deal-savings{font-size:2.8rem}
          .hero-deal-cta{padding:11px 18px;font-size:.88rem}
          .stats{padding:18px 16px}
          .stat-num{font-size:1.3rem}
          .deal-cards{grid-template-columns:1fr}
          .deal-card{padding:16px}
          .savings-num{font-size:1.75rem}
          .nav-cta{padding:5px 11px;font-size:.78rem}
          .nav .logo-text{font-size:1.02rem}
          .city-card{padding:14px 18px;min-height:56px}
          .city-card-name{font-size:1rem}
        }

        /* ============================================================
         * Homepage hero — two-column layout (cleanup PR, 2026-05-04)
         *
         * Left column:  hero copy + dual CTAs + LocationAware strip
         * Right column: featured deal card stacked above category tiles
         *
         * Both columns must be visible in a 1366×768 viewport without
         * scrolling. Category grid moves under the CTAs on tablet, then
         * stacks vertically on mobile (still above the rest of the page).
         * ============================================================ */
        .pp-home-hero {
          position: relative;
          padding: 0 0 clamp(2.5rem, 5vw, 4.5rem);
          overflow: hidden;
        }
        .pp-home-hero-inner {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: clamp(1.75rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem) 0;
          color: var(--color-cream, #F7F4ED);
        }
        .pp-home-hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(1.5rem, 3vw, 2.5rem);
          align-items: start;
        }
        @media (min-width: 1024px) {
          .pp-home-hero-grid {
            grid-template-columns: minmax(0, 1.05fr) minmax(420px, 1fr);
            gap: clamp(2rem, 4vw, 3.5rem);
          }
        }
        .pp-home-hero-left {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .pp-home-hero-right {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .pp-home-hero-photo {
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 38%;
          z-index: 1;
          pointer-events: none;
        }
        .pp-home-hero-photo img { object-fit: cover; object-position: center right; }
        .pp-home-hero-photo-scrim {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to right,
              rgba(31, 61, 43, 1) 0%,
              rgba(31, 61, 43, 0.95) 35%,
              rgba(31, 61, 43, 0.78) 70%,
              rgba(31, 61, 43, 0.55) 100%),
            linear-gradient(to bottom,
              rgba(31, 61, 43, 0.10),
              rgba(31, 61, 43, 0.30));
        }
        .pp-home-hero-eyebrow {
          color: var(--color-sage-vibrant, #93CB5C);
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 600;
          font-size: 0.875rem;
          letter-spacing: 0.01em;
          margin: 0;
        }
        .pp-home-hero-h1 {
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 800;
          font-size: clamp(2.25rem, 4vw + 1rem, 3.75rem);
          line-height: 1.05;
          letter-spacing: -0.04em;
          color: var(--color-cream, #F7F4ED);
          max-width: 18ch;
          margin: 0;
        }
        .pp-home-hero-dollar { color: var(--color-sage-vibrant, #93CB5C); }
        .pp-home-hero-h1-region {
          color: var(--color-sand, #C9A876);
          font-weight: 700;
          font-size: 0.86em;
        }
        .pp-home-hero-sub {
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 500;
          font-size: clamp(0.95rem, 0.5vw + 0.75rem, 1.0625rem);
          color: rgba(247, 244, 237, 0.78);
          max-width: 52ch;
          margin: 0;
        }
        .pp-home-hero-cta-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 0.25rem;
        }

        /* Right column — featured deal card. The HeroDealCard component
           applies its own styles; this just constrains width. */
        .pp-home-hero-featured {
          width: 100%;
        }

        /* Category grid — sits inside the right column on desktop, under
           the CTAs on mobile. Cream tile on deep surface = stays
           on-brand without recoloring the hero. */
        .pp-home-hero-cats-shell {
          background: rgba(247, 244, 237, 0.06);
          border: 1px solid rgba(247, 244, 237, 0.10);
          border-radius: 16px;
          padding: 1rem;
          backdrop-filter: blur(2px);
        }
        .pp-home-hero-cats-label {
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 800;
          font-size: 0.6875rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-sage-vibrant, #93CB5C);
          margin: 0 0 0.625rem 0.25rem;
        }
        .pp-home-hero-cats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.625rem;
        }
        .pp-home-hero-cat-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          padding: 0.875rem 0.5rem;
          border-radius: 12px;
          background: var(--color-cream-pure, #FAFAF7);
          border: 1px solid transparent;
          color: var(--color-deep, #1F3D2B);
          text-decoration: none;
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 600;
          font-size: 0.8125rem;
          letter-spacing: -0.005em;
          transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
          min-height: 78px;
        }
        .pp-home-hero-cat-tile:hover {
          border-color: var(--color-sage, #7DBA47);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
        }
        .pp-home-hero-cat-icon { display: inline-flex; }
        .pp-home-hero-cat-label { display: inline-block; }

        @media (max-width: 1023px) {
          .pp-home-hero-photo { width: 100%; opacity: 0.35; }
          .pp-home-hero-photo-scrim {
            background:
              linear-gradient(to bottom,
                rgba(31, 61, 43, 0.86) 0%,
                rgba(31, 61, 43, 0.92) 60%,
                rgba(31, 61, 43, 1.00) 100%);
          }
        }
        @media (max-width: 640px) {
          .pp-home-hero-cats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .pp-home-hero-cta-row { flex-direction: column; align-items: stretch; }
          .pp-home-hero-cta-row .pp-btn { width: 100%; }
        }
        @media (max-width: 380px) {
          .pp-home-hero-cats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>

      {/* HERO — Two-column layout (cleanup PR, 2026-05-04):
          LEFT: location strip → headline → subhead → dual CTAs
          RIGHT: featured deal card stacked above the category grid
          Both columns must fit in a 1366×768 viewport without scrolling.
          Brand spec § 6.1, asset manifest § 1 + § 2. */}
      <div className="pp-home-hero pp-surface-deep pp-leaf pp-leaf-04">
        <Nav variant="deep" />

        {/* 4/20 DEALS WEEK BANNER — only renders Apr 17–20, 2026 */}
        <FourTwentyBanner />

        {/* Right-edge bud photo accent — desktop only. ~38% width bleed
            with a deep-green tint scrim to keep the headline legible. */}
        <div className="pp-home-hero-photo" aria-hidden="true">
          <Image
            src="/photography/hero-bud-edge.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 1023px) 0px, 38vw"
          />
          <div className="pp-home-hero-photo-scrim" aria-hidden="true" />
        </div>

        <div className="pp-home-hero-inner pp-fade-up">
          <div className="pp-home-hero-grid">
            {/* LEFT — copy + CTAs */}
            <div className="pp-home-hero-left">
              <p className="pp-home-hero-eyebrow"><LocationAware /></p>

              <h1 className="pp-home-hero-h1">
                Best Bud For Your Buck<span className="pp-home-hero-dollar">$</span>
                <br />
                <span className="pp-home-hero-h1-region">in Central Illinois</span>
              </h1>

              <p className="pp-home-hero-sub">
                Live verified deals &middot; Peoria &middot; Bloomington &middot; Champaign
              </p>

              <div className="pp-home-hero-cta-row">
                <Link href="/cannabis/illinois/open-now" className="pp-btn pp-btn-lg pp-btn-sand">
                  <MapPin size={18} strokeWidth={2.25} aria-hidden="true" />
                  Find Deals Near Me
                </Link>
                <Link href="/dispensaries" className="pp-btn pp-btn-lg pp-btn-outline-cream">
                  Browse all dispensaries
                </Link>
              </div>
            </div>

            {/* RIGHT — featured deal card + 6-tile category grid */}
            <div className="pp-home-hero-right">
              <div className="pp-home-hero-featured">
                <HeroDealCard initial={featuredDeal} totalDealCount={dealCount ?? 0} />
                <SavingsCallout initialSavings={featuredDeal ? estimateSavings(featuredDeal) : null} />
              </div>

              <div className="pp-home-hero-cats-shell">
                <p className="pp-home-hero-cats-label">Browse by category</p>
                <div className="pp-home-hero-cats-grid">
                  {CATEGORIES.map((cat) => (
                    <TrackedLink
                      key={cat.slug}
                      href={`/deals/${cat.slug}`}
                      className="pp-home-hero-cat-tile"
                      event="category_click"
                      params={{ category: cat.slug }}
                    >
                      <span className="pp-home-hero-cat-icon">
                        <CategoryIcon slug={cat.slug} size={28} tone="light" />
                      </span>
                      <span className="pp-home-hero-cat-label">{cat.label}</span>
                    </TrackedLink>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PUFFPRICE INDEX — price-per-gram benchmark card.
          Live when sample threshold crosses (migration pending);
          renders a coming-soon progress state in the meantime. */}
      {/* Sentinel for the StickyMobileCTA — mounted right after the
          hero. When this scrolls out of view, the bottom CTA fades in. */}
      <div id="pp-hero-sentinel" aria-hidden="true" style={{ height: 1 }} />

      <PuffPriceIndexCard />

      {/* ============================================================
       * SECTION 2 — Today's deals (stat strip + grid)
       * The HomeDealCards grid carries the deal-card data density
       * (per Chrome's OpenTable benchmark). The stat line above it is
       * the trust signal — three numbers, no flair, no padding.
       * ============================================================ */}
      <EndingSoonRow deals={endingSoon} />
      <RecentlyViewedRow />

      <div className="stats">
        <div className="stats-inner">
          <span className="stats-line">
            <strong>{dealCount !== null ? dealCount : "—"}</strong> active deals · <strong>{listingCount !== null ? listingCount : "—"}</strong> Central IL dispensaries · <strong>{CENTRAL_IL_PUBLIC_CITIES.length}</strong> cities
          </span>
        </div>
      </div>

      <div className="deals-section">
        <HomeDealCards initial={localizedTopDeals} dealCount={dealCount} mostRecent={mostRecentTs} />
      </div>

      {/* TAX CALCULATOR CALLOUT — between deals and city grid. The
          calculator is the moat play: no aggregator builds this, and
          the buyer sees the actual out-the-door price before the
          dispensary parking lot. */}
      <section className="tax-callout" aria-labelledby="tax-callout-heading">
        <div className="tax-callout-inner pp-fade-up">
          <p className="pp-eyebrow">Pricing</p>
          <h2 id="tax-callout-heading" className="tax-callout-h2">
            Wondering what you&apos;ll actually pay at the register?
          </h2>
          <p className="tax-callout-body">
            Illinois cannabis tax runs 26%–45% of the shelf price depending on
            product type and city. Our calculator shows you the real out-the-door
            price for any Central Illinois dispensary.
          </p>
          <Link href="/illinois-cannabis-tax-calculator" className="tax-callout-cta">
            See out-the-door prices for your city →
          </Link>
        </div>
      </section>

      {/* ============================================================
       * SECTION 3 — Browse by city
       * 9 city cards in a 3×3 desktop / 2×5 mobile grid. Each card
       * shows the city name, deal-count badge, and a small accent.
       * Sourced from CENTRAL_IL_PUBLIC_CITIES so a future dispensary
       * opening in a hidden city brings its slug back automatically.
       * ============================================================ */}
      <section className="cities-section" aria-labelledby="cities-heading">
        {/* Banner — University of Illinois South Farms in Urbana
            (James Baltz, Unsplash). The Central IL patchwork from
            above; positions us geographically without leaning on a
            state outline. */}
        <div className="cities-banner pp-fade-in">
          <Image
            src="/photography/cities-il-farmland.jpg"
            alt="Central Illinois farmland under a wide sunset sky"
            fill
            sizes="100vw"
            loading="lazy"
          />
          <div className="cities-banner-tint" aria-hidden="true" />
        </div>
        <div className="cities-inner">
          <p className="pp-eyebrow">Central Illinois · Coverage</p>
          <h2 id="cities-heading" className="cities-h2">Browse deals by city</h2>
          <div className="cities-grid">
            {CENTRAL_IL_PUBLIC_CITIES.map((c, i) => {
              // Pull live counts from the unfiltered city map. Earlier
              // versions used localizedDealPool, which is filtered to the
              // user's metro — that meant cards outside the user's city
              // always read "Listings" (the placeholder) regardless of
              // whether real deals existed there. Fixed 2026-04-30.
              const slot = cityCounts.get(c.name.toLowerCase()) || { deals: 0, listings: 0 };
              const dealN = slot.deals;
              const listingN = slot.listings;
              // Stagger fade-in: cycle through delay-1/2/3 so adjacent
              // cards don't all animate on the same frame, but we never
              // delay a card more than 240ms (delay-3) so the section
              // feels instant on slow connections.
              const delay = ["", " pp-fade-up-delay-1", " pp-fade-up-delay-2", " pp-fade-up-delay-3"][i % 4];
              return (
                <Link key={c.slug} href={`/city/${c.slug}`} className={`city-card pp-card pp-fade-up${delay}`}>
                  <span className="city-card-name">{c.name}</span>
                  {dealN > 0 ? (
                    <span className="city-card-count">{dealN} deal{dealN === 1 ? "" : "s"}</span>
                  ) : listingN > 0 ? (
                    <span className="city-card-count city-card-count-quiet">
                      {listingN} dispensar{listingN === 1 ? "y" : "ies"}
                    </span>
                  ) : (
                    <span className="city-card-count city-card-count-quiet">View dispensaries →</span>
                  )}
                </Link>
              );
            })}
          </div>
          <div className="cities-foot">
            <Link href="/dispensaries" className="cities-all-link">
              Browse every Central IL dispensary →
            </Link>
          </div>
        </div>
      </section>

      <SearchTracker />

      {/* ============================================================
       * SECTION 4 — Trust + brand
       * Small about block. The voice is the strongest part of the
       * brand per the spec — keep the copy plain, builder-to-builder,
       * and let the typography (Source Serif 4 long-form) carry it.
       * ============================================================ */}
      <section className="trust-section" aria-labelledby="trust-heading">
        <div className="trust-grid">
          <div className="trust-inner pp-fade-up">
            <p className="pp-eyebrow">About PuffPrice</p>
            <h2 id="trust-heading" className="trust-h2">We built the thing we wished existed.</h2>
            <p className="trust-body pp-longform">
              One person, in a parking lot, looking for a real deal — that&apos;s the user.
              We pull deals from direct dispensary websites and official social only.
              No aggregator scraping. Re-verified daily. Free to browse, always.
            </p>
            <div className="trust-cta-row">
              <Link href="/about" className="trust-cta">Read the about page →</Link>
              <Link href="/alerts" className="trust-cta-muted">Get free deal alerts</Link>
            </div>
          </div>
          {/* Algonquin-Minonk windfarm at sunset, Illinois (Laura Ockel,
              Unsplash). The "Tuesday afternoon, not a rave" mood the
              brand spec asks for. */}
          <div className="trust-photo pp-fade-up">
            <Image
              src="/photography/trust-il-windfarm-sunset.jpg"
              alt="Wind turbines on an Illinois farm at sunset"
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* FAQ — visible content that matches FAQ_SCHEMA. Google requires
          FAQPage rich-result text to be rendered on the page; the schema
          above was flagged as invalid without this. */}
      <section
        aria-labelledby="faq-heading"
        style={{
          background: "#fff",
          borderTop: "1px solid #e8e4da",
          padding: "52px 28px 44px",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2
            id="faq-heading"
            style={{
              fontSize: "clamp(1.3rem,3vw,1.7rem)",
              fontWeight: 700,
              color: "#1F3D2B",
              letterSpacing: "-.03em",
              marginBottom: 24,
            }}
          >
            Frequently asked
          </h2>
          <dl style={{ display: "grid", gap: 18 }}>
            {FAQ_ENTRIES.map((e, i) => (
              <div
                key={i}
                style={{
                  background: "#F7F4ED",
                  border: "1px solid #e8e4da",
                  borderRadius: 12,
                  padding: "16px 18px",
                }}
              >
                <dt
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#1F3D2B",
                    fontFamily: "system-ui, sans-serif",
                    marginBottom: 6,
                  }}
                >
                  {e.q}
                </dt>
                <dd
                  style={{
                    fontSize: ".92rem",
                    color: "#374151",
                    fontFamily: "system-ui, sans-serif",
                    lineHeight: 1.55,
                  }}
                >
                  {e.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Footer />

      {/* Mobile-only sticky bottom CTA — appears once user scrolls
          past the #pp-hero-sentinel. Hidden on desktop via CSS media
          query inside the component. */}
      <StickyMobileCTA />
    </>
  );
}
