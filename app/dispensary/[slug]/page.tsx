// app/dispensary/[slug]/page.tsx
// Full dispensary profile page — SEO-forward, distinct from /l/[slug]
// which is the "GO HERE confirmation screen" for the core flow.
//
// This page ranks for "[Dispensary] deals" / "[Dispensary] hours" and
// serves as the bookmark/permalink destination for repeat visitors.

import Link from "next/link";
import { Band, HeroTicket, DealLine } from "../../components/gold/Kit";
import StoreAvatar from "@/app/components/StoreAvatar";
import { storeImageUrl } from "@/lib/storeImage";
import { getFeaturesForSlug, FEATURE_LABEL } from "@/lib/waysToBuy";
import AmenityRow from "../../components/AmenityRow";
import DealFreshnessBadge from "../../components/DealFreshnessBadge";
import ReportIssueLink from "../../components/ReportIssueLink";
import ReviewsSection from "../../components/ReviewsSection";
import TrustLine from "../../components/TrustLine";
import { dealContextTag } from "../../../lib/dealContext";
import { getListingDealHistory, historyIsMeaningful, dayCountsReliable } from "../../../lib/dealHistory";
import { getConfirmationsToday } from "../../../lib/confirmations";
import { getStoreAccuracy } from "../../../lib/dealAccuracy";
import DealAccuracy from "../../components/DealAccuracy";
import { getApprovedReviews, getReviewStats, reviewsEnabled } from "../../../lib/reviews";
import { MapPin, Phone, Menu as MenuIcon } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { brand } from "../../../lib/brand";
import { estimateSavings, formatSavingsDollars } from "../../../lib/dealScoring";
import { cleanDealTitle, amountOf, nearestExhale } from "../../../lib/exhale";
import ExhaleCard from "../../components/ExhaleCard";
import EmptyBreath from "../../components/EmptyBreath";
import OtdLine from "../../components/OtdLine";
import WatchControl from "../../components/WatchControl";
import { nowInCT, isOpen, formatTime as formatHourTime } from "../../../lib/hours";
import { visitDispensaryHref } from "../../../lib/links";
import { cityFromSlug } from "../../../lib/cityNormalize";
import { isInCentralIL } from "../../../lib/visibility";
import TrackPage from "../../components/TrackPage";
import { buildDispensaryLocalBusiness, nameWithCity } from "../../../lib/dispensarySchema";

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
  lat?: number | null;
  lng?: number | null;
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
  verified_at: string | null;
  status_reason: string | null;
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
    `master_listings?slug=eq.${encodeURIComponent(slug)}&project_tag=eq.green&is_active=eq.true&select=*&limit=1`
  );
  return rows && rows[0] ? rows[0] : null;
}

async function getHours(listingId: string): Promise<Hours[]> {
  const rows = await sbFetch<Hours[]>(
    `listing_hours?listing_id=eq.${encodeURIComponent(listingId)}&project_tag=eq.green&select=weekday,opens_at,closes_at,is_closed&order=weekday.asc`
  );
  return rows || [];
}

async function getDeals(slug: string): Promise<Deal[]> {
  const rows = await sbFetch<Deal[]>(
    `deals?listing_slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&project_tag=eq.green&select=id,title,description,category,discount_value,discount_unit,discount_type,original_price,sale_price,expires_at,is_recurring,source_url,verified_at,status_reason&order=discount_value.desc.nullslast&limit=500`
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

/** The always-visible part of a store-page deal card, under its tappable face. */
function StoreDealExtras({
  d,
  confirmedCount,
  visit,
  slug,
  hasWebsite,
  reportContext,
}: {
  d: Deal;
  confirmedCount: number;
  visit: { href: string; label: string };
  slug: string;
  hasWebsite: boolean;
  reportContext: string;
}) {
  return (
    <div className="sd-after">
      {confirmedCount > 0 && (
        <div className="confirmed">
          ✓ {confirmedCount} {confirmedCount === 1 ? "person" : "people"} confirmed this today
        </div>
      )}
      {d.description && <p className="deal-desc">{d.description}</p>}
      <div style={{ margin: "6px 0 8px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <DealFreshnessBadge verifiedAt={d.verified_at} statusReason={d.status_reason} />
        {d.source_url && (
          <a
            href={d.source_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--pp-muted)", textDecoration: "none" }}
          >
            Sourced from menu ↗
          </a>
        )}
      </div>
      <a
        href={visit.href}
        target="_blank"
        rel="noopener noreferrer"
        className="deal-cta"
        data-track={hasWebsite ? "website_tap" : "directions_tap"}
        data-track-slug={slug}
        data-track-deal={d.id}
        data-track-from="store_deal"
      >
        {visit.label}
      </a>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Link href={`/deal/${d.id}`} className="deal-details" data-track="deal_tap" data-track-slug={slug} data-track-deal={d.id} data-track-from="store">
          Deal details →
        </Link>
        <ReportIssueLink
          context={reportContext}
          url={`${brand.url}/dispensary/${slug}`}
          dealId={d.id}
        />
      </div>
    </div>
    );
}

function formatDealTitle(d: Deal): string {
  if (d.title) return cleanDealTitle(d.title);
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
    return { title: "Dispensary not found", robots: { index: false } };
  }
  // Central IL scope gate — non-CIL profile pages are hidden publicly.
  if (!isInCentralIL(listing.city)) {
    return { robots: { index: false, follow: false } };
  }
  const name = listing.name || slug;
  const city = listing.city || cityFromSlug(slug) || null;
  const title = `${nameWithCity(name, city)} — Deals, Hours & Directions`;
  const description = city
    ? `${name} in ${city}, IL. See current cannabis deals, full week hours, phone, and directions.`
    : `${name} — Illinois cannabis dispensary. See current deals, full week hours, phone, and directions.`;
  const url = `${brand.url}/dispensary/${slug}`;
  const safeImg = storeImageUrl(listing.logo_url, listing.slug);
  const ogImage = safeImg ? (safeImg.startsWith("/") ? `${brand.url}${safeImg}` : safeImg) : `${brand.url}/og-image.png`;
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
  // Central IL scope gate — non-CIL listings are hidden publicly.
  if (!isInCentralIL(listing.city)) notFound();

  const [hours, deals, reviews, reviewStats, reviewsOn, dealHistoryRaw] = await Promise.all([
    getHours(listing.id),
    getDeals(slug),
    getApprovedReviews(slug),
    getReviewStats(slug),
    reviewsEnabled(),
    getListingDealHistory(slug),
  ]);
  const waysToBuy = (await getFeaturesForSlug(slug)).filter((r) => r.status === "yes" || r.status === "announced");
  const dealHistory = historyIsMeaningful(dealHistoryRaw) ? dealHistoryRaw : null;
  const [confirmed, accuracy] = await Promise.all([getConfirmationsToday(deals.map((d) => d.id)), getStoreAccuracy(slug, deals)]);

  const ct = nowInCT();
  const status = todayOpenStatus(hours, ct);
  const name = listing.name || slug;
  const city = listing.city || cityFromSlug(slug) || null;
  const todayIdx = ct.weekday;

  // LocalBusiness schema (lib/dispensarySchema.ts) — real listing fields
  // only; sameAs is the store's own website, geo only when we have it.
  const schemaImage = storeImageUrl(listing.logo_url, listing.slug);
  const schemaLocal = buildDispensaryLocalBusiness({
    pageUrl: `${brand.url}/dispensary/${slug}`,
    ownHost: brand.domain,
    name,
    listing,
    image: schemaImage ? schemaImage.replace(/^\//, `${brand.url}/`) : null,
    hours,
    // Stars in search: only from real, approved PuffPrice-user reviews.
    ratingFields:
      reviewStats && reviewStats.review_count > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: reviewStats.avg_rating,
              reviewCount: reviewStats.review_count,
              bestRating: 5,
              worstRating: 1,
            },
            review: reviews.slice(0, 5).map((r) => ({
              "@type": "Review",
              reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
              author: { "@type": "Person", name: r.display_name || "PuffPrice user" },
              datePublished: r.created_at.slice(0, 10),
              ...(r.body ? { reviewBody: r.body } : {}),
            })),
          }
        : undefined,
  });

  // Amenity icons live in <AmenityRow /> per brand spec 2.5; this just
  // tracks whether anything qualifies so the section renders only when
  // there's at least one amenity to show.
  const hasAmenities = [
    listing.delivery,
    listing.online_ordering,
    listing.drive_thru,
    listing.atm_onsite,
    listing.wheelchair_accessible,
    listing.parking,
    listing.loyalty_program,
    listing.accepts_credit,
    listing.cash_only,
  ].some((v) => v === true);

  const citySlugStr = city ? city.toLowerCase().trim().replace(/\s+/g, "-") : null;
  const kitDeals = deals.map((d) => ({ ...d, deal_id: String(d.id), deal_title: d.title, name, slug, city, lat: listing.lat ?? null, lng: listing.lng ?? null }));
  const heroPick = nearestExhale(kitDeals, null);
  const heroId = heroPick?.deal.deal_id || null;
  const restDeals = kitDeals
    .filter((d) => d.deal_id !== heroId)
    .sort((a, b) => (amountOf(b)?.value || 0) - (amountOf(a)?.value || 0));
  const directions = listing.address1 ? mapsHref([listing.address1, listing.city, listing.state]) : null;
  const menuHref = listing.menu_url || listing.website || null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaLocal) }} />
      <TrackPage type="store_view" slug={slug} city={city} />

      <Band
        eyebrow={<Link href={citySlugStr ? `/city/${citySlugStr}` : "/deals"} style={{ color: "inherit", textDecoration: "none" }}>{city ? `← ${city} deals` : "← All deals"}</Link>}
        title={name}
        sub={listing.address1 ? `${listing.address1.replace(/,\s*IL\s*\d{5}.*$/, "")}${city && !listing.address1.includes(city) ? `, ${city}` : ""}` : city ? `${city}, IL` : "Illinois"}
      >
        <div className="g-stats">
          <span className="g-stat" style={{ color: status.open ? "#9fe3b4" : "#f2b48f", fontWeight: 700 }}>
            <span className={`g-dot${status.open ? "" : " closed"}`} />
            {status.label}
          </span>
          <span className="g-stat"><b>{deals.length}</b> deal{deals.length === 1 ? "" : "s"} today</span>
          {dealHistory?.best_discount_pct != null && <span className="g-stat">best seen <b>{dealHistory.best_discount_pct}%</b></span>}
        </div>
        <div className="g-sc-actions" style={{ marginTop: 18 }}>
          {directions && (
            <a className="g-btn g-btn-gold g-btn-sm" href={directions} target="_blank" rel="noopener noreferrer" data-track="directions_tap" data-track-slug={slug} data-track-from="store">
              <MapPin size={18} strokeWidth={2.2} /> Directions
            </a>
          )}
          {listing.phone && (
            <a className="g-btn g-btn-ghost g-btn-sm" href={`tel:${listing.phone}`} data-track="call_tap" data-track-slug={slug} data-track-from="store">
              <Phone size={18} strokeWidth={2.2} /> Call
            </a>
          )}
          {menuHref && (
            <a className="g-btn g-btn-ghost g-btn-sm" href={menuHref} target="_blank" rel="noopener noreferrer" data-track={listing.menu_url ? "order_tap" : "website_tap"} data-track-slug={slug} data-track-from="store">
              <MenuIcon size={18} strokeWidth={2.2} /> {listing.menu_url ? "Menu" : "Website"}
            </a>
          )}
        </div>
        {heroPick && <HeroTicket deal={heroPick.deal} miles={null} scope="near" label="Best deal here today" />}
      </Band>

      <main className="g-page">
        <div className="g-wrap">
          {waysToBuy.length > 0 && (
            <div className="g-block" aria-label="Ways to buy">
              <div className="g-near">
                {waysToBuy.map((w) => (
                  <Link key={w.feature} href={w.feature === "drive_thru" ? "/drive-thru" : w.feature === "medical" ? "/medical" : "/ways-to-buy#compare"} title={w.evidence}>
                    {w.status === "announced" ? "Coming: " : "✓ "}{FEATURE_LABEL[w.feature]}
                  </Link>
                ))}
              </div>
              <details className="g-rest">
                <summary>How we know</summary>
                <ul className="g-note" style={{ paddingLeft: 18 }}>
                  {waysToBuy.map((w) => (
                    <li key={w.feature}>
                      {FEATURE_LABEL[w.feature]}: {w.evidence} (<a href={w.source_url} target="_blank" rel="nofollow noopener noreferrer">store&apos;s site</a>, checked {new Date(w.verified_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" })})
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}

          <section className="g-block" aria-label="Active deals">
            <div className="g-eyebrow">On their own site today</div>
            <h2 className="g-display">{restDeals.length > 0 ? (heroPick ? "More deals here" : "Today's deals") : deals.length > 0 ? "That's the one deal today" : "No deal today"}</h2>
            {deals.length === 0 ? (
              <div className="g-answer">
                {name} doesn&apos;t have a deal on its own site today. We check every morning; watch this store below and we&apos;ll
                email you when one posts.
                <div className="g-near" style={{ marginTop: 12 }}>
                  {citySlugStr && <Link href={`/city/${citySlugStr}`}>See deals in {city}</Link>}
                  <Link href="/deals">Every deal today</Link>
                </div>
              </div>
            ) : restDeals.length > 0 ? (
              <div className="g-group">
                <div className="g-lines">
                  {restDeals.slice(0, 8).map((d) => (
                    <DealLine key={d.deal_id} deal={d} href={`/deal/${d.deal_id}`} />
                  ))}
                </div>
                {restDeals.length > 8 && (
                  <details className="g-rest">
                    <summary>{restDeals.length - 8} more deals here</summary>
                    <div className="g-lines">
                      {restDeals.slice(8).map((d) => (
                        <DealLine key={d.deal_id} deal={d} href={`/deal/${d.deal_id}`} />
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ) : null}
            {dealHistory && (
              <div className="g-near" style={{ marginTop: 14 }}>
                {dayCountsReliable() && <span className="g-chip">{dealHistory.deal_days_30d} of the last 30 days with a deal</span>}
                {dealHistory.typical_discount_pct != null && <span className="g-chip">Typical {dealHistory.typical_discount_pct}% off</span>}
              </div>
            )}
            {deals.length > 0 && <TrustLine />}
            <DealAccuracy accuracy={accuracy} />
            {heroId && (confirmed[heroId] || 0) > 0 && (
              <p className="g-note">✓ {confirmed[heroId]} {confirmed[heroId] === 1 ? "person" : "people"} confirmed the top deal today</p>
            )}
            <div style={{ marginTop: 14 }}>
              <WatchControl kind="store" slug={slug} storeName={name} />
            </div>
          </section>

          {hours.length > 0 && (
            <section className="g-block" aria-label="Weekly hours">
              <div className="g-eyebrow">When to go</div>
              <h2 className="g-display">Hours</h2>
              <div className="g-hours">
                {DAY_NAMES.map((day, i) => {
                  const row = hours.find((h) => h.weekday === i);
                  const isToday = i === todayIdx;
                  const closed = !row || row.is_closed || !row.opens_at || !row.closes_at;
                  return (
                    <div key={day} className={`g-hr${isToday ? " today" : ""}`}>
                      <span>{day}{isToday ? " · today" : ""}</span>
                      <span>{closed ? "Closed" : `${formatTime(row!.opens_at)} – ${formatTime(row!.closes_at)}`}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {(listing.long_description || listing.short_description) && (
            <section className="g-block" aria-label={`About ${name}`}>
              <div className="g-eyebrow">The store</div>
              <h2 className="g-display">About {name}</h2>
              <p className="g-answer" style={{ borderLeftColor: "var(--g-line-ink)" }}>{listing.long_description || listing.short_description}</p>
            </section>
          )}

          {hasAmenities && (
            <section className="g-block" aria-label="Amenities">
              <div className="g-eyebrow">Good to know</div>
              <AmenityRow listing={listing} variant="pill" />
            </section>
          )}

          <div className="g-block">
            <ReviewsSection slug={slug} name={name} reviews={reviews} stats={reviewStats} enabled={reviewsOn} />
          </div>

          <p className="g-block g-note">
            Own {name}? <Link href={`/claim/${slug}`}>Claim this listing</Link>
          </p>
        </div>
      </main>
    </>
  );
}
