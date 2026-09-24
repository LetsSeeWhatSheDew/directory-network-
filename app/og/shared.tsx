// app/og/shared.tsx — the Breathe share-image kit (link previews, the daily
// "today's longest exhale" image, campaign pictures). Rendered with next/og
// on the edge. Real data only: amounts come straight from live deals via
// lib/exhale; if nothing qualifies, images say what's true instead.

import { amountOf, longestExhale, productOf, storeWithCity, needsQuantity, isConditional, type ExDeal } from "../../lib/exhale";

export const C = {
  paper: "#F6F1E8", paperTop: "#FBE9DC", surface: "#FFFAF3", ink: "#14231A", body: "#4F4A41", muted: "#5F5A50",
  border: "#ECDFD0", canopy: "#1F4D33", peach: "#F3C3A0", peachDot: "#D4845A", sage: "#BCD0B3",
  nPaper: "#0B1510", nSurface: "#12211A", nInk: "#F3F7F4", nBody: "#B4C7BA", nMuted: "#9FB3A6", mint: "#A8E6BF", firefly: "#EEF3B0",
};

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
  const [sans5, sans6, sans7, serif, serifI, mono] = await fontCache;
  return [
    { name: "Sans", data: sans5, weight: 500 as const, style: "normal" as const },
    { name: "Sans", data: sans6, weight: 600 as const, style: "normal" as const },
    { name: "Sans", data: sans7, weight: 700 as const, style: "normal" as const },
    { name: "Serif", data: serif, weight: 400 as const, style: "normal" as const },
    { name: "Serif", data: serifI, weight: 400 as const, style: "italic" as const },
    { name: "Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

export const REGION = ["Peoria", "East Peoria", "Peoria Heights", "Pekin", "Bloomington", "Normal", "Champaign", "Urbana", "Springfield"];
export const CITY_SLUGS: Record<string, string> = Object.fromEntries(REGION.map((c) => [c.toLowerCase().replace(/\s+/g, "-"), c]));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
// Public anon key (same fallback the deal pages use) so previews never break on a missing env.
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

export async function liveDeals(): Promise<ExDeal[]> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=deal_id,name,slug,listing_slug,city,deal_title,discount_value,discount_unit,discount_type,category&order=discount_value.desc.nullslast&limit=300`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, next: { revalidate: 900 } }
    );
    const rows: ExDeal[] = r.ok ? await r.json() : [];
    return rows.filter((d) => REGION.includes(String(d.city || "")));
  } catch {
    return [];
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

export function Wordmark({ size = 40, night = false }: { size?: number; night?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
      <Mark size={Math.round(size * 0.84)} night={night} crop />
      <span style={{ fontFamily: "Sans", fontWeight: 600, fontSize: size, letterSpacing: "-0.02em", color: night ? C.mint : C.canopy, lineHeight: 1 }}>uffPrice</span>
    </div>
  );
}

/** Paper background with the morning light (day) or deep green with a glow (night).
 *  (Satori note: radial-gradient takes "circle, stops" only — no closest-side.) */
export function Backdrop({ night = false, children, w, h }: { night?: boolean; children: React.ReactNode; w: number; h: number }) {
  const g = Math.round(Math.max(w, h) * 0.9);
  return (
    <div
      style={{
        width: w, height: h, display: "flex", position: "relative", overflow: "hidden",
        backgroundColor: night ? C.nPaper : C.paper,
        backgroundImage: night ? `linear-gradient(180deg, #0E1B15 0%, ${C.nPaper} 55%)` : `linear-gradient(180deg, ${C.paperTop} 0%, ${C.paper} 55%)`,
        fontFamily: "Sans", color: night ? C.nInk : C.ink,
      }}
    >
      <div
        style={{
          position: "absolute", left: -g * 0.42, top: -g * 0.5, width: g, height: g, display: "flex",
          backgroundImage: night
            ? "radial-gradient(circle, rgba(72,150,104,0.30) 0%, rgba(11,21,16,0) 70%)"
            : "radial-gradient(circle, rgba(255,224,192,0.85) 0%, rgba(255,224,192,0) 70%)",
        }}
      />
      {children}
    </div>
  );
}

/** The breathing orb, frozen at the top of an inhale, with its ring. */
export function Orb({ size, night = false, children }: { size: number; night?: boolean; children: React.ReactNode }) {
  const b = Math.round(size * 0.72);
  const layer = (left: number, top: number, d: number, img: string) => (
    <div style={{ position: "absolute", left, top, width: d, height: d, display: "flex", backgroundImage: img }} />
  );
  const fly = (x: number, y: number, d: number) => (
    <div style={{ position: "absolute", left: x, top: y, width: d, height: d, borderRadius: 9999, backgroundColor: C.firefly, boxShadow: "0 0 14px 5px rgba(238,243,176,0.5)", display: "flex" }} />
  );
  return (
    <div style={{ width: size, height: size, display: "flex", position: "relative" }}>
      {night ? (
        layer(-size * 0.1, -size * 0.1, size * 1.2, "radial-gradient(circle, rgba(72,150,104,0.55) 0%, rgba(40,94,64,0.25) 38%, rgba(11,21,16,0) 70%)")
      ) : (
        <>
          {layer(-size * 0.02, -size * 0.04, b, "radial-gradient(circle, rgba(243,195,160,0.9) 0%, rgba(243,195,160,0) 68%)")}
          {layer(size - b + size * 0.02, size - b + size * 0.04, b, "radial-gradient(circle, rgba(188,208,179,1) 0%, rgba(188,208,179,0) 68%)")}
          {layer(size * 0.02, size * 0.02, size * 0.96, "radial-gradient(circle, rgba(255,250,243,1) 0%, rgba(251,241,230,1) 34%, rgba(226,236,218,0.85) 56%, rgba(226,236,218,0) 70%)")}
        </>
      )}
      <div style={{ position: "absolute", left: size * 0.03, top: size * 0.03, width: size * 0.94, height: size * 0.94, borderRadius: 9999, border: `2px solid ${night ? "rgba(168,230,191,0.3)" : "rgba(31,77,51,0.25)"}`, display: "flex" }} />
      {night && fly(size * 0.1, size * 0.18, 6)}
      {night && fly(size * 0.88, size * 0.62, 5)}
      {night && fly(size * 0.16, size * 0.8, 4)}
      <div
        style={{
          position: "absolute", left: 0, top: 0, width: size, height: size, padding: size * 0.14,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const IMG_HEADERS = { "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" };
