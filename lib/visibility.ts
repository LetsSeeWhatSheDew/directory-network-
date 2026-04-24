// lib/visibility.ts
// Central Illinois scope gate.
//
// The app currently exposes Central IL data only. Non-CIL rows stay in
// Supabase (preserved for future expansion) but every public route that
// touches city- or listing-level data must run through this check.
//
// Single source of truth: `CENTRAL_IL_CITIES` in lib/constants/regions.ts.
// When the scope expands, add entries there — this file auto-follows.

import { CENTRAL_IL_CITIES } from "./constants/regions";

// Compound "twin-city" slugs that live as their own static pages but
// map to Central IL content. Keep this list small — only true metros
// where the static folder name doesn't match a canonical CENTRAL_IL_CITIES
// slug.
const CENTRAL_IL_COMPOUND_SLUGS = new Set<string>([
  "bloomington-normal",
  "champaign-urbana",
]);

function normalize(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "-");
}

const CENTRAL_IL_SET = new Set<string>(
  CENTRAL_IL_CITIES.flatMap((c) => [c.slug, normalize(c.name)]),
);

/**
 * Returns true if the given city name OR slug is in the publicly-visible
 * Central IL scope. Case-insensitive, handles "East Peoria", "east-peoria",
 * "EAST PEORIA" identically. Also matches the two compound twin-city
 * slugs ("bloomington-normal", "champaign-urbana") so their existing
 * static pages stay visible.
 */
export function isInCentralIL(cityOrSlug: string | null | undefined): boolean {
  if (!cityOrSlug) return false;
  const key = normalize(cityOrSlug);
  return CENTRAL_IL_SET.has(key) || CENTRAL_IL_COMPOUND_SLUGS.has(key);
}

/**
 * Non-city routes that live under /cannabis/illinois/. These are not
 * geographic slugs and should never be 404'd by the visibility filter.
 */
export const CANNABIS_IL_NON_CITY_SLUGS = new Set<string>([
  "first-time-guide",
  "laws",
  "open-now",
  "get-listed",
  "sitemap",
  "robots",
]);

/**
 * Empty Central IL cities — in scope, but have zero dispensary listings
 * today. These render a honest empty-state hub pointing to the nearest
 * city with inventory. Distances are approximate driving miles.
 */
export const EMPTY_CENTRAL_IL_CITIES: Record<
  string,
  { name: string; nearestCity: string; nearestMiles: number; direction: string }
> = {
  bartonville: {
    name: "Bartonville",
    nearestCity: "Peoria",
    nearestMiles: 5,
    direction: "NE",
  },
  morton: {
    name: "Morton",
    nearestCity: "East Peoria",
    nearestMiles: 8,
    direction: "W",
  },
  pekin: {
    name: "Pekin",
    nearestCity: "East Peoria",
    nearestMiles: 10,
    direction: "N",
  },
  washington: {
    name: "Washington",
    nearestCity: "East Peoria",
    nearestMiles: 9,
    direction: "SW",
  },
};

export function isEmptyCentralILCity(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return normalize(slug) in EMPTY_CENTRAL_IL_CITIES;
}
