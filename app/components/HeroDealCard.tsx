"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatSavingsDollars } from "../../lib/dealScoring";
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

export default function HeroDealCard({ initial }: { initial: Deal | null }) {
  const [deal, setDeal] = useState<Deal | null>(initial);
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    let c: string | null = null;
    try {
      c = sessionStorage.getItem("cl_city");
    } catch {}
    if (!c) return;
    setCity(c);
    fetch(`/api/deals/recommend?category=all&limit=1&city=${encodeURIComponent(c)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const top = data?.topPick || (Array.isArray(data?.deals) ? data.deals[0] : null);
        if (top) setDeal(top);
      })
      .catch(() => {});
  }, []);

  if (!deal) {
    return (
      <div className="hero-deal-card skeleton" aria-hidden="true">
        <div className="hero-deal-label" style={{ color: "#c4c0b6" }}>
          Finding the best deal near you…
        </div>
        <div style={{ height: 54, width: "60%", background: "#f0ece3", borderRadius: 8, margin: "8px 0 4px" }} />
        <div style={{ height: 14, width: "40%", background: "#f5f4f0", borderRadius: 6, marginBottom: 20 }} />
        <div style={{ height: 20, width: "70%", background: "#f0ece3", borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 14, width: "85%", background: "#f5f4f0", borderRadius: 6, marginBottom: 20 }} />
        <div style={{ height: 48, background: "#f0ece3", borderRadius: 10 }} />
      </div>
    );
  }

  const slug = deal.slug || deal.listing_slug || "";
  const name = displayName(deal);
  const savings = formatSavingsDollars(deal);
  const expiresToday = endsToday(deal.expires_at);

  return (
    <div className="hero-deal-card">
      <div className="hero-deal-label">
        {city ? `Best deal near ${city} right now` : "Best deal near you right now"}
      </div>
      <div className="hero-deal-savings">{savings}</div>
      <div className="hero-deal-vs">vs. area average</div>
      <div className="hero-deal-name">{name}</div>
      <div className="hero-deal-title">{deal.deal_title || "Active deal"}</div>
      <div className="hero-deal-row">
        <div className="hero-deal-meta">
          <span>📍 {deal.city || "Illinois"}</span>
          {expiresToday && <span className="hero-deal-urgent">⚡ Ends today</span>}
        </div>
        <TrackedLink
          href={`/l/${slug}`}
          className="hero-deal-cta"
          event="deal_cta_click"
          params={{ dispensary: name, position: 1, source: "hero_recommendation" }}
        >
          GO HERE →
        </TrackedLink>
      </div>
      <Link href="/deals/all" className="hero-deal-more">
        3 other deals near you →
      </Link>
    </div>
  );
}
