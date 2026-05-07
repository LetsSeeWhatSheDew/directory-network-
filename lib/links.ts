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

// "Visit dispensary" / "Get directions" CTA helper. The button used to
// link to /l/[slug] (the in-app confirmation surface) — that's now a
// canonical-only redirect and the CTA should drop the user at the
// dispensary's own website, or Google Maps directions if the website
// isn't on file.
//
// Returns the href + label so the caller can render either case
// without re-running the conditional. `external: true` for both —
// callers should set target="_blank" rel="noopener".
export function visitDispensaryHref(args: {
  website: string | null | undefined;
  address1: string | null | undefined;
  city: string | null | undefined;
}): { href: string; label: string; external: true } {
  const website = (args.website || "").trim();
  if (website) {
    return {
      href: appendUtm(website, "puffprice", "deal"),
      label: "Visit dispensary →",
      external: true,
    };
  }
  const parts = [args.address1, args.city, "IL"].filter(Boolean).join(", ");
  return {
    href: `https://maps.google.com/?q=${encodeURIComponent(parts)}`,
    label: "Get directions →",
    external: true,
  };
}

// Append UTM parameters without clobbering the dispensary's existing
// query string. Falls back to the original URL if it isn't parseable.
export function appendUtm(
  url: string,
  source: string,
  medium: string
): string {
  try {
    const u = new URL(url);
    if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", source);
    if (!u.searchParams.has("utm_medium")) u.searchParams.set("utm_medium", medium);
    return u.toString();
  } catch {
    return url;
  }
}
