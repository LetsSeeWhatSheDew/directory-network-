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
  if (isPlacesPhoto(logoUrl)) return slug ? `/api/store-photo/${encodeURIComponent(slug)}` : null;
  if (/^https:\/\//.test(logoUrl) && !/[?&]key=/.test(logoUrl)) return logoUrl;
  return null;
}

// "places/ChIJ…/photos/AU_…" from any stored Places URL (with or without
// /media and query string).
export function placesPhotoName(url: string): string | null {
  const m = url.match(/(places\/[^/?#]+\/photos\/[^/?#]+)/);
  return m ? m[1] : null;
}
