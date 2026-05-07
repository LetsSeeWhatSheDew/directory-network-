// scripts/scrapers/regex.ts
//
// Title parsing for scraped deals. Two responsibilities:
//   1. inferDiscountPct — pull a "X% off" percentage from a title.
//   2. inferRecurringDays — detect themed-day patterns ("Munchie Monday",
//      "every tuesday", etc.) and return the matching weekday names.
//
// These run on every scraped deal during ingest so the day-of-week
// filter on the homepage works without an operator manually picking
// days. recurring_days is the column written to the deals table.

type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const DAY_PATTERNS: Array<{ pattern: RegExp; days: Weekday[] }> = [
  { pattern: /\bmunchie\s+monday\b|\bmonday\s+special\b|\bmotivation\s+monday\b/i, days: ["monday"] },
  { pattern: /\btoke\s+tuesday\b|\btwo\s+for\s+tuesday\b/i, days: ["tuesday"] },
  { pattern: /\bwax\s+wednesday\b|\bwellness\s+wednesday\b/i, days: ["wednesday"] },
  { pattern: /\bthirsty\s+thursday\b|\bthrowback\s+thursday\b/i, days: ["thursday"] },
  { pattern: /\bflower\s+friday\b|\bfeature\s+friday\b/i, days: ["friday"] },
  { pattern: /\bshatter\s+saturday\b|\bsuper\s+saturday\b/i, days: ["saturday"] },
  { pattern: /\bstoner\s+sunday\b|\bself-care\s+sunday\b/i, days: ["sunday"] },
  { pattern: /\bmondays?\s+only\b|\bevery\s+monday\b/i, days: ["monday"] },
  { pattern: /\btuesdays?\s+only\b|\bevery\s+tuesday\b/i, days: ["tuesday"] },
  { pattern: /\bwednesdays?\s+only\b|\bevery\s+wednesday\b/i, days: ["wednesday"] },
  { pattern: /\bthursdays?\s+only\b|\bevery\s+thursday\b/i, days: ["thursday"] },
  { pattern: /\bfridays?\s+only\b|\bevery\s+friday\b/i, days: ["friday"] },
  { pattern: /\bsaturdays?\s+only\b|\bevery\s+saturday\b/i, days: ["saturday"] },
  { pattern: /\bsundays?\s+only\b|\bevery\s+sunday\b/i, days: ["sunday"] },
];

const WEEKDAY_ORDER: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function inferRecurringDays(
  title: string,
  description?: string
): Weekday[] | null {
  const haystack = `${title ?? ""} ${description ?? ""}`;
  const found = new Set<Weekday>();
  for (const { pattern, days } of DAY_PATTERNS) {
    if (pattern.test(haystack)) {
      for (const d of days) found.add(d);
    }
  }
  if (found.size === 0) return null;
  return WEEKDAY_ORDER.filter((d) => found.has(d));
}

export function inferDiscountPct(title: string): number | null {
  if (!title) return null;
  const m = title.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n);
}
