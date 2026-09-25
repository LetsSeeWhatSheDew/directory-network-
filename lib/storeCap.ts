// lib/storeCap.ts — deal-volume fairness.
//
// A store that posts 100 specials shouldn't bury the store that posts 3.
// Every shared list (home, city, /deals, this week, feeds for AI) caps how
// many deals one store can take, keeping the existing order otherwise.
// Store pages (/dispensary/[slug]) still show everything.
//
// Ranking is untouched: we walk the list in its existing order and skip a
// deal only once its store has hit the cap. Nothing here can be bought.

/** Per-store caps by list type. */
export const STORE_CAP = {
  /** Home + city highlight rows (hero cards, "lowest this morning"). */
  highlight: 3,
  /** Full city deal list. */
  cityList: 6,
  /** Machine-readable feeds: /llms-full.txt, /api/public/deals. */
  feed: 8,
  /** Short ranked lists of ~8 rows (this week). */
  shortList: 2,
} as const;

type AnyDeal = Record<string, any>;

/** Stable store identity for a deal row (view rows carry slug + listing_slug). */
export function dealStoreKey(d: AnyDeal): string {
  return String(d?.listing_slug || d?.slug || d?.name || "").toLowerCase();
}

export type StoreOverflow = {
  key: string;
  slug: string;
  name: string;
  city: string | null;
  total: number;
  shown: number;
};

export type Capped<T> = {
  kept: T[];
  /** Stores that had more deals than the cap, in order of first appearance. */
  overflow: StoreOverflow[];
  /** Total deals per store key in the input (before capping). */
  totals: Map<string, number>;
};

/**
 * Keep at most `max` deals per store, preserving input order.
 * `overflow` lists the stores that were trimmed so the UI can say
 * "See all N deals at {store} →".
 */
export function capPerStore<T extends AnyDeal>(
  deals: T[],
  max: number,
  key: (d: T) => string = dealStoreKey
): Capped<T> {
  const totals = new Map<string, number>();
  for (const d of deals) {
    const k = key(d);
    if (!k) continue;
    totals.set(k, (totals.get(k) || 0) + 1);
  }
  const shown = new Map<string, number>();
  const first = new Map<string, T>();
  const kept: T[] = [];
  for (const d of deals) {
    const k = key(d);
    if (!k) {
      kept.push(d);
      continue;
    }
    if (!first.has(k)) first.set(k, d);
    const n = shown.get(k) || 0;
    if (n >= max) continue;
    shown.set(k, n + 1);
    kept.push(d);
  }
  const overflow: StoreOverflow[] = [];
  for (const [k, d] of first) {
    const total = totals.get(k) || 0;
    const s = shown.get(k) || 0;
    if (total > s) {
      overflow.push({
        key: k,
        slug: String(d?.slug || d?.listing_slug || k),
        name: String(d?.name || d?.store || d?.slug || d?.listing_slug || k),
        city: (d?.city as string) ?? null,
        total,
        shown: s,
      });
    }
  }
  return { kept, overflow, totals };
}

/**
 * Overflow for a list that was capped and then truncated to `limit` rows:
 * any store whose total exceeds what actually made it into `visible`.
 * Only stores that appear in `visible` are reported (a link to a store
 * that isn't on screen would read oddly).
 */
export function overflowFor<T extends AnyDeal>(
  visible: T[],
  totals: Map<string, number>,
  key: (d: T) => string = dealStoreKey
): StoreOverflow[] {
  const shown = new Map<string, number>();
  const first = new Map<string, T>();
  for (const d of visible) {
    const k = key(d);
    if (!k) continue;
    shown.set(k, (shown.get(k) || 0) + 1);
    if (!first.has(k)) first.set(k, d);
  }
  const out: StoreOverflow[] = [];
  for (const [k, d] of first) {
    const total = totals.get(k) || 0;
    const s = shown.get(k) || 0;
    if (total > s) {
      out.push({
        key: k,
        slug: String(d?.slug || d?.listing_slug || k),
        name: String(d?.name || d?.store || d?.slug || d?.listing_slug || k),
        city: (d?.city as string) ?? null,
        total,
        shown: s,
      });
    }
  }
  return out;
}
