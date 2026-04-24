// app/city/[city]/page.tsx
// Canonical indexable landing page for an Illinois city. Google-forward.
// Distinct from /deals/[category]?city=X (the interactive engine) and
// /cannabis/illinois/[city] (the legacy content hub). Links between
// all three via internal linking.

import Link from "next/link";
import Logo from "../../components/Logo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { brand } from "../../../lib/brand";
import { metroCities, isInMetro } from "../../../lib/cityNormalize";
import { isInCentralIL } from "../../../lib/visibility";
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
    const inCity = all.filter((d: any) =>
      isInMetro(d.city, d.slug || d.listing_slug, city)
    );
    return filterExpired(inCity).slice(0, 25);
  } catch {
    return [];
  }
}

async function getCityListings(city: string): Promise<Listing[]> {
  const metros = metroCities(city);
  if (metros.length === 0) return [];
  // PostgREST `in.` filter for the metro cities, case-insensitive.
  const cityFilter = metros
    .map((c) => `"${c.replace(/"/g, "")}"`)
    .join(",");
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?select=id,slug,name,city,address1&city=in.(${encodeURIComponent(cityFilter)})&is_active=eq.true&limit=50`,
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

  const [deals, listings] = await Promise.all([
    getCityDeals(city),
    getCityListings(city),
  ]);

  const dispensaryCount = new Set(
    deals.map((d) => d.listing_slug).filter(Boolean)
  ).size;
  const intro = CITY_INTROS[raw.toLowerCase()] || null;
  const metros = metroCities(city);
  const neighborCities = metros.filter((c) => c.toLowerCase() !== city.toLowerCase());

  // Answer-format line at the top — the Zone 4 Phase 1 signal
  const answerText =
    deals.length > 0
      ? `${deals.length} active deal${deals.length !== 1 ? "s" : ""} at ${dispensaryCount} dispensar${dispensaryCount !== 1 ? "ies" : "y"} in ${city}, IL right now.`
      : `No active deals in ${city}, IL right now — check back soon.`;

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .top-stripe{height:4px;background:#16a34a}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#fff;position:sticky;top:0;z-index:100;border-bottom:1px solid #e8e4da}
        .logo{display:flex;align-items:center;gap:8px;text-decoration:none}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:#16a34a;animation:pulse 2.5s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .logo-text{font-size:1.1rem;font-weight:700;color:#0f1f3d}
        .logo-text span{color:#16a34a}
        .back{font-size:.82rem;color:#6b7280;text-decoration:none;font-family:system-ui,sans-serif}

        .wrap{max-width:900px;margin:0 auto;padding:40px 20px 64px}
        .answer{font-size:1rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:18px;line-height:1.5}
        .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:8px}
        h1{font-size:clamp(1.8rem,4vw,2.4rem);font-weight:700;letter-spacing:-.03em;line-height:1.1;margin-bottom:14px}
        .intro{font-size:.95rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.65;margin-bottom:28px;max-width:680px}

        .section-h{font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#9ca3af;font-family:system-ui,sans-serif;margin:28px 0 12px}

        .deal-row{background:#fff;border:1px solid #e8e4da;border-left:4px solid #16a34a;border-radius:12px;padding:14px 18px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:14px;text-decoration:none;color:inherit;transition:border-color .15s}
        .deal-row:hover{border-left-color:#15803d}
        .deal-body{flex:1;min-width:0}
        .deal-name{font-size:.94rem;font-weight:700;color:#0f1f3d;margin-bottom:2px}
        .deal-title{font-size:.82rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.4}
        .deal-right{text-align:right;flex-shrink:0}
        .deal-save-label{font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;font-family:system-ui,sans-serif;font-weight:700}
        .deal-save-amt{font-size:1.4rem;color:#16a34a;font-weight:700;letter-spacing:-.03em;font-family:Georgia,serif;line-height:1}

        .dlist{background:#fff;border:1px solid #e8e4da;border-radius:12px;overflow:hidden}
        .dlist-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #f5f4f0;text-decoration:none;color:inherit}
        .dlist-row:last-child{border-bottom:none}
        .dlist-row:hover{background:#f0fdf4}
        .dlist-name{font-weight:700;color:#0f1f3d;font-size:.92rem}
        .dlist-addr{font-size:.76rem;color:#6b7280;font-family:system-ui,sans-serif;margin-top:2px}
        .dlist-count{font-size:.72rem;color:#16a34a;font-weight:700;font-family:system-ui,sans-serif}

        .neighbors{margin-top:28px;padding:14px 18px;background:#fff;border:1px solid #e8e4da;border-radius:10px;font-family:system-ui,sans-serif;font-size:.85rem;color:#6b7280}
        .neighbors a{color:#16a34a;font-weight:600;text-decoration:none}
        .neighbors a:hover{text-decoration:underline}

        .footer-link{display:block;text-align:center;margin-top:28px;padding:14px;color:#16a34a;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700}
        .footer-link:hover{text-decoration:underline}

        @media(max-width:600px){.wrap{padding:24px 14px}.deal-save-amt{font-size:1.2rem}}
      `}</style>

      <div className="top-stripe" aria-hidden="true" />
      <nav className="nav">
        <Link href="/" className="logo" aria-label="PuffPrice home">
          <Logo />
        </Link>
        <Link href="/deals/all" className="back">← All Illinois deals</Link>
      </nav>

      <main className="wrap">
        <p className="answer">{answerText}</p>
        <div className="eyebrow">Illinois · City page</div>
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
                <Link key={d.id} href={`/l/${slug}?city=${encodeURIComponent(city)}`} className="deal-row">
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
              {listings.length} dispensar{listings.length === 1 ? "y" : "ies"} in {city}
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
              <span key={c}>
                {i > 0 && " · "}
                <Link href={`/city/${encodeURIComponent(c.toLowerCase())}`}>{c}</Link>
              </span>
            ))}
          </div>
        )}

        <Link href="/deals/all" className="footer-link">
          Browse all Illinois cities →
        </Link>
      </main>
    </>
  );
}
