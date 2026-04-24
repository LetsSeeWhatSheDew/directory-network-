// lib/constants/regions.ts
// Central Illinois scope — the 11 cities the homepage, hero copy, and
// go-to-market focus are currently oriented around. Out-of-scope cities
// keep their existing routes, metadata, and sitemap entries; this file
// only drives regional positioning on the homepage and any utility that
// needs to ask "is this a focus-market city?".

export type CityDef = {
  slug: string;
  name: string;
  state: "IL";
};

export const CENTRAL_IL_CITIES: ReadonlyArray<CityDef> = [
  { slug: "peoria", name: "Peoria", state: "IL" },
  { slug: "east-peoria", name: "East Peoria", state: "IL" },
  { slug: "peoria-heights", name: "Peoria Heights", state: "IL" },
  { slug: "pekin", name: "Pekin", state: "IL" },
  { slug: "bartonville", name: "Bartonville", state: "IL" },
  { slug: "morton", name: "Morton", state: "IL" },
  { slug: "washington", name: "Washington", state: "IL" },
  { slug: "normal", name: "Normal", state: "IL" },
  { slug: "bloomington", name: "Bloomington", state: "IL" },
  { slug: "champaign", name: "Champaign", state: "IL" },
  { slug: "urbana", name: "Urbana", state: "IL" },
  { slug: "springfield", name: "Springfield", state: "IL" },
];

export const CENTRAL_IL_CITY_SLUGS: ReadonlyArray<string> =
  CENTRAL_IL_CITIES.map((c) => c.slug);

export function isCentralILCity(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return CENTRAL_IL_CITY_SLUGS.includes(slug.toLowerCase());
}
