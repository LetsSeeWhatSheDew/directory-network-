// app/city/[city]/page.tsx
// Canonical indexable landing page for an Illinois city. Google-forward.
// Distinct from /deals/[category]?city=X (the interactive engine) and
// /cannabis/illinois/[city] (the legacy content hub). Links between
// all three via internal linking.

import Link from "next/link";
import { isConditional, nearestExhale } from "@/lib/exhale";
import { Band, HeroTicket, StoreDeals, StoreCard, Faq } from "../../components/gold/Kit";
import WatchControl from "../../components/WatchControl";
import { cityTaxRates } from "@/lib/otd";
import { getFeatureRows, featuresBySlug } from "@/lib/waysToBuy";
import StoreAvatar from "@/app/components/StoreAvatar";
import { storeImageUrl } from "@/lib/storeImage";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { brand } from "../../../lib/brand";
import { isInCentralIL } from "../../../lib/visibility";
import { isCentralILPublicCity } from "../../../lib/constants/regions";
import PriceBoard from "../../components/PriceBoard";
import { getLivePriceBoard } from "../../../lib/priceBoard";
import ReportIssueLink from "../../components/ReportIssueLink";
import { capPerStore, overflowFor, STORE_CAP } from "../../../lib/storeCap";
import { getCityProfile, nearbyCities } from "../../../lib/cityProfiles";
import { getCityMonth, dayCountsReliable } from "../../../lib/dealHistory";
import {
  nowInCT,
  isOpen,
  computeOpenStatus,
  formatTime,
  type HoursRow,
} from "../../../lib/hours";

export const revalidate = 300;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";


type Listing = {
  id: string;
  slug: string;
  name: string | null;
  city: string | null;
  address1: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  short_description: string | null;
  online_ordering: boolean | null;
  loyalty_program: boolean | null;
  parking: boolean | null;
  drive_thru: boolean | null;
  delivery: boolean | null;
  wheelchair_accessible: boolean | null;
  logo_url?: string | null;
};

type ListingHoursRow = HoursRow & { listing_id: string; weekday: number };

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
async function getAllActiveDeals(): Promise<DealRow[]> {
  try {
    const res = await fetch(
      // Every active deal (not a top-N): a store adding 100 specials must not
      // push other cities' deals past a row limit. Explicit columns keep the
      // cached payload small. Per-store caps are applied at render.
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=deal_id,deal_title,deal_description,category,discount_type,discount_value,discount_unit,original_price,sale_price,is_recurring,expires_at,listing_slug,slug,name,city,verified_at,status_reason&order=discount_value.desc.nullslast&limit=2000`,
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
    // The view's key is deal_id; the list below keys on id.
    return filterExpired((all as Array<DealRow & { deal_id?: string }>).map((d) => ({ ...d, id: d.id || d.deal_id || "" })));
  } catch {
    return [];
  }
}

function dealsInCity(all: DealRow[], city: string): DealRow[] {
  const target = city.toLowerCase();
  return all
    .filter((d) => typeof d?.city === "string" && d.city.toLowerCase() === target);
}

/** The visible city list: at most STORE_CAP.cityList per store, 25 rows. */
function visibleCityDeals(deals: DealRow[]) {
  const { kept, totals } = capPerStore(deals, STORE_CAP.cityList);
  const shown = kept.slice(0, 25);
  return { shown, overflow: overflowFor(shown, totals) };
}

async function getCityDeals(city: string): Promise<DealRow[]> {
  return dealsInCity(await getAllActiveDeals(), city);
}

async function getHoursFor(ids: string[]): Promise<ListingHoursRow[]> {
  if (ids.length === 0) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/listing_hours?select=listing_id,weekday,opens_at,closes_at,is_closed&project_tag=eq.green&listing_id=in.(${ids.join(",")})`,
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

const WEEKDAY_SCHEMA = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function endingWithin24h(list: DealRow[]): DealRow[] {
  const now = Date.now();
  return list.filter((d) => {
    if (!d.expires_at) return false;
    const t = new Date(d.expires_at).getTime();
    return Number.isFinite(t) && t > now && t < now + 24 * 3600 * 1000;
  });
}

function amenityChips(l: Listing, f?: Partial<Record<string, { status: string }>>): string[] {
  const out: string[] = [];
  if (f?.medical?.status === "yes") out.push("Medical");
  if (f?.curbside?.status === "yes") out.push("Curbside");
  if (l.online_ordering) out.push("Order ahead");
  if (l.loyalty_program) out.push("Loyalty program");
  if (l.drive_thru) out.push("Drive-thru");
  if (l.delivery) out.push("Delivery");
  if (l.parking) out.push("Parking");
  if (l.wheelchair_accessible) out.push("Accessible");
  return out;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

async function getCityListings(city: string): Promise<Listing[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?select=id,slug,name,city,address1,phone,lat,lng,short_description,online_ordering,loyalty_program,parking,drive_thru,delivery,wheelchair_accessible,logo_url&city=eq.${encodeURIComponent(city)}&project_tag=eq.green&state=eq.IL&is_active=eq.true&limit=50`,
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
  const [deals, listings] = await Promise.all([getCityDeals(city), getCityListings(city)]);
  // Root layout title.template appends "| PuffPrice"; don't double it here.
  const title = `${city} Dispensary Deals Today`;
  const n = listings.length;
  const description =
    deals.length > 0
      ? `${deals.length} verified deal${deals.length === 1 ? "" : "s"} today across ${n} ${city}, IL dispensar${n === 1 ? "y" : "ies"} — plus hours, who's open now, and how to order ahead.`
      : `All ${n} licensed dispensar${n === 1 ? "y" : "ies"} in ${city}, IL — hours, who's open now, order-ahead options, and verified deals the moment they post.`;
  const url = `${brand.url}/city/${encodeURIComponent(raw.toLowerCase())}`;
  // Live link preview: the city's longest exhale today (app/og/city/[city]).
  const ogImage = `${brand.url}/og/city/${encodeURIComponent(raw.toLowerCase())}`;
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
  // Public-cities allow-list — cities with zero dispensaries 404 publicly.
  if (!isCentralILPublicCity(raw)) notFound();

  const slug = citySlug(city);
  const profile = getCityProfile(slug);

  const featureMap = featuresBySlug(await getFeatureRows());
  const [allDeals, listings, livePriceBoard] = await Promise.all([
    getAllActiveDeals(),
    getCityListings(city),
    // Real per-store board or null. Hidden until the menu-baseline pipeline
    // has comparable prices — no invented data on city pages either.
    getLivePriceBoard({ locationTag: `${city.toUpperCase()} AREA`, nearCity: citySlug(city) }).catch(() => null),
  ]);
  const deals = dealsInCity(allDeals, city);
  const { shown: shownDeals, overflow: dealOverflow } = visibleCityDeals(deals);
  const [hours, month] = await Promise.all([
    getHoursFor(listings.map((l) => l.id)),
    getCityMonth(city),
  ]);

  const ct = nowInCT();
  const asOf = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });

  // ── Per-store rollup: open status, today's hours, deal count ──────────
  const stores = listings
    .map((l) => {
      const rows = hours.filter((h) => h.listing_id === l.id);
      const today = rows.find((h) => h.weekday === ct.weekday) ?? null;
      const status = computeOpenStatus(rows, ct);
      const openNow = today ? isOpen(today, ct) : false;
      const todayLabel =
        today && !today.is_closed && today.opens_at && today.closes_at
          ? `${formatTime(today.opens_at)} – ${formatTime(today.closes_at)}`
          : today?.is_closed
          ? "Closed today"
          : null;
      const dealCount = deals.filter((d) => d.listing_slug === l.slug).length;
      return { l, rows, today, status, openNow, todayLabel, dealCount };
    })
    .sort(
      (a, b) =>
        Number(b.openNow) - Number(a.openNow) ||
        b.dealCount - a.dealCount ||
        (a.l.name || "").localeCompare(b.l.name || "")
    );

  const openCount = stores.filter((s) => s.openNow).length;
  const hasHours = stores.some((s) => s.rows.length > 0);

  // Latest close tonight — only from real hours rows.
  const lateNight = stores
    .filter((s) => s.today && !s.today.is_closed && s.today.closes_at)
    .sort((a, b) => {
      const m = (t: string) => {
        const [h, mm] = t.split(":").map(Number);
        const v = h * 60 + mm;
        return v < 5 * 60 ? v + 24 * 60 : v; // post-midnight closes count as late
      };
      return m(b.today!.closes_at!) - m(a.today!.closes_at!);
    })[0];

  const orderAhead = stores.filter((s) => s.l.online_ordering).map((s) => s.l.name || s.l.slug);

  // Nearby cities, with today's real deal counts.
  const nearby = nearbyCities(slug, 4).map((c) => ({
    ...c,
    deals: dealsInCity(allDeals, c.name).length,
  }));
  const nearbyWithDeals = nearby.filter((c) => c.deals > 0);

  const storeNames = stores.map((s) => s.l.name || s.l.slug);
  const pageUrl = `${brand.url}/city/${slug}`;

  // ── Structured data (real fields only) ────────────────────────────────
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: brand.name, item: brand.url },
        { "@type": "ListItem", position: 2, name: `${city}, IL`, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Dispensaries in ${city}, IL`,
      numberOfItems: stores.length,
      itemListElement: stores.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Store",
          name: s.l.name,
          url: `${brand.url}/dispensary/${s.l.slug}`,
          ...(s.l.phone ? { telephone: s.l.phone } : {}),
          ...(s.l.address1
            ? {
                address: {
                  "@type": "PostalAddress",
                  streetAddress: s.l.address1.split(",")[0],
                  addressLocality: city,
                  addressRegion: "IL",
                  addressCountry: "US",
                },
              }
            : {}),
          ...(s.l.lat != null && s.l.lng != null
            ? { geo: { "@type": "GeoCoordinates", latitude: s.l.lat, longitude: s.l.lng } }
            : {}),
          ...(s.rows.length
            ? {
                openingHoursSpecification: s.rows
                  .filter((r) => !r.is_closed && r.opens_at && r.closes_at)
                  .map((r) => ({
                    "@type": "OpeningHoursSpecification",
                    dayOfWeek: WEEKDAY_SCHEMA[r.weekday],
                    opens: r.opens_at!.slice(0, 5),
                    closes: r.closes_at!.slice(0, 5),
                  })),
              }
            : {}),
        },
      })),
    },
  ];

  const faqs: { q: string; a: string }[] = [];
  if (stores.length) {
    faqs.push({
      q: `How many dispensaries are in ${city}?`,
      a: `${stores.length} licensed adult-use dispensar${stores.length === 1 ? "y" : "ies"}: ${joinNames(storeNames)}.`,
    });
  }
  if (lateNight?.today?.closes_at) {
    faqs.push({
      q: `Which ${city} dispensary is open latest tonight?`,
      a: `${lateNight.l.name} — open until ${formatTime(lateNight.today.closes_at)} today.`,
    });
  }
  if (orderAhead.length) {
    faqs.push({
      q: `Can I order ahead in ${city}?`,
      a: `Yes — ${joinNames(orderAhead)} ${orderAhead.length === 1 ? "offers" : "offer"} online ordering for in-store pickup.`,
    });
  }
  faqs.push({
    q: "Do I need to be 21?",
    a: "Yes. Adult-use cannabis in Illinois is 21+ with a valid government-issued photo ID.",
  });
  // FAQPage from the exact Q&A rendered in the "{city} questions" block
  // below — built from today's store data, so schema and page always match.
  (jsonLd as Record<string, unknown>[]).push({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });

  const heroPick = nearestExhale(deals.map((d) => ({ ...d, deal_id: d.id })), { city });
  const withDeals = new Set(deals.map((d) => d.listing_slug)).size;
  const pctDeals = deals
    .filter((d) => (d.discount_unit === "percent" || !d.discount_unit) && Number(d.discount_value) > 0 && Number(d.discount_value) <= 100 && !isConditional({ ...d, deal_title: d.deal_title || d.title }))
    .sort((a, b) => Number(b.discount_value) - Number(a.discount_value));
  const topPct = pctDeals[0];
  const nameOf = (d: DealRow) => String(stores.find((x) => x.l.slug === d.listing_slug)?.l.name || d.name || d.listing_slug || "").replace(/^nuera\b/i, "nuEra");
  const tax = cityTaxRates(city);
  const pctLabel = (n: number) => `${(n * 100).toFixed(1).replace(/\.0$/, "")}%`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Band
        eyebrow={<><Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Central Illinois</Link> / {city}</>}
        title={city}
        italic="deals today"
      >
        <div className="g-stats">
          <span className="g-stat"><b>{deals.length}</b> deal{deals.length === 1 ? "" : "s"}</span>
          <span className="g-stat"><b>{stores.length}</b> store{stores.length === 1 ? "" : "s"}</span>
          {hasHours && <span className="g-stat"><b>{openCount}</b> open now</span>}
        </div>
        {heroPick && <HeroTicket deal={heroPick.deal} miles={null} scope="near" label={`Best deal in ${city}`} />}
      </Band>

      <main className="g-page">
        <div className="g-wrap">
          <div className="g-block">
            {/* Quick answer: one quotable paragraph for people and AI assistants. Real data only. */}
            <p className="g-answer">
              <b>Quick answer ({asOf} CT):</b>{" "}
              {topPct
                ? <>the biggest everyday discount in {city} right now is <b>{topPct.deal_title || topPct.title}</b> at {nameOf(topPct)}. </>
                : deals.length > 0
                  ? <>{city} deals right now are bundles and set prices, not straight discounts. </>
                  : <>no {city} store has a deal posted on its own site right now. </>}
              {deals.length > 0 && <>{deals.length} {deals.length === 1 ? "deal is" : "deals are"} live {stores.length === 1 ? <>at {city}&apos;s one dispensary</> : <>at {withDeals} of {stores.length} {city} dispensaries</>}. </>}
              {lateNight?.today?.closes_at && <>{String(lateNight.l.name || "").replace(/^nuera\b/i, "nuEra")} closes latest tonight, at {formatTime(lateNight.today.closes_at)}.</>}
            </p>
            <p className="g-note">
              Checked daily on each dispensary&apos;s own site
              {month && dayCountsReliable() && (
                <>
                  {" "}· last 30 days: deals on {month.daysWithDeals} day{month.daysWithDeals === 1 ? "" : "s"}
                  {month.avgDiscountPct != null ? `, avg ${month.avgDiscountPct}% off` : ""}
                </>
              )}
              {" "}· Nobody pays to rank · <Link href="/how-we-rank">How we rank</Link>
            </p>
          </div>

          <div className="g-block">
            <div className="g-eyebrow">Every deal, by store</div>
            <h2 className="g-display">What&apos;s on in {city}</h2>
            {deals.length > 0 ? (
              <StoreDeals deals={deals.map((d) => ({ ...d, deal_id: d.id }))} cityParam={city} />
            ) : (
              <div className="g-answer">
                No {city} store has a deal on its own site today. We only list what we can confirm there.
                {nearbyWithDeals.length > 0 && (
                  <div className="g-near" style={{ marginTop: 12 }}>
                    {nearbyWithDeals.map((c) => (
                      <Link key={c.slug} href={`/city/${c.slug}`}>
                        {c.name} <small>{c.deals} deal{c.deals === 1 ? "" : "s"} · ~{c.miles} mi</small>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <WatchControl kind="city" city={city} />
            </div>
          </div>

          {(tax || (livePriceBoard && /· LIVE$/.test(livePriceBoard.locationTag || ""))) && (
            <div className="g-block">
              <div className="g-eyebrow">At the register</div>
              <h2 className="g-display">Prices &amp; tax</h2>
              {tax && (
                <p className="g-answer">
                  Tax in {city} adds <b>{pctLabel(tax.flower)}</b> on flower, <b>{pctLabel(tax.concentrate)}</b> on vapes and concentrates, and{" "}
                  <b>{pctLabel(tax.edible)}</b> on edibles. <Link className="g-link" href="/out-the-door">See deals with tax included</Link>
                </p>
              )}
              {livePriceBoard && /· LIVE$/.test(livePriceBoard.locationTag || "") && (
                <div style={{ marginTop: 14, maxWidth: 560 }}>
                  <PriceBoard {...livePriceBoard} />
                </div>
              )}
            </div>
          )}

          {stores.length > 0 && (
            <div className="g-block">
              <div className="g-eyebrow">{hasHours ? "Open ones first" : "Every store"}</div>
              <h2 className="g-display">
                {stores.length} dispensar{stores.length === 1 ? "y" : "ies"} in {city}
              </h2>
              <div className="g-stores">
                {stores.map(({ l, status, openNow, todayLabel, dealCount }) => {
                  const maps =
                    l.lat != null && l.lng != null
                      ? `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`
                      : l.address1
                      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(l.address1)}`
                      : null;
                  return (
                    <StoreCard
                      key={l.id}
                      slug={l.slug}
                      name={String(l.name || l.slug).replace(/^nuera\b/i, "nuEra")}
                      address={l.address1 ? l.address1.replace(/,\s*IL\s*\d{5}.*$/, "") : null}
                      status={status?.label || null}
                      open={openNow}
                      todayLabel={todayLabel}
                      dealCount={dealCount}
                      chips={amenityChips(l, featureMap.get(l.slug)).slice(0, 3)}
                      directions={maps}
                      phone={l.phone}
                      logo={<StoreAvatar src={storeImageUrl(l.logo_url, l.slug)} name={l.name || l.slug} size={44} />}
                    />
                  );
                })}
              </div>
              <p className="g-note">
                <Link href="/ways-to-buy#compare">Compare drive-thru, medical, order-ahead &amp; curbside for every store</Link>
              </p>
            </div>
          )}

          {nearby.length > 0 && (
            <div className="g-block">
              <div className="g-eyebrow">Short drive</div>
              <h2 className="g-display">Nearby towns</h2>
              <div className="g-near">
                {nearby.map((c) => (
                  <Link key={c.slug} href={`/city/${c.slug}`}>
                    {c.name} <small>~{c.miles} mi{c.deals > 0 ? ` · ${c.deals} deal${c.deals === 1 ? "" : "s"}` : ""}</small>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {faqs.length > 0 && (
            <div className="g-block">
              <Faq items={faqs} title={`${city} questions`} />
              <div className="g-near" style={{ marginTop: 16 }}>
                {[
                  ...(["Normal", "Bloomington", "Champaign", "Urbana"].includes(city)
                    ? [{ href: "/guides/where-to-buy-near-isu-and-uiuc", label: city === "Normal" || city === "Bloomington" ? "Near ISU (21+)" : "Near UIUC (21+)" }]
                    : []),
                  { href: "/guides/best-day-for-dispensary-deals", label: "Best day for deals" },
                  { href: "/guides/dispensary-first-time-discounts-central-illinois", label: "First-time & veteran discounts" },
                  { href: "/guides/can-you-use-a-credit-card-at-illinois-dispensaries", label: "Paying: cash or debit?" },
                  { href: "/guides", label: "All guides" },
                ].map((g) => (
                  <Link key={g.href} href={g.href}>{g.label}</Link>
                ))}
              </div>
            </div>
          )}

          <div className="g-block g-note" style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between" }}>
            <Link href="/deals">All Central IL deals</Link>
            <ReportIssueLink context={`${city} city page`} url={pageUrl} label="See something wrong? Tell us" />
          </div>
        </div>
      </main>
    </>
  );
}
