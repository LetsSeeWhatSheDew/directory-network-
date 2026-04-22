/**
 * Renders a freshness indicator for a deal based on `verified_at` timestamp.
 * Uses the existing deals.verified_at column (NOT last_verified_at — the
 * staleness migration doesn't add a new column, it writes to verified_at
 * when the cron deactivates a deal).
 *
 * Tiers:
 *   - status_reason='imported_not_verified':
 *       "Imported {Mon Day}" (muted) — derived from verified_at + 7d
 *       (Option C in docs/handoffs/verified-at-strategy-20260422.md)
 *   - null verified_at:  "Verification pending"  (subtle gray)
 *   - ≤ 7 days:          "Verified N day(s) ago" (subtle gray)
 *   - 8–14 days:         "Verified N days ago"   (muted)
 *   - 15–30 days:        "⚠ Verified N days ago — may be outdated" (amber)
 *   - > 30 days:         null (parent should also filter; double-guard)
 */

import React from "react";

type Variant = "compact" | "detail";

function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 9999;
  return Math.floor((Date.now() - t) / 86_400_000);
}

type Props = {
  verifiedAt?: string | null;
  variant?: Variant;
  statusReason?: string | null;
};

export default function DealFreshnessBadge({
  verifiedAt,
  variant = "compact",
  statusReason,
}: Props) {
  const baseStyle: React.CSSProperties = {
    display: "inline-block",
    fontFamily: "system-ui, sans-serif",
    fontSize: variant === "detail" ? ".82rem" : ".7rem",
    letterSpacing: ".01em",
    padding: variant === "detail" ? "3px 10px" : "2px 8px",
    borderRadius: 100,
    fontWeight: 500,
  };

  // Option C: imported-not-verified deals render the import date (not a
  // fake "verified N days ago"). verified_at was backfilled to
  // created_at - 7d, so +7d recovers the real import date.
  const importedLabel = React.useMemo(() => {
    if (statusReason !== "imported_not_verified") return null;
    if (!verifiedAt) return null;
    const ts = new Date(verifiedAt);
    if (!Number.isFinite(ts.getTime())) return null;
    const importDate = new Date(ts.getTime() + 7 * 24 * 60 * 60 * 1000);
    return importDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }, [statusReason, verifiedAt]);

  if (importedLabel) {
    return (
      <span style={{ ...baseStyle, color: "#6b7280" }}>
        Imported {importedLabel}
      </span>
    );
  }

  if (!verifiedAt) {
    return (
      <span style={{ ...baseStyle, color: "#9ca3af", background: "transparent" }}>
        Verification pending
      </span>
    );
  }

  const days = daysSince(verifiedAt);
  if (days > 30) return null;

  if (days >= 15) {
    return (
      <span
        style={{
          ...baseStyle,
          color: "#92400e",
          background: "#fef3c7",
          fontWeight: 600,
        }}
        title="Consider double-checking with the dispensary"
      >
        ⚠ Verified {days} days ago — may be outdated
      </span>
    );
  }

  if (days >= 8) {
    return (
      <span style={{ ...baseStyle, color: "#6b7280" }}>
        Verified {days} days ago
      </span>
    );
  }

  const whenText = days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
  return (
    <span style={{ ...baseStyle, color: "#9ca3af" }}>
      Verified {whenText}
    </span>
  );
}

/**
 * True when the deal should be hidden from the grid entirely (verified_at
 * is older than 30 days). Parent components can filter proactively using
 * this, as a double-safety layer against the badge itself returning null.
 * Imported-not-verified deals are NOT hidden even though verified_at-7d
 * puts them >7d old — they're an honest "imported" state, not stale.
 */
export function isFreshnessHidden(
  verifiedAt?: string | null,
  statusReason?: string | null
): boolean {
  if (statusReason === "imported_not_verified") return false;
  if (!verifiedAt) return false;
  return daysSince(verifiedAt) > 30;
}

/**
 * True when the deal should render in a visually de-emphasized state
 * (15-30 day range). Callers wrap their deal card in opacity/grayscale.
 */
export function isFreshnessStale(
  verifiedAt?: string | null,
  statusReason?: string | null
): boolean {
  if (statusReason === "imported_not_verified") return false;
  if (!verifiedAt) return false;
  const d = daysSince(verifiedAt);
  return d >= 15 && d <= 30;
}
