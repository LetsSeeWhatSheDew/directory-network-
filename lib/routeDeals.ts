// lib/routeDeals.ts — best deals on your route between two Central Illinois
// cities (/route). Geometry is deliberately simple and free: city centers
// (lib/cityProfiles + lib/menuPrices EXTRA_CENTERS), each store's own
// lat/lng, and the straight line between the two cities. No map API.
//
//   corridor  every store within CORRIDOR_MILES of the straight segment
//             from start to end (so stores in and around both end cities
//             count too), ordered by how far along the line they sit.
//   detour    extra straight-line miles to go start → store → end instead
//             of start → end. A rough guide, labeled as such on the page.
//   deals     per store: everyday savings first, buy-several next, priced
//             deals ("2 for $60") after, conditional deals last; at most
//             PER_STORE shown (fairness, lib/storeCap), the store page has
//             the rest.
//
// Real deals only. If the deal data can't be read the page says so.

import { CENTRAL_IL_CITIES } from "./constants/regions";
import { cityCenter } from "./menuPrices";
import { distanceMiles } from "./proximity";
import { amountOf, isConditional, needsQuantity, type ExDeal } from "./exhale";
import { comparablePercent, readLiveDeals, isLive, type LiveDeal } from "./dealOfTheDay";
import { dealStoreKey } from "./storeCap";

export const CORRIDOR_MILES = 5;
export const PER_STORE = 2;

export type Pt = { lat: number; lng: number };
export type RouteCity = { slug: string; name: string } & Pt;

/** All 12 in-scope cities, with approximate centers. */
export const ROUTE_CITIES: RouteCity[] = CENTRAL_IL_CITIES.map((c) => {
  const p = cityCenter(c.slug);
  return p ? { slug: c.slug, name: c.name, lat: p.lat, lng: p.lng } : null;
}).filter((c): c is RouteCity => !!c);

export const routeCity = (slug: string | null | undefined): RouteCity | null =>
  ROUTE_CITIES.find((c) => c.slug === slug) || null;

/** The drives people make most, pre-rendered and indexed. */
export const COMMON_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["peoria", "bloomington"],
  ["peoria", "springfield"],
  ["bloomington", "champaign"],
  ["bloomington", "springfield"],
];

export const pairSlug = (from: string, to: string) => `${from}-to-${to}`;

/** "east-peoria-to-champaign" → { from, to } when both are in scope and differ. */
export function parsePair(s: string | null | undefined): { from: RouteCity; to: RouteCity } | null {
  const m = String(s || "").match(/^([a-z-]+?)-to-([a-z-]+)$/);
  if (!m) return null;
  const from = routeCity(m[1]);
  const to = routeCity(m[2]);
  if (!from || !to || from.slug === to.slug) return null;
  return { from, to };
}

export const isCommonPair = (from: string, to: string) => COMMON_PAIRS.some(([a, b]) => a === from && b === to);

/** Where an old /on-the-way?from=&to= link lands. Its towns were
 *  "bloomington-normal" and "champaign-urbana"; everything else matches. */
export function onTheWayTarget(fromSlug: string | null | undefined, toSlug: string | null | undefined): string {
  const OLD: Record<string, string> = { "bloomington-normal": "bloomington", "champaign-urbana": "champaign" };
  const from = routeCity(OLD[fromSlug || ""] || fromSlug);
  const to = routeCity(OLD[toSlug || ""] || toSlug);
  return from && to && from.slug !== to.slug ? `/route/${pairSlug(from.slug, to.slug)}` : "/route";
}

// ── Geometry ─────────────────────────────────────────────────────────────

const MI_PER_DEG_LAT = 69.0;

/**
 * Where point p sits relative to the segment a→b, in miles, on a flat
 * (equirectangular) projection centered on the segment. Plenty accurate at
 * Central Illinois scale (≤ ~100 mi).
 *   along  distance from a, measured along the line, clamped to [0, total]
 *   off    shortest distance from p to the segment
 */
export function project(a: Pt, b: Pt, p: Pt): { along: number; off: number; total: number; t: number } {
  const lat0 = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const kx = MI_PER_DEG_LAT * Math.cos(lat0);
  const bx = (b.lng - a.lng) * kx, by = (b.lat - a.lat) * MI_PER_DEG_LAT;
  const px = (p.lng - a.lng) * kx, py = (p.lat - a.lat) * MI_PER_DEG_LAT;
  const len2 = bx * bx + by * by;
  const total = Math.sqrt(len2);
  const t = len2 > 0 ? (px * bx + py * by) / len2 : 0;
  const tc = Math.max(0, Math.min(1, t));
  const dx = px - tc * bx, dy = py - tc * by;
  return { along: tc * total, off: Math.sqrt(dx * dx + dy * dy), total, t };
}

/** Extra straight-line miles to stop at p on the way from a to b. */
export function detourMiles(a: Pt, b: Pt, p: Pt): number {
  const ab = distanceMiles(a, b) ?? 0;
  const ap = distanceMiles(a, p) ?? 0;
  const pb = distanceMiles(p, b) ?? 0;
  return Math.max(0, ap + pb - ab);
}

export type OnRoute<T> = T & { along: number; off: number; detour: number };

/** Items within `width` miles of the segment a→b, ordered along the way. */
export function onCorridor<T extends { lat?: number | null; lng?: number | null }>(a: Pt, b: Pt, items: T[], width = CORRIDOR_MILES): OnRoute<T>[] {
  const out: OnRoute<T>[] = [];
  for (const it of items) {
    const lat = Number(it.lat), lng = Number(it.lng);
    if (it.lat == null || it.lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const p = { lat, lng };
    const pr = project(a, b, p);
    if (pr.off > width) continue;
    out.push({ ...it, along: pr.along, off: pr.off, detour: detourMiles(a, b, p) });
  }
  return out.sort((x, y) => x.along - y.along || x.detour - y.detour);
}

// ── Deals along the way ─────────────────────────────────────────────────

/** 0 everyday saving · 1 buy-several · 2 priced/other · 3 conditional. */
export function dealTier(d: ExDeal): number {
  if (isConditional(d)) return 3;
  if (!amountOf(d)) return 2;
  return needsQuantity(d) ? 1 : 0;
}

export function rankStoreDeals<T extends LiveDeal>(deals: T[]): T[] {
  return [...deals].sort(
    (a, b) => dealTier(a) - dealTier(b) || (comparablePercent(b) ?? 0) - (comparablePercent(a) ?? 0) || String(a.deal_id).localeCompare(String(b.deal_id))
  );
}

export type RouteStop = {
  key: string;
  slug: string;
  name: string | null;
  city: string | null;
  lat: number;
  lng: number;
  along: number;
  off: number;
  detour: number;
  /** Live deals at this store (all kinds). */
  total: number;
  /** Best PER_STORE deals, in rank order. */
  deals: LiveDeal[];
};

export type RoutePlan = {
  from: RouteCity;
  to: RouteCity;
  /** Straight-line miles between the two city centers. */
  miles: number;
  stops: RouteStop[];
  /** The single biggest everyday saving on the route, if any. */
  best: { stop: RouteStop; deal: LiveDeal } | null;
};

export function planRoute(from: RouteCity, to: RouteCity, deals: LiveDeal[], opts: { now?: number; width?: number } = {}): RoutePlan {
  const now = opts.now ?? Date.now();
  const byStore = new Map<string, LiveDeal[]>();
  for (const d of deals) {
    if (!isLive(d, now)) continue;
    const k = dealStoreKey(d);
    if (!k) continue;
    byStore.set(k, [...(byStore.get(k) || []), d]);
  }
  const stores = [...byStore.entries()].map(([key, list]) => {
    const withGeo = list.find((d) => d.lat != null && d.lng != null);
    const first = withGeo || list[0];
    return {
      key,
      slug: String(first.slug || first.listing_slug || key),
      name: first.name ?? null,
      city: first.city ?? null,
      lat: withGeo ? Number(withGeo.lat) : null,
      lng: withGeo ? Number(withGeo.lng) : null,
      total: list.length,
      deals: rankStoreDeals(list).slice(0, PER_STORE),
    };
  });
  // onCorridor drops stores without coordinates, so every stop has lat/lng.
  const stops = onCorridor(from, to, stores, opts.width ?? CORRIDOR_MILES) as RouteStop[];
  let best: RoutePlan["best"] = null;
  for (const stop of stops) {
    const d = stop.deals[0];
    if (!d || dealTier(d) !== 0) continue;
    if (!best || (comparablePercent(d) ?? 0) > (comparablePercent(best.deal) ?? 0)) best = { stop, deal: d };
  }
  return { from, to, miles: distanceMiles(from, to) ?? 0, stops, best };
}

// ── Links ────────────────────────────────────────────────────────────────

const place = (c: RouteCity) => `${c.name}, IL`;

/** Google Maps directions from start to end with this store as a stop. Free URL, no API key. */
export function viaHref(from: RouteCity, to: RouteCity, stop: Pt): string {
  const q = new URLSearchParams({
    api: "1",
    origin: place(from),
    destination: place(to),
    waypoints: `${stop.lat},${stop.lng}`,
    travelmode: "driving",
  });
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}

/** Plain directions for the whole drive. */
export function driveHref(from: RouteCity, to: RouteCity): string {
  const q = new URLSearchParams({ api: "1", origin: place(from), destination: place(to), travelmode: "driving" });
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}

// ── Read side ────────────────────────────────────────────────────────────

/** Plan a route from live data. `plan` is null when deals can't be read. */
export async function getRoutePlan(from: RouteCity, to: RouteCity): Promise<{ plan: RoutePlan | null }> {
  const deals = await readLiveDeals();
  return { plan: deals ? planRoute(from, to, deals) : null };
}
