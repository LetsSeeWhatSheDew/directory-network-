// lib/dealActiveFilter.ts
// Day-of-week + active_until filter helpers.
//
// CONTRACT — match the DB layer
//
// The `active_deals_with_listings` view applies the same two filters
// at the DB layer (see sql/migrations/2026-11-05-deal-hygiene.sql,
// SECTION 5). These JS helpers exist so:
//
//   1. The handful of routes that read `public.deals` directly
//      (`/deal/[id]`, `/sitemap.ts`, `/search`, `/map`) can apply the
//      same gate without an extra round-trip through the view.
//   2. Client-side fetched lists (e.g. /api/deals/recommend → grid)
//      can defensively re-filter, in case stale per-row data sneaks
//      through after midnight rolls over in Chicago and the view
//      filter has cached output.
//
// Day-key convention: lowercase 3-letter ISO-style abbreviations:
//   'mon','tue','wed','thu','fri','sat','sun'.
//
// Timezone: the audience is Central Illinois (America/Chicago). A
// user in Peoria at 11pm Tuesday should still see Tuesday deals; at
// 12:01am Wednesday they should see Wednesday deals. Implementation
// uses Intl.DateTimeFormat with timeZone:'America/Chicago' so DST
// transitions don't have to be handled manually.

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const DAY_KEYS: readonly DayKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

const CHICAGO_TZ = "America/Chicago";

const WEEKDAY_TO_KEY: Record<string, DayKey> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

/**
 * The current weekday in America/Chicago, as a 3-letter lowercase token.
 * Pass `now` for tests; defaults to the actual current instant.
 */
export function chicagoDayKey(now: Date = new Date()): DayKey {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    weekday: "short",
  }).format(now);
  return WEEKDAY_TO_KEY[short] ?? "mon";
}

/**
 * Day-of-week label for an active_days array. "Mondays only", "Fri-Sun",
 * etc. Used in admin UI and the /deal/[id] not-active-today notice.
 */
export function describeActiveDays(days: readonly string[] | null | undefined): string | null {
  if (!days || days.length === 0) return null;
  const NAMES: Record<DayKey, string> = {
    mon: "Mondays",
    tue: "Tuesdays",
    wed: "Wednesdays",
    thu: "Thursdays",
    fri: "Fridays",
    sat: "Saturdays",
    sun: "Sundays",
  };
  // Preserve standard week order regardless of how the array was stored.
  const set = new Set(days.map((d) => d.toLowerCase()));
  const ordered = DAY_KEYS.filter((k) => set.has(k));
  if (ordered.length === 0) return null;
  if (ordered.length === 7) return "Every day";
  if (ordered.length === 1) return NAMES[ordered[0]];
  // Compact "Fri–Sun" when the set is a contiguous range; otherwise list.
  const idxs = ordered.map((k) => DAY_KEYS.indexOf(k));
  const isContiguous = idxs.every((v, i) => i === 0 || v === idxs[i - 1] + 1);
  if (isContiguous && ordered.length >= 3) {
    const SHORT: Record<DayKey, string> = {
      mon: "Mon",
      tue: "Tue",
      wed: "Wed",
      thu: "Thu",
      fri: "Fri",
      sat: "Sat",
      sun: "Sun",
    };
    return `${SHORT[ordered[0]]}–${SHORT[ordered[ordered.length - 1]]}`;
  }
  return ordered.map((k) => NAMES[k].replace(/s$/, "")).join(", ");
}

type DealLike = {
  active_days?: string[] | null;
  active_until?: string | null;
};

/**
 * Should this deal be visible right now?
 *
 *   • active_until in the past   → false
 *   • active_days set, doesn't include today's Chicago day → false
 *   • everything else            → true
 *
 * NULL/empty active_days = always-active. This matches the DB filter and
 * the "no day picker = every day" admin UX contract.
 */
export function isDealActiveNow(deal: DealLike, now: Date = new Date()): boolean {
  if (deal.active_until) {
    const until = new Date(deal.active_until).getTime();
    if (Number.isFinite(until) && until <= now.getTime()) return false;
  }
  const days = deal.active_days;
  if (!days || days.length === 0) return true;
  const today = chicagoDayKey(now);
  return days.map((d) => d.toLowerCase()).includes(today);
}

/** Filter a list of deals down to those active right now in Chicago. */
export function filterActiveDeals<T extends DealLike>(
  deals: readonly T[],
  now: Date = new Date()
): T[] {
  return deals.filter((d) => isDealActiveNow(d, now));
}
