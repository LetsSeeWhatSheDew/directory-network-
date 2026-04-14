"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Deal = {
  deal_id?: string;
  id?: string;
  listing_slug?: string;
  slug?: string;
  name?: string;
  city?: string;
  category?: string;
  deal_title?: string;
  title?: string;
  discount_value?: number;
  discount_unit?: string;
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

function categoryEmoji(c?: string | null) {
  if (c === "flower") return "🌿";
  if (c === "edibles") return "🍬";
  if (c === "vapes") return "💨";
  if (c === "concentrate") return "💎";
  return "🔥";
}

export default function HomeTicker({ initial }: { initial: Deal[] }) {
  const [deals, setDeals] = useState<Deal[]>(initial || []);

  useEffect(() => {
    let city: string | null = null;
    try {
      city = sessionStorage.getItem("cl_city");
    } catch {}
    if (!city) return;

    const url = `/api/deals/recommend?category=all&limit=8&city=${encodeURIComponent(city)}`;
    fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data?.deals) && data.deals.length > 0) {
          setDeals(data.deals.slice(0, 8));
        }
      })
      .catch(() => {});
  }, []);

  if (!deals || deals.length === 0) return null;

  const items = [...deals, ...deals];

  return (
    <div className="ticker" aria-label="Live deals ticker">
      <span className="ticker-live">
        <span className="ticker-live-dot" aria-hidden="true" />
        Live
      </span>
      <div className="ticker-track">
        {items.map((d, i) => {
          const name = displayName(d);
          const title =
            d.deal_title ||
            d.title ||
            (d.discount_unit === "percent"
              ? `${Math.round(d.discount_value || 0)}% off ${d.category || "deal"}`
              : d.discount_unit === "dollars"
              ? `$${d.discount_value} off ${d.category || "deal"}`
              : "Active deal");
          const pct =
            d.discount_unit === "percent" && d.discount_value
              ? `${Math.round(d.discount_value)}%`
              : null;
          return (
            <span
              key={`tk-${i}-${d.deal_id || d.id || name}`}
              style={{ display: "inline-flex", gap: 22, alignItems: "center" }}
            >
              <Link href={`/deals/${d.category || "all"}`}>
                {categoryEmoji(d.category)} <strong>{name}</strong>: {title}
                {pct && (
                  <>
                    {" · "}
                    <em>Save {pct}</em>
                  </>
                )}
              </Link>
              <span className="sep">·</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
