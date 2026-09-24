// lib/dispensaryName.ts
// Shared display-name helper. The `active_deals_with_listings` view
// sometimes returns `name` equal to the slug (enrichment edge case),
// which renders ugly strings like "perception-cannabis-chicago" on
// cards. Every render site should pipe through displayDispensaryName()
// before putting a dispensary label in the DOM.

export function slugToName(slug: string | null | undefined): string {
  if (!slug) return "";
  return String(slug)
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function displayDispensaryName(row: {
  name?: string | null;
  slug?: string | null;
  listing_slug?: string | null;
}): string {
  const name = row?.name?.trim();
  const slug = row?.slug || row?.listing_slug || "";
  if (!name || name === slug || /^[a-z0-9-]+$/.test(name)) {
    return slugToName(slug || name || "Illinois dispensary").replace(/^nuera\b/i, "nuEra");
  }
  // A bare chain name ("NuEra") with a more specific slug ("nuera-pekin")
  // borrows the location from the slug so titles read "nuEra Pekin".
  const fromSlug = slug ? slugToName(slug) : "";
  const out = fromSlug.toLowerCase().startsWith(name.toLowerCase() + " ") ? fromSlug : name;
  return out.replace(/^nuera\b/i, "nuEra");
}
