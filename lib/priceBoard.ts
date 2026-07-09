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
// As of this hotfix the pipeline tables (latest_menu_items, latest_baselines,
// canonical_products) are empty, so this returns null and the board is hidden.
// It lights up automatically once the pipeline populates real rows.
// =============================================================================

// NOTE: server-only in effect — imported solely by RSC data paths (homepage,
// city pages). We don't import the `server-only` guard package because it
// isn't a dependency of this project; keep this module out of client bundles
// by only importing it from server components.
import type { PriceBoardProps, PriceBoardStore } from "../app/components/PriceBoard";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
};

type ListingMini = { id: string; name: string | null; slug: string | null; city: string | null };

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
  opts: { locationTag?: string } = {}
): Promise<PriceBoardProps | null> {
  try {
    // 1. Recent canonicalized menu items that carry a real out-the-door price.
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/latest_menu_items?select=canonical_product_id,dispensary_id,price_out_the_door,price_pretax,raw_name,raw_brand,canonical_category,canonical_unit&price_out_the_door=not.is.null&canonical_product_id=not.is.null&dispensary_id=not.is.null&limit=500`,
      { headers: HEADERS, next: { revalidate: 300, tags: ["price-board"] } }
    );
    if (!res.ok) return null;
    const rows: MenuItem[] = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

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

    // 3. Resolve store identity (Central IL, PuffPrice scope only).
    const ids = Array.from(cheapestByStore.keys());
    const lres = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?id=in.(${ids.join(",")})&project_tag=eq.green&is_active=eq.true&select=id,name,slug,city`,
      { headers: HEADERS, next: { revalidate: 600, tags: ["listings"] } }
    );
    if (!lres.ok) return null;
    const listings: ListingMini[] = await lres.json();
    const listingById = new Map(listings.map((l) => [l.id, l]));

    const stores: PriceBoardStore[] = [];
    let sampleItem: MenuItem | null = null;
    for (const [dispId, item] of cheapestByStore.entries()) {
      const listing = listingById.get(dispId);
      if (!listing || !listing.name || item.price_out_the_door == null) continue;
      sampleItem = sampleItem || item;
      const shelf =
        item.price_pretax != null && item.price_pretax > item.price_out_the_door
          ? item.price_pretax
          : null;
      stores.push({
        slug: listing.slug || undefined,
        storeName: listing.city ? `${listing.name} · ${listing.city}` : listing.name,
        otdPrice: Number(item.price_out_the_door),
        shelfPrice: shelf,
        href: listing.slug ? `/dispensary/${listing.slug}` : undefined,
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

    return {
      rung: "same_sku",
      title: titleFrom(sampleItem),
      subline,
      stores,
      locationTag: opts.locationTag,
    };
  } catch {
    return null;
  }
}
