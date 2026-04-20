"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { estimateSavings, formatSavingsDollars } from "../../lib/dealScoring";
import { displayCity } from "../../lib/cityNormalize";
import { listingHref } from "../../lib/links";
import TrackedLink from "./TrackedLink";

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
  expires_at?: string | null;
  scope?: "local" | "statewide";
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

function fetchDealForCity(c: string, signal?: AbortSignal): Promise<Deal | null> {
  return fetch(
    `/api/deals/recommend?category=all&limit=1&city=${encodeURIComponent(c)}`,
    { cache: "no-store", signal }
  )
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => data?.topPick || (Array.isArray(data?.deals) ? data.deals[0] : null) || null)
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

export default function HeroDealCard({ initial }: { initial: Deal | null }) {
  // We deliberately DO NOT seed state with `initial`. `initial` is the
  // server-rendered statewide top deal, which is almost always a Chicago
  // dispensary — showing that to a Peoria user while GPS is resolving is
  // the "wrong-city flash" we're fixing here. We only fall back to
  // `initial` once location detection has finished *without* producing
  // a city.
  const [deal, setDeal] = useState<Deal | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    // If a city was cached earlier this session, use it immediately.
    let cached: string | null = null;
    try {
      cached = sessionStorage.getItem("cl_city");
    } catch {}

    if (cached) {
      setCity(cached);
      setResolved(true);
      fetchDealForCity(cached, controller.signal).then((d) => {
        if (cancelled) return;
        const next = d || initial;
        setDeal(next);
        dispatchSavings(next);
      });
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    // No cached city — wait for LocationAware to dispatch its event.
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { city?: string } | null;
      if (cancelled) return;
      setResolved(true);
      if (detail?.city) {
        setCity(detail.city);
        fetchDealForCity(detail.city, controller.signal).then((d) => {
          if (cancelled) return;
          const next = d || initial;
          setDeal(next);
          dispatchSavings(next);
        });
      } else {
        // Detection finished with no city. Fall back to the server's
        // statewide top deal so the page is still useful.
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

  if (!resolved || !deal) {
    return (
      <div className="hero-deal-card skeleton" aria-busy="true" aria-live="polite">
        <div className="hero-deal-label" style={{ color: "#9ca3af" }}>
          Finding the best deal near you…
        </div>
        <div className="skeleton-savings" />
        <div className="skeleton-subline" />
        <div className="skeleton-name" />
        <div className="skeleton-subline" style={{ width: "85%" }} />
        <div className="skeleton-cta" />
        <style>{`
          .skeleton-savings{height:54px;width:62%;background:linear-gradient(90deg,#f0ece3 0%,#f8f6f0 50%,#f0ece3 100%);background-size:200% 100%;animation:cl-shimmer 1.4s linear infinite;border-radius:8px;margin:8px 0 4px}
          .skeleton-subline{height:12px;width:40%;background:#f5f4f0;border-radius:6px;margin-bottom:18px}
          .skeleton-name{height:18px;width:70%;background:#f0ece3;border-radius:6px;margin-bottom:8px}
          .skeleton-cta{height:46px;background:#f0ece3;border-radius:10px;margin-top:18px}
          @keyframes cl-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        `}</style>
      </div>
    );
  }

  const slug = deal.slug || deal.listing_slug || "";
  const goHref = listingHref(slug, city);
  const name = displayName(deal);
  const savings = formatSavingsDollars(deal);
  const expiresToday = endsToday(deal.expires_at);

  return (
    <div className="hero-deal-card">
      <div className="hero-deal-label">
        {city ? `Best deal near ${city} right now` : "Best deal near you right now"}
      </div>
      <div className="hero-deal-savings">{savings}</div>
      <div className="hero-deal-name">{name}</div>
      <div className="hero-deal-title">{deal.deal_title || "Active deal"}</div>
      <div className="hero-deal-row">
        <div className="hero-deal-meta">
          <span>📍 {displayCity(deal)}</span>
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
      <Link
        href={city ? `/deals/all?city=${encodeURIComponent(city)}` : "/deals/all"}
        className="hero-deal-more"
      >
        {city ? `3 other deals near ${city} →` : "3 other deals near you →"}
      </Link>
    </div>
  );
}
