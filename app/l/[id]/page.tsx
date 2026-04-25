export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ClaimForm from "../../components/ClaimForm";
import RecentlyViewedTracker from "../../components/RecentlyViewedTracker";
import ShareDealButton from "../../components/ShareDealButton";
import { estimateSavings } from "../../../lib/dealScoring";
import DealFreshnessBadge from "../../components/DealFreshnessBadge";
import { nowInCT, isOpen, formatTime as formatHourTime } from "../../../lib/hours";
import { isInCentralIL } from "../../../lib/visibility";

const NOINDEX_SLUGS = [
  "emerald-city-dispensary-chicago-il",
  "emerald-leaf-collective-chicago-il",
  "lakefront-cannabis-co-chicago-il",
];

type Listing = {
  id: string;
  project_tag: string;
  type: string | null;
  name: string | null;
  slug: string | null;
  city: string | null;
  state: string | null;
  address1: string | null;
  phone: string | null;
  website: string | null;
  short_description: string | null;
  long_description: string | null;
  plan: string | null;
  claimed: boolean | null;
  logo_url: string | null;
  hero_image_url: string | null;
  lat: number | string | null;
  lng: number | string | null;
  delivery: boolean | null;
  drive_thru: boolean | null;
  online_ordering: boolean | null;
  accepts_credit: boolean | null;
  cash_only: boolean | null;
  atm_onsite: boolean | null;
  wheelchair_accessible: boolean | null;
  parking: boolean | null;
  loyalty_program: boolean | null;
  meta_title: string | null;
  meta_description: string | null;
};

type ListingHour = {
  id?: number;
  project_tag: string;
  listing_id: string;
  weekday: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean | null;
};

type ListingAttribute = {
  id?: number;
  project_tag: string;
  listing_id: string;
  tag: string;
};

type ProductOrService = {
  id?: number;
  project_tag: string;
  listing_id: string;
  category: string;
  subcategory: string;
  available: boolean | null;
};

// Env var resolution — resilient to the SUPABASE_SERVICE_KEY →
// SUPABASE_SERVICE_ROLE_KEY rename that landed in code but may not have
// landed in Vercel yet, AND to the case where neither service-role key
// is configured at all. Falls back to the anon key (same hardcoded
// fallback used across the rest of the app) so public read paths on
// master_listings / listing_hours / deals continue to work.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";

const SUPABASE_ANON_KEY_FALLBACK =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  SUPABASE_ANON_KEY_FALLBACK;

const REST_BASE = `${SUPABASE_URL}/rest/v1`;

async function fetchJson<T>(path: string): Promise<T | null> {
  // Returns null on error instead of throwing. The listing page has many
  // data calls; one row-level failure shouldn't crash the entire Server
  // Component. Callers fall back to empty/null and the page still renders.
  try {
    const res = await fetch(`${REST_BASE}${path}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[/l/[id]] fetch failed", res.status, path);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error("[/l/[id]] fetch error", path, err);
    return null;
  }
}

async function getListing(id: string): Promise<Listing | null> {
  const rows = await fetchJson<Listing[]>(
    `/master_listings?slug=eq.${encodeURIComponent(id)}&project_tag=eq.green&is_active=eq.true&select=*`
  );
  return rows?.[0] ?? null;
}

async function getHours(listingId: string): Promise<ListingHour[]> {
  const rows = await fetchJson<ListingHour[]>(
    `/listing_hours?listing_id=eq.${encodeURIComponent(listingId)}&select=*&order=weekday.asc`
  );
  return rows ?? [];
}

async function getAttributes(listingId: string): Promise<ListingAttribute[]> {
  const rows = await fetchJson<ListingAttribute[]>(
    `/listing_attributes?listing_id=eq.${encodeURIComponent(listingId)}&select=*&order=tag.asc`
  );
  return rows ?? [];
}

async function getProducts(listingId: string): Promise<ProductOrService[]> {
  const rows = await fetchJson<ProductOrService[]>(
    `/products_or_services?listing_id=eq.${encodeURIComponent(listingId)}&select=*&order=category.asc,subcategory.asc`
  );
  return rows ?? [];
}

type ActiveDeal = {
  id?: string;
  title?: string;
  description?: string | null;
  category?: string | null;
  discount_value?: number | null;
  discount_unit?: string | null;
  discount_type?: string | null;
  original_price?: number | null;
  sale_price?: number | null;
  expires_at?: string | null;
  is_recurring?: boolean | null;
  verified_at?: string | null;
  status_reason?: string | null;
};

async function getTopActiveDeal(slug: string): Promise<ActiveDeal | null> {
  try {
    const rows = await fetchJson<ActiveDeal[]>(
      `/deals?listing_slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&project_tag=eq.green&select=id,title,description,category,discount_value,discount_unit,discount_type,original_price,sale_price,expires_at,is_recurring,verified_at,status_reason&order=discount_value.desc&limit=1`
    );
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

async function getAllActiveDeals(slug: string): Promise<ActiveDeal[]> {
  try {
    const rows = await fetchJson<ActiveDeal[]>(
      `/deals?listing_slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&project_tag=eq.green&select=id,title,description,category,discount_value,discount_unit,discount_type,original_price,sale_price,expires_at,is_recurring,verified_at,status_reason&order=discount_value.desc&limit=10`
    );
    // Dedup by (title) just in case the DB dedupe migration hasn't run yet
    const seen = new Set<string>();
    return (rows ?? []).filter((d) => {
      const k = d.title || "";
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  } catch {
    return [];
  }
}

type RecentDealRow = {
  discount_value: number | null;
  discount_unit: string | null;
  discount_type: string | null;
  original_price: number | null;
  sale_price: number | null;
};

type RecentDealStats = {
  count: number;
  avgSavings: number | null;
};

async function getRecentDealStats(slug: string): Promise<RecentDealStats> {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const rows = await fetchJson<RecentDealRow[]>(
      `/deals?listing_slug=eq.${encodeURIComponent(slug)}&project_tag=eq.green&created_at=gte.${encodeURIComponent(since)}&select=discount_value,discount_unit,discount_type,original_price,sale_price`
    );
    if (!rows || rows.length === 0) return { count: 0, avgSavings: null };
    const savings = rows
      .map((r) => estimateSavings(r))
      .filter((v): v is number => typeof v === "number" && v > 0);
    if (savings.length === 0) {
      return { count: rows.length, avgSavings: null };
    }
    const avg = savings.reduce((a, b) => a + b, 0) / savings.length;
    return { count: rows.length, avgSavings: Math.round(avg) };
  } catch {
    return { count: 0, avgSavings: null };
  }
}

/**
 * Extract a promo code or produce a plain-English instruction.
 * Used on every deal card so "information" becomes "action".
 */
function howToUseDeal(d: ActiveDeal | null | undefined): string {
  if (!d) return "No code needed — deal applies at checkout";
  const body = `${d.title || ""} ${d.description || ""}`.toLowerCase();
  // Look for common promo code patterns: "code XXXX", "use XXXX", "promo XXXX"
  const codeMatch = body.match(/\b(?:code|use|promo)\s+([A-Z0-9]{3,15})\b/i);
  if (codeMatch) return `Use code ${codeMatch[1].toUpperCase()} at checkout`;
  if (/first[\s-]?time|new\s+customer/i.test(body)) {
    return "For new customers only — mention PuffPrice at checkout";
  }
  if (/specific|select|chosen|only on|limited to/i.test(body)) {
    return "Ask the budtender for this deal by name";
  }
  // Default — applies automatically / verbal mention
  return "No code needed — deal applies at checkout";
}

/**
 * Map a Google Maps search URL for a dispensary address. Works with
 * partial addresses ("504 Riverside Dr, East Peoria, IL") — Google
 * resolves whatever is available.
 */
function mapsHref(parts: Array<string | null | undefined>): string {
  const q = parts.filter(Boolean).join(", ");
  return `https://maps.google.com/?q=${encodeURIComponent(q)}`;
}

async function getRelated(city: string, currentId: string): Promise<Listing[]> {
  // master_listings is shared across multiple projects (PuffPrice + bid +
  // rent + ...). Without project_tag/state/is_active filters this query
  // surfaced apartments and public-works listings as "Other dispensaries
  // in [city]". Scope tightly to active green-tag IL rows only.
  const rows = await fetchJson<Listing[]>(
    `/master_listings?city=eq.${encodeURIComponent(city)}&id=neq.${encodeURIComponent(currentId)}&project_tag=eq.green&state=eq.IL&is_active=eq.true&select=id,name,slug,city,state,type,short_description,logo_url&limit=3`
  );
  return rows ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const isNoIndex = NOINDEX_SLUGS.includes(id);

  if (isNoIndex) {
    return { robots: { index: false, follow: false } };
  }

  const listing = await getListing(id);
  if (!listing) {
    return { robots: { index: false, follow: false } };
  }
  // Central IL scope gate — non-CIL listings are hidden publicly.
  if (!isInCentralIL(listing.city)) {
    return { robots: { index: false, follow: false } };
  }

  const title = listing.meta_title ||
    `${listing.name} — Current Deals & Directions | PuffPrice`;
  const description = listing.meta_description ||
    listing.short_description ||
    `Current deals and directions for ${listing.name}. Save on cannabis in ${listing.city}, IL.`;
  const canonicalUrl = `https://www.puffprice.com/l/${listing.slug}`;
  const image = listing.logo_url || listing.hero_image_url;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "PuffPrice",
      type: "website",
      ...(image ? { images: [{ url: image, alt: (listing.name ?? "") + " logo" }] } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

const formatTime = formatHourTime;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getTodayStatus(hours: ListingHour[], ct: ReturnType<typeof nowInCT>): { open: boolean; label: string } {
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

function buildSchemaOrg(listing: Listing, hours: ListingHour[]) {
  const openingHours = hours
    .filter((h) => !h.is_closed && h.opens_at && h.closes_at)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][h.weekday],
      opens: h.opens_at?.substring(0, 5),
      closes: h.closes_at?.substring(0, 5),
    }));

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: listing.name,
    ...(listing.address1 ? {
      address: {
        "@type": "PostalAddress",
        streetAddress: listing.address1,
        addressLocality: listing.city,
        addressRegion: listing.state,
        addressCountry: "US",
      }
    } : {}),
    ...(listing.phone ? { telephone: listing.phone } : {}),
    url: listing.website ?? `https://www.puffprice.com/l/${listing.slug}`,
    ...(listing.logo_url ? { image: listing.logo_url } : {}),
    ...(openingHours.length > 0 ? { openingHoursSpecification: openingHours } : {}),
    ...(listing.short_description ? { description: listing.short_description } : {}),
    sameAs: [`https://www.puffprice.com/l/${listing.slug}`],
  });
}

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const rawFromCity = Array.isArray(sp?.from) ? sp.from[0] : sp?.from;
  const rawCity = Array.isArray(sp?.city) ? sp.city[0] : sp?.city;
  const fromCity = rawFromCity || rawCity || null;
  const isNoIndex = NOINDEX_SLUGS.includes(id);
  const listing = await getListing(id);

  if (!listing) {
    // Not in DB, or is_active=false. Return a real 404 — the previous
    // inline "Listing not found" screen rendered as 200 OK, which made
    // deactivated rows look live to crawlers and analytics.
    notFound();
  }

  // Central IL scope gate — non-CIL listings are hidden publicly.
  if (!isInCentralIL(listing.city)) {
    notFound();
  }

  const [hours, attributes, products, related, activeDeals, recentStats] = await Promise.all([
    getHours(listing.id),
    getAttributes(listing.id),
    getProducts(listing.id),
    listing.city ? getRelated(listing.city, listing.id) : Promise.resolve([]),
    listing.slug ? getAllActiveDeals(listing.slug) : Promise.resolve([] as ActiveDeal[]),
    listing.slug ? getRecentDealStats(listing.slug) : Promise.resolve({ count: 0, avgSavings: null } as RecentDealStats),
  ]);
  const activeDeal: ActiveDeal | null = activeDeals[0] ?? null;

  const ct = nowInCT();
  const todayStatus = getTodayStatus(hours, ct);
  const isClaimed = listing.claimed === true;
  const initial = (listing.name ?? "?").charAt(0).toUpperCase();
  const schemaOrg = buildSchemaOrg(listing, hours);
  const dealAnnouncements = activeDeals.slice(0, 3).map((d) => JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SpecialAnnouncement",
    name: d.title || "Cannabis deal",
    text: d.description || d.title || "Deal at this dispensary",
    ...(d.expires_at ? { expires: d.expires_at } : {}),
    category: "https://schema.org/SpecialAnnouncement",
    announcementLocation: {
      "@type": "LocalBusiness",
      name: listing.name,
      ...(listing.city
        ? { address: `${listing.city}, IL` }
        : {}),
    },
  }));

  // Back link context — honor ?from= / ?city= if the GO HERE click
  // came from a city-filtered deal page. Otherwise fall back to the
  // listing's own city, finally the generic deals page.
  const backCity = fromCity || listing.city || null;
  const backHref = backCity
    ? `/deals/all?city=${encodeURIComponent(backCity)}`
    : "/deals/all";
  const backLabel = backCity ? `← Back to ${backCity} deals` : "← Back to deals";

  const productsByCategory = products.reduce<Record<string, ProductOrService[]>>((acc, p) => {
    const cat = p.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

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
        dangerouslySetInnerHTML={{ __html: schemaOrg }}
      />
      {dealAnnouncements.map((s, i) => (
        <script
          key={`sa-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: s }}
        />
      ))}
      {!isNoIndex && listing.slug && (
        <RecentlyViewedTracker
          slug={listing.slug}
          name={listing.name ?? listing.slug}
          city={listing.city ?? ""}
        />
      )}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .dn-root { min-height: 100vh; background: #f7f6f2; font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; }
        .dn-nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; background: #fff; border-bottom: 1px solid #e8e5de; position: sticky; top: 0; z-index: 50; }
        .dn-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .dn-nav-dot { width: 10px; height: 10px; border-radius: 50%; background: #16a34a; display: inline-block; flex-shrink: 0; }
        .dn-nav-name { font-size: 1.1rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.02em; }
        .dn-nav-accent { color: #16a34a; }
        .dn-nav-back { font-size: 0.85rem; color: #6b7280; text-decoration: none; font-family: system-ui, sans-serif; }
        .dn-banner { background: #fffbeb; border-bottom: 1px solid #fde68a; padding: 10px 32px; display: flex; align-items: center; gap: 10px; }
        .dn-banner-dot { width: 8px; height: 8px; border-radius: 50%; background: #d97706; flex-shrink: 0; }
        .dn-banner-text { font-size: 0.85rem; color: #92400e; font-family: system-ui, sans-serif; }
        .dn-banner-link { color: #d97706; font-weight: 600; text-decoration: none; }
        .dn-noindex-banner { background: #f0fdf4; border-bottom: 1px solid #bbf7d0; padding: 8px 32px; text-align: center; font-size: 0.78rem; color: #166534; font-family: system-ui, sans-serif; }
        .dn-inner { max-width: 1100px; margin: 0 auto; padding: 32px 24px 64px; }
        .dn-hero { background: #fff; border-radius: 16px; border: 1px solid #e8e5de; padding: 32px; margin-bottom: 24px; }
        .dn-hero-top { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
        .dn-logo-wrap { flex-shrink: 0; width: 80px; height: 80px; border-radius: 12px; overflow: hidden; border: 1px solid #e8e5de; background: #f7f6f2; display: flex; align-items: center; justify-content: center; }
        .dn-logo-img { width: 100%; height: 100%; object-fit: contain; padding: 8px; }
        .dn-logo-fallback { font-size: 2rem; font-weight: 700; color: #16a34a; font-family: Georgia, serif; }
        .dn-hero-info { flex: 1; min-width: 200px; }
        .dn-hero-meta { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
        .dn-badge-type { font-size: 0.7rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #16a34a; background: #dcfce7; padding: 3px 10px; border-radius: 100px; }
        .dn-badge-featured { font-size: 0.7rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #854d0e; background: #fef9c3; padding: 3px 10px; border-radius: 100px; }
        .dn-hero-name { font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 700; letter-spacing: -0.03em; color: #0f1f3d; margin-bottom: 6px; line-height: 1.1; }
        .dn-hero-location { font-size: 0.9rem; color: #6b7280; font-family: system-ui, sans-serif; margin-bottom: 8px; }
        .dn-hero-tagline { font-size: 0.95rem; color: #374151; font-family: system-ui, sans-serif; line-height: 1.6; max-width: 480px; }
        .dn-hero-actions { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; min-width: 180px; }
        .dn-status { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 100px; font-size: 0.8rem; font-family: system-ui, sans-serif; font-weight: 600; }
        .dn-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .dn-status-open { background: #dcfce7; color: #14532d; }
        .dn-status-dot-open { background: #16a34a; }
        .dn-status-closed { background: #fee2e2; color: #991b1b; }
        .dn-status-dot-closed { background: #dc2626; }
        .dn-phone { font-size: 0.9rem; color: #0f1f3d; text-decoration: none; font-family: system-ui, sans-serif; font-weight: 600; }
        .dn-website { font-size: 0.85rem; color: #16a34a; text-decoration: none; font-family: system-ui, sans-serif; font-weight: 600; }
        .dn-amenities { margin-top: 24px; padding-top: 20px; border-top: 1px solid #f0ede6; display: flex; flex-wrap: wrap; gap: 8px; }
        .dn-amenity { font-size: 0.78rem; font-family: system-ui, sans-serif; color: #374151; background: #f7f6f2; border: 1px solid #e8e5de; padding: 4px 12px; border-radius: 100px; }
        .dn-grid { display: grid; grid-template-columns: 1fr 360px; gap: 20px; align-items: start; }
        .dn-col { display: flex; flex-direction: column; gap: 20px; }
        .dn-card { background: #fff; border-radius: 16px; border: 1px solid #e8e5de; padding: 24px; }
        .dn-card-title { font-size: 0.7rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3af; margin-bottom: 16px; }
        .dn-empty { font-size: 0.875rem; color: #9ca3af; font-family: system-ui, sans-serif; }
        .dn-hours-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
        .dn-hours-row-today { background: #f0fdf4; border-radius: 8px; padding: 6px 10px; margin: 0 -10px; }
        .dn-hours-day { font-size: 0.875rem; font-family: system-ui, sans-serif; font-weight: 500; color: #374151; display: flex; align-items: center; gap: 6px; }
        .dn-hours-day-today { font-weight: 700; color: #14532d; }
        .dn-today-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #16a34a; }
        .dn-hours-time { font-size: 0.875rem; font-family: system-ui, sans-serif; color: #374151; }
        .dn-hours-time-today { color: #14532d; font-weight: 600; }
        .dn-hours-closed { color: #9ca3af; }
        .dn-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .dn-tag { font-size: 0.8rem; font-family: system-ui, sans-serif; font-weight: 500; color: #0f1f3d; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 5px 14px; border-radius: 100px; text-transform: capitalize; }
        .dn-product-cat { margin-bottom: 16px; }
        .dn-product-cat-label { font-size: 0.7rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
        .dn-product-items { display: flex; flex-wrap: wrap; gap: 6px; }
        .dn-product-item { font-size: 0.8rem; font-family: system-ui, sans-serif; color: #374151; background: #f7f6f2; border: 1px solid #e8e5de; padding: 4px 12px; border-radius: 6px; }
        .dn-about { font-size: 0.925rem; line-height: 1.75; color: #374151; font-family: system-ui, sans-serif; }
        .dn-claim-card { background: #0f1f3d; border-radius: 16px; padding: 28px; border: 1px solid #1e3a5f; }
        .dn-claim-header { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 16px; }
        .dn-claim-icon { width: 40px; height: 40px; border-radius: 10px; background: #dcfce7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1.1rem; }
        .dn-claim-title { font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 2px; letter-spacing: -0.01em; }
        .dn-claim-sub { font-size: 0.78rem; color: #a3e635; font-family: system-ui, sans-serif; font-weight: 600; }
        .dn-claim-body { font-size: 0.875rem; color: #94a3b8; font-family: system-ui, sans-serif; line-height: 1.65; margin-bottom: 20px; }
        .dn-claim-trust { display: flex; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #1e3a5f; flex-wrap: wrap; }
        .dn-claim-trust-item { font-size: 0.75rem; color: #64748b; font-family: system-ui, sans-serif; }
        .dn-trust-card { background: #f0fdf4; border-radius: 16px; padding: 20px 24px; border: 1px solid #bbf7d0; }
        .dn-trust-title { font-size: 0.7rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #14532d; margin-bottom: 12px; }
        .dn-trust-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .dn-trust-item { font-size: 0.825rem; color: #166534; font-family: system-ui, sans-serif; line-height: 1.4; }
        .dn-related { margin-top: 0; }
        .dn-related-grid { display: flex; flex-direction: column; gap: 12px; }
        .dn-related-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f7f6f2; border-radius: 10px; border: 1px solid #e8e5de; text-decoration: none; }
        .dn-related-card:hover { border-color: #16a34a; background: #f0fdf4; }
        .dn-related-logo { width: 36px; height: 36px; border-radius: 8px; background: #fff; border: 1px solid #e8e5de; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; color: #16a34a; flex-shrink: 0; }
        .dn-related-img { width: 100%; height: 100%; object-fit: contain; padding: 4px; border-radius: 6px; }
        .dn-related-name { font-size: 0.875rem; font-weight: 600; color: #0f1f3d; font-family: system-ui, sans-serif; }
        .dn-related-city { font-size: 0.75rem; color: #6b7280; font-family: system-ui, sans-serif; }
        .dn-footer-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e8e5de; flex-wrap: wrap; gap: 12px; }
        .dn-footer-back { font-size: 0.85rem; color: #6b7280; text-decoration: none; font-family: system-ui, sans-serif; }
        .dn-footer-fwd { font-size: 0.85rem; color: #16a34a; text-decoration: none; font-family: system-ui, sans-serif; font-weight: 600; }
        .dn-footer { background: #0f1f3d; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .dn-footer-brand { font-size: 1rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; font-family: Georgia, serif; }
        .dn-footer-note { font-size: 0.78rem; color: #475569; font-family: system-ui, sans-serif; }
        /* DEAL HISTORY STAT STRIP — matches homepage stats treatment */
        .dn-stats-strip { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 4px; }
        .dn-stat-cell { padding: 4px 0; }
        .dn-stat-num { font-family: Georgia, serif; font-size: clamp(1.8rem, 4vw, 2.3rem); font-weight: 700; color: #0f1f3d; letter-spacing: -0.03em; line-height: 1; }
        .dn-stat-num-accent { color: #16a34a; }
        .dn-stat-label { font-family: system-ui, sans-serif; font-size: 0.78rem; color: #6b7280; margin-top: 6px; letter-spacing: 0.01em; }
        .dn-stat-foot { font-family: system-ui, sans-serif; font-size: 0.74rem; color: #9ca3af; margin-top: 14px; }

        /* ABOUT (structured description) — serif prose, proper measure */
        .dn-about-prose { font-family: Georgia, serif; font-size: 1rem; line-height: 1.65; color: #1f2937; max-width: 65ch; }
        .dn-about-prose p + p { margin-top: 12px; }
        .dn-about-foot { font-family: system-ui, sans-serif; font-size: 0.76rem; color: #9ca3af; margin-top: 16px; padding-top: 12px; border-top: 1px solid #f0ede6; }

        /* REPORT OUTDATED — footer-style, subtle */
        .dn-report-row { margin-top: 8px; padding: 12px 0 0; text-align: center; }
        .dn-report-text { font-family: system-ui, sans-serif; font-size: 0.76rem; color: #9ca3af; }
        .dn-report-link { color: #6b7280; text-decoration: underline; text-decoration-color: #e8e5de; text-underline-offset: 3px; font-weight: 500; border-radius: 2px; }
        .dn-report-link:hover { color: #16a34a; text-decoration-color: #16a34a; }
        .dn-report-link:focus-visible { outline: 2px solid #16a34a; outline-offset: 3px; color: #16a34a; }

        /* LOGO refinements — 64px with cleaner monogram fallback */
        .dn-logo-wrap { width: 64px; height: 64px; border-radius: 14px; }
        .dn-logo-fallback { font-size: 1.7rem; }
        .dn-logo-fallback-mono { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f1f3d, #1e3a5f); color: #4ade80; font-family: Georgia, serif; font-weight: 700; font-size: 1.7rem; letter-spacing: -0.02em; }

        /* MAP EMBED */
        .dn-map-card { padding: 0; overflow: hidden; }
        .dn-map-header { padding: 20px 24px 14px; border-bottom: 1px solid #f0ede6; }
        .dn-map-iframe { display: block; width: 100%; height: 200px; border: 0; }
        @media (min-width: 900px) {
          .dn-map-iframe { height: 300px; }
        }

        @media (max-width: 768px) {
          .dn-nav { padding: 14px 20px; }
          .dn-inner { padding: 20px 16px 48px; }
          .dn-hero { padding: 20px; }
          .dn-grid { grid-template-columns: 1fr; }
          .dn-hero-actions { flex-direction: row; flex-wrap: wrap; align-items: center; }
          .dn-banner { padding: 10px 20px; }
        }
      `}</style>

      <div className="dn-root">
        <div className="top-stripe" aria-hidden="true" style={{ height: 4, background: "#16a34a", width: "100%" }} />
        <nav className="dn-nav">
          <Link href="/" className="dn-nav-brand">
            <span className="dn-nav-dot" aria-hidden="true" />
            <span className="dn-nav-name">puff<span className="dn-nav-accent">price</span></span>
          </Link>
          <Link href={backHref} className="dn-nav-back">{backLabel}</Link>
        </nav>

        {isNoIndex && (
          <div className="dn-noindex-banner">
            This listing is pending verification and is not publicly indexed.
          </div>
        )}

        {activeDeals.length > 0 && (
          <div style={{
            maxWidth: 900,
            margin: "20px auto 0",
            padding: "0 20px",
            fontFamily: "system-ui, sans-serif",
          }}>
            <div style={{
              background: "#fff",
              border: "1px solid #e8e5de",
              borderLeft: "4px solid #16a34a",
              borderRadius: 14,
              padding: "22px 22px 18px",
              boxShadow: "0 4px 16px rgba(15,31,61,.06)",
            }}>
              <div style={{
                fontSize: ".68rem",
                letterSpacing: ".14em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: "#16a34a",
                marginBottom: 6,
              }}>
                Active deal{activeDeals.length > 1 ? "s" : ""} today
              </div>
              <div style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#0f1f3d",
                lineHeight: 1.3,
                marginBottom: 4,
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                flexWrap: "wrap",
              }}>
                <span>{activeDeal!.title}</span>
                {(() => {
                  const exp = activeDeal!.expires_at;
                  if (!exp) return null;
                  const t = new Date(exp).getTime();
                  if (!Number.isFinite(t)) return null;
                  const hoursLeft = Math.floor((t - Date.now()) / 3_600_000);
                  if (hoursLeft <= 0 || hoursLeft > 24) return null;
                  return (
                    <span
                      style={{
                        fontSize: ".68rem",
                        fontFamily: "system-ui,sans-serif",
                        fontWeight: 700,
                        color: "#92400e",
                        background: "#fef3c7",
                        padding: "2px 9px",
                        borderRadius: 100,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ⚡ Expires in {hoursLeft}h
                    </span>
                  );
                })()}
              </div>
              {activeDeal!.description && (
                <p style={{
                  fontSize: ".88rem",
                  color: "#374151",
                  lineHeight: 1.5,
                  marginBottom: 10,
                }}>
                  {activeDeal!.description}
                </p>
              )}
              <div style={{
                fontSize: ".82rem",
                color: "#16a34a",
                fontWeight: 600,
                marginBottom: 12,
              }}>
                → {howToUseDeal(activeDeal)}
              </div>
              <div style={{ marginBottom: 12 }}>
                <DealFreshnessBadge
                  verifiedAt={(activeDeal as any).verified_at}
                  statusReason={(activeDeal as any).status_reason}
                />
              </div>
              {activeDeal!.id && (
                <ShareDealButton
                  dealId={activeDeal!.id}
                  dispensaryName={listing.name || listing.slug || "Dispensary"}
                  dealTitle={activeDeal!.title || "Deal"}
                  savings={estimateSavings(activeDeal) ?? null}
                  variant="block"
                />
              )}
              {activeDeals.length > 1 && (
                <details style={{ marginTop: 10 }}>
                  <summary style={{ fontSize: ".8rem", color: "#6b7280", cursor: "pointer" }}>
                    +{activeDeals.length - 1} more active deal{activeDeals.length - 1 > 1 ? "s" : ""}
                  </summary>
                  <ul style={{ listStyle: "none", marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                    {activeDeals.slice(1).map((d) => (
                      <li key={d.id || d.title} style={{ padding: "10px 12px", background: "#f5f4f0", borderRadius: 8 }}>
                        <div style={{ fontWeight: 600, color: "#0f1f3d", fontSize: ".9rem" }}>{d.title}</div>
                        {d.description && (
                          <div style={{ fontSize: ".78rem", color: "#6b7280", marginTop: 2 }}>{d.description}</div>
                        )}
                        <div style={{ fontSize: ".74rem", color: "#16a34a", marginTop: 4 }}>
                          → {howToUseDeal(d)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        )}

        {!isClaimed && !isNoIndex && (
          <div className="dn-banner">
            <span className="dn-banner-dot" aria-hidden="true" />
            <span className="dn-banner-text">
              This listing hasn&apos;t been claimed yet.{" "}
              <a href="#claim" className="dn-banner-link">Is this your business? Claim it free →</a>
            </span>
          </div>
        )}

        <div className="dn-inner">
          <div className="dn-hero">
            <div className="dn-hero-top">
              <div className="dn-logo-wrap">
                {listing.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={listing.logo_url} alt={`${listing.name ?? "Dispensary"} logo`} className="dn-logo-img" width={80} height={80} loading="lazy" decoding="async" />
                ) : (
                  <span className="dn-logo-fallback-mono" role="img" aria-label={`${listing.name ?? "Dispensary"} monogram`}>{initial}</span>
                )}
              </div>

              <div className="dn-hero-info">
                <div className="dn-hero-meta">
                  <span className="dn-badge-type">{listing.type ?? "Dispensary"}</span>
                  {listing.plan === "boost" || listing.plan === "featured" ? (
                    <span className="dn-badge-featured">★ Featured</span>
                  ) : null}
                </div>
                <h1 className="dn-hero-name">{listing.name ?? "Unnamed Listing"}</h1>
                {(listing.address1 || listing.city) ? (
                  <a
                    href={mapsHref([listing.address1, listing.city, listing.state])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dn-hero-location"
                    style={{ textDecoration: "none", color: "#16a34a", fontWeight: 600, display: "block" }}
                  >
                    {listing.address1 && <span style={{ display: "block" }}>📍 {listing.address1}</span>}
                    {(listing.city || listing.state) && (
                      <span style={{ display: "block", whiteSpace: "nowrap" }}>
                        {[listing.city, listing.state].filter(Boolean).join(", ")} · Get directions →
                      </span>
                    )}
                  </a>
                ) : (
                  <p className="dn-hero-location">Illinois</p>
                )}
                {listing.short_description && (
                  <p className="dn-hero-tagline">{listing.short_description}</p>
                )}
              </div>

              <div className="dn-hero-actions">
                <span className={`dn-status ${todayStatus.open ? "dn-status-open" : "dn-status-closed"}`}>
                  <span className={`dn-status-dot ${todayStatus.open ? "dn-status-dot-open" : "dn-status-dot-closed"}`} aria-hidden="true" />
                  {todayStatus.label}
                </span>
                {listing.phone && (
                  <a href={`tel:${listing.phone}`} className="dn-phone">{listing.phone}</a>
                )}
                {listing.website && (
                  <a href={listing.website} target="_blank" rel="noopener noreferrer" className="dn-website">
                    Visit website →
                  </a>
                )}
              </div>
            </div>

            {amenities.length > 0 && (
              <div className="dn-amenities">
                {amenities.map((a) => (
                  <span key={a} className="dn-amenity">{a}</span>
                ))}
              </div>
            )}
          </div>

          <div className="dn-grid">
            <div className="dn-col">
              <div className="dn-card">
                <p className="dn-card-title">Hours</p>
                {hours.length === 0 ? (
                  <p className="dn-empty">Hours not available yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {DAYS.map((day, idx) => {
                      const row = hours.find((h) => h.weekday === idx);
                      const isToday = ct.weekday === idx;
                      const closed = !row || row.is_closed || (!row.opens_at && !row.closes_at);
                      return (
                        <div key={day} className={`dn-hours-row${isToday ? " dn-hours-row-today" : ""}`}>
                          <span className={`dn-hours-day${isToday ? " dn-hours-day-today" : ""}`}>
                            {day}{isToday && <span className="dn-today-dot" />}
                          </span>
                          <span className={`dn-hours-time${closed ? " dn-hours-closed" : isToday ? " dn-hours-time-today" : ""}`}>
                            {closed ? "Closed" : `${formatTime(row?.opens_at ?? null)} – ${formatTime(row?.closes_at ?? null)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {attributes.length > 0 && (
                <div className="dn-card">
                  <p className="dn-card-title">Features</p>
                  <div className="dn-tags">
                    {attributes.map((a) => (
                      <span key={`${a.listing_id}-${a.tag}`} className="dn-tag">
                        {a.tag.replaceAll("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {products.length > 0 && (
                <div className="dn-card">
                  <p className="dn-card-title">Products & Services</p>
                  {Object.entries(productsByCategory).map(([cat, items]) => (
                    <div key={cat} className="dn-product-cat">
                      <p className="dn-product-cat-label">{cat}</p>
                      <div className="dn-product-items">
                        {items.map((p) => (
                          <span
                            key={`${p.listing_id}-${p.category}-${p.subcategory}`}
                            className="dn-product-item"
                            style={{ opacity: p.available === false ? 0.4 : 1 }}
                          >
                            {p.subcategory}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {recentStats.count > 0 && (
                <div className="dn-card">
                  <p className="dn-card-title">Deal history · last 30 days</p>
                  <div className="dn-stats-strip">
                    <div className="dn-stat-cell">
                      <div className="dn-stat-num">{recentStats.count}</div>
                      <div className="dn-stat-label">
                        deal{recentStats.count === 1 ? "" : "s"} posted
                      </div>
                    </div>
                    {recentStats.avgSavings != null && (
                      <div className="dn-stat-cell">
                        <div className="dn-stat-num dn-stat-num-accent">${recentStats.avgSavings}</div>
                        <div className="dn-stat-label">average savings per deal</div>
                      </div>
                    )}
                  </div>
                  <p className="dn-stat-foot">
                    Based on deals {listing.name ?? "this dispensary"} has run on PuffPrice in the last 30 days.
                  </p>
                </div>
              )}

              {(listing.long_description || listing.short_description) ? (
                <div className="dn-card">
                  <p className="dn-card-title">About {listing.name ?? "this dispensary"}</p>
                  {listing.long_description ? (
                    <div className="dn-about-prose" style={{ whiteSpace: "pre-line" }}>
                      {listing.long_description}
                    </div>
                  ) : (
                    <>
                      <div className="dn-about-prose">
                        <p>{listing.short_description}</p>
                      </div>
                      <p className="dn-about-foot">More details coming soon.</p>
                    </>
                  )}
                </div>
              ) : null}

              {(() => {
                const lat = listing.lat != null ? Number(listing.lat) : NaN;
                const lng = listing.lng != null ? Number(listing.lng) : NaN;
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                const q = [listing.name, listing.address1, listing.city, listing.state]
                  .filter(Boolean)
                  .join(", ") || `${lat},${lng}`;
                const src = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&ll=${lat},${lng}&z=15&output=embed`;
                return (
                  <div className="dn-card dn-map-card">
                    <div className="dn-map-header">
                      <p className="dn-card-title" style={{ marginBottom: 4 }}>Find it on the map</p>
                      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: ".82rem", color: "#6b7280" }}>
                        {[listing.address1, listing.city, listing.state].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <iframe
                      title={`Map of ${listing.name ?? "dispensary"}`}
                      className="dn-map-iframe"
                      src={src}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen={false}
                    />
                  </div>
                );
              })()}

              {related.length > 0 && (
                <div className="dn-card dn-related">
                  <p className="dn-card-title">Other dispensaries in {listing.city}</p>
                  <div className="dn-related-grid">
                    {related.map((r) => (
                      <Link key={r.id} href={`/l/${r.slug}`} className="dn-related-card">
                        <div className="dn-related-logo" aria-hidden={r.logo_url ? undefined : "true"}>
                          {r.logo_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={r.logo_url} alt={`${r.name ?? "Dispensary"} logo`} className="dn-related-img" width={48} height={48} loading="lazy" decoding="async" />
                          ) : (
                            (r.name ?? "?").charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="dn-related-name">{r.name}</p>
                          <p className="dn-related-city">{r.city}, {r.state}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="dn-col">
              <div id="claim" className="dn-claim-card">
                <div className="dn-claim-header">
                  <div className="dn-claim-icon">★</div>
                  <div>
                    <p className="dn-claim-title">
                      {isClaimed ? "Verified listing" : "Claim this listing"}
                    </p>
                    <p className="dn-claim-sub">
                      {isClaimed ? "Owner verified" : "Free · No credit card required"}
                    </p>
                  </div>
                </div>
                {!isClaimed && (
                  <>
                    <p className="dn-claim-body">
                      Own or manage <strong style={{ color: "#e2e8f0" }}>{listing.name}</strong>? Claim your listing to update hours, add photos, and unlock premium features.
                    </p>
                    <ClaimForm
                      listingId={listing.id}
                      projectTag={listing.project_tag}
                      listingTitle={listing.name ?? "this listing"}
                    />
                    <div className="dn-claim-trust">
                      <span className="dn-claim-trust-item">🔒 Secure</span>
                      <span className="dn-claim-trust-item">✓ Free forever</span>
                      <span className="dn-claim-trust-item">⚡ Live in 72hrs</span>
                    </div>
                    <p style={{ marginTop: 12, fontSize: ".8rem", fontFamily: "system-ui, sans-serif", color: "rgba(226,232,240,.6)" }}>
                      Need more options?{" "}
                      <Link href={`/claim/${listing.slug}`} style={{ color: "#4ade80", textDecoration: "none" }}>
                        Use the full claim form →
                      </Link>
                    </p>
                  </>
                )}
              </div>

              <div className="dn-trust-card">
                <p className="dn-trust-title">Why PuffPrice?</p>
                <ul className="dn-trust-list">
                  <li className="dn-trust-item">✓ Verified Central IL cannabis listings</li>
                  <li className="dn-trust-item">✓ Real hours updated by owners</li>
                  <li className="dn-trust-item">✓ No spam, no fake reviews</li>
                  <li className="dn-trust-item">✓ Free base listing always</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="dn-report-row">
            <p className="dn-report-text">
              Something off?{" "}
              <a
                href={`mailto:hello@puffprice.com?subject=Outdated%20info%20for%20${encodeURIComponent(listing.name ?? listing.slug ?? "listing")}&body=Tell%20us%20what%20looks%20wrong%20on%20this%20page%3A%20${encodeURIComponent(`https://www.puffprice.com/l/${listing.slug}`)}%0A%0A`}
                className="dn-report-link"
                aria-label={`Email PuffPrice to report outdated info for ${listing.name ?? "this listing"}`}
              >
                Report outdated info
              </a>
            </p>
          </div>

          <div className="dn-footer-nav">
            <Link href={backHref} className="dn-footer-back">{backLabel}</Link>
            <Link href={`/dispensary/${listing.slug}`} className="dn-footer-fwd">Full profile →</Link>
          </div>
        </div>

        <footer className="dn-footer">
          <span className="dn-footer-brand">puff<span className="dn-nav-accent">price</span></span>
          <span className="dn-footer-note">© {new Date().getFullYear()} PuffPrice · Illinois Cannabis Directory</span>
        </footer>
      </div>
    </>
  );
}
