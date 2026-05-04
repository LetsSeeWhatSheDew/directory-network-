// app/dispensaries/page.tsx
// Top-level dispensary directory landing — full Central IL list grouped by city.
// Distinct from /city/[city] (which is the per-city deal-and-listing landing).
// This page is for users who land via /dispensaries directly.

import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

export const metadata = {
  title: "All Central Illinois Dispensaries | PuffPrice",
  description: "Browse every licensed Central Illinois cannabis dispensary by city. Hours, ratings, and active deals from Peoria, Bloomington-Normal, Champaign-Urbana, and Springfield.",
  alternates: { canonical: "https://www.puffprice.com/dispensaries" },
  openGraph: {
    title: "All Central Illinois Dispensaries",
    description: "Browse every licensed Central Illinois cannabis dispensary by city.",
    url: "https://www.puffprice.com/dispensaries",
    siteName: "PuffPrice",
    type: "website" as const,
    images: [{ url: "https://www.puffprice.com/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "All Central Illinois Dispensaries",
    description: "Browse every licensed Central Illinois cannabis dispensary by city.",
    images: ["https://www.puffprice.com/og-image.png"],
  },
};

// Central IL public-cities allow-list — keeps this page aligned with the
// sitemap and the homepage deal feed. Drops the 3 dispensary-less cities
// (Bartonville, Morton, Washington) from the publicly-indexed directory
// since they have no listings to render and 404 publicly anyway.
const CIL_CITY_IN_LIST = `("Peoria","East Peoria","Peoria Heights","Pekin","Bloomington","Normal","Champaign","Urbana","Springfield")`;

export const dynamic = "force-dynamic";

type Listing = {
  slug: string;
  name: string | null;
  city: string | null;
  state: string | null;
  google_rating: number | null;
  accepts_credit: boolean | null;
  drive_thru: boolean | null;
  delivery: boolean | null;
  plan: string | null;
};

type DealRow = { listing_slug: string };

async function getListings(): Promise<Listing[]> {
  // Missing project_tag=eq.green filter was the "0 dispensaries" bug —
  // without it, RLS policies on master_listings returned an empty set.
  // select=* so a missing optional column (google_rating, accepts_credit,
  // drive_thru, delivery — any of which may not exist on master_listings)
  // doesn't 400 the whole query and silently leave the page empty.
  // Filter narrowed to slug NOT NULL so /l/null cards never render.
  const url = `${SUPABASE_URL}/rest/v1/master_listings?select=*&state=eq.IL&project_tag=eq.green&is_active=eq.true&slug=not.is.null&city=in.${encodeURIComponent(CIL_CITY_IN_LIST)}&order=city.asc&limit=500`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("[dispensaries] master_listings fetch failed:", res.status, await res.text().catch(() => ""));
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function getActiveDealSlugs(): Promise<Map<string, number>> {
  const url = `${SUPABASE_URL}/rest/v1/deals?select=listing_slug&is_active=eq.true&project_tag=eq.green&limit=1000`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) return new Map();
  const data = (await res.json()) as DealRow[];
  const counts = new Map<string, number>();
  for (const d of data || []) {
    if (!d.listing_slug) continue;
    counts.set(d.listing_slug, (counts.get(d.listing_slug) ?? 0) + 1);
  }
  return counts;
}

function humanize(slug: string) {
  return slug.split("-").filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default async function DispensariesIndexPage() {
  const [listings, dealCounts] = await Promise.all([getListings(), getActiveDealSlugs()]);

  // Group by city
  const byCity = new Map<string, Listing[]>();
  for (const l of listings) {
    const c = l.city || "Other";
    if (!byCity.has(c)) byCity.set(c, []);
    byCity.get(c)!.push(l);
  }
  const cities = Array.from(byCity.keys()).sort();

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#f5f4f0", minHeight: "100vh", color: "#0f1f3d" }}>
      <div className="pp-surface-deep pp-leaf pp-leaf-04">
        <Nav variant="deep" />
        <header style={{ color: "var(--color-cream, #F7F4ED)", padding: "clamp(2.5rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem) clamp(2rem, 4vw, 4rem)", textAlign: "center", position: "relative", zIndex: 2 }}>
          <p className="pp-eyebrow" style={{ color: "var(--color-sage-vibrant, #93CB5C)", marginBottom: 10 }}>
            Central Illinois directory
          </p>
          <h1 style={{ fontFamily: "Manrope, system-ui, sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.25rem)", letterSpacing: "-0.035em", lineHeight: 1.1, color: "var(--color-cream, #F7F4ED)", marginBottom: 12 }}>
            Every licensed Central Illinois dispensary
          </h1>
          <p style={{ color: "rgba(247, 244, 237, 0.72)", fontFamily: "Manrope, system-ui, sans-serif", fontWeight: 500, maxWidth: 580, margin: "0 auto", lineHeight: 1.6 }}>
            {listings.length} dispensaries across {cities.length} cities. Click a city to see deals
            and hours, or jump to a specific store.
          </p>
        </header>
      </div>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "44px 28px" }}>
        {cities.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280", fontFamily: "system-ui, sans-serif" }}>
            No listings loaded yet. Try refreshing.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {cities.map((city) => {
              const slug = city.toLowerCase().replace(/\s+/g, "-");
              const items = byCity.get(city)!;
              return (
                <div key={city}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid #e8e4da", paddingBottom: 8, marginBottom: 14 }}>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                      {city}
                    </h2>
                    <Link href={`/city/${slug}`} style={{ fontSize: ".8rem", color: "#16a34a", textDecoration: "none", fontFamily: "system-ui, sans-serif", fontWeight: 600 }}>
                      Deals in {city} →
                    </Link>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                    {items.map((l) => {
                      const rawName = l.name || "";
                      const display =
                        !rawName || rawName === l.slug || /^[a-z0-9-]+$/.test(rawName)
                          ? humanize(l.slug)
                          : rawName;
                      const count = dealCounts.get(l.slug) ?? 0;
                      const attrs: string[] = [];
                      if (l.accepts_credit) attrs.push("Cards OK");
                      if (l.drive_thru) attrs.push("Drive-thru");
                      if (l.delivery) attrs.push("Delivery");
                      return (
                        <Link
                          key={l.slug}
                          href={`/l/${l.slug}`}
                          style={{
                            background: "#fff",
                            border: l.plan === "featured" ? "2px solid #16a34a" : "1px solid #e8e4da",
                            borderRadius: 10,
                            padding: 14,
                            textDecoration: "none",
                            color: "#0f1f3d",
                            display: "block",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ fontSize: ".95rem", fontWeight: 700 }}>{display}</div>
                            {l.plan === "featured" && (
                              <span style={{ fontSize: ".62rem", background: "#16a34a", color: "#fff", padding: "2px 7px", borderRadius: 100, fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
                                Featured
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: 6, fontSize: ".78rem", color: "#6b7280", fontFamily: "system-ui, sans-serif" }}>
                            {l.google_rating ? `${l.google_rating.toFixed(1)} ★` : "No rating yet"}
                            {attrs.length > 0 ? ` · ${attrs.join(" · ")}` : ""}
                          </div>
                          {count > 0 && (
                            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".7rem", fontFamily: "system-ui, sans-serif", fontWeight: 700, color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "3px 9px", borderRadius: 100 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
                              {count} active deal{count === 1 ? "" : "s"}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
