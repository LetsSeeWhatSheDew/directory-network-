// app/deals/[category]/page.tsx
// Fixed v2: force no-cache + correct Supabase query format

import Link from "next/link";
import Logo from "../../components/Logo";
import { redirect } from "next/navigation";
import { estimateSavings, formatSavingsDollars } from "../../../lib/dealScoring";
import DealBadge from "../../components/DealBadge";
import DealFreshnessBadge from "../../components/DealFreshnessBadge";
import { isInMetro, metroCities } from "../../../lib/cityNormalize";
import TrackView from "../../components/TrackView";
import DealCtaLink from "../../components/DealCtaLink";
import ShareDealButton from "../../components/ShareDealButton";
import { getServerLocation } from "../../../lib/location";
import { listingHref } from "../../../lib/links";
import { displayDispensaryName } from "../../../lib/dispensaryName";

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
  flower: "Biggest flower deals in Illinois today",
  edibles: "Biggest edibles deals in Illinois today",
  vapes: "Biggest vape deals in Illinois today",
  concentrate: "Biggest concentrate deals in Illinois today",
  all: "Every active cannabis deal in Illinois right now",
};

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
function dealKey(d: any): string {
  if (d?.deal_id) return `id:${d.deal_id}`;
  if (d?.id) return `id:${d.id}`;
  return `st:${d?.listing_slug || d?.slug || "unknown"}|${d?.title || d?.deal_title || ""}`;
}

/** Remove rows that share the same dealKey, keeping the first. */
function dedupeDeals<T>(list: T[]): T[] {
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
      order: "discount_value.desc",
      limit: city ? "100" : "10",
    });

    if (category !== "all") {
      viewParams.set("category", `eq.${category}`);
    }

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
        if (!city) return { deals: data, source: "view" };

        const metroFiltered = data.filter((d: any) =>
          isInMetro(d.city, d.slug || d.listing_slug, city)
        );
        if (metroFiltered.length > 0) {
          return { deals: metroFiltered.slice(0, 10), source: "view" };
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
    order: "discount_value.desc",
    limit: "10",
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

const formatSavings = (deal: any) => formatSavingsDollars(deal);

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

  if (daysLeft === 0) return { key: "today", text: "⚡ Expires today", bg: "#fee2e2", fg: "#991b1b" };
  if (daysLeft === 1) return { key: "tomorrow", text: "⏱ Expires tomorrow", bg: "#fef3c7", fg: "#92400e" };
  if (daysLeft < 7) {
    const weekday = expiry.toLocaleDateString("en-US", { weekday: "long" });
    return { key: "weekday", text: `Expires ${weekday}`, bg: "#f1f5f9", fg: "#475569" };
  }
  if (daysLeft < 30) {
    const md = expiry.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { key: "date", text: `Expires ${md}`, bg: "#f1f5f9", fg: "#475569" };
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
  const ogImage = "https://puffprice.com/og-image.png";
  const title = city
    ? `${city} Dispensary Deals Today | PuffPrice`
    : `${label} Deals Illinois | PuffPrice`;
  const description = city
    ? `Browse today's best dispensary deals in ${city}, Illinois. Save money on cannabis with live offers.`
    : `Find the cheapest ${label.toLowerCase()} deals at Illinois dispensaries right now. Real prices, real savings.`;
  const url = city
    ? `https://puffprice.com/deals/${category}?city=${encodeURIComponent(city)}`
    : `https://puffprice.com/deals/${category}`;
  return {
    title,
    description,
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

function buildItemListSchema(deals: any[], categoryLabel: string, category: string) {
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
    name: `Best ${categoryLabel} Deals in Illinois`,
    description: `Top cannabis ${category === "all" ? "" : categoryLabel.toLowerCase() + " "}deals at Illinois dispensaries today`,
    itemListElement: top,
  };
}

function buildSpecialAnnouncements(deals: any[]) {
  // SpecialAnnouncement signals to AI crawlers that deals are live, fresh,
  // time-boxed. The expires date is the key Zone 4 signal.
  return deals.slice(0, 10).map((d) => ({
    "@context": "https://schema.org",
    "@type": "SpecialAnnouncement",
    name: d.deal_title || d.title || "Cannabis deal",
    text: d.deal_description || d.description || `${d.discount_value ?? ""}${d.discount_unit === "percent" ? "%" : ""} off ${d.category || "cannabis"} at ${d.name || d.listing_slug || "Illinois dispensary"}`,
    ...(d.expires_at ? { expires: d.expires_at } : {}),
    category: "https://schema.org/SpecialAnnouncement",
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
      { "@type": "ListItem", position: 1, name: "Home", item: "https://puffprice.com" },
      { "@type": "ListItem", position: 2, name: "Deals", item: "https://puffprice.com/deals/all" },
      { "@type": "ListItem", position: 3, name: categoryLabel, item: `https://puffprice.com/deals/${category}` },
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
        .map((d: any) => (d.slug || d.listing_slug) as string | undefined)
        .filter(Boolean) as string[]
    )
  );
  const trends = await getTrendsForSlugs(slugs);

  const categoryLabel = CATEGORY_LABELS[category] || "Deals";
  const subtitle = city
    ? citySubtitle(category, city)
    : CATEGORY_SUBTITLES[category] || "Best deals near you";
  const topDeal = deals[0] || null;
  const alternatives = deals.slice(1, 4);
  const showStatewideFallback = !!city && deals.length > 0 && deals.length < 3;
  const noLocalMatches = !!city && deals.length === 0;
  const itemListSchema = deals.length > 0 ? buildItemListSchema(deals, categoryLabel, category) : null;
  const breadcrumbSchema = buildBreadcrumbSchema(categoryLabel, category);
  const specialAnnouncements = deals.length > 0 ? buildSpecialAnnouncements(deals) : [];

  // Zone 4 Phase 1: direct factual answer above the fold.
  // Count unique dispensaries from the current result set.
  const dispensaryCount = new Set(
    deals.map((d: any) => d.listing_slug || d.slug).filter(Boolean)
  ).size;
  // When `city` is null the user hit the statewide deal page — phrase
  // the headline as statewide Illinois rather than a city. Keeping
  // "Illinois" as the scope here is correct because the result set is
  // genuinely statewide; we just avoid the `|| "Illinois"` sentinel
  // pattern so the surrounding code isn't misread as fallback lying.
  const scopeLabel = city ? `${city}, IL` : "Illinois";
  const answerText = deals.length > 0
    ? `${deals.length} active deal${deals.length !== 1 ? "s" : ""} at ${dispensaryCount} dispensar${dispensaryCount !== 1 ? "ies" : "y"} in ${scopeLabel} right now.`
    : `No active deals in ${scopeLabel} right now — check back soon.`;

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
        .back:hover{color:#0f1f3d}
        .page{max-width:800px;margin:0 auto;padding:40px 20px}
        .cat-tag{font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:8px}
        .page-title{font-size:clamp(1.5rem,4vw,2.2rem);font-weight:700;color:#0f1f3d;letter-spacing:-.04em;line-height:1.1;margin-bottom:6px}
        .page-sub{font-size:.88rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:24px}
        .cat-switch{background:#fff;border:1px solid #e8e4da;border-radius:12px;padding:16px;margin-bottom:24px}
        .cat-switch-label{font-size:.7rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-bottom:10px}
        .cat-pills{display:flex;gap:8px;flex-wrap:wrap}
        .cat-pill{font-size:.8rem;font-family:system-ui,sans-serif;font-weight:500;padding:6px 14px;border-radius:100px;text-decoration:none;border:1px solid #e8e4da;color:#6b7280}
        .cat-pill.active{background:#16a34a;color:#fff;border-color:#16a34a}
        .cat-pill:hover:not(.active){border-color:#9ca3af;color:#374151}
        .top-label{font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#16a34a;font-family:system-ui,sans-serif;margin-bottom:10px}

        /* TOP DEAL CARD — savings dominates */
        .top-card{background:#fff;border:1px solid #e8e4da;border-left:4px solid #16a34a;border-radius:16px;padding:24px;position:relative;margin-bottom:24px;box-shadow:0 4px 16px rgba(15,31,61,.06)}
        .deal-grade{position:absolute;top:12px;right:12px;min-width:28px;height:24px;padding:0 8px;display:inline-flex;align-items:center;justify-content:center;border-radius:100px;font-family:system-ui,sans-serif;font-weight:700;font-size:.68rem;letter-spacing:.02em;opacity:.7}
        .you-save-label{font-size:.66rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:2px}
        .save-amount{font-size:clamp(2.2rem,8vw,3rem);font-weight:700;color:#16a34a;letter-spacing:-.04em;line-height:1;margin-bottom:2px}
        .save-context{font-size:.72rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-bottom:18px}
        .disp-name{font-size:1.1rem;font-weight:700;color:#0f1f3d;margin-top:4px}
        .disp-detail{font-size:.8rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-top:2px;margin-bottom:6px}
        .deal-title-big{font-size:.92rem;font-weight:600;color:#374151;margin-bottom:14px;font-family:system-ui,sans-serif;line-height:1.4;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
        .attrs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:16px}
        .attr{font-size:.66rem;color:#9ca3af;background:#f5f4f0;border-radius:100px;padding:2px 8px;font-family:system-ui,sans-serif}
        .deal-more-toggle{font-size:.78rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:16px;cursor:pointer;text-decoration:none;display:inline-block;list-style:none}
        .deal-more-toggle::-webkit-details-marker{display:none}
        .deal-more-toggle:hover{color:#0f1f3d}
        .card-cta{display:block;width:100%;text-align:center;background:#16a34a;color:#fff;padding:14px;border-radius:10px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:800;font-size:.95rem;letter-spacing:.02em;transition:background .15s}
        .card-cta:hover{background:#15803d}

        /* ALTERNATIVES — same hierarchy pattern */
        .alt-label{font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;font-family:system-ui,sans-serif;margin-bottom:12px}
        .alt-cards{display:flex;flex-direction:column;gap:10px;margin-bottom:36px}
        .alt-card{position:relative;background:#fff;border:1px solid #e8e4da;border-radius:12px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;text-decoration:none;transition:border-color .15s;gap:14px}
        .alt-card:hover{border-color:#16a34a}
        .alt-grade{position:absolute;top:10px;right:12px;font-size:.62rem;color:#9ca3af;font-family:system-ui,sans-serif;font-weight:600;letter-spacing:.08em;opacity:.7}
        .alt-savings-block{min-width:92px;flex-shrink:0}
        .alt-savings-label-top{font-size:.58rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:1px}
        .alt-savings{font-size:1.5rem;font-weight:700;color:#16a34a;letter-spacing:-.03em;line-height:1}
        .alt-body{flex:1;min-width:0}
        .alt-name{font-size:.92rem;font-weight:700;color:#0f1f3d}
        .alt-deal{font-size:.78rem;color:#374151;font-family:system-ui,sans-serif;margin-top:2px;line-height:1.4}
        .alt-meta{font-size:.66rem;color:#9ca3af;font-family:system-ui,sans-serif;margin-top:4px}
        .no-deals{text-align:center;padding:60px 20px;background:#fff;border-radius:16px;border:1px solid #e8e4da}
        .no-deals-title{font-size:1.2rem;font-weight:700;color:#0f1f3d;margin-bottom:8px}
        .no-deals-sub{font-size:.875rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:20px}
        .no-deals-link{display:inline-block;background:#0f1f3d;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700;font-size:.875rem}
        .city-banner{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin-bottom:18px;font-family:system-ui,sans-serif;font-size:.82rem;color:#166534;flex-wrap:wrap}
        .city-banner-pin{font-weight:600}
        .city-banner-clear{color:#16a34a;text-decoration:none;font-weight:600;font-size:.78rem}
        .city-banner-clear:hover{text-decoration:underline}
        .statewide-fallback{background:#fff;border:1px solid #e8e4da;border-radius:12px;padding:16px 18px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;font-family:system-ui,sans-serif;font-size:.85rem;color:#374151}
        .statewide-fallback-link{color:#16a34a;text-decoration:none;font-weight:700;white-space:nowrap}
        .statewide-fallback-link:hover{text-decoration:underline}
        .source-note{font-size:.68rem;color:#d1cfc6;font-family:system-ui,sans-serif;text-align:center;margin-top:24px}
        @media(max-width:600px){.page{padding:24px 14px}.nav{padding:12px 16px}}
        @media(max-width:480px){
          .page-title{font-size:1.35rem}
          .top-card{padding:20px 18px;width:100%}
          .deal-title-big{font-size:.88rem}
          .cat-switch{padding:12px 10px}
          .cat-pills{flex-wrap:nowrap;overflow-x:auto;gap:6px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
          .cat-pills::-webkit-scrollbar{display:none}
          .cat-pill{font-size:.78rem;padding:6px 12px;flex-shrink:0;white-space:nowrap}
          .alt-cards{gap:8px}
          .alt-card{padding:14px;gap:12px}
          .alt-savings{font-size:1.3rem}
          .alt-savings-block{min-width:80px}
          .alt-name{font-size:.86rem}
          .alt-deal{font-size:.74rem}
        }
      `}</style>

      <div className="top-stripe" aria-hidden="true" />
      <nav className="nav">
        <Link href="/" className="logo" aria-label="PuffPrice home">
          <Logo />
        </Link>
        <Link href="/" className="back">← Back</Link>
      </nav>

      <div className="page">
        {/* Zone 4 Phase 1: direct factual answer for AI crawlers */}
        <p
          style={{
            fontSize: "1rem",
            color: "#6b7280",
            fontFamily: "system-ui, sans-serif",
            textAlign: "left",
            marginBottom: "18px",
            lineHeight: 1.5,
          }}
        >
          {answerText}
        </p>
        <div className="cat-tag">{categoryLabel}</div>
        <h1 className="page-title">{subtitle}</h1>
        <p className="page-sub">
          {deals.length > 0
            ? city
              ? `${deals.length} active deal${deals.length !== 1 ? "s" : ""} found near ${city}`
              : `${deals.length} active deal${deals.length !== 1 ? "s" : ""} found in Illinois`
            : city
            ? `No active deals near ${city} right now`
            : "No active deals right now — check back soon"}
        </p>

        {city && (
          <div className="city-banner">
            <span className="city-banner-pin">📍 Deals near {city}, IL</span>
          </div>
        )}

        <div className="cat-switch">
          <div className="cat-switch-label">What are you looking for?</div>
          <div className="cat-pills">
            {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
              <Link
                key={slug}
                href={city ? `/deals/${slug}?city=${encodeURIComponent(city)}` : `/deals/${slug}`}
                className={`cat-pill ${slug === category ? "active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {topDeal ? (
          <>
            <TrackView event="deal_view" params={{ dispensary: topDeal.name || topDeal.listing_slug, category }} />
            <div className="top-label">Our recommendation</div>
            <div className="top-card">
              <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}>
                <DealBadge dealId={topDeal.deal_id || topDeal.id} />
              </div>

              {(() => {
                const dollars = estimateSavings(topDeal);
                const formatted = formatSavings(topDeal);
                if (formatted === "Deal active") return null;
                if (dollars != null) {
                  return (
                    <>
                      <div className="you-save-label">You save</div>
                      <div className="save-amount">${dollars}</div>
                      </>
                  );
                }
                return (
                  <>
                    <div className="save-amount">{formatted}</div>
                    <div className="save-context">on this deal</div>
                  </>
                );
              })()}

              <div className="disp-name">
                {displayDispensaryName(topDeal)}
              </div>
              <div className="disp-detail">
                {topDeal.city ? `${topDeal.city}, ${topDeal.state_abbrev || 'IL'}` : 'IL'}
                {topDeal.google_rating > 0 && ` · ${topDeal.google_rating}★`}
              </div>

              <div className="deal-title-big">
                <span>{topDeal.deal_title || topDeal.title || `${topDeal.discount_value}% off ${topDeal.category}`}</span>
                {(() => {
                  const u = getExpiryUrgency(topDeal.expires_at);
                  if (!u) return null;
                  return (
                    <span style={{ fontSize: ".68rem", fontFamily: "system-ui,sans-serif", fontWeight: 700, color: u.fg, background: u.bg, padding: "2px 9px", borderRadius: 100, whiteSpace: "nowrap" }}>
                      {u.text}
                    </span>
                  );
                })()}
              </div>

              {(() => {
                const t = trends[topDeal.slug || topDeal.listing_slug];
                if (t === "better") return <div style={{ fontSize: ".78rem", fontFamily: "system-ui,sans-serif", color: "#16a34a", fontWeight: 600, marginBottom: 10 }}>↓ Better deal than last week</div>;
                if (t === "worse") return <div style={{ fontSize: ".78rem", fontFamily: "system-ui,sans-serif", color: "#f59e0b", fontWeight: 600, marginBottom: 10 }}>↑ Not as good as last week</div>;
                return null;
              })()}

              <div style={{ marginBottom: 10 }}>
                <DealFreshnessBadge verifiedAt={topDeal.verified_at} />
              </div>

              <div className="attrs">
                {topDeal.accepts_credit && <span className="attr">Cards OK</span>}
                {topDeal.drive_thru && <span className="attr">Drive-thru</span>}
                {topDeal.delivery && <span className="attr">Delivery</span>}
                {topDeal.is_recurring && topDeal.recurring_days?.length > 0 && (
                  <span className="attr">
                    Recurring · {Array.isArray(topDeal.recurring_days)
                      ? topDeal.recurring_days.slice(0, 3).join(", ")
                      : topDeal.recurring_days}
                  </span>
                )}
                {/* Expiration is rendered once, next to the deal title,
                    by getExpiryUrgency() above. Do NOT also show a
                    duplicate "Expires Apr 21" attribute pill here. */}
              </div>

              {(topDeal.deal_description || topDeal.description) && (
                <details style={{ marginBottom: 16 }}>
                  <summary className="deal-more-toggle">Show more ▾</summary>
                  <div style={{ fontSize: ".82rem", color: "#374151", fontFamily: "system-ui,sans-serif", marginTop: 8, lineHeight: 1.5 }}>
                    {topDeal.deal_description || topDeal.description}
                  </div>
                </details>
              )}

              {(() => {
                const topGoHref = listingHref(topDeal.slug || topDeal.listing_slug, city);
                if (!topGoHref) return null;
                return (
                  <DealCtaLink
                    href={topGoHref}
                    className="card-cta"
                    deal={{
                      dispensary: topDeal.name || topDeal.listing_slug || "Illinois dispensary",
                      dealTitle: topDeal.deal_title || topDeal.title || "",
                      savingsAmount: estimateSavings(topDeal) ?? 0,
                      category: topDeal.category || null,
                    }}
                  >
                    GO HERE →
                  </DealCtaLink>
                );
              })()}
              {/* Secondary links — internal link graph for SEO and curious users */}
              <div
                style={{
                  display: "flex",
                  gap: 18,
                  justifyContent: "center",
                  marginTop: 10,
                  fontSize: ".78rem",
                  fontFamily: "system-ui,sans-serif",
                  flexWrap: "wrap",
                }}
              >
                {(topDeal.id || topDeal.deal_id) && (
                  <Link
                    href={`/deal/${topDeal.id || topDeal.deal_id}`}
                    style={{ color: "#6b7280", textDecoration: "none" }}
                  >
                    Details →
                  </Link>
                )}
                {(topDeal.slug || topDeal.listing_slug) && (
                  <Link
                    href={`/dispensary/${topDeal.slug || topDeal.listing_slug}`}
                    style={{ color: "#6b7280", textDecoration: "none" }}
                  >
                    {topDeal.name || "Dispensary"} profile →
                  </Link>
                )}
                {(topDeal.id || topDeal.deal_id) && (
                  <ShareDealButton
                    dealId={topDeal.id || topDeal.deal_id}
                    dispensaryName={topDeal.name || topDeal.listing_slug || "Dispensary"}
                    dealTitle={topDeal.deal_title || topDeal.title || "Active deal"}
                    savings={estimateSavings(topDeal) ?? null}
                    variant="inline"
                  />
                )}
              </div>
            </div>

            {alternatives.length > 0 && (
              <>
                <div className="alt-label">Also worth considering</div>
                <div className="alt-cards">
                  {alternatives.map((deal: any, i: number) => {
                    const altHref = listingHref(deal.slug || deal.listing_slug, city);
                    if (!altHref) return null;
                    return (
                    <Link
                      key={deal.id || deal.deal_id || i}
                      href={altHref}
                      className="alt-card"
                    >
                      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}>
                        <DealBadge dealId={deal.deal_id || deal.id} />
                      </div>
                      {(() => {
                        const dollars = estimateSavings(deal);
                        const formatted = formatSavings(deal);
                        if (formatted === "Deal active") return null;
                        if (dollars != null) {
                          return (
                            <div className="alt-savings-block">
                              <div className="alt-savings-label-top">You save</div>
                              <div className="alt-savings">${dollars}</div>
                            </div>
                          );
                        }
                        return (
                          <div className="alt-savings-block">
                            <div className="alt-savings" style={{ fontSize: "1.1rem" }}>{formatted}</div>
                          </div>
                        );
                      })()}
                      <div className="alt-body">
                        <div className="alt-name">{displayDispensaryName(deal)}</div>
                        <div className="alt-deal">
                          {deal.deal_title || deal.title || `${deal.discount_value}% off`}
                        </div>
                        {(() => {
                          const u = getExpiryUrgency(deal.expires_at);
                          if (!u) return null;
                          return (
                            <div style={{ marginTop: 4, display: "inline-block", fontSize: ".64rem", fontFamily: "system-ui,sans-serif", fontWeight: 700, color: u.fg, background: u.bg, padding: "2px 8px", borderRadius: 100 }}>
                              {u.text}
                            </div>
                          );
                        })()}
                        <div className="alt-meta">
                          {deal.city ? `${deal.city}, ${deal.state_abbrev || 'IL'}` : 'IL'}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <DealFreshnessBadge verifiedAt={deal.verified_at} />
                        </div>
                      </div>
                    </Link>
                  )})}
                </div>
              </>
            )}

            {showStatewideFallback && (
              <div className="statewide-fallback">
                <span>
                  {deals.length} deal{deals.length === 1 ? "" : "s"} near {city} right now.
                  More coming soon — get alerts for new deals.
                </span>
                <Link href="/alerts" className="statewide-fallback-link">
                  Get free alerts →
                </Link>
              </div>
            )}

            {city && (
              <div style={{ textAlign: "center", margin: "8px 0 20px" }}>
                <Link
                  href={`/deals/${category}`}
                  style={{
                    fontSize: ".9rem",
                    color: "#16a34a",
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  See all Illinois deals →
                </Link>
              </div>
            )}

            <p className="source-note">
              Data from Leafly, Weedmaps + dispensary sites ·{" "}
              <Link href="/dispensary/submit-deal" style={{ color: "#16a34a", textDecoration: "none" }}>
                Submit your deal →
              </Link>
            </p>
          </>
        ) : (
          <div className="no-deals">
            <div className="no-deals-title">
              {noLocalMatches
                ? `No active ${categoryLabel.toLowerCase()} deals near ${city} right now`
                : `No active ${categoryLabel.toLowerCase()} deals right now`}
            </div>
            <p className="no-deals-sub">
              {noLocalMatches
                ? "Try a wider search, or get notified the moment one goes live in your city."
                : "Check back tomorrow — dispensaries post fresh deals overnight. Or get an alert the moment one goes live."}
            </p>
            {noLocalMatches ? (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href={`/deals/${category}`} className="no-deals-link" style={{ background: "#16a34a" }}>
                  See all Illinois deals →
                </Link>
                <Link href="/alerts" className="no-deals-link">
                  Get deal alerts →
                </Link>
              </div>
            ) : (
              <Link href="/alerts" className="no-deals-link">
                Get deal alerts →
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
