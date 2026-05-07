// lib/links.ts
// Defensive href helpers. The deal feed has historically rendered
// /dispensary/undefined?city=… when both `slug` and `listing_slug` are
// null — always run a slug through listingHref() before putting it in
// an <a>.
//
// /dispensary/[slug] is the canonical listing URL pattern. The legacy
// /l/[slug] route 308-redirects to /dispensary/[slug] for SEO
// consolidation (see next.config.ts redirects).

export function listingHref(
  slug: string | null | undefined,
  city: string | null | undefined
): string | null {
  const s = typeof slug === "string" ? slug.trim() : "";
  if (!s || s === "undefined" || s === "null") return null;
  return city
    ? `/dispensary/${s}?city=${encodeURIComponent(city)}`
    : `/dispensary/${s}`;
}
