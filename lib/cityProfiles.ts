// lib/cityProfiles.ts
// Per-city facts for the /city/[city] landing pages. Only durable geography
// lives here — no prices, no counts, no claims that go stale. Everything
// numeric on a city page is computed from the live DB at render time.
//
// Coordinates are approximate city centers, used only to order the
// "nearby cities" row and to label rough straight-line distances.

export type CityProfile = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  /** One or two factual sentences about where the city sits and how locals shop it. */
  intro: string;
};

export const CITY_PROFILES: Record<string, CityProfile> = {
  peoria: {
    slug: "peoria",
    name: "Peoria",
    lat: 40.6936,
    lng: -89.589,
    intro:
      "Peoria sits on the west bank of the Illinois River. East Peoria and Peoria Heights each have their own dispensaries a few minutes away, so comparing across the river is easy.",
  },
  "east-peoria": {
    slug: "east-peoria",
    name: "East Peoria",
    lat: 40.666,
    lng: -89.58,
    intro:
      "East Peoria is right across the Illinois River from downtown Peoria, off I-74. Peoria's dispensaries are a short drive, which makes it easy to compare before you go.",
  },
  "peoria-heights": {
    slug: "peoria-heights",
    name: "Peoria Heights",
    lat: 40.747,
    lng: -89.574,
    intro:
      "Peoria Heights is a small village on the bluff just north of Peoria. Peoria and East Peoria dispensaries are close by if you want more options.",
  },
  pekin: {
    slug: "pekin",
    name: "Pekin",
    lat: 40.5675,
    lng: -89.6407,
    intro:
      "Pekin is south of Peoria along the Illinois River. East Peoria and Peoria are both within a short drive, so check them before you head out.",
  },
  normal: {
    slug: "normal",
    name: "Normal",
    lat: 40.5142,
    lng: -88.9906,
    intro:
      "Normal is home to Illinois State University and shares a border with Bloomington. Most people shop the two towns as one market.",
  },
  bloomington: {
    slug: "bloomington",
    name: "Bloomington",
    lat: 40.4842,
    lng: -88.9937,
    intro:
      "Bloomington shares a border with Normal, and most people shop the two towns as one market. Check both before you drive.",
  },
  champaign: {
    slug: "champaign",
    name: "Champaign",
    lat: 40.1164,
    lng: -88.2434,
    intro:
      "Champaign shares a border with Urbana, and the University of Illinois campus spans both. Treat Champaign-Urbana as one market when you compare.",
  },
  urbana: {
    slug: "urbana",
    name: "Urbana",
    lat: 40.1106,
    lng: -88.2073,
    intro:
      "Urbana shares a border with Champaign, and the University of Illinois campus spans both. Champaign dispensaries are minutes away.",
  },
  springfield: {
    slug: "springfield",
    name: "Springfield",
    lat: 39.7817,
    lng: -89.6501,
    intro:
      "Springfield is the state capital and the biggest market in the south end of Central Illinois, with I-55 running along its east side.",
  },
};

export function getCityProfile(slug: string): CityProfile | null {
  return CITY_PROFILES[slug.toLowerCase()] ?? null;
}

/** Straight-line distance in miles (haversine). */
export function milesBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Other profiled cities ordered nearest-first. */
export function nearbyCities(slug: string, limit = 4) {
  const me = getCityProfile(slug);
  if (!me) return [];
  return Object.values(CITY_PROFILES)
    .filter((c) => c.slug !== me.slug)
    .map((c) => ({ ...c, miles: Math.round(milesBetween(me, c)) }))
    .sort((x, y) => x.miles - y.miles)
    .slice(0, limit);
}
