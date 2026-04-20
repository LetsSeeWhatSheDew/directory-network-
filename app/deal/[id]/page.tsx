// app/deal/[id]/page.tsx
// Individual deal page. Target queries: "[deal title] at [dispensary]",
// "[dispensary] 20% off", etc. Each card in the product now has a
// "Details →" link pointing here. The primary CTA is still GO HERE →
// /l/[slug], which carries the full destination-screen UX.

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { brand } from "../../../lib/brand";
import { estimateSavings, formatSavingsDollars } from "../../../lib/dealScoring";
import { listingHref } from "../../../lib/links";
import ShareDealButton from "../../components/ShareDealButton";

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
  source_url: string | null;
  is_active: boolean | null;
};

type ListingMini = {
  slug: string;
  name: string | null;
  city: string | null;
  address1: string | null;
  phone: string | null;
};

async function getDeal(id: string): Promise<Deal | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/deals?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
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
      `${SUPABASE_URL}/rest/v1/master_listings?slug=eq.${encodeURIComponent(slug)}&select=slug,name,city,address1,phone&limit=1`,
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
    return { title: "Deal not found | PuffPrice", robots: { index: false } };
  }
  const listing = await getListing(deal.listing_slug);
  const headline = formatDealHeadline(deal);
  const disp = listing?.name || deal.listing_slug;
  const city = listing?.city || "Illinois";
  const dollars = estimateSavings(deal);
  const savingsSuffix = dollars ? ` — Save $${dollars}` : "";
  const title = `${headline} at ${disp}${savingsSuffix} | ${brand.name}`;
  const description = deal.description
    ? deal.description.slice(0, 180)
    : `${headline} at ${disp} in ${city}, IL. ${brand.name} tracks active cannabis deals across Illinois.`;
  const url = `${brand.url}/deal/${id}`;
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

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal || !deal.is_active) notFound();

  const listing = await getListing(deal.listing_slug);
  const headline = formatDealHeadline(deal);
  const dollars = estimateSavings(deal);
  const savingsFormatted = formatSavingsDollars(deal);
  const code = extractPromoCode(deal.description) || extractPromoCode(deal.title);
  const expiry = computeExpiry(deal.expires_at);
  const expiryStyle: Record<ExpiryBadge["tone"], React.CSSProperties> = {
    none:     { display: "none" },
    ongoing:  { color: "#166534", background: "#dcfce7" },
    soft:     { color: "#475569", background: "#f1f5f9" },
    warning:  { color: "#92400e", background: "#fef3c7" },
    urgent:   { color: "#fff",    background: "#dc2626" },
  };
  const disp = listing?.name || deal.listing_slug;
  const city = listing?.city || "Illinois";

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
      address: `${city}, IL`,
    },
    url: `${brand.url}/deal/${id}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaAnnouncement) }}
      />
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
        .wrap{max-width:680px;margin:0 auto;padding:40px 20px 64px}
        .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:10px}
        h1{font-size:clamp(1.8rem,4.5vw,2.6rem);font-weight:700;letter-spacing:-.03em;line-height:1.12;margin-bottom:10px}
        .disp{font-size:1rem;color:#374151;font-family:system-ui,sans-serif;margin-bottom:4px}
        .disp a{color:#16a34a;font-weight:700;text-decoration:none}
        .disp a:hover{text-decoration:underline}
        .city{font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:22px}
        .city a{color:#16a34a;text-decoration:none}
        .savings-block{background:#fff;border:1px solid #e8e4da;border-left:4px solid #16a34a;border-radius:16px;padding:24px;margin-bottom:18px;box-shadow:0 4px 16px rgba(15,31,61,.06)}
        .sv-label{font-size:.68rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:2px}
        .sv-amt{font-size:clamp(2.4rem,9vw,3.4rem);font-weight:700;color:#16a34a;letter-spacing:-.04em;line-height:1;margin-bottom:4px}
        .sv-vs{font-size:.78rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-bottom:14px}
        .expires{display:inline-block;font-size:.74rem;color:#92400e;background:#fef3c7;padding:3px 10px;border-radius:100px;font-family:system-ui,sans-serif;font-weight:700;margin-bottom:14px}
        .expires.ongoing{color:#166534;background:#dcfce7}
        .desc{font-size:.98rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.6;margin-bottom:16px}
        .code-box{background:#0f1f3d;color:#fff;border-radius:10px;padding:14px 18px;margin-bottom:18px;font-family:system-ui,sans-serif;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .code-label{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:#4ade80;font-weight:700}
        .code-value{font-family:monospace;font-size:1.05rem;font-weight:700;background:rgba(255,255,255,.1);padding:6px 14px;border-radius:8px;letter-spacing:.06em}
        .how-to{font-size:.88rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.5;margin-bottom:18px;padding:12px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;color:#14532d}
        .cta{display:block;width:100%;text-align:center;background:#16a34a;color:#fff;padding:16px;border-radius:12px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:800;font-size:1rem;letter-spacing:.02em;min-height:52px;transition:background .15s}
        .cta:hover{background:#15803d}
        .secondary{display:block;text-align:center;margin-top:12px;color:#6b7280;font-family:system-ui,sans-serif;font-size:.82rem;text-decoration:none}
        .secondary:hover{color:#0f1f3d;text-decoration:underline}
        @media(max-width:600px){.wrap{padding:24px 14px}.savings-block{padding:20px 18px}}
      `}</style>

      <div className="top-stripe" aria-hidden="true" />
      <nav className="nav">
        <Link href="/" className="logo">
          <span className="logo-dot" />
          <span className="logo-text">puff<span>price</span></span>
        </Link>
        <Link
          href={city !== "Illinois" ? `/city/${encodeURIComponent(city.toLowerCase())}` : "/deals/all"}
          className="back"
        >
          ← {city !== "Illinois" ? `${city} deals` : "All deals"}
        </Link>
      </nav>

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
          <Link href={`/city/${encodeURIComponent(city.toLowerCase())}`}>{city}, IL</Link>
        </p>

        <div className="savings-block">
          {dollars != null ? (
            <>
              <div className="sv-label">You save</div>
              <div className="sv-amt">${dollars}</div>
              <div className="sv-vs">vs. area average</div>
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
            const goHref = listingHref(deal.listing_slug, city);
            if (!goHref) return null;
            return (
              <Link href={goHref} className="cta">
                GO HERE →
              </Link>
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
