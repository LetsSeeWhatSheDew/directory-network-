import Link from "next/link";
import Logo from "../components/Logo";
import MapClient from "./MapClient";
import { cityFromSlug } from "@/lib/cityNormalize";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

export const revalidate = 600;

export const metadata = {
  title: "Illinois cannabis map — every dispensary + live deals | PuffPrice",
  description:
    "Every Illinois cannabis dispensary on one map. Green pins mark live deals. Click any pin to see the best deal today.",
};

type Listing = {
  slug: string;
  name: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
};

type Deal = {
  listing_slug: string;
  deal_title: string;
  category: string | null;
  discount_value: number | null;
  discount_unit: string | null;
};

async function getListings(): Promise<Listing[]> {
  // Column names are lat/lng, NOT latitude/longitude — wrong column names
  // were 400ing the PostgREST query and emptying the map silently.
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?select=slug,name,city,lat,lng&project_tag=eq.green&state=eq.IL&is_active=eq.true&lat=not.is.null&limit=500`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        next: { revalidate: 600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function getDeals(): Promise<Deal[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/deals?select=listing_slug,title,category,discount_value,discount_unit&is_active=eq.true&project_tag=eq.green&limit=500`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        next: { revalidate: 600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((d: any) => ({
      listing_slug: d.listing_slug,
      deal_title: d.title,
      category: d.category,
      discount_value: d.discount_value,
      discount_unit: d.discount_unit,
    }));
  } catch {
    return [];
  }
}

export default async function MapPage() {
  const [listings, deals] = await Promise.all([getListings(), getDeals()]);
  // Pick best deal per slug (highest discount_value)
  const bestDeal: Record<string, Deal> = {};
  for (const d of deals) {
    const cur = bestDeal[d.listing_slug];
    if (!cur || (d.discount_value ?? 0) > (cur.discount_value ?? 0)) {
      bestDeal[d.listing_slug] = d;
    }
  }

  const points = listings
    .filter((l) => l.lat && l.lng)
    .map((l) => ({
      slug: l.slug,
      name: l.name || l.slug,
      city: l.city || cityFromSlug(l.slug) || "",
      lat: Number(l.lat),
      lng: Number(l.lng),
      deal: bestDeal[l.slug] || null,
    }));

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;font-family:Georgia,serif;background:#f5f4f0}
        .top-stripe{height:4px;background:#16a34a;width:100%}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#fff;border-bottom:1px solid #e8e4da}
        .logo{color:#0f1f3d;text-decoration:none;font-weight:700;letter-spacing:-.02em}
        .logo span{color:#16a34a}
        .back{font-size:.82rem;color:#6b7280;text-decoration:none;font-family:system-ui,sans-serif}
        .back:hover{color:#0f1f3d}
        .map-shell{position:relative;width:100%;height:calc(100vh - 60px);min-height:520px;background:#e8e4da}
        .map-loading{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#e8e4da;font-family:system-ui,sans-serif;color:#6b7280;z-index:1;pointer-events:none}
        .map-loading-spinner{width:36px;height:36px;border:3px solid #d1cfc6;border-top-color:#16a34a;border-radius:50%;animation:mapspin 1s linear infinite}
        @keyframes mapspin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="top-stripe" aria-hidden="true" />
      <nav className="nav">
        <Link href="/" className="logo" aria-label="PuffPrice home"><Logo /></Link>
        <Link href="/" className="back">← Home</Link>
      </nav>

      {/* When we have fewer than 3 geocoded dispensaries there's nothing
          a map adds over the list view — most dispensaries have null
          lat/lng until the Google Places backfill runs. Show a prominent
          link to /dispensaries rather than an empty map. */}
      {points.length < 3 ? (
        <div
          style={{
            padding: "64px 28px",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
            background: "#fff",
            borderTop: "1px solid #e8e4da",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              color: "#0f1f3d",
              fontFamily: "Georgia, serif",
              marginBottom: 10,
              letterSpacing: "-0.02em",
            }}
          >
            Map view coming soon
          </h2>
          <p style={{ color: "#6b7280", marginBottom: 22, maxWidth: 480, margin: "0 auto 22px", lineHeight: 1.5 }}>
            We&apos;re adding map pins for every Illinois dispensary. Browse the full list below while we finish geocoding.
          </p>
          <Link
            href="/dispensaries"
            style={{
              display: "inline-block",
              background: "#16a34a",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: ".95rem",
            }}
          >
            Browse all Illinois dispensaries →
          </Link>
        </div>
      ) : (
        <div className="map-shell">
          {/* Baseline loader rendered at the page level so the user sees
              feedback even if Leaflet fails to download. MapClient paints
              on top of this as soon as tiles arrive. */}
          <div className="map-loading">
            <div className="map-loading-spinner" />
            <div>Loading Illinois map…</div>
          </div>
          <MapClient points={points} />
        </div>
      )}
    </>
  );
}
