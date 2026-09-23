// lib/waysToBuy.ts
// "Ways to buy" — drive-thru, curbside, order-ahead, medical, late hours.
// Facts come from public.listing_features: one row per store+feature, each
// with the exact wording and the store page it came from. No row = we
// haven't confirmed it, and the UI says nothing (never "no" by default).

import { nowInCT, formatTime } from "./hours";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const H = () => ({ apikey: ANON, Authorization: `Bearer ${ANON}` });

export const REGION_CITIES = [
  "Peoria", "East Peoria", "Peoria Heights", "Pekin",
  "Bloomington", "Normal", "Champaign", "Urbana", "Springfield",
];

export type Feature = "drive_thru" | "curbside" | "order_ahead" | "medical" | "delivery";
export type FeatureRow = {
  listing_slug: string;
  feature: Feature;
  status: "yes" | "no" | "announced";
  evidence: string;
  source_url: string;
  verified_at: string;
};

export const FEATURE_LABEL: Record<Feature, string> = {
  drive_thru: "Drive-thru",
  curbside: "Curbside pickup",
  order_ahead: "Order ahead",
  medical: "Medical",
  delivery: "Delivery",
};

export type RegionStore = {
  id: string;
  slug: string;
  name: string;
  city: string;
  address1: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
};

export async function getFeatureRows(): Promise<FeatureRow[]> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/listing_features?select=listing_slug,feature,status,evidence,source_url,verified_at&project_tag=eq.green`,
      { headers: H(), next: { revalidate: 3600, tags: ["listing-features"] } }
    );
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

export function featuresBySlug(rows: FeatureRow[]): Map<string, Partial<Record<Feature, FeatureRow>>> {
  const m = new Map<string, Partial<Record<Feature, FeatureRow>>>();
  for (const r of rows) {
    const cur = m.get(r.listing_slug) || {};
    cur[r.feature] = r;
    m.set(r.listing_slug, cur);
  }
  return m;
}

export async function getFeaturesForSlug(slug: string): Promise<FeatureRow[]> {
  const rows = await getFeatureRows();
  return rows.filter((r) => r.listing_slug === slug);
}

export async function getRegionStores(): Promise<RegionStore[]> {
  const inList = `(${REGION_CITIES.map((c) => `"${c}"`).join(",")})`;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?select=id,slug,name,city,address1,phone,website,logo_url&project_tag=eq.green&is_active=eq.true&state=eq.IL&city=in.${encodeURIComponent(inList)}&order=city.asc,name.asc&limit=200`,
      { headers: H(), next: { revalidate: 3600 } }
    );
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

export type TonightRow = {
  store: RegionStore;
  closesAt: string | null; // "HH:MM:SS"
  closesLabel: string;
  openNow: boolean;
  closedToday: boolean;
};

// Everyone's closing time today (Central Time), latest first.
export async function getClosingTonight(stores: RegionStore[]): Promise<TonightRow[]> {
  if (stores.length === 0) return [];
  const ct = nowInCT();
  const ids = stores.map((s) => s.id);
  let rows: Array<{ listing_id: string; weekday: number; opens_at: string | null; closes_at: string | null; is_closed: boolean | null }> = [];
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/listing_hours?select=listing_id,weekday,opens_at,closes_at,is_closed&project_tag=eq.green&weekday=eq.${ct.weekday}&listing_id=in.(${ids.join(",")})`,
      { headers: H(), next: { revalidate: 600 } }
    );
    rows = r.ok ? await r.json() : [];
  } catch {}
  const byId = new Map(rows.map((r) => [r.listing_id, r]));
  const toMin = (t: string | null) => (t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : -1);
  return stores
    .map((s) => {
      const h = byId.get(s.id);
      const closedToday = !!h?.is_closed;
      const open = h && !closedToday ? toMin(h.opens_at) : -1;
      const close = h && !closedToday ? toMin(h.closes_at) : -1;
      const openNow = open >= 0 && close >= 0 && ct.minutes >= open && ct.minutes < (close <= open ? close + 1440 : close);
      return {
        store: s,
        closesAt: h && !closedToday ? h.closes_at : null,
        closesLabel: closedToday ? "Closed today" : h?.closes_at ? `Open until ${formatTime(h.closes_at)}` : "Hours not listed",
        openNow,
        closedToday,
      };
    })
    .sort((a, b) => {
      const k = (x: TonightRow) => (x.closesAt ? toMin(x.closesAt) + (toMin(x.closesAt) < 300 ? 1440 : 0) : -1);
      return k(b) - k(a);
    });
}
