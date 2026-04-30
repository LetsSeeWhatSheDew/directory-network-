import Link from "next/link";
import Logo from "./components/Logo";
import LocationAware from "./components/LocationAware";
import TrackedLink from "./components/TrackedLink";
import HomeDealCards from "./components/HomeDealCards";
import HeroDealCard from "./components/HeroDealCard";
import MobileNavMenu from "./components/MobileNavMenu";
import SavingsCallout from "./components/SavingsCallout";
import SearchTracker from "./components/SearchTracker";
import FourTwentyBanner from "./components/FourTwentyBanner";
import RecentlyViewedRow from "./components/RecentlyViewedRow";
import EndingSoonRow from "./components/EndingSoonRow";
import PuffPriceIndexCard from "./components/PuffPriceIndexCard";
import StickyMobileCTA from "./components/StickyMobileCTA";
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

// 7-blade cannabis leaf — universal cannabis symbol
function LeafIcon({ size = 20, color = "#4ade80" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* stem */}
      <path d="M32 60 L32 44" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* center blade (tallest) */}
      <path d="M32 44 Q30 28 32 4 Q34 28 32 44 M30 14 L26 16 M34 14 L38 16 M30 22 L25 24 M34 22 L39 24 M30 30 L24 33 M34 30 L40 33" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.55" strokeLinejoin="round" />
      {/* upper-left blade */}
      <path d="M32 44 Q20 32 10 14 Q22 28 32 44 M15 18 L11 22 M19 22 L15 26 M23 26 L20 30" stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.5" strokeLinejoin="round" />
      {/* upper-right blade */}
      <path d="M32 44 Q44 32 54 14 Q42 28 32 44 M49 18 L53 22 M45 22 L49 26 M41 26 L44 30" stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.5" strokeLinejoin="round" />
      {/* mid-left blade (widest) */}
      <path d="M32 44 Q14 40 2 30 Q18 40 32 44 M10 34 L7 38 M16 36 L13 40 M22 40 L20 43" stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.45" strokeLinejoin="round" />
      {/* mid-right blade (widest) */}
      <path d="M32 44 Q50 40 62 30 Q46 40 32 44 M54 34 L57 38 M48 36 L51 40 M42 40 L44 43" stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.45" strokeLinejoin="round" />
      {/* lower-left blade (short) */}
      <path d="M32 44 Q22 48 12 50 Q24 46 32 44" stroke={color} strokeWidth="1.3" fill={color} fillOpacity="0.4" strokeLinejoin="round" />
      {/* lower-right blade (short) */}
      <path d="M32 44 Q42 48 52 50 Q40 46 32 44" stroke={color} strokeWidth="1.3" fill={color} fillOpacity="0.4" strokeLinejoin="round" />
    </svg>
  );
}

// Gummy bear — edibles icon
function GummyBearIcon({ size = 20 }) {
  const color = "#fb923c";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* left ear */}
      <circle cx="20" cy="14" r="6" fill={color} />
      {/* right ear */}
      <circle cx="44" cy="14" r="6" fill={color} />
      {/* head */}
      <circle cx="32" cy="22" r="10" fill={color} />
      {/* torso */}
      <ellipse cx="32" cy="40" rx="13" ry="14" fill={color} />
      {/* left arm */}
      <ellipse cx="16" cy="36" rx="5" ry="6" fill={color} />
      {/* right arm */}
      <ellipse cx="48" cy="36" rx="5" ry="6" fill={color} />
      {/* left leg */}
      <ellipse cx="24" cy="56" rx="5" ry="5" fill={color} />
      {/* right leg */}
      <ellipse cx="40" cy="56" rx="5" ry="5" fill={color} />
      {/* eyes */}
      <circle cx="28" cy="20" r="1.4" fill="#0f1f3d" />
      <circle cx="36" cy="20" r="1.4" fill="#0f1f3d" />
      {/* smile */}
      <path d="M28 25 Q32 28 36 25" stroke="#0f1f3d" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Vape pen — sleek cartridge with oil window
function VapeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* mouthpiece */}
      <rect x="28" y="4" width="8" height="8" rx="1.5" fill="#1f2937" />
      {/* upper cartridge body */}
      <rect x="24" y="12" width="16" height="22" rx="2" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
      {/* oil window */}
      <rect x="27" y="16" width="10" height="14" rx="1" fill="#fbbf24" />
      {/* metal band */}
      <rect x="23" y="34" width="18" height="4" rx="1" fill="#9ca3af" />
      {/* battery body */}
      <rect x="24" y="38" width="16" height="20" rx="2" fill="#0f1f3d" />
      {/* LED button */}
      <circle cx="32" cy="52" r="2.2" fill="#16a34a" />
      <circle cx="32" cy="52" r="1" fill="#4ade80" />
    </svg>
  );
}

// Concentrate crystal — faceted gem / water drop
function ConcentrateIcon({ size = 20 }) {
  const color = "#a78bfa";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* outer crystal teardrop */}
      <path d="M32 6 L50 32 Q50 54 32 58 Q14 54 14 32 Z" fill={color} fillOpacity="0.85" stroke="#7c3aed" strokeWidth="1.2" strokeLinejoin="round" />
      {/* internal facet lines */}
      <path d="M32 6 L32 58" stroke="#c4b5fd" strokeWidth="0.8" />
      <path d="M14 32 L50 32" stroke="#c4b5fd" strokeWidth="0.8" />
      <path d="M22 18 L42 46" stroke="#c4b5fd" strokeWidth="0.7" />
      <path d="M42 18 L22 46" stroke="#c4b5fd" strokeWidth="0.7" />
      {/* highlight */}
      <path d="M26 14 L22 24" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}

// Flame — all deals icon
function FlameIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* outer flame (white on green bg) */}
      <path d="M32 6 C36 18 48 24 48 40 C48 52 40 58 32 58 C24 58 16 52 16 40 C16 30 22 26 24 20 C26 26 30 22 32 6 Z" fill="#fff" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
      {/* inner flame */}
      <path d="M32 22 C34 28 40 32 40 42 C40 50 36 54 32 54 C28 54 24 50 24 42 C24 36 28 34 29 30 C30 34 31 32 32 22 Z" fill="#fb923c" />
      {/* core */}
      <path d="M32 34 C33 38 36 40 36 45 C36 49 34 51 32 51 C30 51 28 49 28 45 C28 41 30 41 32 34 Z" fill="#fbbf24" />
    </svg>
  );
}

// Large botanical cannabis plant — hero background, 420px tall, bottom-aligned
// 7-blade fan leaf clusters branching off the main stalk at multiple heights
function PlantSilhouette({ side = "left" }) {
  const transform = side === "right" ? "scale(-1,1) translate(-200,0)" : "";
  // Single 7-blade fan leaf cluster, origin at (0,0), blades radiating upward
  const FanLeaf = ({ scale = 1 }) => (
    <g transform={`scale(${scale})`} fill="#e8e4da" fillOpacity="0.9" stroke="#e8e4da" strokeWidth="1" strokeLinejoin="round">
      {/* center blade — tallest, straight up */}
      <path d="M0 0 Q-3 -40 -1 -78 Q0 -82 1 -78 Q3 -40 0 0 Z" />
      {/* blades at 30° (left + right) */}
      <path d="M0 0 Q-22 -32 -40 -62 Q-43 -66 -38 -65 Q-14 -28 0 0 Z" />
      <path d="M0 0 Q22 -32 40 -62 Q43 -66 38 -65 Q14 -28 0 0 Z" />
      {/* blades at 60° (widest) */}
      <path d="M0 0 Q-38 -20 -64 -34 Q-68 -36 -63 -32 Q-24 -10 0 0 Z" />
      <path d="M0 0 Q38 -20 64 -34 Q68 -36 63 -32 Q24 -10 0 0 Z" />
      {/* blades at 80° (short lower) */}
      <path d="M0 0 Q-32 -4 -50 -4 Q-54 -3 -48 -1 Q-22 2 0 0 Z" />
      <path d="M0 0 Q32 -4 50 -4 Q54 -3 48 -1 Q22 2 0 0 Z" />
    </g>
  );
  return (
    <svg
      width="200"
      height="420"
      viewBox="0 0 200 420"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        bottom: "0",
        [side]: "-30px",
        opacity: 0.3,
        pointerEvents: "none",
        zIndex: 0,
      }}
      aria-hidden="true"
    >
      <g transform={transform}>
        {/* main stalk, rises from bottom */}
        <path d="M100 420 L100 20" stroke="#e8e4da" strokeWidth="3" fill="none" />
        {/* branch offshoots */}
        <path d="M100 330 Q82 318 62 304" stroke="#e8e4da" strokeWidth="2" fill="none" />
        <path d="M100 240 Q118 228 140 216" stroke="#e8e4da" strokeWidth="2" fill="none" />
        <path d="M100 150 Q80 140 60 128" stroke="#e8e4da" strokeWidth="2" fill="none" />
        {/* fan leaf clusters at different heights */}
        <g transform="translate(100 22)"><FanLeaf scale={1} /></g>
        <g transform="translate(60 128)"><FanLeaf scale={0.82} /></g>
        <g transform="translate(140 216)"><FanLeaf scale={0.78} /></g>
        <g transform="translate(62 304)"><FanLeaf scale={0.68} /></g>
        <g transform="translate(100 390)"><FanLeaf scale={0.55} /></g>
      </g>
    </svg>
  );
}

// ---------- DATA ----------

const CATEGORIES = [
  { label: "Flower", slug: "flower", icon: "leaf" },
  { label: "Edibles", slug: "edibles", icon: "gummy" },
  { label: "Vapes", slug: "vapes", icon: "vape" },
  { label: "Concentrates", slug: "concentrate", icon: "crystal" },
  { label: "All deals", slug: "all", icon: "flame" },
];

function renderIcon(key) {
  const s = 36;
  if (key === "leaf") return <LeafIcon size={s} />;
  if (key === "gummy") return <GummyBearIcon size={s} />;
  if (key === "vape") return <VapeIcon size={s} />;
  if (key === "crystal") return <ConcentrateIcon size={s} />;
  if (key === "flame") return <FlameIcon size={s} />;
  return null;
}

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

async function getTopDeals() {
  // ISR: cache the Supabase response for 60s. Cold starts and repeat
  // visitors both read the cached payload instead of round-tripping
  // to Supabase, dropping TTFB from ~10s to <2s. Deals only need to
  // refresh roughly once a minute.
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=*&city=in.${encodeURIComponent(CIL_CITY_IN_LIST)}&order=discount_value.desc&limit=6`,
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
    return Array.isArray(data) ? filterExpired(data).slice(0, 3) : [];
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
        body{font-family:Georgia,serif;background:#f5f4f0;min-height:100vh;color:#0f1f3d}

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
        .logo img{width:56px!important;height:56px!important}
        .logo-mark{position:relative;width:28px;height:28px;display:inline-block;flex-shrink:0}
        .logo-mark-dot{position:absolute;top:-2px;right:-2px;width:10px;height:10px;border-radius:50%;background:#16a34a;border:2px solid #fff;animation:pulse 2.5s infinite}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:#16a34a;animation:pulse 2.5s infinite}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.9)}}
        .logo-text{font-size:1.15rem;font-weight:700;color:#0f1f3d;letter-spacing:-.02em}
        .logo-text span{color:#16a34a}
        .nav-links{display:flex;align-items:center;gap:20px}
        .nav-link{font-size:.82rem;color:#6b7280;text-decoration:none;font-family:system-ui,sans-serif}
        .nav-link:hover{color:#0f1f3d}
        .nav-cta{
          font-size:.82rem;font-family:system-ui,sans-serif;font-weight:600;
          color:#fff;background:#16a34a;padding:6px 14px;border-radius:6px;
          text-decoration:none;
        }
        .nav-cta:hover{background:#15803d}

        /* 4/20 PROMO BANNER */
        .promo-banner{background:#15803d;color:#fff}
        .promo-inner{max-width:1100px;margin:0 auto;padding:8px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
        .promo-left{display:flex;align-items:center;gap:10px;font-family:system-ui,sans-serif;font-size:.82rem;font-weight:600}
        .promo-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;animation:pulse 2s infinite;flex-shrink:0}
        .promo-text{line-height:1.3}
        .promo-cta{color:#fff;text-decoration:none;font-family:system-ui,sans-serif;font-size:.82rem;font-weight:600;white-space:nowrap}
        .promo-cta:hover{text-decoration:underline}
        @media(max-width:520px){.promo-inner{padding:8px 14px}.promo-text{font-size:.75rem}}

        /* HERO — pp-hero-bg from globals.css now drives the backdrop
           (warm cream + radial-gradient terracotta hint). The local
           rule keeps the layout shape and removes the prior white. */
        .hero{
          padding:36px 28px 56px;
          position:relative;
          overflow:hidden;
          border-bottom:1px solid #e8e4da;
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
          font-size:.8rem;color:#16a34a;font-family:system-ui,sans-serif;
          font-weight:500;margin-bottom:2px;
        }

        .hero h1{
          /* Spec 2.3 hero: 56-72px Geist Display 700, tight tracking. */
          font-family:var(--font-display, var(--font-geist-sans));
          font-size:clamp(2.5rem, 6vw + 1rem, 4.25rem);
          font-weight:700;color:#0f1f3d;
          letter-spacing:-.04em;line-height:1.02;
          margin-bottom:10px;
        }
        .hero h1 em{color:#16a34a;font-style:normal}
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
          border-left:4px solid #16a34a;
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
          font-weight:700;color:#16a34a;
          letter-spacing:-.04em;line-height:1;
        }
        .hero-deal-vs{
          font-size:.72rem;color:#9ca3af;
          font-family:system-ui,sans-serif;
          margin-top:2px;margin-bottom:16px;
        }
        .hero-deal-name{
          font-size:1.1rem;font-weight:700;
          color:#0f1f3d;line-height:1.2;
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
          background:#16a34a;color:#fff;
          padding:12px 22px;border-radius:10px;
          text-decoration:none;font-family:var(--font-ui, system-ui, sans-serif);
          font-weight:700;font-size:.92rem;letter-spacing:.02em;
          transition:background 150ms ease, transform 150ms ease;
          white-space:nowrap;
          min-height:44px;display:inline-flex;align-items:center;
        }
        .hero-deal-cta:hover{background:#15803d;transform:translateY(-1px)}
        .hero-deal-more{
          margin-top:14px;align-self:flex-start;
          font-size:.82rem;color:#6b7280;
          font-family:system-ui,sans-serif;
          text-decoration:none;
        }
        .hero-deal-more:hover{color:#16a34a}
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
          color:#0f1f3d;cursor:pointer;text-decoration:none;
          transition:all .15s;
        }
        .cat-btn:hover{background:#f0fdf4;border-color:#16a34a;color:#0f1f3d}
        .cat-btn svg{flex-shrink:0;width:24px;height:24px}

        /* STATS STRIP — minimal credibility line */
        .stats{background:#f5f4f0;padding:22px 28px;text-align:center}
        .stats-inner{max-width:900px;margin:0 auto}
        .stats-line{font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif;letter-spacing:.01em}
        .stats-line strong{color:#16a34a;font-weight:700}
        @media(max-width:520px){.stats-line{font-size:.78rem}}

        /* DEALS SECTION */
        .deals-section{max-width:1100px;margin:0 auto;padding:52px 28px}

        .section-eyebrow{
          font-size:.7rem;font-weight:700;letter-spacing:.14em;
          text-transform:uppercase;color:#16a34a;
          font-family:system-ui,sans-serif;margin-bottom:6px;
        }
        .section-title{
          font-size:clamp(1.4rem,3vw,1.8rem);font-weight:700;
          color:#0f1f3d;letter-spacing:-.03em;margin-bottom:4px;
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
        .deal-card:hover{border-color:#16a34a}
        .deal-card.top-pick{
          border:2px solid #16a34a;
          background:linear-gradient(135deg,#f0fdf4 0%,#fff 60%);
        }
        .top-pick-badge{
          position:absolute;top:-10px;left:16px;
          background:#16a34a;color:#fff;
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
        .deal-name{font-size:.95rem;font-weight:700;color:#0f1f3d}
        .deal-city{font-size:.75rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-top:2px}
        .open-badge{
          font-size:.68rem;font-weight:600;
          padding:2px 8px;border-radius:100px;
          font-family:system-ui,sans-serif;
          white-space:nowrap;
        }
        .open-badge.open{color:#166534;background:#dcfce7}
        .open-badge.closed{color:#6b7280;background:#f1f5f9}
        .deal-highlight{
          font-size:.95rem;font-weight:700;color:#16a34a;
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
          background:#f5f4f0;border-radius:100px;
          padding:2px 9px;font-family:system-ui,sans-serif;
        }
        .deal-savings{
          display:flex;align-items:center;justify-content:space-between;
          gap:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;
          padding:14px 16px;margin-top:auto;
        }
        .savings-copy{display:flex;flex-direction:column}
        .savings-label{font-size:.65rem;font-weight:700;color:#166534;font-family:system-ui,sans-serif;text-transform:uppercase;letter-spacing:.12em}
        .savings-sub{font-size:.68rem;color:rgba(22,101,52,.7);font-family:system-ui,sans-serif;margin-top:2px}
        .savings-num{font-size:2rem;font-weight:700;color:#16a34a;letter-spacing:-.03em;line-height:1}

        /* FOOTER */
        .footer{
          background:#fff;border-top:1px solid #e8e4da;
          padding:20px 28px;
          display:flex;justify-content:space-between;align-items:center;
          flex-wrap:wrap;gap:12px;
        }
        .footer-logo{font-size:.9rem;font-weight:700;color:#0f1f3d}
        .footer-logo span{color:#16a34a}
        .footer-links{display:flex;gap:18px}
        .footer-link{font-size:.75rem;color:#6b7280;font-family:system-ui,sans-serif;text-decoration:none}
        .footer-link:hover{color:#0f1f3d}
        .footer-copy{font-size:.72rem;color:#9ca3af;font-family:system-ui,sans-serif}

        /* SECTION 3 — CITIES GRID (Phase 4 layout consolidation) */
        .cities-section{background:#fff;border-top:1px solid #e8e4da;border-bottom:1px solid #e8e4da;padding:64px 28px}
        .cities-inner{max-width:1100px;margin:0 auto}
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
          color:#0f1f3d;
        }
        .city-card-count{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.78rem;font-weight:600;letter-spacing:.01em;
          color:#16a34a;background:#f0fdf4;
          padding:4px 10px;border-radius:100px;
          font-variant-numeric:tabular-nums;
        }
        .city-card-count-quiet{
          color:#9ca3af;background:transparent;border:1px solid #e8e4da;
        }
        .cities-foot{margin-top:28px;text-align:center}
        .cities-all-link{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.92rem;font-weight:600;color:#16a34a;
          text-decoration:none;
        }
        .cities-all-link:hover{text-decoration:underline}

        /* SECTION 4 — TRUST + BRAND */
        .trust-section{
          background:linear-gradient(180deg, #F5F4F0 0%, #FFFFFF 100%);
          padding:72px 28px;
        }
        .trust-inner{max-width:680px;margin:0 auto;text-align:center}
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
          font-size:.92rem;font-weight:700;color:#fff;background:#16a34a;
          text-decoration:none;padding:11px 22px;border-radius:10px;
          min-height:44px;display:inline-flex;align-items:center;
          transition:background 150ms ease, transform 150ms ease;
        }
        .trust-cta:hover{background:#15803d;transform:translateY(-1px)}
        .trust-cta-muted{
          font-family:var(--font-ui, system-ui, sans-serif);
          font-size:.92rem;font-weight:600;color:#374151;
          text-decoration:none;padding:11px 4px;
          min-height:44px;display:inline-flex;align-items:center;
        }
        .trust-cta-muted:hover{color:#0f1f3d}

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
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <Link href="/" className="logo" aria-label="PuffPrice home">
          <Logo size={44} priority />
        </Link>
        <div className="nav-links desktop-only-nav">
          <Link href="/cannabis/illinois/open-now" className="nav-link">Open now</Link>
          <Link href="/savings/dashboard" className="nav-link">My savings</Link>
          <Link href="/map" className="nav-link">Map view</Link>
          <Link href="/" className="nav-link">Browse Central IL</Link>
          <Link href="/about" className="nav-link">About</Link>
          <Link href="/dispensaries" className="nav-cta">For dispensaries</Link>
        </div>
        <MobileNavMenu />
      </nav>

      {/* 4/20 DEALS WEEK BANNER — only renders Apr 17–20, 2026 */}
      <FourTwentyBanner />

      {/* HERO — one recommendation, above the fold. The pp-hero-bg
          class layers a warm cream + terracotta-hint radial gradient
          per brand spec 2.3 in lieu of hero photography (deferred). */}
      <div className="hero pp-hero-bg">
        <PlantSilhouette side="left" />
        <PlantSilhouette side="right" />
        <div className="hero-inner">
          <div className="hero-grid">
            <div className="hero-left pp-fade-up">
              {/* Location line — tiny, first */}
              <LocationAware />

              {/* Regional eyebrow — Central IL is the focus market. */}
              <p className="pp-eyebrow" style={{ marginBottom: 6 }}>Serving Central Illinois</p>

              {/* Headline */}
              <h1>Best Bud For <em>Your Buck$</em></h1>
              <p className="hero-sub">
                Low Prices. High Times.
                <br />
                Live dispensary deals for Central Illinois.
              </p>

              {/* THE big deal card — the hero element */}
              <HeroDealCard initial={featuredDeal} totalDealCount={dealCount ?? 0} />

              {/* City-aware savings callout — muted supporting copy */}
              <SavingsCallout initialSavings={featuredDeal ? estimateSavings(featuredDeal) : null} />
            </div>

            {/* Desktop-only right column: category shortcuts */}
            <div className="hero-right">
              <div className="hero-right-label">Browse by category</div>
              {CATEGORIES.map((cat) => (
                <TrackedLink
                  key={cat.slug}
                  href={`/deals/${cat.slug}`}
                  className="cat-btn"
                  event="category_click"
                  params={{ category: cat.slug }}
                >
                  {renderIcon(cat.icon)}
                  {cat.label}
                </TrackedLink>
              ))}
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

      {/* ============================================================
       * SECTION 3 — Browse by city
       * 9 city cards in a 3×3 desktop / 2×5 mobile grid. Each card
       * shows the city name, deal-count badge, and a small accent.
       * Sourced from CENTRAL_IL_PUBLIC_CITIES so a future dispensary
       * opening in a hidden city brings its slug back automatically.
       * ============================================================ */}
      <section className="cities-section" aria-labelledby="cities-heading">
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
        <div className="trust-inner pp-fade-up">
          <p className="pp-eyebrow">About PuffPrice</p>
          <h2 id="trust-heading" className="trust-h2">We built the thing we wished existed.</h2>
          <p className="trust-body pp-longform">
            One person, in a parking lot, looking for a real deal — that's the user.
            We pull deals from direct dispensary websites and official social only.
            No aggregator scraping. Re-verified daily. Free to browse, always.
          </p>
          <div className="trust-cta-row">
            <Link href="/about" className="trust-cta">Read the about page →</Link>
            <Link href="/alerts" className="trust-cta-muted">Get free deal alerts</Link>
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
              color: "#0f1f3d",
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
                  background: "#f5f4f0",
                  border: "1px solid #e8e4da",
                  borderRadius: 12,
                  padding: "16px 18px",
                }}
              >
                <dt
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#0f1f3d",
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

      {/* FOOTER */}
      <footer className="footer">
        <span className="footer-logo" aria-label="PuffPrice"><Logo size={32} /></span>
        <div className="footer-links">
          <Link href="/" className="footer-link">Central Illinois</Link>
          <Link href="/cannabis/illinois/first-time-guide" className="footer-link">First-time guide</Link>
          <Link href="/cannabis/illinois/laws" className="footer-link">IL laws</Link>
          <Link href="/dispensaries" className="footer-link">For dispensaries</Link>
        </div>
        <span className="footer-copy">© {new Date().getFullYear()} PuffPrice</span>
      </footer>

      {/* Mobile-only sticky bottom CTA — appears once user scrolls
          past the #pp-hero-sentinel. Hidden on desktop via CSS media
          query inside the component. */}
      <StickyMobileCTA />
    </>
  );
}
