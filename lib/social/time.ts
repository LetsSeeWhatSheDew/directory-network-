// lib/social/time.ts — Central Time labels for "as of" lines.
// Every post carries one, so a screenshot shared a week later still says
// exactly when its numbers were true.

const TZ = "America/Chicago";

/** "Sep 27, 2026, 8:05 AM CT" from an ISO timestamp or Date. */
export function asOfLabel(at: string | Date): string {
  const d = typeof at === "string" ? new Date(at) : at;
  if (!Number.isFinite(d.getTime())) return "";
  const s = d.toLocaleString("en-US", { timeZone: TZ, month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  return `${s} CT`;
}

/** "Sep 26, 2026 CT" from a YYYY-MM-DD day (a calendar day in Central Time). */
export function dayAsOfLabel(day: string): string {
  return `${shortDay(day)} CT`;
}

/** "Sep 26, 2026" from YYYY-MM-DD. */
export function shortDay(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** "Sept 26" style short month + day, no year (for chart labels). */
export function monthDay(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Weekday initial for a YYYY-MM-DD day ("S", "M", …). */
export function weekdayShort(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

/** Today's date in Central Time as YYYY-MM-DD. */
export function ctDay(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** 0 = Sunday … 6 = Saturday, in Central Time. */
export function ctWeekday(now: Date = new Date()): number {
  const w = now.toLocaleDateString("en-US", { timeZone: TZ, weekday: "short" });
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(w);
}

/** Night theme between 19:00 and 06:00 Central, same as the site (Breathe spec). */
export function isNightCT(now: Date = new Date()): boolean {
  const h = Number(now.toLocaleString("en-US", { timeZone: TZ, hour: "numeric", hour12: false })) % 24;
  return h >= 19 || h < 6;
}

/** Days since Jan 1 of the Central Time year (0-based), for daily rotations. */
export function ctDayOfYear(now: Date = new Date()): number {
  const day = ctDay(now);
  const start = Date.UTC(Number(day.slice(0, 4)), 0, 1);
  return Math.floor((Date.parse(`${day}T00:00:00Z`) - start) / 86_400_000);
}
