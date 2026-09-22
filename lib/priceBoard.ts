// lib/priceBoard.ts
// =============================================================================
// Live PriceBoard data source (server-only).
//
// Builds a REAL, per-store "who's cheapest right now" board from the
// menu-baseline pipeline (latest_menu_items = per-store canonicalized prices;
// latest_baselines = the geo median reference). Returns null whenever real
// data isn't available yet.
//
// HARD RULE (no-fake-data): this NEVER invents prices. The homepage renders
// the board only when this returns a non-null board; otherwise it renders
// nothing. SAMPLE_BOARD in app/components/PriceBoard.tsx is for
// dev/storybook only and must never reach a production render path.
//
// As of 2026-07-09 the pipeline holds real rows for 2 stores (nuEra East
// Peoria + Ivy Hall Peoria Heights) with one comparable cross-store SKU, so
// this returns a real board. Store identity resolves from `dispensaries`
// (see step 3). `dispensaries` has RLS on with no anon policy, so that one
// lookup uses the service-role key (this module is server-only; the key is
// never bundled to the client). Everything else uses the anon key. Falls back
// to null (board hidden) on any error or when < 2 stores share a SKU.
// =============================================================================

// NOTE: server-only in effect — imported solely by RSC data paths (homepage,
// city pages). We don't import the `server-only` guard package because it
// isn't a dependency of this project; keep this module out of client bundles
// by only importing it from server components.
import type { PriceBoardProps, PriceBoardStore } from "../app/components/PriceBoard";
import { getCityProfile, milesBetween } from "./cityProfiles";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

// Server-only. `dispensaries` (RLS on, no anon policy) is not anon-readable,
// so the store-identity lookup in step 3 uses the service-role key. This
// module is imported solely by RSC data paths, so the key never reaches the
// client. Vercel sets SUPABASE_SERVICE_ROLE_KEY; local .env.local uses
// SUPABASE_SERVICE_KEY — accept either. If absent, that lookup 401s and the
// board falls back to null (hidden), never a broken render.
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";
const SERVICE_HEADERS = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
};

type MenuItem = {
  canonical_product_id: string | null;
  dispensary_id: string | null;
  price_out_the_door: number | null;
  price_pretax: number | null;
  raw_name: string | null;
  raw_brand: string | null;
  canonical_category: string | null;
  canonical_unit: string | null;
  scraped_at?: string | null;
};

type ListingMini = { id: string; name: string | null; slug: string | null; city: string | null };

// Honest freshness suffix for the canopy tag. "LIVE" only when the prices
// were captured in the last 2 days; otherwise say when they're from.
function freshnessSuffix(newestIso: string | null): string {
  if (!newestIso) return "";
  const t = new Date(newestIso).getTime();
  if (!Number.isFinite(t)) return "";
  const ageDays = (Date.now() - t) / 86_400_000;
  if (ageDays <= 2) return "LIVE";
  const d = new Date(t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  });
  return `PRICES AS OF ${d.toUpperCase()}`;
}

function titleFrom(item: MenuItem): string {
  const brand = (item.raw_brand || "").trim();
  const name = (item.raw_name || "").trim();
  if (brand && name) return `${brand} · ${name}`;
  return name || brand || "Comparable product";
}

/**
 * Build a live PriceBoard for the homepage from real per-store prices, or
 * return null when the pipeline has no comparable multi-store SKU yet.
 * Fail-safe: any error or shortfall (< 2 stores) returns null — the caller
 * renders nothing rather than a broken or invented board.
 */
export async function getLivePriceBoard(
  opts: {
    /** Area label for the canopy strip, e.g. "CENTRAL IL". A freshness
     *  suffix ("LIVE" / "PRICES AS OF JUL 9") is appended here. */
    locationTag?: string;
    /** City slug: only compare stores within `radiusMiles` of this city. */
    nearCity?: string;
    radiusMiles?: number;
  } = {}
): Promise<PriceBoardProps | null> {
  try {
    // 1. Recent canonicalized menu items that carry a real out-the-door price.
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/latest_menu_items?select=canonical_product_id,dispensary_id,price_out_the_door,price_pretax,raw_name,raw_brand,canonical_category,canonical_unit,scraped_at&price_out_the_door=not.is.null&canonical_product_id=not.is.null&dispensary_id=not.is.null&limit=500`,
      { headers: HEADERS, next: { revalidate: 300, tags: ["price-board"] } }
    );
    if (!res.ok) return null;
    let rows: MenuItem[] = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    // 1b. Optional geographic scope — a city page must only compare stores
    //     near that city, never label Peoria-area prices as "Springfield".
    if (opts.nearCity) {
      const center = getCityProfile(opts.nearCity);
      if (!center) return null;
      const radius = opts.radiusMiles ?? 15;
      const allIds = Array.from(
        new Set(rows.map((r) => r.dispensary_id).filter((x): x is string => !!x))
      );
      if (allIds.length === 0) return null;
      const gres = await fetch(
        `${SUPABASE_URL}/rest/v1/dispensaries?id=in.(${allIds.join(",")})&select=id,city`,
        { headers: SERVICE_HEADERS, next: { revalidate: 600, tags: ["dispensaries"] } }
      );
      if (!gres.ok) return null;
      const geo: Array<{ id: string; city: string | null }> = await gres.json();
      const nearIds = new Set(
        geo
          .filter((d) => {
            const slug = (d.city || "").trim().toLowerCase().replace(/\s+/g, "-");
            const p = getCityProfile(slug);
            return !!p && milesBetween(center, p) <= radius;
          })
          .map((d) => d.id)
      );
      rows = rows.filter((r) => r.dispensary_id && nearIds.has(r.dispensary_id));
      if (rows.length === 0) return null;
    }

    // 2. Pick the canonical product with the most DISTINCT stores (≥ 2) —
    //    the most legitimately comparable board.
    const byProduct = new Map<string, MenuItem[]>();
    for (const r of rows) {
      if (!r.canonical_product_id || !r.dispensary_id || r.price_out_the_door == null) continue;
      const list = byProduct.get(r.canonical_product_id) || [];
      list.push(r);
      byProduct.set(r.canonical_product_id, list);
    }
    let bestItems: MenuItem[] | null = null;
    let bestStoreCount = 0;
    for (const items of byProduct.values()) {
      const stores = new Set(items.map((i) => i.dispensary_id));
      if (stores.size > bestStoreCount) {
        bestStoreCount = stores.size;
        bestItems = items;
      }
    }
    if (!bestItems || bestStoreCount < 2) return null;

    // One row per store: the cheapest OTD price that store lists for the SKU.
    const cheapestByStore = new Map<string, MenuItem>();
    for (const it of bestItems) {
      const key = it.dispensary_id!;
      const cur = cheapestByStore.get(key);
      if (!cur || (it.price_out_the_door ?? Infinity) < (cur.price_out_the_door ?? Infinity)) {
        cheapestByStore.set(key, it);
      }
    }
    if (cheapestByStore.size < 2) return null;

    // 3. Resolve store identity from the pipeline's `dispensaries` table — the
    //    ID-space that latest_menu_items.dispensary_id actually lives in.
    //    (The previous version looked these ids up in master_listings.id, a
    //    DIFFERENT id-space with zero overlap, so the board never resolved a
    //    store and always returned null.) `dispensaries` carries name/city/slug.
    //    master_listings is consulted ONLY to decide which stores have a live
    //    PuffPrice listing page for the link — a store with no listing page
    //    still renders on the board, just without an href.
    const ids = Array.from(cheapestByStore.keys());
    const dres = await fetch(
      `${SUPABASE_URL}/rest/v1/dispensaries?id=in.(${ids.join(",")})&is_active=eq.true&select=id,name,slug,city`,
      { headers: SERVICE_HEADERS, next: { revalidate: 600, tags: ["dispensaries"] } }
    );
    if (!dres.ok) return null;
    const disps: ListingMini[] = await dres.json();
    const dispById = new Map(disps.map((d) => [d.id, d]));

    // Which of these stores have a live PuffPrice (green) listing page?
    // Matched by slug (dispensaries.slug === master_listings.slug). Only those
    // get an href; the rest render unlinked.
    const slugs = disps.map((d) => d.slug).filter((s): s is string => !!s);
    const linkableSlugs = new Set<string>();
    if (slugs.length > 0) {
      const lres = await fetch(
        `${SUPABASE_URL}/rest/v1/master_listings?slug=in.(${slugs.join(",")})&project_tag=eq.green&is_active=eq.true&select=slug`,
        { headers: HEADERS, next: { revalidate: 600, tags: ["listings"] } }
      );
      if (lres.ok) {
        const ls: Array<{ slug: string | null }> = await lres.json();
        for (const l of ls) if (l.slug) linkableSlugs.add(l.slug);
      }
    }

    const stores: PriceBoardStore[] = [];
    let sampleItem: MenuItem | null = null;
    for (const [dispId, item] of cheapestByStore.entries()) {
      const disp = dispById.get(dispId);
      if (!disp || !disp.name || item.price_out_the_door == null) continue;
      sampleItem = sampleItem || item;
      const shelf =
        item.price_pretax != null && item.price_pretax > item.price_out_the_door
          ? item.price_pretax
          : null;
      const linkable = disp.slug ? linkableSlugs.has(disp.slug) : false;
      stores.push({
        slug: disp.slug || undefined,
        storeName: disp.city ? `${disp.name} · ${disp.city}` : disp.name,
        otdPrice: Number(item.price_out_the_door),
        shelfPrice: shelf,
        href: linkable && disp.slug ? `/dispensary/${disp.slug}` : undefined,
      });
    }
    if (stores.length < 2 || !sampleItem) return null;

    // 4. Honest #1 savings = real gap to the next-cheapest store.
    stores.sort((a, b) => a.otdPrice - b.otdPrice);
    const gap = Math.round((stores[1].otdPrice - stores[0].otdPrice) * 100) / 100;
    if (gap > 0) stores[0].saveVs = gap;

    const cat = (sampleItem.canonical_category || "").toUpperCase();
    const unit = (sampleItem.canonical_unit || "").toUpperCase();
    const subline = [cat, unit, `SAME PRODUCT · ${stores.length} STORES`]
      .filter(Boolean)
      .join(" · ");

    const newest = Array.from(cheapestByStore.values())
      .map((i) => i.scraped_at || "")
      .sort()
      .pop() || null;
    const suffix = freshnessSuffix(newest);
    const base = (opts.locationTag || "CENTRAL IL").replace(/\s*·\s*LIVE$/i, "");

    return {
      rung: "same_sku",
      title: titleFrom(sampleItem),
      subline,
      stores,
      locationTag: suffix ? `${base} · ${suffix}` : base,
    };
  } catch {
    return null;
  }
}
