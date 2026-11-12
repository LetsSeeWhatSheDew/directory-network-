// app/deals/[category]/page.tsx
// Fixed v2: force no-cache + correct Supabase query format

import StoreOverflowLinks from "../../components/StoreOverflowLinks";
import { capPerStore, overflowFor, STORE_CAP } from "../../../lib/storeCap";
import Link from "next/link";
import { Band, HeroTicket, StoreDeals } from "../../components/gold/Kit";
import { CategoryArt } from "../../components/gold/Art";
import { amountOf, saveLabel, cleanDealTitle, directionsHref, EXHALE_LINES, nearestExhale, milesLabel } from "../../../lib/exhale";
import ExhaleCard from "../../components/ExhaleCard";
import EmptyBreath from "../../components/EmptyBreath";
import OtdLine from "../../components/OtdLine";
import TrustLine from "../../components/TrustLine";
import { effectiveCategory } from "../../../lib/inferCategory";
import { redirect } from "next/navigation";
import { estimateSavings, formatSavingsDollars, type Deal } from "../../../lib/dealScoring";
import DealBadge from "../../components/DealBadge";
import DealFreshnessBadge from "../../components/DealFreshnessBadge";
import { isInMetro, metroCities } from "../../../lib/cityNormalize";
import TrackView from "../../components/TrackView";
import DealCtaLink from "../../components/DealCtaLink";
import ShareDealButton from "../../components/ShareDealButton";
import { getServerLocation } from "../../../lib/location";
import { listingHref, visitDispensaryHref } from "../../../lib/links";
import { displayDispensaryName } from "../../../lib/dispensaryName";
import { brand } from "../../../lib/brand";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hnbjufmtmrhexmdrfubw.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300';

const CATEGORY_LABELS: Record<string, string> = {
  flower: "Flower",
  edibles: "Edibles",
  vapes: "Vapes",
  concentrate: "Concentrates",
  all: "All deals",
};

const CATEGORY_SUBTITLES: Record<string, string> = {
  flower: "Biggest flower deals in Central Illinois today",
  edibles: "Biggest edibles deals in Central Illinois today",
  vapes: "Biggest vape deals in Central Illinois today",
  concentrate: "Biggest concentrate deals in Central Illinois today",
  all: "Every active cannabis deal in Central Illinois right now",
};

// Central IL scope filter — all public deal queries restrict to the
// 12 cities listed in lib/constants/regions.ts so out-of-scope deals
// never surface. Duplicating the allow-list here keeps this route
// self-contained; see app/page.jsx for the matching homepage filter.
const CIL_CITY_IN_LIST = `("Peoria","East Peoria","Peoria Heights","Pekin","Bartonville","Morton","Washington","Bloomington","Normal","Champaign","Urbana","Springfield")`;

function citySubtitle(category: string, city: string) {
  const label = CATEGORY_LABELS[category] || "deals";
  if (category === "all") return `Best cannabis deals near ${city} right now`;
  return `Best ${label.toLowerCase()} deals near ${city} right now`;
}

/**
 * Identity key for a deal. Prefer deal_id/id (unique), fall back to
 * slug + title (survives DB-level duplicates where the same deal was
 * inserted twice with different IDs).
 */
function dealKey(d: Deal): string {
  if (d?.deal_id) return `id:${d.deal_id}`;
  if (d?.id) return `id:${d.id}`;
  return `st:${d?.listing_slug || d?.slug || "unknown"}|${d?.title || d?.deal_title || ""}`;
}

/** Remove rows that share the same dealKey, keeping the first. */
function dedupeDeals<T extends Deal>(list: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const d of list) {
    const k = dealKey(d);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(d);
  }
  return out;
}

/**
 * Defensive filter: strip deals whose expires_at has already passed.
 * The Supabase query filters by is_active=true, but we've seen deals
 * where the flag wasn't flipped promptly after expiry (CDN cache lag
 * or a missed scheduled job). This guards the UI against showing a
 * user an expired deal they can't actually use.
 */
function filterExpired<T extends { expires_at?: string | null }>(list: T[]): T[] {
  const now = Date.now();
  return list.filter((d) => {
    if (!d?.expires_at) return true;
    const t = new Date(d.expires_at).getTime();
    return !Number.isFinite(t) || t > now;
  });
}

function toCityCase(raw: string) {
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

async function getDeals(category: string, city?: string | null) {
  // Try the view first — active_deals_with_listings already joins
  // master_listings, so we can filter by city directly on the view.
  try {
    // When a city is requested we pull the full statewide result set
    // and filter in JS. That's because (a) we need metro aliasing
    // (Peoria → {Peoria, East Peoria, Bartonville}) and (b) we need
    // a slug-derived city fallback for orphan rows the view reports
    // as "Illinois". Both are awkward to express in a PostgREST
    // single-column filter.
    const viewParams = new URLSearchParams({
      select: "*",
      order: "discount_value.desc.nullslast",
      // Category is filtered in JS (effectiveCategory) because the scraper
      // leaves the column NULL on most rows — pull the full active set.
      limit: "1000",
    });
    // Central IL scope — never surface non-CIL deals on the public page.
    viewParams.set("city", `in.${CIL_CITY_IN_LIST}`);

    const viewRes = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?${viewParams}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (viewRes.ok) {
      const data = await viewRes.json();
      if (Array.isArray(data)) {
        const inCat =
          category === "all"
            ? data
            : data.filter((d: Deal) => effectiveCategory(d) === category);
        if (!city) return { deals: inCat, source: "view" };

        const metroFiltered = inCat.filter((d: Deal) =>
          isInMetro(d.city, d.slug || d.listing_slug, city)
        );
        if (metroFiltered.length > 0) {
          return { deals: metroFiltered, source: "view" };
        }
        // City filter matched nothing — don't fall through to the
        // direct-table path (it can't filter by city at all).
        return { deals: [], source: "view", metroAliases: metroCities(city) };
      }
    }
  } catch {
    // fall through to direct table query below
  }

  // Fallback: query deals table directly (no city filter available here
  // because the deals table doesn't carry a city column; only reached
  // when the view itself errors out).
  const params = new URLSearchParams({
    select: "id,title,description,category,discount_type,discount_value,discount_unit,original_price,sale_price,unit,is_recurring,recurring_days,expires_at,source,listing_slug",
    project_tag: "eq.green",
    is_active: "eq.true",
    order: "discount_value.desc.nullslast",
    limit: "1000",
  });

  if (category !== "all") {
    params.set("category", `eq.${category}`);
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/deals?${params}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) return { deals: [], source: "none" };
  const deals = await res.json();
  return { deals: Array.isArray(deals) ? deals : [], source: "table" };
}

const formatSavings = (deal: Deal) => formatSavingsDollars(deal);

/**
 * Single source of truth for expiration copy. Returns null when the
 * deal has no expiration, when it's already expired, or when the date
 * is far enough out that highlighting it would be noise (>30 days).
 *
 * Never render two of these at once on the same card.
 *   today     → ⚡ Expires today  (red)
 *   tomorrow  → ⏱ Expires tomorrow (amber)
 *   < 7 days  → Expires Tuesday   (slate)
 *   < 30 days → Expires Apr 28    (slate)
 */
function getExpiryUrgency(expiresAt?: string | null) {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  if (!Number.isFinite(expiry.getTime())) return null;
  const diffMs = expiry.getTime() - now.getTime();
  if (diffMs < 0) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  const daysLeft = Math.floor(diffMs / dayMs);

  if (daysLeft === 0) return { key: "today", text: "Expires today", bg: "var(--pp-stop-bg)", fg: "var(--pp-stop-fg)" };
  if (daysLeft === 1) return { key: "tomorrow", text: "Expires tomorrow", bg: "var(--pp-note-bg)", fg: "var(--pp-note-fg)" };
  if (daysLeft < 7) {
    const weekday = expiry.toLocaleDateString("en-US", { weekday: "long" });
    return { key: "weekday", text: `Expires ${weekday}`, bg: "var(--pp-paper)", fg: "var(--pp-muted)" };
  }
  if (daysLeft < 30) {
    const md = expiry.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { key: "date", text: `Expires ${md}`, bg: "var(--pp-paper)", fg: "var(--pp-muted)" };
  }
  return null;
}

type Trend = "better" | "worse" | "stable" | "unknown";

async function getTrendsForSlugs(slugs: string[]): Promise<Record<string, Trend>> {
  if (slugs.length === 0) return {};
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const inList = slugs.map((s) => `"${s}"`).join(",");
    const url = `${SUPABASE_URL}/rest/v1/deal_price_history?select=listing_slug,discount_value,recorded_at&listing_slug=in.(${inList})&recorded_at=gte.${since}&project_tag=eq.green&order=recorded_at.asc&limit=2000`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      next: { revalidate: 600 },
    });
    if (!res.ok) return {};
    const rows = (await res.json()) as Array<{
      listing_slug: string;
      discount_value: number | null;
      recorded_at: string;
    }>;
    const bySlug = new Map<string, typeof rows>();
    for (const r of rows) {
      if (!r.listing_slug) continue;
      const list = bySlug.get(r.listing_slug) || [];
      list.push(r);
      bySlug.set(r.listing_slug, list);
    }
    const out: Record<string, Trend> = {};
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const slug of slugs) {
      const list = bySlug.get(slug);
      if (!list || list.length < 2) {
        out[slug] = "unknown";
        continue;
      }
      const latest = list[list.length - 1];
      const baseline = [...list].reverse().find((r) => new Date(r.recorded_at).getTime() <= weekAgo) || list[0];
      const a = latest.discount_value;
      const b = baseline.discount_value;
      if (a == null || b == null) {
        out[slug] = "unknown";
        continue;
      }
      const diff = a - b;
      out[slug] = diff > 1 ? "better" : diff < -1 ? "worse" : "stable";
    }
    return out;
  } catch {
    return {};
  }
}

async function getListingCtaFields(
  slug: string | null | undefined
): Promise<{ website: string | null; address1: string | null; city: string | null } | null> {
  if (!slug) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/master_listings?slug=eq.${encodeURIComponent(slug)}&project_tag=eq.green&is_active=eq.true&select=website,address1,city&limit=1`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
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

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ city?: string | string[] }>;
}) {
  const { category } = await params;
  const sp = await searchParams;
  const rawCity = Array.isArray(sp?.city) ? sp.city[0] : sp?.city;
  const cityFromUrl = rawCity ? toCityCase(rawCity) : null;
  const cookieLoc = await getServerLocation();
  const city = cityFromUrl || (cookieLoc?.city ? toCityCase(cookieLoc.city) : null);
  const label = CATEGORY_LABELS[category] || "Cannabis deals";
  const ogImage = `${brand.url}/og-image.png`;
  const title = city
    ? `${city} Dispensary Deals Today`
    : category === "all"
      ? "Every Cannabis Deal in Central Illinois Today"
      : `${label} Deals in Central Illinois Today`;
  const description = city
    ? `Browse today's best dispensary deals in ${city}, Illinois. Save money on cannabis with live offers.`
    : category === "all"
      ? "Every active dispensary deal in Central Illinois, biggest everyday savings first. Checked on each store's own site every morning."
      : `Find the cheapest ${label.toLowerCase()} deals at Central Illinois dispensaries right now. Real prices, real savings.`;
  const url = city
    ? `${brand.url}/deals/${category}?city=${encodeURIComponent(city)}`
    : `${brand.url}/deals/${category}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "PuffPrice",
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: "en_US",
      type: "website" as const,
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [ogImage],
    },
  };
}

export const dynamic = "force-dynamic"; // Force SSR, never cache

function buildItemListSchema(deals: Deal[], categoryLabel: string, category: string) {
  const top = deals.slice(0, 4).map((d, i) => {
    const price = d.sale_price ?? d.discount_value ?? undefined;
    return {
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: d.deal_title || d.title || `${categoryLabel} deal`,
        description: d.deal_description || d.description || `${categoryLabel} deal at ${d.name || d.listing_slug || "Illinois dispensary"}`,
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          ...(price !== undefined ? { price: String(price), priceCurrency: "USD" } : {}),
          seller: {
            "@type": "Store",
            name: d.name || d.listing_slug || "Illinois cannabis dispensary",
            address: {
              "@type": "PostalAddress",
              ...(d.city ? { addressLocality: d.city } : {}),
              addressRegion: "IL",
              addressCountry: "US",
            },
          },
        },
      },
    };
  });
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best ${categoryLabel} Deals in Central Illinois`,
    description: `Top cannabis ${category === "all" ? "" : categoryLabel.toLowerCase() + " "}deals at Central Illinois dispensaries today`,
    itemListElement: top,
  };
}

function buildSpecialAnnouncements(deals: Deal[]) {
  // SpecialAnnouncement signals to AI crawlers that deals are live, fresh,
  // time-boxed. The expires date is the key Zone 4 signal.
  return deals.slice(0, 10).map((d) => ({
    "@context": "https://schema.org",
    "@type": "SpecialAnnouncement",
    name: d.deal_title || d.title || "Cannabis deal",
    text: d.deal_description || d.description || `${d.discount_value ?? ""}${d.discount_unit === "percent" ? "%" : ""} off ${d.category || "cannabis"} at ${d.name || d.listing_slug || "Illinois dispensary"}`,
    ...(d.expires_at ? { expires: d.expires_at } : {}),
    announcementLocation: {
      "@type": "LocalBusiness",
      name: d.name || d.listing_slug || "Illinois cannabis dispensary",
      address: {
        "@type": "PostalAddress",
        ...(d.city ? { addressLocality: d.city } : {}),
        addressRegion: d.state_abbrev || "IL",
        addressCountry: "US",
      },
    },
  }));
}

function buildBreadcrumbSchema(categoryLabel: string, category: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: brand.url },
      { "@type": "ListItem", position: 2, name: "Deals", item: `${brand.url}/deals/all` },
      { "@type": "ListItem", position: 3, name: categoryLabel, item: `${brand.url}/deals/${category}` },
    ],
  };
}

const VALID_CATEGORIES = new Set(["flower", "edibles", "vapes", "concentrate", "all"]);

export default async function DealsPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ city?: string | string[] }>;
}) {
  const { category } = await params;
  const sp = await searchParams;

  // Flow C fix: users landing on /deals/chicago (or any non-category path)
  // from Google previously saw "No active deals" — the category filter
  // matched nothing. Treat an unknown category segment that looks like a
  // city name as a city filter instead, and redirect to /deals/all?city=X.
  // Heuristic: alphabetic + hyphens + short (<= 40 chars), not a recognized
  // category slug.
  if (!VALID_CATEGORIES.has(category)) {
    const looksLikeCity =
      category.length <= 40 && /^[a-z][a-z-]*$/i.test(category);
    if (looksLikeCity) {
      const cityParam = category.replace(/-/g, " ");
      redirect(`/deals/all?city=${encodeURIComponent(cityParam)}`);
    }
    // Otherwise fall through — the page will render its empty state.
  }

  const rawCity = Array.isArray(sp?.city) ? sp.city[0] : sp?.city;
  const cityFromUrl = rawCity ? toCityCase(rawCity) : null;
  const cookieLoc = await getServerLocation();
  const city = cityFromUrl || (cookieLoc?.city ? toCityCase(cookieLoc.city) : null);

  const { deals: rawDeals, source } = await getDeals(category, city);
  const deals = dedupeDeals(filterExpired(rawDeals));
  const slugs = Array.from(
    new Set(
      deals
        .map((d: Deal) => (d.slug || d.listing_slug) as string | undefined)
        .filter(Boolean) as string[]
    )
  );
  const trends = await getTrendsForSlugs(slugs);

  const categoryLabel = CATEGORY_LABELS[category] || "Deals";
  const subtitle = city
    ? citySubtitle(category, city)
    : CATEGORY_SUBTITLES[category] || "Best deals near you";
  // Lead with the biggest everyday saving; bundles/conditional deals follow.
  // Same rule as the homepage orb (lib/exhale nearestExhale): with the
  // visitor's city known, the biggest everyday saving nearest them first, with
  // an honest distance; with no city, the Central-IL-wide pick, labeled so.
  const origin = city
    ? {
        city,
        // Saved GPS only applies when the city is the cookie's own, not a ?city= browse.
        lat: !cityFromUrl || cityFromUrl.toLowerCase() === (cookieLoc?.city || "").toLowerCase() ? cookieLoc?.lat ?? null : null,
        lng: !cityFromUrl || cityFromUrl.toLowerCase() === (cookieLoc?.city || "").toLowerCase() ? cookieLoc?.lng ?? null : null,
      }
    : null;
  const topPick = nearestExhale(deals, origin);
  const topDeal = topPick?.deal || deals[0] || null;
  const topScope = topPick && topPick.deal === topDeal ? topPick.scope : city ? "near" : "region";
  const topMiles = topPick && topPick.deal === topDeal ? milesLabel(topPick.miles) : null;
  // Fairness: the four cards above the fold hold at most STORE_CAP.shortList
  // from any one store (top deal included); the store page has the rest.
  const ordered = topDeal ? [topDeal, ...deals.filter((d: Deal) => d !== topDeal)] : deals;
  const capped = capPerStore(ordered, STORE_CAP.shortList);
  const alternatives = capped.kept.filter((d: Deal) => d !== topDeal).slice(0, 3);
  const visibleCards = topDeal ? [topDeal, ...alternatives] : alternatives;
  const cardOverflow = overflowFor(visibleCards, capped.totals);
  const schemaDeals = capPerStore(deals, STORE_CAP.highlight).kept;

  // The view doesn't include website/address1 — fetch them for the
  // primary CTA so the "Visit dispensary" / "Get directions" button
  // can route externally.
  const topListing = topDeal
    ? await getListingCtaFields(topDeal.slug || topDeal.listing_slug)
    : null;
  const showStatewideFallback = !!city && deals.length > 0 && deals.length < 3;
  const noLocalMatches = !!city && deals.length === 0;
  const itemListSchema = deals.length > 0 ? buildItemListSchema(visibleCards, categoryLabel, category) : null;
  const breadcrumbSchema = buildBreadcrumbSchema(categoryLabel, category);
  const specialAnnouncements = deals.length > 0 ? buildSpecialAnnouncements(schemaDeals) : [];

  // Zone 4 Phase 1: direct factual answer above the fold.
  // Count unique dispensaries from the current result set.
  const dispensaryCount = new Set(
    deals.map((d: Deal) => d.listing_slug || d.slug).filter(Boolean)
  ).size;
  // The default result set is now scoped to the 12 Central IL cities
  // (see CIL_CITY_IN_LIST above). Label without-city views accordingly
  // so the "N deals at X dispensaries in …" answer string matches what
  // the user actually sees in the cards below.
  // The default proximity radius (15 mi) wraps every CIL metro alias —
  // see lib/proximity.ts. Phrasing the empty state as "within 15 miles
  // of <city>" instead of "near <city>" matches what the metro-alias
  // filter actually does and rules out the trust-killing "advertised on
  // homepage but missing from /deals" gap that surfaced in the audit.
  const scopeLabel = city ? `within 15 miles of ${city}, IL` : "in Central Illinois";
  const answerText = deals.length > 0
    ? `${deals.length} active deal${deals.length !== 1 ? "s" : ""} at ${dispensaryCount} dispensar${dispensaryCount !== 1 ? "ies" : "y"} ${scopeLabel} right now.`
    : `No active ${categoryLabel.toLowerCase()} deals ${scopeLabel} right now — check back soon.`;

  return (
    <>
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {specialAnnouncements.map((s, i) => (
        <script
          key={`sa-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      {topDeal && <TrackView event="deal_view" params={{ dispensary: topDeal.name || topDeal.listing_slug, category }} />}

      <Band
        eyebrow={categoryLabel}
        title={category === "all" ? "Every deal" : categoryLabel}
        italic={city ? `near ${city}` : "in Central IL"}
        leaf={category === "all"}
      >
        {category !== "all" && (
          <span className="g-band-art" aria-hidden="true">
            <CategoryArt category={category} />
          </span>
        )}
        <div className="g-stats">
          <span className="g-stat"><b>{deals.length}</b> deal{deals.length === 1 ? "" : "s"}</span>
          <span className="g-stat"><b>{dispensaryCount}</b> store{dispensaryCount === 1 ? "" : "s"}</span>
          {city && <span className="g-stat">within 15 mi</span>}
        </div>
        <nav className="g-cat-switch" aria-label="Deal type">
          {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
            <Link
              key={slug}
              href={city ? `/deals/${slug}?city=${encodeURIComponent(city)}` : `/deals/${slug}`}
              className={slug === category ? "on" : ""}
              aria-current={slug === category ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        {topDeal && (
          <HeroTicket
            deal={topDeal}
            miles={topPick && topPick.deal === topDeal ? topPick.miles : null}
            scope={topScope as "near" | "widened" | "region"}
            label={topScope === "region" ? `Best ${category === "all" ? "deal" : categoryLabel.toLowerCase() + " deal"} in Central IL` : `Best ${category === "all" ? "deal" : categoryLabel.toLowerCase() + " deal"} near ${city}`}
          />
        )}
      </Band>

      <main className="g-page">
        <div className="g-wrap">
          <div className="g-block">
            {/* Zone 4: direct factual answer for people and AI crawlers. */}
            <p className="g-answer">{answerText}</p>
            <TrustLine />
          </div>

          {deals.length > 0 ? (
            <div className="g-block">
              <div className="g-eyebrow">Every one, by store</div>
              <h2 className="g-display">{category === "all" ? "All of today's deals" : `All ${categoryLabel.toLowerCase()} deals`}</h2>
              <StoreDeals deals={deals} cityParam={city || undefined} />
              {showStatewideFallback && (
                <p className="g-note">
                  Only {deals.length} near {city} right now. <Link href={`/deals/${category}`}>See all of Central Illinois</Link> or{" "}
                  <Link href="/alerts">get free alerts</Link>.
                </p>
              )}
              {city && !showStatewideFallback && (
                <p className="g-note">
                  <Link href={`/deals/${category}`}>See every Central IL deal</Link>
                </p>
              )}
              <p className="g-note">
                Data from the stores&apos; own sites · <Link href="/dispensary/submit-deal">Submit your deal</Link>
              </p>
            </div>
          ) : (
            <div className="g-block">
              <p className="g-answer">
                {noLocalMatches
                  ? `No ${categoryLabel.toLowerCase()} deals within 15 miles of ${city} right now. A wider look usually turns one up.`
                  : `No ${categoryLabel.toLowerCase()} deals posted on a store's own site right now. Stores post overnight; we check every morning.`}
              </p>
              <div className="g-near" style={{ marginTop: 12 }}>
                {noLocalMatches && <Link href={`/deals/${category}`}>See all Central IL deals</Link>}
                {category !== "all" && !noLocalMatches && <Link href="/deals/all">See every deal today</Link>}
                <Link href="/alerts">Get free alerts</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
