import { MetadataRoute } from "next";
import { brand } from "../lib/brand";

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

const INTENTS = ["best", "open-now", "recreational", "deals"] as const;

const CHICAGO_LANDMARKS = [
    "near-wrigley-field",
    "near-ohare",
    "near-navy-pier",
    "near-magnificent-mile",
  ];

const STATIC_PAGES = [
  { path: "first-time-guide", freq: "monthly" as const, pri: 0.8 },
  { path: "laws", freq: "monthly" as const, pri: 0.8 },
  { path: "open-now", freq: "hourly" as const, pri: 0.9 },
  ];

async function getAllListings() {
    try {
          const res = await fetch(
                  `${SUPABASE_URL}/rest/v1/master_listings?select=slug,updated_at&limit=200`,
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

async function getIllinoisCities() {
    try {
          const res = await fetch(
                  `${SUPABASE_URL}/rest/v1/master_listings?select=city,state&state=eq.IL&project_tag=eq.green&limit=200`,
            {
                      headers: {
                                  apikey: SUPABASE_ANON_KEY!,
                                  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                      },
                      next: { revalidate: 3600 },
            }
                );
          if (!res.ok) return [];
          const rows = await res.json();
          const unique = [...new Set(rows.map((r: { city: string }) => r.city).filter(Boolean))];
          return unique;
    } catch {
          return [];
    }
}

async function getActiveDeals() {
  try {
    // Only emit /deal/[id] URLs for deals still live — Google treats
    // crawling a 404-or-notFound page for an expired deal as a quality
    // signal against the site. `expires_at.is.null` keeps evergreen deals.
    const nowIso = new Date().toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/deals?select=id,updated_at,expires_at&is_active=eq.true&project_tag=eq.green&or=(expires_at.gt.${nowIso},expires_at.is.null)&limit=500`,
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
    const [listings, cities, activeDeals] = await Promise.all([
          getAllListings(),
          getIllinoisCities(),
          getActiveDeals(),
        ]);

  const base: MetadataRoute.Sitemap = [
    { url: `${brand.url}`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${brand.url}/cannabis`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${brand.url}/cannabis/illinois`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${brand.url}/alerts`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${brand.url}/dispensaries`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${brand.url}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${brand.url}/get-listed`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${brand.url}/early-access`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${brand.url}/upgrade`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${brand.url}/claim`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${brand.url}/start`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${brand.url}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${brand.url}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    // Brand index — placeholder today, data-driven once the brands table lands.
    { url: `${brand.url}/brand`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${brand.url}/about/index`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
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

  // Individual listing pages
  const listingUrls: MetadataRoute.Sitemap = listings
      .filter((l: { slug: string }) => l.slug && !NOINDEX_SLUGS.includes(l.slug))
      .map((l: { slug: string; updated_at: string }) => ({
              url: `${brand.url}/l/${l.slug}`,
              lastModified: l.updated_at ? new Date(l.updated_at) : new Date(),
              changeFrequency: "weekly" as const,
              priority: 0.8,
      }));

  // City hub pages
  const cityUrls: MetadataRoute.Sitemap = (cities as string[]).map((city) => ({
        url: `${brand.url}/cannabis/illinois/${city.toLowerCase().replace(/\s+/g, "-")}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.85,
  }));

  // Intent pages — best, open-now, recreational, deals for every city
  const intentUrls: MetadataRoute.Sitemap = (cities as string[]).flatMap((city) =>
        INTENTS.map((intent) => ({
                url: `${brand.url}/cannabis/illinois/${city.toLowerCase().replace(/\s+/g, "-")}/${intent}`,
                lastModified: new Date(),
                changeFrequency: intent === "open-now" ? ("hourly" as const) : ("daily" as const),
                priority: intent === "best" || intent === "open-now" ? 0.9 : 0.8,
        }))
                                                                           );

  // Chicago landmark pages
  const landmarkUrls: MetadataRoute.Sitemap = CHICAGO_LANDMARKS.map((lm) => ({
        url: `${brand.url}/cannabis/illinois/chicago/${lm}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
  }));

  // NEW — /dispensary/[slug] full profile pages (parallel to /l/[slug])
  const dispensaryProfileUrls: MetadataRoute.Sitemap = listings
    .filter((l: { slug: string }) => l.slug && !NOINDEX_SLUGS.includes(l.slug))
    .map((l: { slug: string; updated_at: string }) => ({
      url: `${brand.url}/dispensary/${l.slug}`,
      lastModified: l.updated_at ? new Date(l.updated_at) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.85,
    }));

  // NEW — /city/[city] clean landing pages
  const cityLandingUrls: MetadataRoute.Sitemap = (cities as string[]).map((city) => ({
    url: `${brand.url}/city/${city.toLowerCase().replace(/\s+/g, "-")}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // NEW — /deal/[id] per-deal pages (active deals only)
  const dealDetailUrls: MetadataRoute.Sitemap = (activeDeals as Array<{ id: string; updated_at?: string }>)
    .filter((d) => d.id)
    .map((d) => ({
      url: `${brand.url}/deal/${d.id}`,
      lastModified: d.updated_at ? new Date(d.updated_at) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

  return [
    ...base,
    ...dealUrls,
    ...staticPages,
    ...listingUrls,
    ...cityUrls,
    ...intentUrls,
    ...landmarkUrls,
    ...dispensaryProfileUrls,
    ...cityLandingUrls,
    ...dealDetailUrls,
  ];
}
