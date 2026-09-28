// lib/social/build.ts — turns live rows into the data each social template
// draws. Pure functions (no fetches), so the unit tests run them on fixtures.
//
// Selection reuses the site's own rules instead of inventing new ones:
//   - Biggest saving: lib/exhale longestExhale (the home page's "longest
//     exhale": everyday deals only, no first-time/veteran/"up to", no
//     buy-several), limited to deals re-found on the store's site within 7
//     days (lib/dealFreshness, the featured-slot rule) and not expired.
//     When PR #8's lib/dealOfTheDay lands on main, swap in pickDealOfTheDay
//     here so the post and /deal-of-the-day always agree.
//   - City roundup: lib/exhale lowestList (one deal per store) within the city.
//   - Deal Index: lib/dealIndex, the same numbers /deal-index shows.
//   - Cheapest eighth: lib/menuPrices, the same rows /cheapest shows.
//   - Drive-thru: lib/waysToBuy listing_features, same as /drive-thru.
//
// HARD RULE: never invent a number. Unreadable data → status "unknown",
// postable false. Nothing that qualifies → status "none" with true counts.

import { amountOf, longestExhale, lowestList, productOf, storeName, cleanDealTitle, type ExDeal } from "../exhale";
import { isFreshFeatured } from "../dealFreshness";
import type { CheapestBoard } from "../menuPrices";
import type { RegionStore, FeatureRow } from "../waysToBuy";
import type { DayCity, IndexDay } from "../dealIndex";
import type { CheapestData, CityData, DealLine, DriveThruData, IndexData, SavingData } from "./types";
import { asOfLabel, dayAsOfLabel } from "./time";

export type SocialDeal = ExDeal & { verified_at?: string | null; expires_at?: string | null };

/** Scope cities that have stores (the order the site lists them in). */
export const SOCIAL_CITIES = ["Peoria", "East Peoria", "Peoria Heights", "Pekin", "Bloomington", "Normal", "Champaign", "Urbana", "Springfield"];
export const citySlug = (c: string) => c.toLowerCase().replace(/\s+/g, "-");
export const cityBySlug = (slug: string | null | undefined) => SOCIAL_CITIES.find((c) => citySlug(c) === String(slug || "").toLowerCase()) || null;

/** Live today: in scope and not past its end date. */
function isLive(d: SocialDeal, now: number): boolean {
  if (!SOCIAL_CITIES.includes(String(d.city || ""))) return false;
  if (!d.expires_at) return true;
  const t = new Date(d.expires_at).getTime();
  return !Number.isFinite(t) || t > now;
}

/** Fresh enough to headline a post: re-found on the store's own site within 7 days. */
function isFresh(d: SocialDeal, now: number): boolean {
  return isFreshFeatured(d.verified_at, now);
}

const storeKey = (d: SocialDeal) => String(d.slug || d.listing_slug || d.name || "").toLowerCase();

export function dealLine(d: SocialDeal): DealLine {
  const a = amountOf(d)!;
  const title = cleanDealTitle(d.deal_title);
  return {
    saving: a.big,
    product: productOf({ ...d, deal_title: title }),
    store: storeName(d),
    city: String(d.city || ""),
  };
}

/** The oldest check time among the deals shown: the honest "as of". */
function oldestCheck(ds: SocialDeal[], now: number): string {
  const ts = ds.map((d) => new Date(d.verified_at || "").getTime()).filter(Number.isFinite);
  return asOfLabel(new Date(ts.length ? Math.min(...ts) : now));
}

export function buildSaving(deals: SocialDeal[] | null, now: number = Date.now()): SavingData {
  if (!deals) return { status: "unknown", postable: false, asOf: asOfLabel(new Date(now)) };
  const live = deals.filter((d) => isLive(d, now));
  const stores = new Set(live.map(storeKey).filter(Boolean)).size;
  const pick = longestExhale(live.filter((d) => isFresh(d, now)));
  if (!pick) return { status: "none", postable: live.length > 0, asOf: asOfLabel(new Date(now)), live: live.length, stores };
  return { status: "ok", postable: true, asOf: oldestCheck([pick], now), deal: dealLine(pick), live: live.length, stores };
}

/** Cities with at least one fresh everyday deal, most stores discounting first. */
export function citiesWithDeals(deals: SocialDeal[] | null, now: number = Date.now()): string[] {
  if (!deals) return [];
  const byCity = new Map<string, Set<string>>();
  for (const d of deals) {
    if (!isLive(d, now) || !isFresh(d, now) || !amountOf(d)) continue;
    const c = String(d.city);
    byCity.set(c, (byCity.get(c) || new Set()).add(storeKey(d)));
  }
  return [...byCity.entries()]
    .sort((a, b) => b[1].size - a[1].size || SOCIAL_CITIES.indexOf(a[0]) - SOCIAL_CITIES.indexOf(b[0]))
    .map(([c]) => c);
}

export function buildCity(deals: SocialDeal[] | null, city: string | null, now: number = Date.now()): CityData {
  const pickCity = city || citiesWithDeals(deals, now)[0] || "Peoria";
  const base = { city: pickCity, citySlug: citySlug(pickCity) };
  if (!deals) return { ...base, status: "unknown", postable: false, asOf: asOfLabel(new Date(now)), deals: [], live: 0 };
  const inCity = deals.filter((d) => isLive(d, now) && d.city === pickCity);
  const top = lowestList(inCity.filter((d) => isFresh(d, now)), 3, pickCity);
  if (!top.length) return { ...base, status: "none", postable: false, asOf: asOfLabel(new Date(now)), deals: [], live: inCity.length };
  return { ...base, status: "ok", postable: true, asOf: oldestCheck(top, now), deals: top.map(dealLine), live: inCity.length };
}

/** Days the count changed for a reason other than the market (see /deal-index). */
export const COVERAGE_CHANGES: { day: string; note: string }[] = [
  { day: "2026-09-25", note: "From Sept 25 we count seven more stores' own specials pages, so the jump that day is coverage, not a wave of sales." },
];

export function buildIndex(idx: { days: IndexDay[]; latest: DayCity[]; latestDay: string | null }): IndexData {
  const today = idx.days[idx.days.length - 1];
  if (!today || !idx.latestDay) return { status: "unknown", postable: false, asOf: "" };
  const week = idx.days.slice(-7).map((d) => ({ day: d.day, deals: d.deals }));
  const first = week[0].day;
  const change = COVERAGE_CHANGES.find((c) => c.day > first && c.day <= today.day) || null;
  return {
    status: "ok",
    postable: true,
    asOf: dayAsOfLabel(idx.latestDay),
    day: idx.latestDay,
    deals: today.deals,
    stores: today.stores,
    avgPct: today.avgPct,
    week,
    cities: idx.latest.map((c) => ({ city: c.city, deals: c.deals_live, stores: c.stores_with_deals, avgPct: c.avg_discount_pct })),
    coverageNote: change ? change.note : null,
  };
}

/** Lowest out-the-door eighth per city, only cities with a real shelf price. */
export function buildCheapest(board: CheapestBoard): CheapestData {
  const items = board.byRef.eighth;
  if (!items.length || !board.newest) return { status: "unknown", postable: false, asOf: "" };
  const best = new Map<string, (typeof items)[number]>();
  for (const it of items) {
    const cur = best.get(it.city);
    if (!cur || it.otd < cur.otd) best.set(it.city, it);
  }
  const rows = [...best.values()]
    .sort((a, b) => a.otd - b.otd || a.city.localeCompare(b.city))
    .map((it) => ({ city: it.city, store: it.storeName.replace(/\s*\(.*?\)\s*$/, ""), pretax: it.pretax, otd: it.otd, onSale: it.onSale }));
  // "As of" is the oldest menu read among the rows shown.
  const shownChecks = [...best.values()].map((it) => it.checkedAt).sort();
  return { status: "ok", postable: true, asOf: asOfLabel(shownChecks[0]), rows, stores: new Set(items.map((i) => i.listingSlug)).size };
}

/** Kept in step with LAST_CHECKED on app/drive-thru/page.tsx (the last manual sweep). */
export const DRIVE_THRU_LAST_SWEEP = "2026-09-23T17:00:00Z";

export function buildDriveThru(stores: RegionStore[], rows: FeatureRow[]): DriveThruData {
  if (!stores.length) return { status: "unknown", postable: false, asOf: "" };
  const slugs = new Set(stores.map((s) => s.slug));
  const dt = rows.filter((r) => r.feature === "drive_thru" && slugs.has(r.listing_slug));
  const open = stores
    .filter((s) => dt.some((r) => r.listing_slug === s.slug && r.status === "yes"))
    .map((s) => ({ store: s.name.replace(/\s*\(.*?\)\s*$/, ""), city: s.city }));
  const announced = new Set(dt.filter((r) => r.status === "announced").map((r) => r.listing_slug)).size;
  const newest = [DRIVE_THRU_LAST_SWEEP, ...dt.map((r) => r.verified_at).filter(Boolean)].sort().pop()!;
  return { status: "ok", postable: true, asOf: asOfLabel(newest).replace(/, \d+:\d+ [AP]M CT$/, " CT"), open, announced, tracked: stores.length };
}
