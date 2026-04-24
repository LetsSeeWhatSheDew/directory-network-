/**
 * Renders a freshness indicator for a deal based on `verified_at` timestamp.
 *
 * Per 2026-04-26 scope lock:
 *   - Fresh verified (<7 days): "Verified {Mon Day}" (subtle gray)
 *   - Stale verified (7-14 days): "Last checked {Mon Day}" (muted)
 *   - status_reason='imported_not_verified' & verified_at >7d old:
 *       "Verification pending" (subtle gray)
 *   - No verified_at: "Verification pending"
 *   - 15-30 days: "⚠ Last checked N days ago — may be outdated" (amber)
 *   - > 30 days: null (parent should also filter; double-guard)
 */

import React from "react";

type Variant = "compact" | "detail";

function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 9999;
  return Math.floor((Date.now() - t) / 86_400_000);
}

function shortDate(iso: string): string | null {
  const t = new Date(iso);
  if (!Number.isFinite(t.getTime())) return null;
  return t.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

  const days = verifiedAt ? daysSince(verifiedAt) : null;
  const date = verifiedAt ? shortDate(verifiedAt) : null;

  // No verified_at at all — or imported-not-verified with stale verified_at
  // (older than 7 days) — show "Verification pending".
  if (
    !verifiedAt ||
    (statusReason === "imported_not_verified" && (days ?? 9999) > 7)
  ) {
    return (
      <span style={{ ...baseStyle, color: "#9ca3af", background: "transparent" }}>
        Verification pending
      </span>
    );
  }

  if (days === null) return null;
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
        ⚠ Last checked {days} days ago — may be outdated
      </span>
    );
  }

  if (days >= 7) {
    return (
      <span style={{ ...baseStyle, color: "#6b7280" }}>
        Last checked {date}
      </span>
    );
  }

  // Fresh: < 7 days
  return (
    <span style={{ ...baseStyle, color: "#9ca3af" }}>
      Verified {date}
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
