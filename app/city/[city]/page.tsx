// app/city/[city]/page.tsx
// Canonical indexable landing page for an Illinois city. Google-forward.
// Distinct from /deals/[category]?city=X (the interactive engine) and
// /cannabis/illinois/[city] (the legacy content hub). Links between
// all three via internal linking.

import Link from "next/link";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { brand } from "../../../lib/brand";
import {
  isInCentralIL,
  EMPTY_CENTRAL_IL_CITIES,
} from "../../../lib/visibility";
import {
  CENTRAL_IL_PUBLIC_CITIES,
  isCentralILPublicCity,
} from "../../../lib/constants/regions";
import { estimateSavings } from "../../../lib/dealScoring";
import EndingSoonRow, { type EndingSoonDeal } from "../../components/EndingSoonRow";

export const revalidate = 300;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

// Unique intro copy for the top 6 cities. Placeholder until Cowork writes
// real copy. Kept short and factual — Google rewards specificity.
const CITY_INTROS: Record<string, string> = {
  chicago:
    "Chicago has the deepest dispensary market in Illinois. Over a dozen recreational dispensaries compete on price every day, which is why the best deals in the state usually live here. Check back daily — Chicago offers change fast.",
  peoria:
    "Peoria and its metro (East Peoria, Bartonville) host a handful of dispensaries serving Central Illinois. Drive times are short, so a 20%-off deal 10 minutes down I-74 is genuinely worth it.",
  rockford:
    "Rockford anchors the Rock River Valley cannabis market. Fewer dispensaries than Chicago, but consistent weekly deals — especially on flower and pre-rolls.",
  springfield:
    "Springfield dispensaries serve the Illinois capital region. Rec menus trend heavier on edibles and vapes; worth checking here if that's your lane.",
  aurora:
    "Aurora and the western Chicago suburbs have a growing dispensary footprint. Deals here tend to match or beat the city when you factor in the drive.",
  joliet:
    "Joliet dispensaries serve the I-80 corridor and south-suburban Chicago. Useful stop for anyone heading to or from Chicagoland.",
};

type Listing = {
  id: string;
  slug: string;
  name: string | null;
  city: string | null;
  address1: string | null;
};

type DealRow = {
  id: string;
  deal_title?: string | null;
  title?: string | null;
  deal_description?: string | null;
  description?: string | null;
  listing_slug: string;
  slug?: string;
  name?: string;
  city?: string;
  category?: string | null;
  discount_value?: number | null;
  discount_unit?: string | null;
  discount_type?: string | null;
  original_price?: number | null;
  sale_price?: number | null;
  expires_at?: string | null;
};

function toCityCase(raw: string) {
  return raw
    .replace(/-/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function filterExpired<T extends { expires_at?: string | null }>(list: T[]): T[] {
  const now = Date.now();
  return list.filter((d) => {
    if (!d?.expires_at) return true;
    const t = new Date(d.expires_at).getTime();
    return !Number.isFinite(t) || t > now;
  });
}

// Exact city match for both deals and listings. Previously this expanded
// via metroCities() which folded East Peoria + Bartonville into Peoria
// queries, producing "8 dispensaries in Peoria" when only 5 are in Peoria
// proper, and bleeding 6 deals onto Bartonville (which has zero licensed
// dispensaries). /city/peoria means Peoria, the city. Period.
async function getCityDeals(city: string): Promise<DealRow[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=*&order=discount_value.desc&limit=100`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 300, tags: ["deals"] },
      }
    );
    if (!res.ok) return [];
    const all = await res.json();
    if (!Array.isArray(all)) return [];
    const target = city.toLowerCase();
    const inCity = all.filter(
      (d: any) => typeof d?.city === "string" && d.city.toLowerCase() === target
    );
    return filterExpired(inCity).slice(0, 25);
  } catch {
    return [];
  }
}

async function getCityListings(city: string): Promise<Listing[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?select=id,slug,name,city,address1&city=eq.${encodeURIComponent(city)}&project_tag=eq.green&state=eq.IL&is_active=eq.true&limit=50`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 3600, tags: ["listings"] },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Slugify a city name into the canonical /city/[slug] path segment.
// Lowercase + replace whitespace runs with hyphens. Matches CENTRAL_IL_CITIES
// slug shape (e.g., "East Peoria" → "east-peoria"). encodeURIComponent
// would emit "east%20peoria" which 404s, since the route param doesn't
// decode back to "East Peoria" before the visibility check.
function citySlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: raw } = await params;
  // Central IL scope gate — mirror the page component.
  if (!isInCentralIL(raw)) {
    return { robots: { index: false, follow: false } };
  }
  // Public-cities allow-list — hidden CIL cities get noindex metadata so
  // any cached crawler entry de-indexes alongside the route returning 404.
  if (!isCentralILPublicCity(raw)) {
    return { robots: { index: false, follow: false } };
  }
  const city = toCityCase(raw);
  const deals = await getCityDeals(city);
  const dispensaryCount = new Set(deals.map((d) => d.listing_slug).filter(Boolean)).size;
  const title = `${city} Dispensary Deals Today | ${brand.name}`;
  const description =
    deals.length > 0
      ? `Browse ${deals.length} active dispensary deals at ${dispensaryCount} dispensar${dispensaryCount === 1 ? "y" : "ies"} in ${city}, IL.`
      : `Browse active dispensary deals in ${city}, IL.`;
  const url = `${brand.url}/city/${encodeURIComponent(raw.toLowerCase())}`;
  const ogImage = `${brand.url}/og-image.png`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: brand.name,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: raw } = await params;
  const city = toCityCase(raw);
  if (!city) notFound();
  // Central IL scope gate — non-CIL city landings are hidden publicly.
  if (!isInCentralIL(raw)) notFound();
  // Public-cities allow-list — the 3 CIL cities with zero dispensaries
  // (Bartonville, Morton, Washington) stay in CENTRAL_IL_CITIES for the
  // data scope but no longer render a public page. They 404 publicly.
  if (!isCentralILPublicCity(raw)) notFound();

  const [deals, listings] = await Promise.all([
    getCityDeals(city),
    getCityListings(city),
  ]);

  const dispensaryCount = new Set(
    deals.map((d) => d.listing_slug).filter(Boolean)
  ).size;
  const intro = CITY_INTROS[raw.toLowerCase()] || null;

  // Empty-CIL-cities (Bartonville, Morton, Washington) show explicit
  // "no licensed dispensary yet" copy plus a pointer at the nearest CIL
  // city with inventory. Cities with listings get the standard answer.
  const isEmpty = listings.length === 0;
  const emptyMeta = isEmpty
    ? EMPTY_CENTRAL_IL_CITIES[raw.toLowerCase()] ?? null
    : null;
  const answerText = isEmpty
    ? emptyMeta
      ? `No licensed dispensaries in ${city}, IL yet — nearest is about ${emptyMeta.nearestMiles} mi ${emptyMeta.direction} in ${emptyMeta.nearestCity}.`
      : `No licensed dispensaries in ${city}, IL yet.`
    : `${deals.length} active deal${deals.length !== 1 ? "s" : ""} at ${dispensaryCount} dispensar${dispensaryCount !== 1 ? "ies" : "y"} in ${city}, IL right now.`;

  // "Also near you" — explicit list of OTHER public Central IL cities, not
  // a metro expansion. Pulled from the public-cities allow-list so hidden
  // cities (Bartonville, Morton, Washington) never appear as a clickable
  // link anywhere on the site. Caps at 6 to keep the row scannable.
  const neighborCities = CENTRAL_IL_PUBLIC_CITIES.filter(
    (c) => c.slug !== citySlug(city)
  )
    .slice(0, 6)
    .map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#F7F4ED;color:#1F3D2B;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#fff;position:sticky;top:0;z-index:100;border-bottom:1px solid #e8e4da}
        .logo{display:flex;align-items:center;gap:8px;text-decoration:none}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:#7DBA47;animation:pulse 2.5s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .logo-text{font-size:1.1rem;font-weight:700;color:#1F3D2B}
        .logo-text span{color:#7DBA47}
        .back{font-size:.82rem;color:#6b7280;text-decoration:none;font-family:system-ui,sans-serif}

        .wrap{max-width:900px;margin:0 auto;padding:40px 20px 64px}
        .answer{font-size:1rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:18px;line-height:1.5}
        .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#7DBA47;font-family:system-ui,sans-serif;margin-bottom:8px}
        h1{font-size:clamp(1.8rem,4vw,2.4rem);font-weight:700;letter-spacing:-.03em;line-height:1.1;margin-bottom:14px}
        .intro{font-size:.95rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.65;margin-bottom:28px;max-width:680px}

        .section-h{font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#9ca3af;font-family:system-ui,sans-serif;margin:28px 0 12px}

        .deal-row{background:#fff;border:1px solid #e8e4da;border-left:4px solid #7DBA47;border-radius:12px;padding:14px 18px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:14px;text-decoration:none;color:inherit;transition:border-color .15s}
        .deal-row:hover{border-left-color:#6BA63B}
        .deal-body{flex:1;min-width:0}
        .deal-name{font-size:.94rem;font-weight:700;color:#1F3D2B;margin-bottom:2px}
        .deal-title{font-size:.82rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.4}
        .deal-right{text-align:right;flex-shrink:0}
        .deal-save-label{font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;font-family:system-ui,sans-serif;font-weight:700}
        .deal-save-amt{font-size:1.4rem;color:#7DBA47;font-weight:700;letter-spacing:-.03em;font-family:Georgia,serif;line-height:1}

        .dlist{background:#fff;border:1px solid #e8e4da;border-radius:12px;overflow:hidden}
        .dlist-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #F7F4ED;text-decoration:none;color:inherit}
        .dlist-row:last-child{border-bottom:none}
        .dlist-row:hover{background:#F2F8E9}
        .dlist-name{font-weight:700;color:#1F3D2B;font-size:.92rem}
        .dlist-addr{font-size:.76rem;color:#6b7280;font-family:system-ui,sans-serif;margin-top:2px}
        .dlist-count{font-size:.72rem;color:#7DBA47;font-weight:700;font-family:system-ui,sans-serif}

        .neighbors{margin-top:28px;padding:14px 18px;background:#fff;border:1px solid #e8e4da;border-radius:10px;font-family:system-ui,sans-serif;font-size:.85rem;color:#6b7280}
        .neighbors a{color:#7DBA47;font-weight:600;text-decoration:none}
        .neighbors a:hover{text-decoration:underline}

        .footer-link{display:block;text-align:center;margin-top:28px;padding:14px;color:#7DBA47;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700}
        .footer-link:hover{text-decoration:underline}

        @media(max-width:600px){.wrap{padding:24px 14px}.deal-save-amt{font-size:1.2rem}}
      `}</style>

      <Nav variant="light" />

      <main className="wrap">
        <p className="answer">{answerText}</p>
        <div className="eyebrow">Central Illinois · City page</div>
        <h1>{city} dispensary deals today</h1>
        {intro && <p className="intro">{intro}</p>}

        {/* Ending-soon urgency row, scoped to this city */}
        <EndingSoonRow
          deals={deals
            .filter((d) => {
              if (!d.expires_at) return false;
              const t = new Date(d.expires_at).getTime();
              const now = Date.now();
              return Number.isFinite(t) && t > now && t < now + 24 * 3600 * 1000;
            })
            .slice(0, 5)
            .map(
              (d): EndingSoonDeal => ({
                id: d.id,
                listing_slug: d.slug || d.listing_slug,
                dispensary_name: d.name || d.listing_slug || "Dispensary",
                city: d.city || city,
                title: d.deal_title || d.title || "Active deal",
                expires_at: d.expires_at!,
              })
            )}
        />

        {deals.length > 0 && (
          <>
            <div className="section-h">Active deals · best savings first</div>
            {deals.map((d) => {
              const slug = d.slug || d.listing_slug;
              const dollars = estimateSavings(d);
              const name = d.name || slug;
              const title = d.deal_title || d.title || "Active deal";
              return (
                <Link key={d.id} href={`/dispensary/${slug}?city=${encodeURIComponent(city)}`} className="deal-row">
                  <div className="deal-body">
                    <div className="deal-name">{name}</div>
                    <div className="deal-title">{title}</div>
                  </div>
                  <div className="deal-right">
                    {dollars != null ? (
                      <>
                        <div className="deal-save-label">You save</div>
                        <div className="deal-save-amt">${dollars}</div>
                      </>
                    ) : (
                      <div className="deal-save-amt" style={{ fontSize: "1rem" }}>Deal</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </>
        )}

        {listings.length > 0 && (
          <>
            <div className="section-h">
              {listings.length} dispensar{listings.length === 1 ? "y" : "ies"} in {city}, IL
            </div>
            <div className="dlist">
              {listings.map((l) => {
                const dealCount = deals.filter((d) => d.listing_slug === l.slug).length;
                return (
                  <Link key={l.id} href={`/dispensary/${l.slug}`} className="dlist-row">
                    <div>
                      <div className="dlist-name">{l.name || l.slug}</div>
                      {l.address1 && <div className="dlist-addr">{l.address1}</div>}
                    </div>
                    <span className="dlist-count">
                      {dealCount > 0 ? `${dealCount} deal${dealCount === 1 ? "" : "s"} →` : "View →"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {neighborCities.length > 0 && (
          <div className="neighbors">
            Also near you:{" "}
            {neighborCities.map((c, i) => (
              <span key={c.slug}>
                {i > 0 && " · "}
                <Link href={`/city/${c.slug}`}>{c.name}</Link>
              </span>
            ))}
          </div>
        )}

        <Link href="/deals/all" className="footer-link">
          Browse all Central IL cities →
        </Link>
      </main>

      <footer
        style={{
          background: "#1F3D2B",
          padding: "24px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span
          style={{
            color: "#fff",
            fontSize: "1rem",
            fontWeight: 700,
            fontFamily: "Georgia, serif",
          }}
        >
          puff<span style={{ color: "#7DBA47" }}>price</span>
        </span>
        <span
          style={{
            color: "#475569",
            fontSize: "0.78rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          © {new Date().getFullYear()} PuffPrice · Central Illinois
        </span>
      </footer>
    </>
  );
}
