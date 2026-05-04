"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { estimateSavings, formatSavingsDollars, hasExactSavings } from "../../lib/dealScoring";
import { displayCity } from "../../lib/cityNormalize";
import { listingHref } from "../../lib/links";
import TrackedLink from "./TrackedLink";
import DealFreshnessBadge from "./DealFreshnessBadge";

type Deal = {
  deal_id?: string;
  id?: string;
  listing_slug?: string;
  slug?: string;
  name?: string;
  city?: string;
  category?: string | null;
  deal_title?: string;
  discount_value?: number;
  discount_unit?: string;
  original_price?: number | null;
  sale_price?: number | null;
  expires_at?: string | null;
  verified_at?: string | null;
  status_reason?: string | null;
  lat?: number | null;
  lng?: number | null;
  scope?: "local" | "statewide";
};

type Recommendation = {
  topPick: Deal | null;
  deals?: Deal[];
  likelyOpen?: boolean;
  openStatus?: { isOpen: boolean; label: string } | null;
};

function slugToName(s: string) {
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function displayName(d: Deal) {
  const name = d.name;
  const slug = d.slug || d.listing_slug || "";
  if (!name || name === slug || /^[a-z0-9-]+$/.test(name)) {
    return slugToName(slug || name || "Illinois dispensary");
  }
  return name;
}

function endsToday(expiresAt?: string | null) {
  if (!expiresAt) return false;
  const exp = new Date(expiresAt).getTime();
  if (!Number.isFinite(exp)) return false;
  const hoursLeft = (exp - Date.now()) / 3_600_000;
  return hoursLeft > 0 && hoursLeft < 24;
}

// Haversine distance in miles. Returns null if either coord missing/invalid.
function distanceMiles(
  a: { lat: number | null | undefined; lng: number | null | undefined },
  b: { lat: number | null | undefined; lng: number | null | undefined }
): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const lat1 = Number(a.lat), lng1 = Number(a.lng);
  const lat2 = Number(b.lat), lng2 = Number(b.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null;
  const R = 3958.8; // Earth radius in miles
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function readUserCoords(): { lat: number | null; lng: number | null } {
  try {
    const lat = Number(sessionStorage.getItem("cl_lat"));
    const lng = Number(sessionStorage.getItem("cl_lng"));
    if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
      return { lat, lng };
    }
  } catch {}
  return { lat: null, lng: null };
}

function fetchRecommendation(c: string, signal?: AbortSignal): Promise<Recommendation | null> {
  return fetch(
    `/api/deals/recommend?category=all&limit=1&city=${encodeURIComponent(c)}`,
    { cache: "no-store", signal }
  )
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
}

function dispatchSavings(d: Deal | null) {
  const savings = d ? estimateSavings(d) : null;
  try {
    window.dispatchEvent(
      new CustomEvent("cl:top-deal-resolved", { detail: { savings } })
    );
  } catch {}
}

export default function HeroDealCard({
  initial,
  totalDealCount: _totalDealCount = 0,
}: {
  initial: Deal | null;
  totalDealCount?: number;
}) {
  // The 7-day featured-slot freshness gate has been retired (2026-04-30).
  // The daily-verification sweep (lib/scraper/dailyVerification.ts) now
  // deactivates any active deal that's gone 7+ days without an
  // independent verification, so any active deal that reaches this
  // component is safe to feature. Per-card freshness badges still
  // surface the actual age at the row level.
  const [deal, setDeal] = useState<Deal | null>(initial);
  const [city, setCity] = useState<string | null>(null);
  const [openStatus, setOpenStatus] = useState<{ isOpen: boolean; label: string } | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    let cached: string | null = null;
    try {
      cached = sessionStorage.getItem("cl_city");
    } catch {}

    if (cached) {
      setCity(cached);
      setResolved(true);
      fetchRecommendation(cached, controller.signal).then((data) => {
        if (cancelled) return;
        const apiTop =
          data?.topPick ||
          (Array.isArray(data?.deals) && data.deals.length > 0 ? data.deals[0] : null);
        const next = apiTop || initial;
        setDeal(next);
        if (data?.openStatus && typeof data.openStatus.label === "string") {
          setOpenStatus(data.openStatus);
        }
        dispatchSavings(next);
      });
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { city?: string } | null;
      if (cancelled) return;
      setResolved(true);
      if (detail?.city) {
        setCity(detail.city);
        fetchRecommendation(detail.city, controller.signal).then((data) => {
          if (cancelled) return;
          const apiTop =
            data?.topPick ||
            (Array.isArray(data?.deals) && data.deals.length > 0 ? data.deals[0] : null);
          const next = apiTop || initial;
          setDeal(next);
          if (data?.openStatus && typeof data.openStatus.label === "string") {
            setOpenStatus(data.openStatus);
          }
          dispatchSavings(next);
        });
      } else {
        setDeal(initial);
        dispatchSavings(initial);
      }
    };

    window.addEventListener("cl:location-resolved", handler);
    return () => {
      cancelled = true;
      controller.abort();
      window.removeEventListener("cl:location-resolved", handler);
    };
  }, [initial]);

  // Pre-resolution skeleton — keeps perceived load tight while client
  // location detection runs.
  if (!resolved && !deal) {
    return (
      <div className="hero-deal-card skeleton" aria-busy="true" aria-live="polite">
        <div className="hero-deal-label" style={{ color: "#9ca3af" }}>
          Finding the top Central Illinois deal…
        </div>
        <div className="skeleton-savings" />
        <div className="skeleton-subline" />
        <div className="skeleton-name" />
        <div className="skeleton-subline" style={{ width: "85%" }} />
        <div className="skeleton-cta" />
        <style>{`
          .skeleton-savings{height:54px;width:62%;background:linear-gradient(90deg,#f0ece3 0%,#f8f6f0 50%,#f0ece3 100%);background-size:200% 100%;animation:cl-shimmer 1.4s linear infinite;border-radius:8px;margin:8px 0 4px}
          .skeleton-subline{height:12px;width:40%;background:#F7F4ED;border-radius:6px;margin-bottom:18px}
          .skeleton-name{height:18px;width:70%;background:#f0ece3;border-radius:6px;margin-bottom:8px}
          .skeleton-cta{height:46px;background:#f0ece3;border-radius:10px;margin-top:18px}
          @keyframes cl-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        `}</style>
      </div>
    );
  }

  // Catastrophe-state empty: only fires when the entire site has zero
  // active deals (totalDealCount === 0). The 7-day "no featured deal
  // today" empty state was retired 2026-04-30 — the daily-verification
  // sweep now keeps active deals fresh, so any time we have any active
  // deals at all we can fill the hero.
  if (!deal) {
    return (
      <div className="hero-deal-card hero-deal-empty">
        <div className="hero-deal-label" style={{ color: "#9ca3af" }}>
          {city ? `Deals near ${city}` : "Central Illinois deals"}
        </div>
        <div className="hero-deal-empty-headline">Pulling today's deals…</div>
        <p className="hero-deal-empty-sub">
          We're re-verifying with Central Illinois dispensaries right now.
          Browse the directory while we finish.
        </p>
        <Link href="/dispensaries" className="hero-deal-cta hero-deal-empty-cta">
          Browse Central IL dispensaries →
        </Link>
        <style>{`
          .hero-deal-empty-headline{font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#1F3D2B;letter-spacing:-.02em;margin:8px 0 6px}
          .hero-deal-empty-sub{font-size:.92rem;color:#6b7280;font-family:system-ui,sans-serif;line-height:1.55;margin:0 0 18px;max-width:520px}
          .hero-deal-empty-cta{display:inline-block;text-align:center;text-decoration:none}
        `}</style>
      </div>
    );
  }

  const slug = deal.slug || deal.listing_slug || "";
  const goHref = listingHref(slug, city);
  const name = displayName(deal);
  const savings = formatSavingsDollars(deal);
  const expiresToday = endsToday(deal.expires_at);
  const exact = hasExactSavings(deal);
  const regular = exact && deal.original_price != null ? Number(deal.original_price) : null;
  const sale = exact && deal.sale_price != null ? Number(deal.sale_price) : null;
  const userCoords = readUserCoords();
  const miles = distanceMiles(userCoords, { lat: deal.lat, lng: deal.lng });

  return (
    <div className="hero-deal-card">
      <div className="hero-deal-label">
        {city ? `Best deal near ${city} right now` : "Top Central Illinois deal right now"}
      </div>
      <div className="hero-deal-savings">{savings}</div>
      {regular != null && sale != null && (
        <div className="hero-deal-price">
          was <span className="strike">${regular.toFixed(0)}</span>, now <strong>${sale.toFixed(0)}</strong>
        </div>
      )}
      <div className="hero-deal-name">{name}</div>
      <div className="hero-deal-title">{deal.deal_title || "Active deal"}</div>
      <div className="hero-deal-row">
        <div className="hero-deal-meta">
          <span>📍 {displayCity(deal)}{miles != null && miles < 500 ? ` · ${miles.toFixed(1)} mi from you` : ""}</span>
          {openStatus?.isOpen === true && (
            <span className="hero-deal-open">● {openStatus.label}</span>
          )}
          {openStatus?.isOpen === false && (
            <span className="hero-deal-closed">{openStatus.label}</span>
          )}
          {expiresToday && <span className="hero-deal-urgent">⚡ Ends today</span>}
        </div>
        {goHref && (
          <TrackedLink
            href={goHref}
            className="hero-deal-cta"
            event="deal_cta_click"
            params={{ dispensary: name, position: 1, source: "hero_recommendation" }}
          >
            GO HERE →
          </TrackedLink>
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        <DealFreshnessBadge verifiedAt={deal.verified_at} statusReason={deal.status_reason} />
      </div>
      <Link
        href={city ? `/deals/all?city=${encodeURIComponent(city)}` : "/deals/all"}
        className="hero-deal-more"
      >
        {city ? `3 other deals near ${city} →` : "See more Central Illinois deals →"}
      </Link>
      <style>{`
        .hero-deal-price{font-size:.9rem;color:#6b7280;font-family:system-ui,sans-serif;margin:-4px 0 8px}
        .hero-deal-price .strike{text-decoration:line-through}
        .hero-deal-price strong{color:#7DBA47;font-weight:700}
        .hero-deal-open{color:#7DBA47;font-size:.75rem;font-weight:600;background:#F2F8E9;padding:2px 8px;border-radius:100px}
        .hero-deal-closed{color:#9ca3af;font-size:.72rem;font-family:system-ui,sans-serif}
      `}</style>
    </div>
  );
}
