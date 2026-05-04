// lib/proximity.ts
// Unified proximity logic. The site uses two complementary signals:
//
//   1. Metro aliases (lib/cityNormalize.ts) — coarse "is this city in
//      the user's metro?" check. Cheap, works without lat/lng, and is
//      already plumbed through the deal queries.
//   2. Haversine distance — fine-grained radius check when both the
//      user and the listing have lat/lng. Used to label a card with
//      "X mi from you" and to enforce the 15-mile radius rule on
//      "near me" views (homepage hero card, deals/[category]).
//
// Keep PROXIMITY_RADIUS_MILES in sync with the metro alias rule of
// thumb: every alias in METRO_ALIASES should sit inside this radius
// of the key city.

export const PROXIMITY_RADIUS_MILES = 15;

export type Coords = {
  lat?: number | null;
  lng?: number | null;
};

/** Earth radius in miles. */
const EARTH_RADIUS_MI = 3958.8;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Great-circle distance in miles between two lat/lng points. Returns
 * null when either coord is missing or non-finite — call sites should
 * treat null as "unknown distance" rather than 0.
 */
export function distanceMiles(a: Coords, b: Coords): number | null {
  if (a?.lat == null || a?.lng == null || b?.lat == null || b?.lng == null) return null;
  const lat1 = Number(a.lat),
    lng1 = Number(a.lng);
  const lat2 = Number(b.lat),
    lng2 = Number(b.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(s)));
}

/**
 * Within the proximity radius? Returns:
 *   - true: distance is known AND <= radius
 *   - false: distance is known AND > radius
 *   - null: unknown — caller should fall back to metro alias matching
 *
 * Distinguishing "known false" from "unknown" matters: the hero card
 * should show "X mi from you" when known, and silently omit it when
 * unknown — never show "0 mi" for a missing coord.
 */
export function withinRadius(
  user: Coords,
  listing: Coords,
  radiusMi: number = PROXIMITY_RADIUS_MILES
): boolean | null {
  const d = distanceMiles(user, listing);
  if (d == null) return null;
  return d <= radiusMi;
}

/**
 * Format miles for display. Hides the line entirely past 500 miles
 * (almost certainly a coord error or the user is on the other coast)
 * and rounds to one decimal under 100, whole numbers above. Returns
 * null when distance is unknown.
 */
export function formatDistance(d: number | null): string | null {
  if (d == null || !Number.isFinite(d) || d > 500) return null;
  if (d < 0.1) return "<0.1 mi";
  if (d < 100) return `${d.toFixed(1)} mi`;
  return `${Math.round(d)} mi`;
}
