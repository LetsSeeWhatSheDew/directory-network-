// app/components/VerifiedRow.tsx
// "✓ Verified [discount]% · [time]" — the trust signal that sits at the
// foot of every deal card and below the hero deal headline.
//
// Rules (P0 deal hygiene PR, 2026-11-05 rewrite):
//   - Always lead with a sage check + "Verified".
//   - Append the deal's discount when known (e.g. "25%"). Hidden when 0/null.
//   - Append a HUMAN-RELATIVE timestamp anchored to America/Chicago time —
//     not the user's machine time, not raw UTC. Central Illinois is the
//     only audience; "5pm here means 5pm Chicago" is the contract.
//
//     < 6 hours        → "2 hours ago"             ("just now" under 1 min)
//     same Chicago day → "today 9:14 AM"
//     yesterday        → "yesterday"
//     < 7 days         → "Mon" / "Tue" …
//     < 30 days        → "May 4"
//     ≥ 30 days        → still rendered as date so the row never lies; the
//                        deal-visibility layer (active_until + 7-day stale
//                        sweep) is what hides ancient deals from users.
//   - Stale (≥ 7 days) flips the verb to "Last checked …" and mutes the
//     palette so we don't dress up a stale check as fresh.
//   - Returns null when both verified_at AND discountPct are missing.
//
// Pure presentational component; no client state, safe in RSC + client.

import { Check } from "lucide-react";

type Props = {
  /** The deal's verified_at timestamp (ISO string). UTC at rest in the DB. */
  verifiedAt?: string | null;
  /** Percent discount when known (e.g. 25 for "25% off"). 0/null → omitted. */
  discountPct?: number | null;
  /** "compact" inside grids (default), "detail" for hero/detail surfaces. */
  variant?: "compact" | "detail";
  /** "light" — sage on cream/white. "dark" — sage-vibrant on deep surfaces. */
  tone?: "light" | "dark";
};

const CHICAGO_TZ = "America/Chicago";

/**
 * Returns the YYYY-MM-DD calendar date for a given instant, evaluated in
 * America/Chicago. Used so "yesterday" means "yesterday in Peoria", not
 * "yesterday in whatever timezone the server happened to render in".
 */
function chicagoDayKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHICAGO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function chicagoTimeOfDay(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function chicagoShortMonthDay(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    month: "short",
    day: "numeric",
  }).format(date);
}

function chicagoShortWeekday(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    weekday: "short",
  }).format(date);
}

function formatVerifiedTime(iso: string): string | null {
  const d = new Date(iso);
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return null;
  const now = new Date();
  const ageMs = now.getTime() - ms;
  if (ageMs < 0) return "just now"; // future timestamp: clock skew, treat as now

  const ageMin = ageMs / 60_000;
  const ageHours = ageMs / 3_600_000;

  if (ageMin < 1) return "just now";

  // < 6 hours: relative phrasing. Reads as fresh on a deal card without
  // forcing the user to do clock math.
  if (ageHours < 6) {
    if (ageMin < 60) {
      const m = Math.max(1, Math.round(ageMin));
      return `${m} minute${m === 1 ? "" : "s"} ago`;
    }
    const h = Math.round(ageHours);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }

  // Calendar-aware buckets, anchored to Chicago. A 5pm local check verified
  // at 9am the same morning should read "today 9:14 AM", not "9 hours ago".
  const today = chicagoDayKey(now);
  const verifiedDay = chicagoDayKey(d);
  if (verifiedDay === today) {
    return `today ${chicagoTimeOfDay(d)}`;
  }

  // "Yesterday" = the calendar day immediately before today in Chicago.
  const yesterday = chicagoDayKey(new Date(now.getTime() - 86_400_000));
  if (verifiedDay === yesterday) {
    return "yesterday";
  }

  const ageDays = ageMs / 86_400_000;
  if (ageDays < 7) {
    return chicagoShortWeekday(d);
  }
  return chicagoShortMonthDay(d);
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
