// app/dispensaries/page.tsx
// Top-level dispensary directory landing — full IL list grouped by city.
// Distinct from /cannabis/illinois (which is more SEO-focused with intent
// pages). This page is for users who land via /dispensaries.

import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "All Illinois Dispensaries | CleanList",
  description: "Browse every licensed Illinois cannabis dispensary by city. Hours, ratings, and live deals updated daily.",
  alternates: { canonical: "https://cleanlist.co/dispensaries" },
};

type Listing = {
  slug: string;
  name: string;
  city: string;
  google_rating: number | null;
  review_count: number | null;
  plan: string | null;
};

export default async function DispensariesIndexPage() {
  const { data, error } = await supabase
    .from("master_listings")
    .select("slug, name, city, google_rating, review_count, plan")
    .eq("project_tag", "green")
    .eq("state", "Illinois")
    .order("city", { ascending: true })
    .order("google_rating", { ascending: false });

  if (error) console.error("[dispensaries] query error:", error);

  const listings = (data as Listing[] | null) || [];

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
      <nav style={{ padding: "14px 28px", background: "#0f1f3d", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "1.15rem" }}>
          clean<span style={{ color: "#4ade80" }}>list</span>
        </Link>
        <Link href="/deals/all" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: ".85rem", fontFamily: "system-ui, sans-serif" }}>
          See today&apos;s deals →
        </Link>
      </nav>

      <header style={{ background: "#0f1f3d", color: "#fff", padding: "48px 28px", textAlign: "center" }}>
        <p style={{ fontSize: ".7rem", letterSpacing: ".14em", textTransform: "uppercase", color: "#4ade80", fontFamily: "system-ui, sans-serif", fontWeight: 700, marginBottom: 8 }}>
          Illinois directory
        </p>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-0.03em", marginBottom: 10 }}>
          Every licensed Illinois dispensary
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontFamily: "system-ui, sans-serif", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
          {listings.length} dispensaries across {cities.length} cities. Click a city to see deals
          and hours, or jump to a specific store.
        </p>
      </header>

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
                    <Link href={`/cannabis/illinois/${slug}/deals`} style={{ fontSize: ".8rem", color: "#16a34a", textDecoration: "none", fontFamily: "system-ui, sans-serif", fontWeight: 600 }}>
                      Deals in {city} →
                    </Link>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                    {items.map((l) => (
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
                          <div style={{ fontSize: ".95rem", fontWeight: 700 }}>{l.name}</div>
                          {l.plan === "featured" && (
                            <span style={{ fontSize: ".62rem", background: "#16a34a", color: "#fff", padding: "2px 7px", borderRadius: 100, fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
                              Featured
                            </span>
                          )}
                        </div>
                        {l.google_rating ? (
                          <div style={{ marginTop: 6, fontSize: ".78rem", color: "#6b7280", fontFamily: "system-ui, sans-serif" }}>
                            {l.google_rating.toFixed(1)} ★ · {l.review_count?.toLocaleString() || 0} reviews
                          </div>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer style={{ background: "#0f1f3d", padding: "20px 28px", textAlign: "center" }}>
        <span style={{ color: "#fff", fontSize: ".9rem" }}>
          clean<span style={{ color: "#4ade80" }}>list</span>
        </span>
      </footer>
    </div>
  );
}
