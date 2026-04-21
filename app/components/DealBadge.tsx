"use client";

import { useEffect, useState } from "react";

/**
 * Top 5% deal badge. Reads from the deal_rankings materialized view
 * (sql/migrations/2026-04-21-deal-ranking.sql). Renders nothing until
 * the view exists AND the given deal is flagged is_top_5_percent.
 *
 * This replaces the old A/B/C/D letter grade. Expected state on 2026-04-21
 * with current data: 1-2 badges total across the site (only `category=all`
 * clears the 20-deal floor per spec). As per-category coverage grows,
 * badges light up without code changes.
 */
export default function DealBadge({ dealId }: { dealId: string | number | undefined | null }) {
  const [isTop, setIsTop] = useState(false);

  useEffect(() => {
    if (!dealId) return;
    let cancelled = false;
    fetch(`/api/deals/ranking?id=${encodeURIComponent(String(dealId))}`, { cache: "force-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setIsTop(Boolean(data?.is_top_5_percent));
      })
      .catch(() => {
        // Migration not applied, view missing, or network error — silently
        // render nothing. The badge is additive; its absence never breaks
        // the deal card.
      });
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  if (!isTop) return null;

  return (
    <span
      className="deal-top-badge"
      aria-label="Top 5 percent deal"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "#fff7ed",
        color: "#c2410c",
        border: "1px solid #fdba74",
        borderRadius: 100,
        padding: "2px 10px",
        fontSize: ".72rem",
        fontWeight: 700,
        fontFamily: "system-ui, sans-serif",
        letterSpacing: ".02em",
      }}
    >
      🔥 Top 5%
    </span>
  );
}
