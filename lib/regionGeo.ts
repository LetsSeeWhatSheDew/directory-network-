// lib/regionGeo.ts
// Decide "is this point inside Central Illinois, and which scope city is
// it nearest?" from our own coordinates. Client-safe (no server imports).
//
// Why: LocationAware used to trust a third-party reverse geocode
// (Nominatim) to name the city and then asked "is that name one of our 12
// cities?". When the lookup was slow, failed, or returned a county/township
// name, a GPS user standing in Peoria was told "outside Central Illinois".
// Our own coordinates are the source of truth; a reverse geocode may only
// refine the display label (see LocationAware).

import { CENTRAL_IL_CITIES } from "./constants/regions";
import { cityCenter, milesBetween } from "./cityProfiles";

/** Within this many straight-line miles of any scope city = inside the region. */
export const REGION_RADIUS_MILES = 35;

export type ScopeCityPoint = { slug: string; name: string; lat: number; lng: number };

export const SCOPE_CITY_POINTS: ReadonlyArray<ScopeCityPoint> = CENTRAL_IL_CITIES.flatMap((c) => {
  const p = cityCenter(c.slug);
  return p ? [{ slug: c.slug, name: c.name, lat: p.lat, lng: p.lng }] : [];
});

export type RegionMatch = {
  /** Nearest scope city. */
  slug: string;
  name: string;
  /** Straight-line miles from the point to that city's center. */
  miles: number;
  /** True when the point is within REGION_RADIUS_MILES of a scope city. */
  inside: boolean;
};

/** Nearest scope city to a lat/lng, with an inside/outside verdict. Null on bad input. */
export function nearestScopeCity(
  lat: number | null | undefined,
  lng: number | null | undefined,
  radiusMiles: number = REGION_RADIUS_MILES
): RegionMatch | null {
  if (lat == null || lng == null) return null;
  const la = Number(lat), lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  if (Math.abs(la) > 90 || Math.abs(lo) > 180) return null;
  let best: RegionMatch | null = null;
  for (const c of SCOPE_CITY_POINTS) {
    const miles = milesBetween({ lat: la, lng: lo }, c);
    if (!best || miles < best.miles) best = { slug: c.slug, name: c.name, miles, inside: false };
  }
  if (best) best.inside = best.miles <= radiusMiles;
  return best;
}

/** A reverse-geocoded name may relabel the point only if it names a scope city this close. */
export const LABEL_REFINE_MILES = 10;

/**
 * Display/commit label for a point that is inside the region. Starts from
 * the nearest scope city; a reverse-geocoded place name (Nominatim) may
 * swap in a different scope city only when that city's center is within
 * LABEL_REFINE_MILES of the point. A geocoded name can never move the
 * user out of region or to a far city (e.g. "Springfield" for a point in
 * Peoria).
 */
export function refinedCityLabel(lat: number, lng: number, geocoded: string | null | undefined): string | null {
  const m = nearestScopeCity(lat, lng);
  if (!m || !m.inside) return null;
  const slug = String(geocoded || "").trim().toLowerCase().replace(/\s+/g, "-");
  const hit = slug ? SCOPE_CITY_POINTS.find((c) => c.slug === slug) : undefined;
  if (hit && milesBetween({ lat, lng }, hit) <= LABEL_REFINE_MILES) return hit.name;
  return m.name;
}
