import Link from "next/link";
import MapClient from "./MapClient";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

export const revalidate = 600;

export const metadata = {
  title: "Illinois cannabis map — every dispensary + live deals | CleanList",
  description:
    "Every Illinois cannabis dispensary on one map. Green pins mark live deals. Click any pin to see the best deal today.",
};

type Listing = {
  slug: string;
  name: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Deal = {
  listing_slug: string;
  deal_title: string;
  category: string | null;
  discount_value: number | null;
  discount_unit: string | null;
};

async function getListings(): Promise<Listing[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?select=slug,name,city,latitude,longitude&project_tag=eq.green&state=eq.IL&latitude=not.is.null&limit=500`,
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
    .filter((l) => l.latitude && l.longitude)
    .map((l) => ({
      slug: l.slug,
      name: l.name || l.slug,
      city: l.city || "Illinois",
      lat: Number(l.latitude),
      lng: Number(l.longitude),
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
        <Link href="/" className="logo">clean<span>list</span></Link>
        <Link href="/" className="back">← Home</Link>
      </nav>

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
    </>
  );
}
