// app/dispensary/[slug]/page.tsx
// Full dispensary profile page — SEO-forward, distinct from /l/[slug]
// which is the "GO HERE confirmation screen" for the core flow.
//
// This page ranks for "[Dispensary] deals" / "[Dispensary] hours" and
// serves as the bookmark/permalink destination for repeat visitors.

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { brand } from "../../../lib/brand";
import { estimateSavings, formatSavingsDollars } from "../../../lib/dealScoring";
import { nowInCT, isOpen, formatTime as formatHourTime } from "../../../lib/hours";
import { listingHref } from "../../../lib/links";

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
  state: string | null;
  address1: string | null;
  phone: string | null;
  website: string | null;
  short_description: string | null;
  long_description: string | null;
  menu_url?: string | null;
  type: string | null;
  plan: string | null;
  logo_url: string | null;
  delivery: boolean | null;
  drive_thru: boolean | null;
  online_ordering: boolean | null;
  accepts_credit: boolean | null;
  cash_only: boolean | null;
  atm_onsite: boolean | null;
  wheelchair_accessible: boolean | null;
  parking: boolean | null;
  loyalty_program: boolean | null;
};

type Hours = {
  weekday: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean | null;
};

type Deal = {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  discount_value: number | null;
  discount_unit: string | null;
  discount_type: string | null;
  original_price: number | null;
  sale_price: number | null;
  expires_at: string | null;
  is_recurring: boolean | null;
  source_url: string | null;
};

async function sbFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 300, tags: ["deals", "listings"] },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function getListing(slug: string): Promise<Listing | null> {
  const rows = await sbFetch<Listing[]>(
    `master_listings?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`
  );
  return rows && rows[0] ? rows[0] : null;
}

async function getHours(listingId: string): Promise<Hours[]> {
  const rows = await sbFetch<Hours[]>(
    `listing_hours?listing_id=eq.${encodeURIComponent(listingId)}&select=weekday,opens_at,closes_at,is_closed&order=weekday.asc`
  );
  return rows || [];
}

async function getDeals(slug: string): Promise<Deal[]> {
  const rows = await sbFetch<Deal[]>(
    `deals?listing_slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&project_tag=eq.green&select=id,title,description,category,discount_value,discount_unit,discount_type,original_price,sale_price,expires_at,is_recurring,source_url&order=discount_value.desc&limit=10`
  );
  // Defensive: strip expired rows even if is_active wasn't flipped yet
  const now = Date.now();
  return (rows || []).filter(
    (d) => !d.expires_at || new Date(d.expires_at).getTime() > now
  );
}

const formatTime = formatHourTime;

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function todayOpenStatus(hours: Hours[], ct: ReturnType<typeof nowInCT>): { open: boolean; label: string } {
  const row = hours.find((h) => h.weekday === ct.weekday);
  if (!row || row.is_closed || !row.opens_at || !row.closes_at) {
    return { open: false, label: "Closed today" };
  }
  if (isOpen(row, ct)) {
    return { open: true, label: `Open until ${formatTime(row.closes_at)}` };
  }
  const [oh, om] = row.opens_at.split(":").map(Number);
  if (ct.minutes < oh * 60 + om) {
    return { open: false, label: `Opens at ${formatTime(row.opens_at)}` };
  }
  return { open: false, label: "Closed now" };
}

function mapsHref(parts: Array<string | null | undefined>): string {
  const q = parts.filter(Boolean).join(", ");
  return `https://maps.google.com/?q=${encodeURIComponent(q)}`;
}

function formatDealTitle(d: Deal): string {
  if (d.title) return d.title;
  if (d.discount_unit === "percent" && d.discount_value) {
    return `${Math.round(d.discount_value)}% off${d.category ? " " + d.category : ""}`;
  }
  if (d.discount_unit === "dollars" && d.discount_value) {
    return `$${d.discount_value} off`;
  }
  return "Active deal";
}

function formatExpires(exp: string | null): string | null {
  if (!exp) return null;
  const d = new Date(exp);
  const now = new Date();
  const diffDays = Math.floor((d.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return null;
  if (diffDays === 0) return "Expires today";
  if (diffDays === 1) return "Expires tomorrow";
  if (diffDays < 7) return `Expires ${d.toLocaleDateString("en-US", { weekday: "long" })}`;
  return `Expires ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) {
    return { title: "Dispensary not found | PuffPrice", robots: { index: false } };
  }
  const name = listing.name || slug;
  const city = listing.city || "Illinois";
  const title = `${name} — Deals, Hours & Directions | PuffPrice`;
  const description = `${name} in ${city}, IL. See current cannabis deals, full week hours, phone, and directions. Updated daily.`;
  const url = `${brand.url}/dispensary/${slug}`;
  const ogImage = listing.logo_url || `${brand.url}/og-image.png`;
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

export default async function DispensaryProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  const [hours, deals] = await Promise.all([
    getHours(listing.id),
    getDeals(slug),
  ]);

  const ct = nowInCT();
  const status = todayOpenStatus(hours, ct);
  const name = listing.name || slug;
  const city = listing.city || "Illinois";
  const todayIdx = ct.weekday;

  // LocalBusiness schema — mirrors /l/[slug] so both pages give Google the
  // same canonical entity data.
  const openingHours = hours
    .filter((h) => !h.is_closed && h.opens_at && h.closes_at)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][h.weekday],
      opens: h.opens_at?.substring(0, 5),
      closes: h.closes_at?.substring(0, 5),
    }));
  const schemaLocal = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    ...(listing.address1
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: listing.address1,
            addressLocality: listing.city,
            addressRegion: listing.state || "IL",
            addressCountry: "US",
          },
        }
      : {}),
    ...(listing.phone ? { telephone: listing.phone } : {}),
    url: `${brand.url}/dispensary/${slug}`,
    ...(listing.logo_url ? { image: listing.logo_url } : {}),
    ...(openingHours.length > 0 ? { openingHoursSpecification: openingHours } : {}),
    ...(listing.short_description ? { description: listing.short_description } : {}),
    sameAs: [
      `${brand.url}/dispensary/${slug}`,
      `${brand.url}/l/${slug}`,
    ],
  };

  const amenities = [
    listing.delivery === true && "🚗 Delivery",
    listing.online_ordering === true && "📱 Online ordering",
    listing.drive_thru === true && "🏎 Drive-thru",
    listing.atm_onsite === true && "💵 ATM on-site",
    listing.wheelchair_accessible === true && "♿ Accessible",
    listing.parking === true && "🅿 Parking",
    listing.loyalty_program === true && "⭐ Loyalty program",
    listing.accepts_credit === true && "💳 Credit cards",
    listing.cash_only === true && "💵 Cash only",
  ].filter(Boolean) as string[];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaLocal) }}
      />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .top-stripe{height:4px;background:#16a34a;width:100%}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#fff;position:sticky;top:0;z-index:100;border-bottom:1px solid #e8e4da}
        .logo{display:flex;align-items:center;gap:8px;text-decoration:none}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:#16a34a;animation:pulse 2.5s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .logo-text{font-size:1.1rem;font-weight:700;color:#0f1f3d}
        .logo-text span{color:#16a34a}
        .back{font-size:.82rem;color:#6b7280;text-decoration:none;font-family:system-ui,sans-serif}

        .wrap{max-width:900px;margin:0 auto;padding:40px 20px 64px}
        .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:10px}
        h1{font-size:clamp(1.8rem,4vw,2.6rem);font-weight:700;letter-spacing:-.03em;line-height:1.1;margin-bottom:8px}
        .city-line{font-size:.95rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:18px}

        .status-row{display:flex;gap:10px;align-items:center;margin-bottom:20px;flex-wrap:wrap}
        .status{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:100px;font-size:.82rem;font-family:system-ui,sans-serif;font-weight:600}
        .status-open{background:#dcfce7;color:#14532d}
        .status-closed{background:#fee2e2;color:#991b1b}
        .status-dot{width:7px;height:7px;border-radius:50%}
        .status-dot-open{background:#16a34a}
        .status-dot-closed{background:#dc2626}

        .contact-grid{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:28px}
        .contact-btn{
          flex:1 1 220px;min-width:200px;min-height:52px;
          display:flex;align-items:center;gap:10px;
          background:#fff;border:1px solid #e8e4da;border-radius:12px;
          padding:12px 16px;text-decoration:none;color:#0f1f3d;
          font-family:system-ui,sans-serif;font-size:.92rem;font-weight:600;
          transition:border-color .15s,transform .05s;
        }
        .contact-btn:hover{border-color:#16a34a}
        .contact-btn:active{transform:translateY(1px)}
        .contact-btn .ico{font-size:1.15rem}
        .contact-btn .sub{display:block;font-size:.72rem;color:#9ca3af;font-weight:500;margin-top:2px}

        .section{margin-bottom:32px}
        .section-h{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9ca3af;font-family:system-ui,sans-serif;margin-bottom:14px}

        .deal-card{background:#fff;border:1px solid #e8e4da;border-left:4px solid #16a34a;border-radius:14px;padding:18px 20px;margin-bottom:10px}
        .deal-title{font-size:1.05rem;font-weight:700;color:#0f1f3d;margin-bottom:4px}
        .deal-meta{display:flex;gap:10px;flex-wrap:wrap;align-items:baseline;margin-bottom:8px}
        .deal-savings{font-size:1.4rem;font-weight:700;color:#16a34a;letter-spacing:-.02em}
        .deal-savings-label{font-size:.68rem;color:#6b7280;font-family:system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;font-weight:700}
        .deal-expires{font-size:.74rem;color:#92400e;background:#fef3c7;padding:2px 8px;border-radius:100px;font-family:system-ui,sans-serif;font-weight:600}
        .deal-desc{font-size:.88rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.5;margin-bottom:12px}
        .deal-cta{display:block;width:100%;text-align:center;background:#16a34a;color:#fff;padding:14px;border-radius:10px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700;font-size:.92rem;min-height:44px}
        .deal-cta:hover{background:#15803d}
        .deal-details{font-size:.76rem;color:#16a34a;text-decoration:none;display:inline-block;margin-top:8px;font-family:system-ui,sans-serif;font-weight:600}
        .deal-details:hover{text-decoration:underline}

        .no-deals{background:#fff;border:1px solid #e8e4da;border-radius:14px;padding:28px 24px;text-align:center}
        .no-deals-t{font-size:.98rem;font-weight:700;color:#0f1f3d}
        .no-deals-s{font-size:.82rem;color:#6b7280;font-family:system-ui,sans-serif;margin-top:4px}

        .hours{background:#fff;border:1px solid #e8e4da;border-radius:14px;padding:18px 22px}
        .hr{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-family:system-ui,sans-serif;font-size:.9rem;color:#374151}
        .hr-today{background:#f0fdf4;margin:0 -10px;padding:8px 10px;border-radius:8px}
        .hr-today-day,.hr-today-t{color:#14532d;font-weight:700}
        .hr-closed{color:#9ca3af}

        .amenities{display:flex;flex-wrap:wrap;gap:8px}
        .amenity{font-size:.78rem;font-family:system-ui,sans-serif;color:#374151;background:#fff;border:1px solid #e8e4da;padding:4px 12px;border-radius:100px}

        .about{background:#fff;border:1px solid #e8e4da;border-radius:14px;padding:18px 22px;font-size:.925rem;color:#374151;line-height:1.7;font-family:system-ui,sans-serif}

        .claim-cta{margin-top:32px;padding:18px;background:#fff;border:1px dashed #e8e4da;border-radius:12px;text-align:center;font-family:system-ui,sans-serif;font-size:.82rem;color:#6b7280}
        .claim-cta a{color:#16a34a;font-weight:700;text-decoration:none}
        .claim-cta a:hover{text-decoration:underline}

        @media(max-width:600px){.wrap{padding:24px 14px}.contact-btn{flex-basis:100%}}
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
          {city !== "Illinois" ? `← ${city} deals` : "← All deals"}
        </Link>
      </nav>

      <main className="wrap">
        <div className="eyebrow">{listing.type || "Dispensary"}</div>
        <h1>{name}</h1>
        <div className="city-line">{city}, IL</div>

        <div className="status-row">
          <span className={`status ${status.open ? "status-open" : "status-closed"}`}>
            <span className={`status-dot ${status.open ? "status-dot-open" : "status-dot-closed"}`} />
            {status.label}
          </span>
        </div>

        {/* Contact actions — big tap targets for mobile */}
        <div className="contact-grid">
          {listing.address1 && (
            <a
              href={mapsHref([listing.address1, listing.city, listing.state])}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-btn"
              aria-label={`Directions to ${name}`}
            >
              <span className="ico">📍</span>
              <span>
                {listing.address1}
                <span className="sub">Tap for directions</span>
              </span>
            </a>
          )}
          {listing.phone && (
            <a href={`tel:${listing.phone}`} className="contact-btn" aria-label={`Call ${name}`}>
              <span className="ico">📞</span>
              <span>
                {listing.phone}
                <span className="sub">Tap to call</span>
              </span>
            </a>
          )}
          {(listing.menu_url || listing.website) && (
            <a
              href={listing.menu_url || listing.website!}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-btn"
              aria-label="Open full menu"
            >
              <span className="ico">📋</span>
              <span>
                {listing.menu_url ? "View Full Menu" : "Visit Website"}
                <span className="sub">{listing.menu_url ? "External menu" : "External site"}</span>
              </span>
            </a>
          )}
        </div>

        {/* Active deals */}
        <section className="section" aria-label="Active deals">
          <div className="section-h">
            Active deals · {deals.length} {deals.length === 1 ? "offer" : "offers"}
          </div>
          {deals.length === 0 ? (
            <div className="no-deals">
              <div className="no-deals-t">No active deals right now</div>
              <div className="no-deals-s">
                We check daily. Get an alert when a new deal drops here →{" "}
                <Link href="/alerts" style={{ color: "#16a34a", fontWeight: 700, textDecoration: "none" }}>
                  Get alerts
                </Link>
              </div>
            </div>
          ) : (
            deals.map((d) => {
              const dollars = estimateSavings(d);
              const savingsLabel = formatSavingsDollars(d);
              const expiresLabel = formatExpires(d.expires_at);
              return (
                <div className="deal-card" key={d.id}>
                  <div className="deal-title">{formatDealTitle(d)}</div>
                  <div className="deal-meta">
                    {dollars != null ? (
                      <>
                        <span className="deal-savings-label">You save</span>
                        <span className="deal-savings">${dollars}</span>
                      </>
                    ) : (
                      savingsLabel !== "Deal active" && <span className="deal-savings">{savingsLabel}</span>
                    )}
                    {expiresLabel && <span className="deal-expires">{expiresLabel}</span>}
                  </div>
                  {d.description && <p className="deal-desc">{d.description}</p>}
                  {(() => {
                    const href = listingHref(slug, city && city !== "Illinois" ? city : null);
                    if (!href) return null;
                    return (
                      <Link href={href} className="deal-cta">
                        GO HERE →
                      </Link>
                    );
                  })()}
                  <Link href={`/deal/${d.id}`} className="deal-details">
                    Deal details →
                  </Link>
                </div>
              );
            })
          )}
        </section>

        {/* Hours */}
        {hours.length > 0 && (
          <section className="section" aria-label="Weekly hours">
            <div className="section-h">Hours</div>
            <div className="hours">
              {DAY_NAMES.map((day, i) => {
                const row = hours.find((h) => h.weekday === i);
                const isToday = i === todayIdx;
                const closed = !row || row.is_closed || !row.opens_at || !row.closes_at;
                return (
                  <div key={day} className={`hr ${isToday ? "hr-today" : ""}`}>
                    <span className={isToday ? "hr-today-day" : ""}>
                      {isToday && "● "}{day}
                    </span>
                    <span className={`${isToday ? "hr-today-t" : ""} ${closed ? "hr-closed" : ""}`}>
                      {closed ? "Closed" : `${formatTime(row!.opens_at)} – ${formatTime(row!.closes_at)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* About */}
        {(listing.long_description || listing.short_description) && (
          <section className="section" aria-label={`About ${name}`}>
            <div className="section-h">About</div>
            <div className="about">
              {listing.long_description || listing.short_description}
            </div>
          </section>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <section className="section" aria-label="Amenities">
            <div className="section-h">Amenities</div>
            <div className="amenities">
              {amenities.map((a) => (
                <span key={a} className="amenity">{a}</span>
              ))}
            </div>
          </section>
        )}

        {/* Claim CTA — subtle, non-intrusive */}
        <div className="claim-cta">
          Own {name}?{" "}
          <Link href={`/claim/${slug}`}>Claim this listing →</Link>
        </div>
      </main>
    </>
  );
}
