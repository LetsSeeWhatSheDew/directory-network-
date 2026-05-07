// app/deal/[id]/page.tsx
// Individual deal page. Target queries: "[deal title] at [dispensary]",
// "[dispensary] 20% off", etc. Each card in the product has a
// "Details →" link pointing here. The primary CTA goes external —
// to the dispensary's website (with utm_source=puffprice) when one
// is on file, or to Google Maps directions otherwise.

import Link from "next/link";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { brand } from "../../../lib/brand";
import { estimateSavings, formatSavingsDollars } from "../../../lib/dealScoring";
import { visitDispensaryHref } from "../../../lib/links";
import { displayDispensaryName } from "../../../lib/dispensaryName";
import ShareDealButton from "../../components/ShareDealButton";
import DealFreshnessBadge from "../../components/DealFreshnessBadge";
import { isInCentralIL } from "../../../lib/visibility";
import { isDealActiveNow, describeActiveDays } from "../../../lib/dealActiveFilter";

export const revalidate = 60;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

type Deal = {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  listing_slug: string;
  discount_value: number | null;
  discount_unit: string | null;
  discount_type: string | null;
  original_price: number | null;
  sale_price: number | null;
  expires_at: string | null;
  is_recurring: boolean | null;
  recurring_days?: string[] | null;
  active_days?: string[] | null;
  active_until?: string | null;
  source_url: string | null;
  is_active: boolean | null;
};

type ListingMini = {
  slug: string;
  name: string | null;
  city: string | null;
  address1: string | null;
  phone: string | null;
  website: string | null;
};

async function getDeal(id: string): Promise<Deal | null> {
  try {
    const res = await fetch(
      // deals is shared across projects (same as master_listings); scope
      // to project_tag=green so /deal/[uuid] can't surface a non-PuffPrice
      // deal even if a UUID collision occurred.
      `${SUPABASE_URL}/rest/v1/deals?id=eq.${encodeURIComponent(id)}&project_tag=eq.green&select=*&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 60, tags: ["deals"] },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

async function getListing(slug: string): Promise<ListingMini | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?slug=eq.${encodeURIComponent(slug)}&project_tag=eq.green&is_active=eq.true&select=slug,name,city,address1,phone,website&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 3600, tags: ["listings"] },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

function extractPromoCode(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = text.match(/\b(code|promo|use)\s*[:=]?\s*["']?([A-Z0-9_-]{3,20})["']?\b/i);
  return m ? m[2].toUpperCase() : null;
}

function formatDealHeadline(d: Deal): string {
  if (d.title && d.title.length > 0) return d.title;
  if (d.discount_unit === "percent" && d.discount_value) {
    return `${Math.round(d.discount_value)}% off${d.category ? " " + d.category : ""}`;
  }
  if (d.discount_unit === "dollars" && d.discount_value) {
    return d.discount_type === "fixed_price"
      ? `$${d.discount_value} flat price`
      : `$${d.discount_value} off`;
  }
  return "Cannabis deal";
}

type ExpiryBadge = {
  text: string;
  tone: "none" | "ongoing" | "soft" | "warning" | "urgent";
};

// Tiered urgency for the /deal/[id] expiry badge:
//   <6h   → red "urgent"    "Ends in Xh Ym — don't wait"
//   <24h  → orange "warning" "Ends in Xh"
//   ≤30d  → slate "soft"     "Expires Apr 28"
//   no expiry → green "ongoing"
function computeExpiry(exp: string | null): ExpiryBadge {
  if (!exp) return { text: "Ongoing deal", tone: "ongoing" };
  const d = new Date(exp);
  if (!Number.isFinite(d.getTime())) return { text: "Ongoing deal", tone: "ongoing" };
  const diffMs = d.getTime() - Date.now();
  if (diffMs <= 0) return { text: "Expired", tone: "none" };
  const hours = diffMs / 3_600_000;
  if (hours < 6) {
    const h = Math.floor(hours);
    const m = Math.floor((diffMs % 3_600_000) / 60_000);
    const body = h >= 1 ? `${h}h ${m}m` : `${m}m`;
    return { text: `Ends in ${body} — don't wait`, tone: "urgent" };
  }
  if (hours < 24) {
    return { text: `Ends in ${Math.max(1, Math.floor(hours))}h`, tone: "warning" };
  }
  return {
    text: `Expires ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    tone: "soft",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) {
    return { title: "Deal not found", robots: { index: false } };
  }
  const listing = await getListing(deal.listing_slug);
  // Central IL scope gate — mirror the page component below.
  if (!isInCentralIL(listing?.city)) {
    return { robots: { index: false, follow: false } };
  }
  const headline = formatDealHeadline(deal);
  const disp = displayDispensaryName({ name: listing?.name, slug: deal.listing_slug, listing_slug: deal.listing_slug });
  const rawCity = listing?.city && listing.city !== "Illinois" ? listing.city : null;
  const cityPhrase = rawCity ? `${rawCity}, IL` : "Illinois";
  const dollars = estimateSavings(deal);
  const savingsSuffix = dollars ? ` — Save $${dollars}` : "";
  const title = `${headline} at ${disp}${savingsSuffix} | ${brand.name}`;
  const description = deal.description
    ? deal.description.slice(0, 180)
    : `${headline} at ${disp} in ${cityPhrase}. ${brand.name} tracks active cannabis deals across Central Illinois.`;
  const url = `${brand.url}/deal/${id}`;
  // Point canonical at the dispensary detail page when we have a
  // listing slug. /deal/[uuid] is a UUID-keyed convenience URL; the
  // dispensary page is the durable resource the deal hangs off and
  // the surface we want indexed. Falls back to self-canonical when
  // no listing context is available so we never emit an empty/null
  // canonical. GSC was flagging /deal/[uuid] as "duplicate without
  // user-selected canonical" before this consolidation.
  const canonicalUrl = deal.listing_slug
    ? `${brand.url}/dispensary/${deal.listing_slug}`
    : url;
  const ogImage = `${brand.url}/og-image.png`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
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

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal || !deal.is_active) notFound();

  const listing = await getListing(deal.listing_slug);
  // Central IL scope gate — deals on non-CIL listings are hidden publicly.
  if (!isInCentralIL(listing?.city)) notFound();
  // Day-of-week + active_until visibility gate. The page renders even when
  // not active today (so the URL stays a stable resource), but the savings
  // block flips to a "not active today" notice that names the days the
  // deal is valid. Mirror of the DB-level filter applied by the
  // active_deals_with_listings view.
  const activeNow = isDealActiveNow(deal);
  const activeDaysLabel = describeActiveDays(deal.active_days);
  const headline = formatDealHeadline(deal);
  const dollars = estimateSavings(deal);
  const savingsFormatted = formatSavingsDollars(deal);
  const code = extractPromoCode(deal.description) || extractPromoCode(deal.title);
  const expiry = computeExpiry(deal.expires_at);
  const expiryStyle: Record<ExpiryBadge["tone"], React.CSSProperties> = {
    none:     { display: "none" },
    ongoing:  { color: "#3F6B1F", background: "#dcfce7" },
    soft:     { color: "#475569", background: "#f1f5f9" },
    warning:  { color: "#92400e", background: "#fef3c7" },
    urgent:   { color: "#fff",    background: "#dc2626" },
  };
  const disp = displayDispensaryName({ name: listing?.name, slug: deal.listing_slug, listing_slug: deal.listing_slug });
  const rawCity = listing?.city && listing.city !== "Illinois" ? listing.city : null;
  const city = rawCity; // null when we don't have a real city — avoid "Illinois" sentinel
  const cityLabel = rawCity ? `${rawCity}, IL` : "IL";

  // SpecialAnnouncement schema — Zone 4 Phase 1 "fresh & live" signal
  const schemaAnnouncement = {
    "@context": "https://schema.org",
    "@type": "SpecialAnnouncement",
    name: headline,
    text: deal.description || headline,
    ...(deal.expires_at ? { expires: deal.expires_at } : {}),
    category: "https://schema.org/SpecialAnnouncement",
    announcementLocation: {
      "@type": "LocalBusiness",
      name: disp,
      address: cityLabel,
    },
    url: `${brand.url}/deal/${id}`,
  };

  // Offer schema — competitive moat vs Leafly/Weedmaps/iHeartJane.
  // None of them publish indexable per-deal pages with Offer markup.
  // CannaSaver does; we match + beat with LocalBusiness offeredBy.
  const schemaOffer: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: headline,
    description: deal.description || headline,
    url: `${brand.url}/deal/${id}`,
    availability: "https://schema.org/InStock",
    category: deal.category || "Cannabis",
    offeredBy: {
      "@type": "LocalBusiness",
      name: disp,
      address: {
        "@type": "PostalAddress",
        ...(rawCity ? { addressLocality: rawCity } : {}),
        addressRegion: "IL",
        addressCountry: "US",
      },
    },
  };
  if (deal.sale_price != null && Number.isFinite(Number(deal.sale_price))) {
    schemaOffer.price = Number(deal.sale_price);
    schemaOffer.priceCurrency = "USD";
  }
  if (deal.expires_at) {
    // Schema.org prefers ISO date (YYYY-MM-DD). Trim time if present.
    const iso = String(deal.expires_at).slice(0, 10);
    schemaOffer.priceValidUntil = iso;
    schemaOffer.validThrough = iso;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaAnnouncement) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOffer) }}
      />
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
        .wrap{max-width:680px;margin:0 auto;padding:40px 20px 64px}
        .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#7DBA47;font-family:system-ui,sans-serif;margin-bottom:10px}
        h1{font-size:clamp(1.8rem,4.5vw,2.6rem);font-weight:700;letter-spacing:-.03em;line-height:1.12;margin-bottom:10px}
        .disp{font-size:1rem;color:#374151;font-family:system-ui,sans-serif;margin-bottom:4px}
        .disp a{color:#7DBA47;font-weight:700;text-decoration:none}
        .disp a:hover{text-decoration:underline}
        .city{font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:22px}
        .city a{color:#7DBA47;text-decoration:none}
        .savings-block{background:#fff;border:1px solid #e8e4da;border-left:4px solid #7DBA47;border-radius:16px;padding:24px;margin-bottom:18px;box-shadow:0 4px 16px rgba(15,31,61,.06)}
        .sv-label{font-size:.68rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:2px}
        .sv-amt{font-size:clamp(2.4rem,9vw,3.4rem);font-weight:700;color:#7DBA47;letter-spacing:-.04em;line-height:1;margin-bottom:4px}
        .sv-vs{font-size:.78rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-bottom:14px}
        .expires{display:inline-block;font-size:.74rem;color:#92400e;background:#fef3c7;padding:3px 10px;border-radius:100px;font-family:system-ui,sans-serif;font-weight:700;margin-bottom:14px}
        .expires.ongoing{color:#3F6B1F;background:#dcfce7}
        .desc{font-size:.98rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.6;margin-bottom:16px}
        .code-box{background:#1F3D2B;color:#fff;border-radius:10px;padding:14px 18px;margin-bottom:18px;font-family:system-ui,sans-serif;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .code-label{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:#93CB5C;font-weight:700}
        .code-value{font-family:monospace;font-size:1.05rem;font-weight:700;background:rgba(255,255,255,.1);padding:6px 14px;border-radius:8px;letter-spacing:.06em}
        .how-to{font-size:.88rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.5;margin-bottom:18px;padding:12px 14px;background:#F2F8E9;border:1px solid #C7E5A8;border-radius:10px;color:#14532d}
        .cta{display:block;width:100%;text-align:center;background:#7DBA47;color:#fff;padding:16px;border-radius:12px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:800;font-size:1rem;letter-spacing:.02em;min-height:52px;transition:background .15s}
        .cta:hover{background:#6BA63B}
        .secondary{display:block;text-align:center;margin-top:12px;color:#6b7280;font-family:system-ui,sans-serif;font-size:.82rem;text-decoration:none}
        .secondary:hover{color:#1F3D2B;text-decoration:underline}
        @media(max-width:600px){.wrap{padding:24px 14px}.savings-block{padding:20px 18px}}
      `}</style>

      <Nav variant="light" />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(1rem, 4vw, 2rem) 4px", fontSize: 13 }}>
        <Link
          href={city ? `/city/${encodeURIComponent(city.toLowerCase())}` : "/deals/all"}
          style={{ color: "var(--color-gray-500, #6B7280)", textDecoration: "none", fontFamily: "Manrope, system-ui, sans-serif", fontWeight: 500 }}
        >
          ← {city ? `${city} deals` : "All deals"}
        </Link>
      </div>

      <main className="wrap">
        <div className="eyebrow">Active deal{deal.category ? ` · ${deal.category}` : ""}</div>
        <h1>{headline}</h1>
        <p className="disp">
          at{" "}
          <Link href={`/dispensary/${deal.listing_slug}`}>
            {disp}
          </Link>
        </p>
        <p className="city">
          {rawCity ? (
            <Link href={`/city/${rawCity.toLowerCase().trim().replace(/\s+/g, "-")}`}>{rawCity}, IL</Link>
          ) : (
            <Link href="/">Central Illinois</Link>
          )}
        </p>

        <div className="savings-block">
          {!activeNow && (
            <div
              role="status"
              style={{
                background: "#fef3c7",
                border: "1px solid #f5d27a",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 14,
                fontFamily: "system-ui,sans-serif",
                fontSize: ".88rem",
                color: "#92400e",
                lineHeight: 1.5,
              }}
            >
              <strong>Not active today.</strong>{" "}
              {activeDaysLabel
                ? `This deal runs ${activeDaysLabel} only — check back then.`
                : "This deal isn't valid right now."}
            </div>
          )}
          {dollars != null ? (
            <>
              <div className="sv-label">You save</div>
              <div className="sv-amt">${dollars}</div>
              </>
          ) : (
            savingsFormatted !== "Deal active" && (
              <>
                <div className="sv-amt" style={{ fontSize: "2rem" }}>{savingsFormatted}</div>
                <div className="sv-vs">on this deal</div>
              </>
            )
          )}
          <span
            className="expires"
            style={{
              ...expiryStyle[expiry.tone],
              fontWeight: expiry.tone === "urgent" ? 800 : 700,
              padding: expiry.tone === "urgent" ? "6px 14px" : "3px 10px",
              fontSize: expiry.tone === "urgent" ? ".88rem" : ".74rem",
              display: expiry.tone === "none" ? "none" : "inline-block",
            }}
          >
            {expiry.text}
          </span>
          {deal.description && <p className="desc">{deal.description}</p>}
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <DealFreshnessBadge
              verifiedAt={(deal as any).verified_at}
              statusReason={(deal as any).status_reason}
              variant="detail"
            />
          </div>
          {code && (
            <div className="code-box">
              <span className="code-label">Use code at checkout</span>
              <span className="code-value">{code}</span>
            </div>
          )}
          <div className="how-to">
            → {code ? `Show this code at checkout: ${code}` : "No code needed — deal applies at checkout"}
          </div>
          {(() => {
            const visit = visitDispensaryHref({
              website: listing?.website,
              address1: listing?.address1,
              city: listing?.city,
            });
            return (
              <a
                href={visit.href}
                className="cta"
                target="_blank"
                rel="noopener noreferrer"
              >
                {visit.label}
              </a>
            );
          })()}
          <div style={{ marginTop: 10 }}>
            <ShareDealButton
              dealId={id}
              dispensaryName={disp}
              dealTitle={headline}
              savings={dollars}
              variant="block"
            />
          </div>
          <Link href={`/dispensary/${deal.listing_slug}`} className="secondary">
            See full {disp} profile
          </Link>
        </div>
      </main>
    </>
  );
}
