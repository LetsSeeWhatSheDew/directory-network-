import { MetadataRoute } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [listings, cities] = await Promise.all([
          getAllListings(),
          getIllinoisCities(),
        ]);

  const base: MetadataRoute.Sitemap = [
    { url: "https://cleanlist.co", lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: "https://cleanlist.co/cannabis", lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: "https://cleanlist.co/cannabis/illinois", lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: "https://cleanlist.co/get-listed", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
      ];

  // Static IL guide pages
  const staticPages: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
        url: `https://cleanlist.co/cannabis/illinois/${p.path}`,
        lastModified: new Date(),
        changeFrequency: p.freq,
        priority: p.pri,
  }));

  // Individual listing pages
  const listingUrls: MetadataRoute.Sitemap = listings
      .filter((l: { slug: string }) => l.slug && !NOINDEX_SLUGS.includes(l.slug))
      .map((l: { slug: string; updated_at: string }) => ({
              url: `https://cleanlist.co/l/${l.slug}`,
              lastModified: l.updated_at ? new Date(l.updated_at) : new Date(),
              changeFrequency: "weekly" as const,
              priority: 0.8,
      }));

  // City hub pages
  const cityUrls: MetadataRoute.Sitemap = (cities as string[]).map((city) => ({
        url: `https://cleanlist.co/cannabis/illinois/${city.toLowerCase().replace(/\s+/g, "-")}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.85,
  }));

  // Intent pages — best, open-now, recreational, deals for every city
  const intentUrls: MetadataRoute.Sitemap = (cities as string[]).flatMap((city) =>
        INTENTS.map((intent) => ({
                url: `https://cleanlist.co/cannabis/illinois/${city.toLowerCase().replace(/\s+/g, "-")}/${intent}`,
                lastModified: new Date(),
                changeFrequency: intent === "open-now" ? ("hourly" as const) : ("daily" as const),
                priority: intent === "best" || intent === "open-now" ? 0.9 : 0.8,
        }))
                                                                           );

  // Chicago landmark pages
  const landmarkUrls: MetadataRoute.Sitemap = CHICAGO_LANDMARKS.map((lm) => ({
        url: `https://cleanlist.co/cannabis/illinois/chicago/${lm}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
  }));

  return [...base, ...staticPages, ...listingUrls, ...cityUrls, ...intentUrls, ...landmarkUrls];
}
