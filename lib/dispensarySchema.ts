// lib/dispensarySchema.ts
// Title and LocalBusiness JSON-LD for /dispensary/[slug]. Real fields only:
// every property is emitted only when the listing row actually has it.

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** "SHARE" in Springfield → "SHARE Springfield"; "Cookies Peoria Heights"
 *  stays as is. A bare chain name in a page title says nothing about where
 *  the store is, which is the whole local query. */
export function nameWithCity(name: string, city: string | null | undefined): string {
  const n = (name || "").trim();
  const c = (city || "").trim();
  if (!c || !n) return n;
  return n.toLowerCase().includes(c.toLowerCase()) ? n : `${n} ${c}`;
}

/** The store's own website, for schema sameAs — only a real external
 *  http(s) URL, never a PuffPrice page (sameAs pointing at ourselves says
 *  nothing about the entity). */
export function externalSameAs(website: string | null | undefined, ownHost: string): string[] {
  const w = (website || "").trim();
  if (!w) return [];
  try {
    const u = new URL(w);
    if (u.protocol !== "http:" && u.protocol !== "https:") return [];
    const host = u.hostname.replace(/^www\./, "");
    if (host === ownHost.replace(/^www\./, "")) return [];
    return [u.toString()];
  } catch {
    return [];
  }
}

export type DispensarySchemaInput = {
  pageUrl: string;
  ownHost: string;
  name: string;
  listing: {
    address1?: string | null;
    city?: string | null;
    state?: string | null;
    phone?: string | null;
    website?: string | null;
    short_description?: string | null;
    lat?: number | string | null;
    lng?: number | string | null;
  };
  image?: string | null;
  hours: { weekday: number; opens_at: string | null; closes_at: string | null; is_closed: boolean | null }[];
  /** Pre-built rating/review fields (only from real approved reviews). */
  ratingFields?: Record<string, unknown>;
};

export function buildDispensaryLocalBusiness(i: DispensarySchemaInput): Record<string, unknown> {
  const l = i.listing;
  const openingHours = i.hours
    .filter((h) => !h.is_closed && h.opens_at && h.closes_at && WEEKDAYS[h.weekday])
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: WEEKDAYS[h.weekday],
      opens: h.opens_at!.substring(0, 5),
      closes: h.closes_at!.substring(0, 5),
    }));
  const lat = l.lat == null || l.lat === "" ? NaN : Number(l.lat);
  const lng = l.lng == null || l.lng === "" ? NaN : Number(l.lng);
  const sameAs = externalSameAs(l.website, i.ownHost);
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${i.pageUrl}#store`,
    name: i.name,
    ...(l.address1
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: l.address1,
            ...(l.city ? { addressLocality: l.city } : {}),
            addressRegion: l.state || "IL",
            addressCountry: "US",
          },
        }
      : {}),
    ...(Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
      ? { geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng } }
      : {}),
    ...(l.phone ? { telephone: l.phone } : {}),
    url: i.pageUrl,
    ...(i.image ? { image: i.image } : {}),
    ...(openingHours.length > 0 ? { openingHoursSpecification: openingHours } : {}),
    ...(l.short_description ? { description: l.short_description } : {}),
    ...(i.ratingFields || {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}
