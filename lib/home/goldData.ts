// Data for the Gold Leaf home. Same source and filters as the live home
// (active_deals_with_listings, Central IL scope, active + unexpired, capped per
// store) so every number here agrees with the rest of the site.

import { filterActiveDeals } from "../dealActiveFilter";
import { capPerStore, STORE_CAP } from "../storeCap";
import { CENTRAL_IL_CITIES } from "../constants/regions";
import { effectiveCategory } from "../inferCategory";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

const CITY_IN = `(${CENTRAL_IL_CITIES.map((c) => `"${c.name}"`).join(",")})`;
const COLS =
  "deal_id,deal_title,deal_description,category,discount_type,discount_value,discount_unit,discount_pct,original_price,sale_price,unit,expires_at,source,source_url,listing_slug,slug,verified_at,name,city,lat,lng,drive_thru,delivery,savings_amount,savings_percent";

export type GoldDeal = {
  deal_id: string;
  deal_title: string | null;
  deal_description: string | null;
  category: string | null;
  discount_type: string | null;
  discount_value: number | null;
  discount_unit: string | null;
  expires_at: string | null;
  source_url: string | null;
  listing_slug: string | null;
  slug: string | null;
  verified_at: string | null;
  name: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  drive_thru?: boolean | null;
};

function notExpired<T extends { expires_at?: string | null }>(rows: T[]): T[] {
  const now = Date.now();
  return rows.filter((d) => !d.expires_at || new Date(d.expires_at).getTime() > now);
}

/** Every active Central IL deal (raw, uncapped). */
export async function getAllActiveDeals(): Promise<GoldDeal[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=${COLS}&city=in.${encodeURIComponent(CITY_IN)}&order=discount_value.desc.nullslast&limit=2000`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        next: { revalidate: 60, tags: ["deals"] },
      },
    );
    if (!res.ok) return [];
    const raw = await res.json();
    if (!Array.isArray(raw)) return [];
    return filterActiveDeals(notExpired(raw)) as GoldDeal[];
  } catch {
    return [];
  }
}

export type GoldHome = {
  all: GoldDeal[];
  pool: GoldDeal[];
  total: number;
  stores: number;
  byCategory: Record<string, number>;
  byCity: Record<string, number>;
  lastSeen: string | null;
};

export async function getGoldHome(): Promise<GoldHome> {
  const all = await getAllActiveDeals();
  const pool = capPerStore(all, STORE_CAP.highlight).kept as GoldDeal[];
  const stores = new Set(all.map((d) => d.listing_slug || d.slug)).size;
  const byCategory: Record<string, number> = {};
  const byCity: Record<string, number> = {};
  let lastSeen: string | null = null;
  for (const d of all) {
    const c = effectiveCategory(d);
    if (c) byCategory[c] = (byCategory[c] || 0) + 1;
    if (d.city) byCity[d.city] = (byCity[d.city] || 0) + 1;
    if (d.verified_at && (!lastSeen || d.verified_at > lastSeen)) lastSeen = d.verified_at;
  }
  return { all, pool, total: all.length, stores, byCategory, byCity, lastSeen };
}

/** "6:15 AM" in Central time. */
export function ctTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" });
}

/** "today" / "yesterday" / "Nov 9" in Central time. */
export function ctDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const fmt = (x: Date) => x.toLocaleDateString("en-US", { timeZone: "America/Chicago" });
  const now = new Date();
  if (fmt(d) === fmt(now)) return "today";
  if (fmt(d) === fmt(new Date(now.getTime() - 86400000))) return "yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" });
}
