export const revalidate = 300; // revalidate every 5 minutes — hours change throughout the day

import { Metadata } from "next";
import Link from "next/link";
import { nowInCT, isOpen, formatTime as formatHourTime } from "../../../../lib/hours";
import { getServerLocation } from "../../../../lib/location";
import { isInMetro } from "../../../../lib/cityNormalize";

export const metadata: Metadata = {
  title: "Illinois Dispensaries Open Right Now | PuffPrice",
  description: "Find cannabis dispensaries open right now in Illinois. Real-time hours for every licensed dispensary. Updated continuously.",
  alternates: { canonical: "https://www.puffprice.com/cannabis/illinois/open-now" },
  openGraph: {
    title: "Illinois Dispensaries Open Right Now",
    description: "Find cannabis dispensaries open right now in Illinois. Real-time hours updated continuously.",
    url: "https://www.puffprice.com/cannabis/illinois/open-now",
    siteName: "PuffPrice",
    type: "website",
    images: [{ url: "https://www.puffprice.com/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Illinois Dispensaries Open Right Now",
    description: "Find cannabis dispensaries open right now in Illinois. Real-time hours updated continuously.",
    images: ["https://www.puffprice.com/og-image.png"],
  },
  robots: { index: true, follow: true },
};

type Listing = {
  id: string;
  name: string | null;
  slug: string | null;
  city: string | null;
  state: string | null;
  address1: string | null;
  phone: string | null;
  type: string | null;
  logo_url: string | null;
  delivery: boolean | null;
  online_ordering: boolean | null;
};

type Hour = {
  listing_id: string;
  weekday: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean | null;
};

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "https://hnbjufmtmrhexmdrfubw.supabase.co");
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300"));

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    cache: "no-store",
  });
  if (!res.ok) return [] as unknown as T;
  return res.json();
}

function isOpenNow(
  hours: Hour[],
  listingId: string,
  ct: ReturnType<typeof nowInCT>
): { open: boolean; closes: string | null } {
  const row = hours.find((h) => h.listing_id === listingId && h.weekday === ct.weekday);
  if (isOpen(row, ct)) return { open: true, closes: row!.closes_at };
  return { open: false, closes: null };
}

const formatTime = formatHourTime;

export default async function OpenNowPage() {
  const ct = nowInCT();
  const cookieLoc = await getServerLocation();
  const userCity = cookieLoc?.city ?? null;
  const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" });

  const [listings, hours] = await Promise.all([
    fetchJson<Listing[]>(
      `/master_listings?state=eq.IL&is_active=eq.true&select=id,name,slug,city,state,address1,phone,type,logo_url,delivery,online_ordering&order=city.asc,name.asc&limit=100`
    ),
    fetchJson<Hour[]>(
      `/listing_hours?weekday=eq.${ct.weekday}&select=listing_id,weekday,opens_at,closes_at,is_closed`
    ),
  ]);

  // Filter to real dispensaries only
  const dispensaries = listings.filter(l =>
    l.slug && !["emerald-city-dispensary-chicago-il","emerald-leaf-collective-chicago-il","lakefront-cannabis-co-chicago-il"].includes(l.slug)
  );

  const withStatus = dispensaries.map(l => ({
    ...l,
    ...isOpenNow(hours, l.id, ct),
  }));

  const openNow = withStatus.filter(l => l.open);
  const closedNow = withStatus.filter(l => !l.open);

  // Group open ones by city
  const byCity = openNow.reduce<Record<string, typeof openNow>>((acc, l) => {
    const city = l.city ?? "Other";
    if (!acc[city]) acc[city] = [];
    acc[city].push(l);
    return acc;
  }, {});

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .on-root { min-height: 100vh; background: #f7f6f2; font-family: Georgia, serif; }
        .on-nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; background: #fff; border-bottom: 1px solid #e8e5de; position: sticky; top: 0; z-index: 50; }
        .on-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .on-nav-dot { width: 10px; height: 10px; border-radius: 50%; background: #16a34a; display: inline-block; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .on-nav-name { font-size: 1.1rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.02em; }
        .on-nav-accent { color: #16a34a; }
        .on-nav-back { font-size: 0.85rem; color: #6b7280; text-decoration: none; font-family: system-ui, sans-serif; }
        .on-breadcrumb { padding: 12px 32px; background: #fff; border-bottom: 1px solid #f0ede6; font-size: 0.8rem; font-family: system-ui, sans-serif; color: #6b7280; display: flex; gap: 8px; }
        .on-breadcrumb a { color: #6b7280; text-decoration: none; }
        .on-inner { max-width: 900px; margin: 0 auto; padding: 32px 24px 64px; }
        .on-hero { margin-bottom: 32px; }
        .on-live-badge { display: inline-flex; align-items: center; gap: 6px; background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 100px; padding: 4px 14px; font-size: 0.75rem; font-family: system-ui, sans-serif; color: #14532d; font-weight: 700; margin-bottom: 12px; }
        .on-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #16a34a; animation: pulse 2s infinite; }
        .on-h1 { font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 700; color: #0f1f3d; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 10px; }
        .on-sub { font-size: 0.95rem; color: #6b7280; font-family: system-ui, sans-serif; }
        .on-stats { display: flex; gap: 20px; flex-wrap: wrap; margin: 24px 0; }
        .on-stat { display: flex; flex-direction: column; gap: 2px; }
        .on-stat-num { font-size: 2rem; font-weight: 700; color: #16a34a; letter-spacing: -0.03em; }
        .on-stat-num-closed { color: #9ca3af; }
        .on-stat-label { font-size: 0.75rem; color: #6b7280; font-family: system-ui, sans-serif; }
        .on-section-title { font-size: 0.7rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3af; margin-bottom: 12px; margin-top: 32px; }
        .on-city-title { font-size: 1rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.01em; margin-bottom: 10px; margin-top: 24px; padding-bottom: 8px; border-bottom: 1px solid #e8e5de; }
        .on-card { background: #fff; border-radius: 12px; border: 1px solid #e8e5de; padding: 16px 20px; display: flex; gap: 14px; align-items: center; text-decoration: none; margin-bottom: 10px; }
        .on-card:hover { border-color: #16a34a; }
        .on-card-closed { opacity: 0.5; }
        .on-logo { width: 44px; height: 44px; border-radius: 8px; border: 1px solid #e8e5de; background: #f7f6f2; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; font-size: 1.2rem; font-weight: 700; color: #16a34a; font-family: Georgia, serif; }
        .on-logo-img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
        .on-info { flex: 1; min-width: 0; }
        .on-name { font-size: 0.95rem; font-weight: 700; color: #0f1f3d; font-family: system-ui, sans-serif; margin-bottom: 2px; }
        .on-address { font-size: 0.8rem; color: #6b7280; font-family: system-ui, sans-serif; }
        .on-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
        .on-open-badge { font-size: 0.72rem; font-family: system-ui, sans-serif; font-weight: 700; color: #14532d; background: #dcfce7; padding: 3px 10px; border-radius: 100px; }
        .on-closes { font-size: 0.72rem; color: #6b7280; font-family: system-ui, sans-serif; }
        .on-tags { display: flex; gap: 6px; margin-top: 4px; }
        .on-tag { font-size: 0.68rem; font-family: system-ui, sans-serif; color: #374151; background: #f7f6f2; border: 1px solid #e8e5de; padding: 2px 8px; border-radius: 100px; }
        .on-cta { background: #0f1f3d; border-radius: 14px; padding: 24px; margin-top: 40px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .on-cta-text { font-size: 0.95rem; font-weight: 700; color: #fff; }
        .on-cta-sub { font-size: 0.8rem; color: #94a3b8; font-family: system-ui, sans-serif; margin-top: 4px; }
        .on-cta-btn { background: #16a34a; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-family: system-ui, sans-serif; font-weight: 700; font-size: 0.85rem; white-space: nowrap; }
        .on-footer { background: #0f1f3d; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .on-footer-brand { font-size: 1rem; font-weight: 700; color: #fff; font-family: Georgia, serif; }
        .on-footer-note { font-size: 0.78rem; color: #475569; font-family: system-ui, sans-serif; }
        @media (max-width: 768px) {
          .on-nav { padding: 14px 20px; }
          .on-breadcrumb { padding: 10px 20px; }
          .on-inner { padding: 20px 16px 48px; }
          .on-cta { flex-direction: column; }
        }
      `}</style>

      <div className="on-root">
        <nav className="on-nav">
          <Link href="/" className="on-nav-brand">
            <span className="on-nav-dot" />
            <span className="on-nav-name">puff<span className="on-nav-accent">price</span></span>
          </Link>
          <Link href="/cannabis/illinois" className="on-nav-back">← Illinois</Link>
        </nav>

        <div className="on-breadcrumb">
          <Link href="/">Home</Link>
          <span>›</span>
          <Link href="/cannabis">Cannabis</Link>
          <span>›</span>
          <Link href="/cannabis/illinois">Illinois</Link>
          <span>›</span>
          <span style={{ color: "#374151" }}>Open now</span>
        </div>

        <div className="on-inner">
          <div className="on-hero">
            <span className="on-live-badge">
              <span className="on-live-dot" />
              Live · Updated {timeStr} CT
            </span>
            <h1 className="on-h1">Illinois Dispensaries<br />Open Right Now</h1>
            <p className="on-sub">Real hours, updated daily. Showing what&apos;s open at {timeStr} Central Time.</p>
            <div className="on-stats">
              <div className="on-stat">
                <span className="on-stat-num">{openNow.length}</span>
                <span className="on-stat-label">open right now</span>
              </div>
              <div className="on-stat">
                <span className="on-stat-num on-stat-num-closed">{closedNow.length}</span>
                <span className="on-stat-label">currently closed</span>
              </div>
            </div>
          </div>

          {openNow.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e8e5de", padding: "32px", textAlign: "center" }}>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "#0f1f3d", marginBottom: "8px" }}>No dispensaries open right now</p>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", fontFamily: "system-ui, sans-serif" }}>Check back during business hours — most Illinois dispensaries open between 9–10 AM CT.</p>
            </div>
          ) : (
            <>
              <p className="on-section-title">Open dispensaries by city</p>
              {Object.entries(byCity).sort(([a, listA], [b, listB]) => {
                // Bring the user's metro to the top when we know their city.
                if (userCity) {
                  const aIn = isInMetro(listA[0]?.city, listA[0]?.slug, userCity);
                  const bIn = isInMetro(listB[0]?.city, listB[0]?.slug, userCity);
                  if (aIn !== bIn) return aIn ? -1 : 1;
                }
                return a.localeCompare(b);
              }).map(([city, dispensaries]) => (
                <div key={city}>
                  <p className="on-city-title">{city} <span style={{ fontWeight: 400, color: "#6b7280", fontSize: "0.85rem" }}>({dispensaries.length} open)</span></p>
                  {dispensaries.map(l => {
                    const initial = (l.name ?? "?").charAt(0).toUpperCase();
                    return (
                      <Link key={l.id} href={`/l/${l.slug}`} className="on-card">
                        <div className="on-logo">
                          {l.logo_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={l.logo_url} alt={l.name + " logo"} className="on-logo-img" width={48} height={48} loading="lazy" decoding="async" />
                          ) : initial}
                        </div>
                        <div className="on-info">
                          <p className="on-name">{l.name}</p>
                          {l.address1 && <p className="on-address">{l.address1}</p>}
                          <div className="on-tags">
                            {l.delivery && <span className="on-tag">🚗 Delivery</span>}
                            {l.online_ordering && <span className="on-tag">📱 Online ordering</span>}
                          </div>
                        </div>
                        <div className="on-right">
                          <span className="on-open-badge">● Open</span>
                          {l.closes && <span className="on-closes">Closes {formatTime(l.closes)}</span>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </>
          )}

          <div className="on-cta">
            <div>
              <p className="on-cta-text">Own a dispensary in Illinois?</p>
              <p className="on-cta-sub">Claim your listing free — update your hours and appear here automatically.</p>
            </div>
            <Link href="/get-listed" className="on-cta-btn">Claim your listing →</Link>
          </div>
        </div>

        <footer className="on-footer">
          <span className="on-footer-brand">puff<span style={{ color: "#16a34a" }}>price</span></span>
          <span className="on-footer-note">© {new Date().getFullYear()} PuffPrice · Hours sourced from verified dispensary listings</span>
        </footer>
      </div>
    </>
  );
}
