// app/components/VerifiedRow.tsx
// "✓ Verified [discount]% · [time]" — the trust signal that sits at the
// foot of every deal card and below the hero deal headline. Replaces the
// older "Verified May 4" plain-date pattern.
//
// Rules (cleanup PR, 2026-05-04):
//   - Always lead with a sage check + "Verified".
//   - Append the deal's discount when known (e.g. "25%"). Hidden when 0/null.
//   - Append the timestamp formatted in the user's local timezone:
//       within 24h → "11:09 AM"
//       older     → "May 3"  (short date, no time)
//   - Stale (>= 7 days) falls back to a muted "Last checked …" line so we
//     don't dress up a stale check as fresh.
//   - Returns null for missing verified_at AND missing discount_pct
//     (no signal to render — caller should still show its empty state).
//
// Pure presentational component; no client state, safe in RSC + client.

import { Check } from "lucide-react";

type Props = {
  /** The deal's verified_at timestamp (ISO string, server-rendered). */
  verifiedAt?: string | null;
  /** Percent discount when known (e.g. 25 for "25% off"). 0/null → omitted. */
  discountPct?: number | null;
  /** "compact" inside grids (default), "detail" for hero/detail surfaces. */
  variant?: "compact" | "detail";
  /** "light" — sage on cream/white. "dark" — sage-vibrant on deep surfaces. */
  tone?: "light" | "dark";
};

function formatVerifiedTime(iso: string): string | null {
  const d = new Date(iso);
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return null;
  const ageHours = (Date.now() - ms) / 3_600_000;
  if (ageHours < 0) {
    // Future timestamp — treat as "now".
    return "just now";
  }
  if (ageHours < 24) {
    // Local-time clock format. Falls back to UTC if the runtime can't
    // resolve the user's timezone (very rare, but defensive).
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isStale(iso: string): boolean {
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return false;
  const ageDays = (Date.now() - ms) / 86_400_000;
  return ageDays >= 7;
}

export default function VerifiedRow({
  verifiedAt,
  discountPct,
  variant = "compact",
  tone = "light",
}: Props) {
  const pct = discountPct != null && Number(discountPct) > 0 ? Math.round(Number(discountPct)) : null;
  const time = verifiedAt ? formatVerifiedTime(verifiedAt) : null;
  if (pct == null && !time) return null;

  const stale = verifiedAt ? isStale(verifiedAt) : false;
  const sage = "var(--color-sage, #7DBA47)";
  const sageVibrant = "var(--color-sage-vibrant, #93CB5C)";
  const mutedDark = "rgba(247, 244, 237, 0.62)";
  const mutedLight = "var(--color-gray-500, #6B7280)";

  const checkColor = stale ? (tone === "dark" ? mutedDark : mutedLight) : tone === "dark" ? sageVibrant : sage;
  const labelColor = stale ? (tone === "dark" ? mutedDark : mutedLight) : tone === "dark" ? "rgba(247, 244, 237, 0.78)" : "var(--color-gray-700, #374151)";
  const metaColor = tone === "dark" ? mutedDark : mutedLight;

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: variant === "detail" ? 6 : 4,
    fontFamily: "Manrope, system-ui, -apple-system, sans-serif",
    fontSize: variant === "detail" ? "0.82rem" : "0.72rem",
    fontWeight: 500,
    letterSpacing: "0.01em",
    color: labelColor,
  };

  const verb = stale ? "Last checked" : "Verified";

  return (
    <span style={baseStyle} aria-label={`${verb}${pct != null ? ` ${pct}% off` : ""}${time ? ` at ${time}` : ""}`}>
      <Check
        size={variant === "detail" ? 14 : 12}
        strokeWidth={2.5}
        color={checkColor}
        aria-hidden="true"
      />
      <span>
        {verb}
        {pct != null ? <strong style={{ fontWeight: 700, color: stale ? labelColor : tone === "dark" ? "var(--color-cream, #F7F4ED)" : "var(--color-deep, #1F3D2B)" }}>{` ${pct}%`}</strong> : null}
        {time ? <span style={{ color: metaColor }}> · {time}</span> : null}
      </span>
    </span>
  );
}
