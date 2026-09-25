import { MetadataRoute } from "next";
import { brand } from "../lib/brand";
import { getAllBrands } from "../lib/brands";
import { isInCentralIL } from "../lib/visibility";
import { CENTRAL_IL_PUBLIC_CITIES } from "../lib/constants/regions";
import { GUIDES } from "../lib/guides";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

const DEAL_CATEGORIES = ["flower", "edibles", "vapes", "concentrate", "all"] as const;

const NOINDEX_SLUGS = [
    "emerald-city-dispensary-chicago-il",
    "emerald-leaf-collective-chicago-il",
    "lakefront-cannabis-co-chicago-il",
  ];

// /cannabis/illinois content pages that survived the legacy-tree retirement.
// These are content guides, not city directories — middleware lets them through.
const STATIC_PAGES = [
  { path: "first-time-guide", freq: "monthly" as const, pri: 0.8 },
  { path: "laws", freq: "monthly" as const, pri: 0.8 },
  { path: "open-now", freq: "hourly" as const, pri: 0.9 },
  ];

async function getAllListings() {
    try {
          const res = await fetch(
                  `${SUPABASE_URL}/rest/v1/master_listings?select=slug,city,updated_at&project_tag=eq.green&state=eq.IL&is_active=eq.true&limit=200`,
            {
                      headers: {
                                  apikey: SUPABASE_ANON_KEY!,
                                  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                      },
                      next: { revalidate: 3600 },
            }
                );
          if (!res.ok) return [];
          return res.json();
    } catch {
          return [];
    }
}

async function getActiveDeals() {
  try {
    // Only emit /deal/[id] URLs for deals still live — Google treats
    // crawling a 404-or-notFound page for an expired deal as a quality
    // signal against the site. `expires_at.is.null` keeps evergreen deals.
    // Join the listing's city so we can filter to Central IL only in
    // the sitemap builder below.
    const nowIso = new Date().toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/deals?select=id,updated_at,expires_at,listing_slug&is_active=eq.true&project_tag=eq.green&or=(expires_at.gt.${nowIso},expires_at.is.null)&limit=500`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [listings, activeDeals, brands] = await Promise.all([
          getAllListings(),
          getActiveDeals(),
          getAllBrands(),
        ]);

  const base: MetadataRoute.Sitemap = [
    { url: `${brand.url}`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${brand.url}/alerts`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${brand.url}/dispensaries`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${brand.url}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${brand.url}/ways-to-buy`, lastModified: new Date(), changeFrequency: "daily", priority: 0.85 },
    { url: `${brand.url}/drive-thru`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${brand.url}/medical`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${brand.url}/open-late`, lastModified: new Date(), changeFrequency: "daily", priority: 0.75 },
    { url: `${brand.url}/illinois-cannabis-delivery`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${brand.url}/illinois-hemp-law`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${brand.url}/deal-index`, lastModified: new Date(), changeFrequency: "daily", priority: 0.75 },
    { url: `${brand.url}/for-dispensaries`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${brand.url}/this-week`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${brand.url}/how-we-rank`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${brand.url}/developers`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${brand.url}/status`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.5 },
    { url: `${brand.url}/on-the-way`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${brand.url}/green-wednesday`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${brand.url}/out-the-door`, lastModified: new Date(), changeFrequency: "daily", priority: 0.85 },
    { url: `${brand.url}/illinois-cannabis-tax-calculator`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${brand.url}/illinois-cannabis-tax`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${brand.url}/get-listed`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${brand.url}/upgrade`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${brand.url}/claim`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${brand.url}/start`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${brand.url}/deals/submit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${brand.url}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${brand.url}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    // Brand index — placeholder today, data-driven once the brands table lands.
    { url: `${brand.url}/brand`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${brand.url}/about/index`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // /guides hub + answer pages
  const guideUrls: MetadataRoute.Sitemap = [
    { url: `${brand.url}/guides`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    ...GUIDES.map((g) => ({
      url: `${brand.url}/guides/${g.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  // Deal engine category pages
  const dealUrls: MetadataRoute.Sitemap = DEAL_CATEGORIES.map((c) => ({
    url: `${brand.url}/deals/${c}`,
    lastModified: new Date(),
    changeFrequency: "hourly" as const,
    priority: 0.9,
  }));

  // Static IL guide pages
  const staticPages: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
        url: `${brand.url}/cannabis/illinois/${p.path}`,
        lastModified: new Date(),
        changeFrequency: p.freq,
        priority: p.pri,
  }));

  // /dispensary/[slug] is the canonical listing URL. /l/[slug] 308-redirects
  // to it (next.config.ts), so we no longer emit /l/ URLs in the sitemap.
  const dispensaryProfileUrls: MetadataRoute.Sitemap = listings
    .filter((l: { slug: string; city?: string | null }) =>
      l.slug && !NOINDEX_SLUGS.includes(l.slug) && isInCentralIL(l.city))
    .map((l: { slug: string; updated_at: string }) => ({
      url: `${brand.url}/dispensary/${l.slug}`,
      lastModified: l.updated_at ? new Date(l.updated_at) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.85,
    }));

  // /city/[city] canonical landings — only the 9 Central IL cities with
  // licensed dispensaries today. The 3 dispensary-less cities (Bartonville,
  // Morton, Washington) stay in CENTRAL_IL_CITIES for data-scope reasons
  // but render 404 publicly, so they must not appear in the sitemap.
  const cityLandingUrls: MetadataRoute.Sitemap = CENTRAL_IL_PUBLIC_CITIES.map((c) => ({
    url: `${brand.url}/city/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // NEW — /brand/[slug] per-brand pages. Returns [] until brands table lands,
  // so the shape is live but the section is empty today.
  const brandDetailUrls: MetadataRoute.Sitemap = brands
    .filter((b) => b.slug)
    .map((b) => ({
      url: `${brand.url}/brand/${b.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  // /deal/[id] per-deal pages — active deals only, Central IL listings only.
  // Build a slug→city map from `listings` so we can filter by the deal's
  // listing_slug without another round-trip.
  const listingCityBySlug = new Map<string, string | null>();
  for (const l of listings as Array<{ slug: string; city?: string | null }>) {
    if (l?.slug) listingCityBySlug.set(l.slug, l.city ?? null);
  }
  const dealDetailUrls: MetadataRoute.Sitemap = (activeDeals as Array<{ id: string; updated_at?: string; listing_slug?: string }>)
    .filter((d) => {
      if (!d.id) return false;
      const city = d.listing_slug ? listingCityBySlug.get(d.listing_slug) : null;
      return isInCentralIL(city);
    })
    .map((d) => ({
      url: `${brand.url}/deal/${d.id}`,
      lastModified: d.updated_at ? new Date(d.updated_at) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

  void dealDetailUrls; // kept for reference; not emitted (see note in the list below)
  return [
    ...base,
    ...guideUrls,
    ...dealUrls,
    ...staticPages,
    ...dispensaryProfileUrls,
    ...cityLandingUrls,
    ...brandDetailUrls,
    // /deal/[id] URLs left out: each one canonicals to its dispensary page
    // (see app/deal/[id]/page.tsx), and a sitemap should list canonical URLs only.
  ];
}
