// app/og/shared.tsx — the Breathe share-image kit (link previews, the daily
// "today's longest exhale" image, campaign pictures). Rendered with next/og
// on the edge. Real data only: amounts come straight from live deals via
// lib/exhale; if nothing qualifies, images say what's true instead.

import { amountOf, longestExhale, productOf, storeWithCity, needsQuantity, isConditional, type ExDeal } from "../../lib/exhale";

// Gold Leaf (2026-11-11): one look for every share image, day or night —
// deep forest, cream type, gold for the money. Day and night keys map to the
// same palette so older routes that still pass ?theme=night stay on brand.
export const C = {
  paper: "#10291C", paperTop: "#10291C", surface: "#173A28", ink: "#F4EAD5", body: "rgba(244,234,213,0.82)", muted: "rgba(244,234,213,0.62)",
  border: "rgba(217,172,79,0.45)", canopy: "#D9AC4F", peach: "#F2CDB3", peachDot: "#D9AC4F", sage: "#CFE2CF",
  nPaper: "#10291C", nSurface: "#173A28", nInk: "#F4EAD5", nBody: "rgba(244,234,213,0.82)", nMuted: "rgba(244,234,213,0.62)", mint: "#D9AC4F", firefly: "#F6DC8F",
};

import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Fonts ship in the repo (OFL); next.config traces app/og/fonts into the /og functions.
let fontCache: Promise<Buffer[]> | null = null;
export async function loadFonts() {
  const f = (p: string) => readFile(join(process.cwd(), "app/og/fonts", p.replace("./fonts/", "")));
  fontCache = fontCache || Promise.all([
    f("./fonts/InstrumentSans-Medium.ttf"),
    f("./fonts/InstrumentSans-SemiBold.ttf"),
    f("./fonts/InstrumentSans-Bold.ttf"),
    f("./fonts/InstrumentSerif-Regular.ttf"),
    f("./fonts/InstrumentSerif-Italic.ttf"),
    f("./fonts/IBMPlexMono-Medium.ttf"),
  ]);
  const [sans5, sans6, sans7, serif, serifI, mono] = await fontCache.catch((e) => {
    fontCache = null; // don't pin a failed read for the life of the function
    throw e;
  });
  return [
    { name: "Sans", data: sans5, weight: 500 as const, style: "normal" as const },
    { name: "Sans", data: sans6, weight: 600 as const, style: "normal" as const },
    { name: "Sans", data: sans7, weight: 700 as const, style: "normal" as const },
    { name: "Serif", data: serif, weight: 400 as const, style: "normal" as const },
    { name: "Serif", data: serifI, weight: 400 as const, style: "italic" as const },
    { name: "Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

// The gold leaf from the Nov 10 flyers (public/gold-leaf.svg), inlined for Satori.
let leafUri = "";
try {
  leafUri = `data:image/svg+xml;base64,${readFileSync(join(process.cwd(), "public/gold-leaf.svg")).toString("base64")}`;
} catch {}
export const LEAF_URI = leafUri;

export const REGION = ["Peoria", "East Peoria", "Peoria Heights", "Pekin", "Bloomington", "Normal", "Champaign", "Urbana", "Springfield"];
export const CITY_SLUGS: Record<string, string> = Object.fromEntries(REGION.map((c) => [c.toLowerCase().replace(/\s+/g, "-"), c]));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
// Public anon key (same fallback the deal pages use) so previews never break on a missing env.
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

/** Live deals, or null if the data couldn't be read (never a fake zero). */
export async function liveDeals(): Promise<ExDeal[] | null> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=deal_id,name,slug,listing_slug,city,deal_title,discount_value,discount_unit,discount_type,category&order=discount_value.desc.nullslast&limit=1000`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, next: { revalidate: 900 } }
    );
    if (!r.ok) return null;
    const rows: ExDeal[] = await r.json();
    return rows.filter((d) => REGION.includes(String(d.city || "")));
  } catch {
    return null;
  }
}

export type Exhale = { big: string; upTo: boolean; product: string; store: string; city: string | null } | null;

export function exhaleOf(deals: ExDeal[], city?: string | null): Exhale {
  const pool = city ? deals.filter((d) => (d.city || "").toLowerCase() === city.toLowerCase()) : deals;
  const d = longestExhale(pool, city) || (city ? null : null);
  if (!d) return null;
  const a = amountOf(d)!;
  return { big: a.big, upTo: a.upTo, product: productOf(d), store: storeWithCity(d), city: d.city || null };
}

export function counts(deals: ExDeal[], city?: string | null) {
  const pool = city ? deals.filter((d) => (d.city || "").toLowerCase() === city.toLowerCase()) : deals;
  const stores = new Set(pool.map((d) => d.slug || d.listing_slug)).size;
  const everyday = pool.filter((d) => amountOf(d) && !isConditional(d) && !needsQuantity(d)).length;
  return { deals: pool.length, stores, everyday };
}

export function todayLabel(d = new Date()) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "long", month: "long", day: "numeric" }).format(d);
}

/** Mark C — the P with a breath dot. `crop` trims to the letter for lockups. */
export function Mark({ size, night = false, crop = false }: { size: number; night?: boolean; crop?: boolean }) {
  const stroke = night ? C.mint : C.canopy;
  const dot = night ? C.firefly : C.peachDot;
  const vb = crop ? "11 5 26 40" : "0 0 48 48";
  const w = crop ? Math.round((size * 26) / 40) : size;
  return (
    <svg width={w} height={size} viewBox={vb}>
      <circle cx="24" cy="18" r="8.2" fill={dot} fillOpacity={0.22} />
      <path d="M14 42 V8 H24 A10 10 0 0 1 24 28 H14" stroke={stroke} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="18" r="4.6" fill={dot} />
    </svg>
  );
}

export function Wordmark({ size = 40 }: { size?: number; night?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(size * 0.25) }}>
      <img src={LEAF_URI} width={Math.round(size * 1.05)} height={Math.round(size * 1.05)} alt="" />
      <span style={{ fontFamily: "Sans", fontWeight: 700, fontSize: size, letterSpacing: "-0.02em", color: C.ink, lineHeight: 1 }}>PuffPrice</span>
    </div>
  );
}

/** Paper background with the morning light (day) or deep green with a glow (night).
 *  (Satori note: radial-gradient takes "circle, stops" only — no closest-side.) */
export function Backdrop({ children, w, h }: { night?: boolean; children: React.ReactNode; w: number; h: number }) {
  const g = Math.round(Math.max(w, h) * 0.9);
  const leaf = Math.round(Math.min(w, h) * 0.95);
  return (
    <div
      style={{
        width: w, height: h, display: "flex", position: "relative", overflow: "hidden",
        backgroundColor: C.paper, fontFamily: "Sans", color: C.ink,
      }}
    >
      <div
        style={{
          position: "absolute", left: -g * 0.42, top: -g * 0.5, width: g, height: g, display: "flex",
          backgroundImage: "radial-gradient(circle, rgba(217,172,79,0.22) 0%, rgba(16,41,28,0) 70%)",
        }}
      />
      <img src={LEAF_URI} width={leaf} height={leaf} alt="" style={{ position: "absolute", right: -leaf * 0.28, bottom: -leaf * 0.22, opacity: 0.22 }} />
      {children}
    </div>
  );
}

/** The deal card (was the Breathe orb): forest-green coupon, gold dashed edge. */
export function Orb({ size, children }: { size: number; night?: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: size, height: size, display: "flex", position: "relative",
        backgroundColor: C.surface, borderRadius: Math.round(size * 0.08),
        border: `3px dashed ${C.border}`,
      }}
    >
      <div
        style={{
          position: "absolute", left: 0, top: 0, width: size, height: size, padding: size * 0.1,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const IMG_HEADERS = { "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" };
