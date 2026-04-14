import Link from "next/link";
import LocationAware from "./components/LocationAware";
import TrackedLink from "./components/TrackedLink";
import HomeDealCards from "./components/HomeDealCards";
import HeroDealCard from "./components/HeroDealCard";
import MobileNavMenu from "./components/MobileNavMenu";
import SearchTracker from "./components/SearchTracker";
import { formatSavingsDollars, gradeDeal } from "../lib/dealScoring";

// ============================================================
// CLEANLIST HOMEPAGE — Cannabis visual identity overhaul
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

function FourTwentyBanner() {
  const now = new Date();
  const show = now >= new Date("2026-04-17") && now <= new Date("2026-04-20T23:59:59");
  if (!show) return null;
  return (
    <div className="promo-banner">
      <div className="promo-inner">
        <span className="promo-left">
          <span className="promo-dot" aria-hidden="true" />
          <span className="promo-text">
            🌿 4/20 DEALS WEEK — Best discounts of the year at Illinois dispensaries
          </span>
        </span>
        <Link href="/deals/all" className="promo-cta">See all deals →</Link>
      </div>
    </div>
  );
}

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

async function getTopDeals() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=*&order=discount_value.desc&limit=3`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
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

async function getActiveDealCount() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/deals?select=id&is_active=eq.true&project_tag=eq.green`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "count=exact",
          "Range-Unit": "items",
          Range: "0-0",
        },
        next: { revalidate: 300 },
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

export default async function HomePage() {
  const [dealCount, topDeals] = await Promise.all([
    getActiveDealCount(),
    getTopDeals(),
  ]);
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:Georgia,serif;background:#f5f4f0;min-height:100vh;color:#0f1f3d}

        /* GREEN TOP STRIPE — money signal */
        .top-stripe{height:4px;background:#16a34a;width:100%}

        /* NAV */
        .nav{
          display:flex;justify-content:space-between;align-items:center;
          padding:14px 28px;background:#fff;
          position:sticky;top:0;z-index:100;
          border-bottom:1px solid #e8e4da;
        }
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none}
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

        /* HERO */
        .hero{
          background:#fff;
          padding:20px 28px 44px;
          position:relative;
          overflow:hidden;
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
          font-size:clamp(1.8rem,5vw,2.8rem);
          font-weight:700;color:#0f1f3d;
          letter-spacing:-.04em;line-height:1.05;
          margin-bottom:4px;
        }
        .hero h1 em{color:#16a34a;font-style:normal}
        .hero-sub{
          font-size:.92rem;color:#6b7280;
          font-family:system-ui,sans-serif;
          line-height:1.5;margin-bottom:14px;
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
          text-decoration:none;font-family:system-ui,sans-serif;
          font-weight:800;font-size:.92rem;letter-spacing:.02em;
          transition:background .15s;white-space:nowrap;
        }
        .hero-deal-cta:hover{background:#15803d}
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

        /* BELOW-FOLD CATEGORY SECTION */
        .below-section{background:#fff;border-top:1px solid #e8e4da}
        .below-inner{max-width:900px;margin:0 auto;padding:48px 28px}
        .below-title{
          font-size:clamp(1.3rem,3vw,1.6rem);font-weight:700;
          color:#0f1f3d;letter-spacing:-.03em;margin-bottom:18px;
        }
        .below-cat-grid{
          display:grid;grid-template-columns:1fr 1fr;gap:12px;
        }
        .below-cat-card{
          display:flex;flex-direction:column;align-items:center;gap:10px;
          background:#fff;border:1px solid #e8e4da;border-radius:12px;
          padding:24px 16px;text-decoration:none;
          transition:all .15s;
        }
        .below-cat-card:hover{border-color:#16a34a;background:#f0fdf4}
        .below-cat-icon{display:flex;align-items:center;justify-content:center}
        .below-cat-icon svg{width:38px;height:38px}
        .below-cat-label{
          font-size:.95rem;font-weight:700;color:#0f1f3d;
          font-family:system-ui,sans-serif;
        }

        /* HOW IT WORKS — simplified 3 lines */
        .how{background:#f5f4f0;border-top:1px solid #e8e4da;border-bottom:1px solid #e8e4da}
        .how-inner{
          max-width:900px;margin:0 auto;
          padding:40px 28px;
          display:grid;grid-template-columns:repeat(3,1fr);gap:28px;
        }
        .how-num{
          font-size:1.8rem;font-weight:700;color:#16a34a;
          line-height:1;margin-bottom:8px;
        }
        .how-title{font-size:.95rem;font-weight:700;color:#0f1f3d;font-family:system-ui,sans-serif;line-height:1.3}

        /* ALERTS CTA STRIP */
        .alerts-strip{background:#fff;border-top:1px solid #e8e4da;padding:44px 28px;text-align:center}
        .alerts-inner{max-width:600px;margin:0 auto}
        .alerts-title{font-size:1.3rem;font-weight:700;color:#0f1f3d;letter-spacing:-.02em;margin-bottom:6px}
        .alerts-sub{font-size:.9rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:18px}
        .alerts-btn{
          display:inline-block;background:#16a34a;color:#fff;
          padding:12px 24px;border-radius:10px;text-decoration:none;
          font-family:system-ui,sans-serif;font-weight:700;font-size:.9rem;
        }
        .alerts-btn:hover{background:#15803d}

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
        .open-badge.closed{color:#991b1b;background:#fee2e2}
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

        /* BIZ STRIP */
        .biz-strip{
          background:#f5f4f0;border-top:1px solid #e8e4da;
          padding:44px 28px;text-align:center;
        }
        .biz-title{
          font-size:1.25rem;font-weight:700;color:#0f1f3d;
          letter-spacing:-.02em;margin-bottom:6px;
        }
        .biz-sub{
          font-size:.875rem;color:#6b7280;
          font-family:system-ui,sans-serif;margin-bottom:20px;
          max-width:400px;margin-left:auto;margin-right:auto;
        }
        .biz-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
        .biz-btn-primary{
          background:#0f1f3d;color:#fff;
          padding:10px 22px;border-radius:8px;
          text-decoration:none;font-family:system-ui,sans-serif;
          font-weight:700;font-size:.875rem;
        }
        .biz-btn-primary:hover{background:#1e3a5f}
        .biz-btn-secondary{
          background:transparent;color:#6b7280;
          padding:10px 22px;border-radius:8px;
          text-decoration:none;font-family:system-ui,sans-serif;
          font-weight:600;font-size:.875rem;
          border:1px solid #d1cfc6;
        }
        .biz-btn-secondary:hover{border-color:#9ca3af;color:#374151}

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

        /* RESPONSIVE */
        @media(max-width:768px){
          .nav{padding:12px 16px}
          .hero{padding:40px 16px 36px}
          .how-inner{grid-template-columns:1fr;gap:24px;padding:36px 16px}
          .deals-section{padding:36px 16px}
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
        }
      `}</style>

      {/* GREEN MONEY STRIPE */}
      <div className="top-stripe" aria-hidden="true" />

      {/* NAV */}
      <nav className="nav">
        <Link href="/" className="logo" aria-label="CleanList home">
          <span className="logo-mark">
            <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="0" y="0" width="28" height="28" rx="6" fill="#0f1f3d" />
              <rect x="7" y="9" width="14" height="1.8" rx="0.9" fill="#fff" />
              <rect x="7" y="13.2" width="14" height="1.8" rx="0.9" fill="#fff" />
              <rect x="7" y="17.4" width="14" height="1.8" rx="0.9" fill="#fff" />
            </svg>
            <span className="logo-mark-dot" aria-hidden="true" />
          </span>
          <span className="logo-text">clean<span>list</span></span>
        </Link>
        <div className="nav-links desktop-only-nav">
          <Link href="/cannabis/illinois/open-now" className="nav-link">Open now</Link>
          <Link href="/savings/dashboard" className="nav-link">My savings</Link>
          <Link href="/map" className="nav-link">Map view</Link>
          <Link href="/cannabis/illinois" className="nav-link">Browse Illinois</Link>
          <Link href="/dispensaries" className="nav-cta">For dispensaries</Link>
        </div>
        <MobileNavMenu />
      </nav>

      {/* 4/20 DEALS WEEK BANNER — only renders Apr 17–20, 2026 */}
      <FourTwentyBanner />

      {/* HERO — one recommendation, above the fold */}
      <div className="hero">
        <PlantSilhouette side="left" />
        <PlantSilhouette side="right" />
        <div className="hero-inner">
          <div className="hero-grid">
            <div className="hero-left">
              {/* Location line — tiny, first */}
              <LocationAware />

              {/* Headline */}
              <h1>Best Bud For <em>Your Buck$</em></h1>
              <p className="hero-sub">Low Prices. High Times.</p>

              {/* THE big deal card — the hero element */}
              <HeroDealCard initial={topDeals[0] || null} />
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

      {/* BELOW FOLD — Section 1: Browse by category (mobile-first) */}
      <div className="below-section below-categories">
        <div className="below-inner">
          <h2 className="below-title">Browse by what you want</h2>
          <div className="below-cat-grid">
            {CATEGORIES.filter((c) => c.slug !== "all").map((cat) => (
              <TrackedLink
                key={cat.slug}
                href={`/deals/${cat.slug}`}
                className="below-cat-card"
                event="category_click"
                params={{ category: cat.slug, source: "below_fold" }}
              >
                <div className="below-cat-icon">{renderIcon(cat.icon)}</div>
                <div className="below-cat-label">{cat.label}</div>
              </TrackedLink>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: How it works — 3 simplified lines */}
      <div className="how">
        <div className="how-inner">
          <div className="how-step">
            <div className="how-num">01</div>
            <div className="how-title">We detect your location</div>
          </div>
          <div className="how-step">
            <div className="how-num">02</div>
            <div className="how-title">We find the best deal right now</div>
          </div>
          <div className="how-step">
            <div className="how-num">03</div>
            <div className="how-title">You save money</div>
          </div>
        </div>
      </div>

      {/* Section 3: More deals near you (existing card grid) */}
      <div className="deals-section">
        <HomeDealCards initial={topDeals} />
      </div>

      {/* Section 4: Get alerts CTA */}
      <div className="alerts-strip">
        <div className="alerts-inner">
          <div className="alerts-title">Never miss a deal near you</div>
          <p className="alerts-sub">Free email alerts when a better deal drops in your city.</p>
          <Link href="/alerts" className="alerts-btn">Get free alerts →</Link>
        </div>
      </div>

      {/* Section 5: Stats — credibility line */}
      <div className="stats">
        <div className="stats-inner">
          <span className="stats-line">
            <strong>{dealCount !== null ? dealCount : "100"}</strong> active deals · <strong>293</strong> dispensaries · <strong>162</strong> cities
          </span>
        </div>
      </div>

      <SearchTracker />

      {/* DISPENSARY CTA */}
      <div className="biz-strip">
        <div className="biz-title">Own a dispensary?</div>
        <p className="biz-sub">
          Get your daily deals in front of people actively looking to buy right now.
          Featured placement from $49/month.
        </p>
        <div className="biz-btns">
          <Link href="/upgrade" className="biz-btn-primary">Submit your deals →</Link>
          <Link href="/get-listed" className="biz-btn-secondary">Claim free listing</Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <span className="footer-logo">clean<span>list</span></span>
        <div className="footer-links">
          <Link href="/cannabis/illinois" className="footer-link">Illinois</Link>
          <Link href="/cannabis/illinois/first-time-guide" className="footer-link">First-time guide</Link>
          <Link href="/cannabis/illinois/laws" className="footer-link">IL laws</Link>
          <Link href="/dispensaries" className="footer-link">For dispensaries</Link>
        </div>
        <span className="footer-copy">© {new Date().getFullYear()} CleanList</span>
      </footer>
    </>
  );
}
