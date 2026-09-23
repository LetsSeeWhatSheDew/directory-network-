// lib/storeImage.ts
// Public-safe store image URL. Google Places photo URLs in
// master_listings.logo_url historically carried `?key=…` (the Places API
// key rendered into page HTML). Never hand those to the browser: route
// them through /api/store-photo/[slug], which resolves the photo
// server-side and 302s to Google's key-free photo CDN URL.
// Direct image URLs (a store's own logo on its site) pass through.

export function isPlacesPhoto(url: string | null | undefined): boolean {
  return !!url && /places\.googleapis\.com\/v1\/places\/[^/]+\/photos\//.test(url);
}

export function storeImageUrl(
  logoUrl: string | null | undefined,
  slug: string | null | undefined
): string | null {
  if (!logoUrl) return null;
  // Places photos need Google Cloud billing (off as of 2026-09-23). Until
  // NEXT_PUBLIC_PLACES_PHOTOS=1 is set, skip the request and show the
  // monogram instead of a guaranteed 404.
  if (isPlacesPhoto(logoUrl)) return slug && process.env.NEXT_PUBLIC_PLACES_PHOTOS === "1" ? `/api/store-photo/${encodeURIComponent(slug)}` : null;
  if (/^https:\/\//.test(logoUrl) && !/[?&]key=/.test(logoUrl)) return logoUrl;
  return null;
}

// "places/ChIJ…/photos/AU_…" from any stored Places URL (with or without
// /media and query string).
export function placesPhotoName(url: string): string | null {
  const m = url.match(/(places\/[^/?#]+\/photos\/[^/?#]+)/);
  return m ? m[1] : null;
}
