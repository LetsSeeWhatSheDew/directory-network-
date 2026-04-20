// lib/links.ts
// Defensive href helpers. The deal feed has historically rendered
// /l/undefined?city=… when both `slug` and `listing_slug` are null —
// always run a slug through listingHref() before putting it in an <a>.

export function listingHref(
  slug: string | null | undefined,
  city: string | null | undefined
): string | null {
  const s = typeof slug === "string" ? slug.trim() : "";
  if (!s || s === "undefined" || s === "null") return null;
  return city
    ? `/l/${s}?city=${encodeURIComponent(city)}`
    : `/l/${s}`;
}
