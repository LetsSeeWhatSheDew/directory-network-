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
        html,body{height:100%;font-family:Georgia,serif;background:#0f1f3d}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#0f1f3d;border-bottom:1px solid rgba(255,255,255,.06)}
        .logo{color:#fff;text-decoration:none;font-weight:700;letter-spacing:-.02em}
        .logo span{color:#4ade80}
        .back{font-size:.82rem;color:rgba(255,255,255,.55);text-decoration:none;font-family:system-ui,sans-serif}
        .back:hover{color:#fff}
        .map-shell{position:relative;width:100%;height:calc(100vh - 56px);min-height:520px;background:#0b172f}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo">clean<span>list</span></Link>
        <Link href="/" className="back">← Home</Link>
      </nav>

      <div className="map-shell">
        <MapClient points={points} />
      </div>
    </>
  );
}
