// lib/cityNormalize.ts
//
// Until sql/backfill-orphan-listings-2026-04-15.sql runs in prod, the
// active_deals_with_listings view falls back to city='Illinois' for
// 13 orphan slugs. This file derives a displayable city from the slug
// so users in Chicago and Peoria don't see "Illinois" as the location
// on real deals at real Chicago/Peoria dispensaries.
//
// Also used by ranking to broaden the "near me" filter into the
// metro area — East Peoria IS Peoria to someone living there.

const KNOWN_CITY_SUFFIXES: string[] = [
  // Longer multi-word cities first so "chicago-heights" matches before "chicago"
  "chicago-heights",
  "east-peoria",
  "carol-stream",
  "galesburg",
  "naperville",
  "crestwood",
  "westmont",
  "aurora",
  "peoria",
  "champaign",
  "danville",
  "chicago",
  "moline",
  "elgin",
  "morris",
  "milan",
  "joliet",
  "bartonville",
  "rockford",
  "springfield",
];

/** "cookies-chicago" → "Chicago"; "mood-shine-chicago-heights" → "Chicago Heights" */
export function cityFromSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const s = slug.toLowerCase();
  for (const suffix of KNOWN_CITY_SUFFIXES) {
    if (s.endsWith(`-${suffix}`) || s === suffix) {
      return suffix
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }
  return null;
}

/**
 * Displayable city for a deal. Prefers the joined city, falls back to
 * deriving from slug when the join returned the generic "Illinois"
 * placeholder.
 */
export function displayCity(deal: { city?: string | null; slug?: string | null; listing_slug?: string | null }): string {
  const c = deal.city;
  if (c && c !== "Illinois") return c;
  const fromSlug = cityFromSlug(deal.slug || deal.listing_slug);
  return fromSlug || "Illinois";
}

/**
 * Greater-metro aliases — used to broaden the city filter so a Peoria
 * user sees East Peoria + Bartonville deals too. Keys are the
 * user-input city; values are the set of aliases to search against
 * (always includes the input itself). Keys are matched case-insensitive.
 */
const METRO_ALIASES: Record<string, string[]> = {
  peoria: ["Peoria", "East Peoria", "Bartonville"],
  "east peoria": ["East Peoria", "Peoria", "Bartonville"],
  bartonville: ["Bartonville", "Peoria", "East Peoria"],
  chicago: ["Chicago", "Chicago Heights", "Oak Park", "Cicero"],
  "chicago heights": ["Chicago Heights", "Chicago"],
  champaign: ["Champaign", "Urbana"],
  urbana: ["Urbana", "Champaign"],
  "carol stream": ["Carol Stream", "Bloomingdale", "Wheaton"],
  naperville: ["Naperville", "Aurora", "Lisle"],
  aurora: ["Aurora", "Naperville"],
  moline: ["Moline", "Rock Island", "East Moline"],
};

/** Return all city names the user's input should match against. */
export function metroCities(city: string): string[] {
  if (!city) return [];
  const key = city.trim().toLowerCase();
  return METRO_ALIASES[key] || [city];
}

/** Does a deal row belong to the user's metro area? Case-insensitive substring match. */
export function isInMetro(dealCity: string | null | undefined, dealSlug: string | null | undefined, userCity: string): boolean {
  const aliases = metroCities(userCity).map((s) => s.toLowerCase());
  const candidates = [
    (dealCity || "").toLowerCase(),
    (cityFromSlug(dealSlug) || "").toLowerCase(),
  ];
  return candidates.some((c) => c && aliases.some((a) => c.includes(a) || a.includes(c)));
}
