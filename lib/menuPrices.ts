// lib/menuPrices.ts
// =============================================================================
// Shelf prices for three reference units, read from each store's own online
// menu: an eighth of flower (3.5g), a 1g vape cartridge (not a disposable)
// and a 100mg pack of gummies.
//
// Writer: scripts/scrape-rendered-deals.ts (menu phase, lib/scraper/menuCapture.ts)
// writes menu_snapshots + menu_items rows — the menu-baseline pipeline tables
// (sql/menu-baseline-schema.sql on feat/menu-baseline-pipeline). Each row it
// writes carries raw_payload.puffprice_ref ("eighth" | "cart_1g" |
// "gummies_100mg") and raw_payload.listing_slug (the master_listings slug), so
// this reader needs only the anon-readable `latest_menu_items` view plus
// master_listings — never the RLS-protected `dispensaries` table.
//
// Methodology (docs/deal-data-policy.md): this is the "same size, any brand"
// rung — the lowest shelf price per store for one exact size in one category.
// Never a blended index. Out-the-door prices use lib/taxRates via lib/otd.
//
// HARD RULE: never invents a price. Any read error → empty result, and the
// page shows an honest empty state.
// =============================================================================

import { getCityProfile, milesBetween } from "./cityProfiles";
import { CENTRAL_IL_CITIES } from "./constants/regions";

export type RefUnit = "eighth" | "cart_1g" | "gummies_100mg";

export const REF_UNITS: RefUnit[] = ["eighth", "cart_1g", "gummies_100mg"];

export const REF_DEF: Record<
  RefUnit,
  {
    label: string;          // "Eighth of flower"
    short: string;          // "eighth"
    size: string;           // "3.5g"
    canonicalCategory: "flower" | "vape" | "edible";
    canonicalUnit: string;  // menu_items.canonical_unit
    thcTier: "non_infused_le_35" | "non_infused_gt_35" | "infused";
    taxTier: "flower" | "concentrate" | "edible"; // lib/taxRates ThcTier
    band: [number, number]; // sanity band on the pre-tax price, USD
    taxNote: string;
  }
> = {
  eighth: {
    label: "Eighth of flower",
    short: "eighth",
    size: "3.5g",
    canonicalCategory: "flower",
    canonicalUnit: "3.5g",
    thcTier: "non_infused_le_35",
    taxTier: "flower",
    band: [10, 80],
    taxNote: "taxed as flower under 35% THC (10% state excise); infused flower and anything the menu lists above 35% THC is left out",
  },
  cart_1g: {
    label: "1g vape cartridge",
    short: "cart",
    size: "1g",
    canonicalCategory: "vape",
    canonicalUnit: "1g",
    thcTier: "non_infused_gt_35",
    taxTier: "concentrate",
    band: [10, 80],
    taxNote: "taxed as a concentrate (25% state excise); disposables and pods are left out",
  },
  gummies_100mg: {
    label: "100mg of gummies",
    short: "gummies",
    size: "100mg",
    canonicalCategory: "edible",
    canonicalUnit: "100mg",
    thcTier: "infused",
    taxTier: "edible",
    band: [5, 40],
    taxNote: "taxed as an edible (20% state excise); only packs with 100mg THC in total",
  },
};

/** The rung-of-the-ladder label every surface shows with these numbers. */
export const RUNG_LABEL = "Same size, any brand — lowest price per store";

/** How long a store's latest menu read counts as "today". The reader runs
 *  twice a day; 36h tolerates one missed run, never shows last week. */
export const MENU_FRESH_HOURS = 36;

/** Stores within this many miles of a city count as "near" it. */
export const NEAR_MILES = 15;

// Approximate city centers for the three scope cities with no store of their
// own (not in lib/cityProfiles, which only profiles cities with stores).
const EXTRA_CENTERS: Record<string, { lat: number; lng: number }> = {
  bartonville: { lat: 40.6503, lng: -89.6523 },
  morton: { lat: 40.6128, lng: -89.4593 },
  washington: { lat: 40.7036, lng: -89.4073 },
};

export function cityCenter(slug: string): { lat: number; lng: number } | null {
  const p = getCityProfile(slug);
  if (p) return { lat: p.lat, lng: p.lng };
  return EXTRA_CENTERS[slug] || null;
}

export function cityName(slug: string): string | null {
  return CENTRAL_IL_CITIES.find((c) => c.slug === slug)?.name || null;
}

export const citySlugOf = (city: string | null | undefined) =>
  String(city || "").trim().toLowerCase().replace(/\s+/g, "-");

// -----------------------------------------------------------------------------
// Read side
// -----------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";
// latest_menu_items is a plain view (owner rights), so anon can read it today.
// If a future RLS change closes it to anon, fall back to the service key —
// server-only, the same pattern as lib/analyticsDb.ts and lib/priceBoard.ts.
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

type MenuRow = {
  snapshot_id: string;
  dispensary_id: string;
  scraped_at: string;
  raw_name: string | null;
  raw_brand: string | null;
  raw_weight: string | null;
  raw_price: number | null;
  raw_sale_price: number | null;
  is_on_sale: boolean | null;
  price_pretax: number | null;
  price_out_the_door: number | null;
  raw_payload: { puffprice_ref?: string; listing_slug?: string; source_url?: string } | null;
};

type ListingRow = { slug: string; name: string | null; city: string | null };

export type CheapestItem = {
  ref: RefUnit;
  listingSlug: string;
  storeName: string;
  city: string;
  citySlug: string;
  brand: string | null;
  product: string;
  weight: string | null;
  regular: number;           // shelf price before any sale, pre-tax
  pretax: number;            // what the shelf says today (sale if on sale)
  otd: number;               // out the door, this store's city
  onSale: boolean;
  checkedAt: string;         // ISO — when the store's menu was read
  sourceUrl: string | null;  // the store's own menu page
  milesFrom?: number;        // set when scoped to a city
};

export type CheapestBoard = {
  byRef: Record<RefUnit, CheapestItem[]>; // one row per store, cheapest first
  stores: number;                          // stores with any fresh menu data in scope
  newest: string | null;                   // newest checkedAt in scope
  oldest: string | null;
};

const EMPTY: CheapestBoard = { byRef: { eighth: [], cart_1g: [], gummies_100mg: [] }, stores: 0, newest: null, oldest: null };

async function readRows(key: string): Promise<MenuRow[] | null> {
  const since = new Date(Date.now() - MENU_FRESH_HOURS * 3600_000).toISOString();
  const url =
    `${SUPABASE_URL}/rest/v1/latest_menu_items` +
    `?select=snapshot_id,dispensary_id,scraped_at,raw_name,raw_brand,raw_weight,raw_price,raw_sale_price,is_on_sale,price_pretax,price_out_the_door,raw_payload` +
    `&raw_payload->>puffprice_ref=in.(${REF_UNITS.join(",")})` +
    `&scraped_at=gte.${encodeURIComponent(since)}` +
    `&price_out_the_door=not.is.null&limit=5000`;
  try {
    const r = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 900, tags: ["menu-prices"] },
    });
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j) ? j : null;
  } catch {
    return null;
  }
}

async function readListings(slugs: string[]): Promise<ListingRow[]> {
  if (!slugs.length) return [];
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?select=slug,name,city&project_tag=eq.green&is_active=eq.true&slug=in.(${slugs.map(encodeURIComponent).join(",")})`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, next: { revalidate: 900, tags: ["listings"] } }
    );
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

/**
 * Lowest out-the-door price per store for each reference unit, from each
 * store's most recent menu read (within MENU_FRESH_HOURS). With `nearCity`,
 * only stores within NEAR_MILES of that city are included.
 */
export async function getCheapestBoard(opts: { nearCity?: string } = {}): Promise<CheapestBoard> {
  let rows = await readRows(ANON);
  if ((rows === null || rows.length === 0) && SERVICE) rows = await readRows(SERVICE);
  if (!rows || rows.length === 0) return EMPTY;

  // Only each store's newest snapshot: an item missing from the latest read
  // is sold out or delisted, and latest_menu_items would otherwise keep
  // showing its last-seen row.
  const newestSnap = new Map<string, { id: string; at: string }>();
  for (const r of rows) {
    const slug = r.raw_payload?.listing_slug;
    if (!slug) continue;
    const cur = newestSnap.get(slug);
    if (!cur || r.scraped_at > cur.at) newestSnap.set(slug, { id: r.snapshot_id, at: r.scraped_at });
  }
  const listings = await readListings([...newestSnap.keys()]);
  const listingBySlug = new Map(listings.map((l) => [l.slug, l]));

  const center = opts.nearCity ? cityCenter(opts.nearCity) : null;
  if (opts.nearCity && !center) return EMPTY;

  const best = new Map<string, CheapestItem>(); // `${ref}|${slug}`
  for (const r of rows) {
    const slug = r.raw_payload?.listing_slug;
    const ref = r.raw_payload?.puffprice_ref as RefUnit | undefined;
    if (!slug || !ref || !REF_DEF[ref]) continue;
    if (newestSnap.get(slug)?.id !== r.snapshot_id) continue;
    const l = listingBySlug.get(slug);
    if (!l || !l.name || !l.city) continue; // not a live PuffPrice store
    const pretax = Number(r.price_pretax);
    const otd = Number(r.price_out_the_door);
    const regular = Number(r.raw_price);
    const [lo, hi] = REF_DEF[ref].band;
    if (!(pretax >= lo && pretax <= hi) || !(otd > pretax) || !(regular >= pretax)) continue; // belt and braces
    let milesFrom: number | undefined;
    if (center) {
      const c = cityCenter(citySlugOf(l.city));
      if (!c) continue;
      milesFrom = Math.round(milesBetween(center, c) * 10) / 10;
      if (milesFrom > NEAR_MILES) continue;
    }
    const item: CheapestItem = {
      ref,
      listingSlug: slug,
      storeName: l.name,
      city: l.city,
      citySlug: citySlugOf(l.city),
      brand: r.raw_brand,
      product: String(r.raw_name || "").trim(),
      weight: r.raw_weight,
      regular,
      pretax,
      otd,
      onSale: !!r.is_on_sale && pretax < regular,
      checkedAt: r.scraped_at,
      sourceUrl: r.raw_payload?.source_url || null,
      milesFrom,
    };
    const k = `${ref}|${slug}`;
    const cur = best.get(k);
    if (!cur || item.otd < cur.otd) best.set(k, item);
  }

  const byRef = { eighth: [], cart_1g: [], gummies_100mg: [] } as Record<RefUnit, CheapestItem[]>;
  for (const it of best.values()) byRef[it.ref].push(it);
  for (const k of REF_UNITS) byRef[k].sort((a, b) => a.otd - b.otd || a.storeName.localeCompare(b.storeName));
  const all = [...best.values()];
  const storeSet = new Set(all.map((i) => i.listingSlug));
  const times = all.map((i) => i.checkedAt).sort();
  return { byRef, stores: storeSet.size, newest: times[times.length - 1] || null, oldest: times[0] || null };
}

/** Stores with fresh menu data within NEAR_MILES of each scope city (for the
 *  sitemap / noindex rule: a city page is indexed at 2+ stores). */
export function storesNearEachCity(board: CheapestBoard): Record<string, number> {
  const stores = new Map<string, string>(); // listingSlug -> citySlug
  for (const r of REF_UNITS) for (const it of board.byRef[r]) stores.set(it.listingSlug, it.citySlug);
  const out: Record<string, number> = {};
  for (const c of CENTRAL_IL_CITIES) {
    const center = cityCenter(c.slug);
    let n = 0;
    if (center) for (const cs of stores.values()) { const p = cityCenter(cs); if (p && milesBetween(center, p) <= NEAR_MILES) n++; }
    out[c.slug] = n;
  }
  return out;
}

export const money = (n: number) => `$${n.toFixed(2)}`;

/** "Fri 7:14 AM" in Central time. */
export function checkedLabel(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" });
}
