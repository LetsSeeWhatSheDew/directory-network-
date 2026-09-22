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
import { isInCentralIL } from "../../../lib/visibility";
import { isCentralILPublicCity } from "../../../lib/constants/regions";
import { estimateSavings } from "../../../lib/dealScoring";
import EndingSoonRow, { type EndingSoonDeal } from "../../components/EndingSoonRow";
import PriceBoard from "../../components/PriceBoard";
import { getLivePriceBoard } from "../../../lib/priceBoard";
import ReportIssueLink from "../../components/ReportIssueLink";
import { getCityProfile, nearbyCities } from "../../../lib/cityProfiles";
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
    return filterExpired(all as DealRow[]);
  } catch {
    return [];
  }
}

function dealsInCity(all: DealRow[], city: string): DealRow[] {
  const target = city.toLowerCase();
  return all
    .filter((d) => typeof d?.city === "string" && d.city.toLowerCase() === target)
    .slice(0, 25);
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

function amenityChips(l: Listing): string[] {
  const out: string[] = [];
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
      `${SUPABASE_URL}/rest/v1/master_listings?select=id,slug,name,city,address1,phone,lat,lng,short_description,online_ordering,loyalty_program,parking,drive_thru,delivery,wheelchair_accessible&city=eq.${encodeURIComponent(city)}&project_tag=eq.green&state=eq.IL&is_active=eq.true&limit=50`,
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
  // Public-cities allow-list — cities with zero dispensaries 404 publicly.
  if (!isCentralILPublicCity(raw)) notFound();

  const slug = citySlug(city);
  const profile = getCityProfile(slug);

  const [allDeals, listings, livePriceBoard] = await Promise.all([
    getAllActiveDeals(),
    getCityListings(city),
    // Real per-store board or null. Hidden until the menu-baseline pipeline
    // has comparable prices — no invented data on city pages either.
    getLivePriceBoard({ locationTag: `${city.toUpperCase()} AREA`, nearCity: citySlug(city) }).catch(() => null),
  ]);
  const deals = dealsInCity(allDeals, city);
  const hours = await getHoursFor(listings.map((l) => l.id));

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

  return (
    <>
      <style>{`
        .cp{max-width:880px;margin:0 auto;padding:clamp(1.5rem,4vw,2.75rem) clamp(1rem,4vw,1.5rem) 4rem;color:var(--pp-body)}
        .cp-crumb{font-family:var(--font-mono);font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--pp-muted);margin-bottom:.9rem}
        .cp-crumb a{color:inherit;text-decoration:none}
        .cp-crumb a:hover{color:var(--pp-signal-ink)}
        .cp h1{font-family:var(--font-display);font-size:clamp(2rem,5vw,3rem);line-height:1.02;letter-spacing:-.035em;color:var(--pp-ink);font-weight:700;margin:0 0 .9rem}
        .cp-intro{font-size:1rem;line-height:1.6;max-width:640px;margin:0 0 1.5rem;color:var(--pp-body)}

        .cp-ticker{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--pp-border);border-radius:12px;background:var(--pp-surface);margin:0 0 .5rem;overflow:hidden}
        .cp-tick{padding:.9rem 1rem;border-right:1px solid var(--pp-border)}
        .cp-tick:last-child{border-right:none}
        .cp-tick-n{font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-size:clamp(1.5rem,4vw,2rem);font-weight:600;color:var(--pp-ink);line-height:1}
        .cp-tick-n.sig{color:var(--pp-signal)}
        .cp-tick-l{font-family:var(--font-mono);font-size:.64rem;letter-spacing:.1em;text-transform:uppercase;color:var(--pp-muted);margin-top:.4rem}
        .cp-asof{font-family:var(--font-mono);font-size:.68rem;color:var(--pp-muted);margin:0 0 2rem}
        .cp-asof .dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--pp-signal);margin-right:.4rem;vertical-align:middle}

        .cp-h{font-family:var(--font-mono);font-size:.7rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--pp-muted);margin:2.25rem 0 .75rem;display:flex;justify-content:space-between;gap:1rem}

        .cp-empty{border:1px dashed var(--pp-best-border);background:var(--pp-best-tint);border-radius:12px;padding:1.1rem 1.2rem}
        .cp-empty-t{font-family:var(--font-display);font-weight:700;color:var(--pp-ink);font-size:1.05rem;margin:0 0 .3rem}
        .cp-empty p{font-size:.9rem;line-height:1.55;margin:0}
        .cp-near{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.85rem}
        .cp-near a{display:inline-flex;align-items:baseline;gap:.45rem;padding:.45rem .75rem;border:1px solid var(--pp-best-border);background:var(--pp-surface);border-radius:999px;text-decoration:none;color:var(--pp-ink);font-size:.85rem;font-weight:600}
        .cp-near a:hover{border-color:var(--pp-signal)}
        .cp-near .m{font-family:var(--font-mono);font-size:.72rem;color:var(--pp-signal-ink);font-weight:500}
        .cp-alert{display:inline-block;margin-top:.9rem;font-weight:700;font-size:.88rem;color:var(--pp-signal-ink);text-decoration:none}
        .cp-alert:hover{text-decoration:underline}

        .deal-row{background:var(--pp-surface);border:1px solid var(--pp-border);border-left:3px solid var(--pp-signal);border-radius:12px;padding:.9rem 1.1rem;margin-bottom:.6rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;text-decoration:none;color:inherit}
        .deal-row:hover{border-color:var(--pp-best-border);border-left-color:var(--pp-signal)}
        .deal-body{flex:1;min-width:0}
        .deal-name{font-family:var(--font-display);font-size:.95rem;font-weight:700;color:var(--pp-ink);margin-bottom:2px}
        .deal-title{font-size:.84rem;line-height:1.4}
        .deal-right{text-align:right;flex-shrink:0}
        .deal-save-label{font-family:var(--font-mono);font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:var(--pp-muted)}
        .deal-save-amt{font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-size:1.4rem;color:var(--pp-signal-ink);font-weight:600;line-height:1}

        .st{border:1px solid var(--pp-border);border-radius:12px;background:var(--pp-surface);overflow:hidden}
        .st-row{display:grid;grid-template-columns:1fr auto;gap:.35rem 1rem;padding:1rem 1.1rem;border-bottom:1px solid var(--pp-border)}
        .st-row:last-child{border-bottom:none}
        .st-name{font-family:var(--font-display);font-size:1.05rem;font-weight:700;color:var(--pp-ink);text-decoration:none;letter-spacing:-.01em}
        .st-name:hover{color:var(--pp-signal-ink)}
        .st-status{font-family:var(--font-mono);font-size:.72rem;white-space:nowrap;align-self:start;padding-top:.2rem}
        .st-status.open{color:var(--pp-signal)}
        .st-status.open::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--pp-signal);margin-right:.4rem;vertical-align:middle}
        .st-status.closed{color:var(--pp-muted)}
        .st-meta{grid-column:1/-1;font-size:.8rem;color:var(--pp-muted);display:flex;flex-wrap:wrap;gap:.25rem .9rem}
        .st-meta .mono{font-family:var(--font-mono);font-variant-numeric:tabular-nums}
        .st-desc{grid-column:1/-1;font-size:.88rem;line-height:1.5;margin:.15rem 0 0;max-width:640px}
        .st-chips{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.35rem}
        .st-chip{font-size:.72rem;padding:.2rem .55rem;border:1px solid var(--pp-border);border-radius:999px;color:var(--pp-body);background:var(--pp-paper)}
        .st-chip.deal{border-color:var(--pp-best-border);background:var(--pp-best-tint);color:var(--pp-signal-ink);font-weight:600}
        .st-actions{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:1.1rem;margin-top:.5rem;font-size:.82rem;font-weight:600}
        .st-actions a{color:var(--pp-signal-ink);text-decoration:none;min-height:32px;display:inline-flex;align-items:center}
        .st-actions a:hover{text-decoration:underline}

        .faq{border-top:1px solid var(--pp-border)}
        .faq-item{border-bottom:1px solid var(--pp-border);padding:1rem 0}
        .faq-q{font-family:var(--font-display);font-weight:700;color:var(--pp-ink);font-size:1rem;margin:0 0 .3rem}
        .faq-a{font-size:.9rem;line-height:1.55;margin:0}

        .cp-foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;align-items:center;margin-top:2.5rem;padding-top:1.25rem;border-top:1px solid var(--pp-border);font-size:.82rem;color:var(--pp-muted)}
        .cp-foot a{color:var(--pp-signal-ink);font-weight:600;text-decoration:none}

        @media(max-width:560px){
          .st-row{grid-template-columns:1fr}
          .st-status{padding-top:0}
          .cp-tick{padding:.75rem .7rem}
          .cp-tick-l{font-size:.58rem}
          .deal-save-amt{font-size:1.2rem}
        }
      `}</style>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Nav variant="light" />

      <main className="cp">
        <nav className="cp-crumb" aria-label="Breadcrumb">
          <Link href="/">Central Illinois</Link> / {city}
        </nav>
        <h1>{city} dispensary deals today</h1>
        {profile?.intro && <p className="cp-intro">{profile.intro}</p>}

        {/* Live ticker — every number is computed from the DB at render. */}
        <div className="cp-ticker" role="group" aria-label={`${city} right now`}>
          <div className="cp-tick">
            <div className="cp-tick-n">{stores.length}</div>
            <div className="cp-tick-l">Dispensaries</div>
          </div>
          <div className="cp-tick">
            <div className={`cp-tick-n${openCount > 0 ? " sig" : ""}`}>
              {hasHours ? openCount : "—"}
            </div>
            <div className="cp-tick-l">Open now</div>
          </div>
          <div className="cp-tick">
            <div className={`cp-tick-n${deals.length > 0 ? " sig" : ""}`}>{deals.length}</div>
            <div className="cp-tick-l">Verified deals</div>
          </div>
        </div>
        <p className="cp-asof">
          <span className="dot" aria-hidden="true" />
          As of {asOf} CT · deals checked daily on each dispensary&apos;s own site
        </p>

        {livePriceBoard && (
          <div style={{ margin: "0 0 2rem", maxWidth: 560 }}>
            <PriceBoard {...livePriceBoard} />
          </div>
        )}

        <EndingSoonRow
          deals={endingWithin24h(deals)
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

        <div className="cp-h">
          <span>Deals · best savings first</span>
        </div>
        {deals.length > 0 ? (
          deals.map((d) => {
            const dslug = d.slug || d.listing_slug;
            const dollars = estimateSavings(d);
            const name = d.name || dslug;
            const title = d.deal_title || d.title || "Active deal";
            return (
              <Link key={d.id} href={`/dispensary/${dslug}?city=${encodeURIComponent(city)}`} className="deal-row">
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
          })
        ) : (
          <div className="cp-empty">
            <p className="cp-empty-t">No verified deals posted in {city} today.</p>
            <p>
              We only list deals we can confirm on the dispensary&apos;s own site — no
              aggregator listings, no guesses. When one posts, it shows up here.
            </p>
            {nearbyWithDeals.length > 0 && (
              <div className="cp-near">
                {nearbyWithDeals.map((c) => (
                  <Link key={c.slug} href={`/city/${c.slug}`}>
                    {c.name}
                    <span className="m">
                      {c.deals} deal{c.deals === 1 ? "" : "s"} · ~{c.miles} mi
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/alerts" className="cp-alert">
              Text me when {city} gets a deal →
            </Link>
          </div>
        )}

        {stores.length > 0 && (
          <>
            <div className="cp-h">
              <span>
                {stores.length} dispensar{stores.length === 1 ? "y" : "ies"} in {city}
              </span>
              {hasHours && <span>Open first</span>}
            </div>
            <div className="st">
              {stores.map(({ l, status, openNow, todayLabel, dealCount }) => {
                const chips = amenityChips(l);
                const maps =
                  l.lat != null && l.lng != null
                    ? `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`
                    : l.address1
                    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(l.address1)}`
                    : null;
                return (
                  <div key={l.id} className="st-row">
                    <Link href={`/dispensary/${l.slug}`} className="st-name">
                      {l.name || l.slug}
                    </Link>
                    {status ? (
                      <span className={`st-status ${openNow ? "open" : "closed"}`}>{status.label}</span>
                    ) : (
                      <span />
                    )}
                    <div className="st-meta">
                      {l.address1 && <span>{l.address1.replace(/,\s*IL\s*\d{5}.*$/, "")}</span>}
                      {todayLabel && <span className="mono">Today {todayLabel}</span>}
                    </div>
                    {l.short_description && <p className="st-desc">{l.short_description}</p>}
                    {(chips.length > 0 || dealCount > 0) && (
                      <div className="st-chips">
                        {dealCount > 0 && (
                          <span className="st-chip deal">
                            {dealCount} deal{dealCount === 1 ? "" : "s"} today
                          </span>
                        )}
                        {chips.map((c) => (
                          <span key={c} className="st-chip">{c}</span>
                        ))}
                      </div>
                    )}
                    <div className="st-actions">
                      <Link href={`/dispensary/${l.slug}`}>Details →</Link>
                      {maps && (
                        <a href={maps} target="_blank" rel="noopener noreferrer">Directions</a>
                      )}
                      {l.phone && <a href={`tel:${l.phone.replace(/[^\d+]/g, "")}`}>{l.phone}</a>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {nearby.length > 0 && (
          <>
            <div className="cp-h"><span>Nearby cities</span></div>
            <div className="cp-near" style={{ marginTop: 0 }}>
              {nearby.map((c) => (
                <Link key={c.slug} href={`/city/${c.slug}`}>
                  {c.name}
                  <span className="m">
                    ~{c.miles} mi{c.deals > 0 ? ` · ${c.deals} deal${c.deals === 1 ? "" : "s"}` : ""}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}

        {faqs.length > 0 && (
          <>
            <div className="cp-h"><span>{city} questions</span></div>
            <div className="faq">
              {faqs.map((f) => (
                <div key={f.q} className="faq-item">
                  <h2 className="faq-q">{f.q}</h2>
                  <p className="faq-a">{f.a}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="cp-foot">
          <Link href="/deals/all">All Central IL deals →</Link>
          <ReportIssueLink context={`${city} city page`} url={pageUrl} label="See something wrong? Tell us" />
        </div>
      </main>

      <Footer />
    </>
  );
}
