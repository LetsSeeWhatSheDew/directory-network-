// lib/hours.ts
// Single source of truth for "is this dispensary open right now" logic.
//
// DB schema (listing_hours):
//   weekday   smallint   0=Monday … 6=Sunday  (ISO, Mon-first)
//   opens_at  time       Local Central Time, no zone metadata
//   closes_at time       Local Central Time, no zone metadata
//   is_closed boolean    true = closed all day
//
// Vercel runs in UTC. Don't trust new Date().getDay() / .getHours() server-side.
// Always go through nowInCT() so the predicate sees Central Time.

export type HoursRow = {
  weekday?: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean | null;
};

export type CTNow = {
  weekday: number; // 0=Mon … 6=Sun, matches DB encoding
  minutes: number; // minutes since midnight CT
};

export function nowInCT(date: Date = new Date()): CTNow {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  );
  const wkMap: Record<string, number> = {
    Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
  };
  const weekday = wkMap[parts.weekday] ?? 0;
  // hour12:false can return "24" at midnight in some Intl impls
  const hour = parts.hour === "24" ? 0 : Number(parts.hour);
  const minutes = hour * 60 + Number(parts.minute);
  return { weekday, minutes };
}

export function isOpen(row: HoursRow | undefined | null, ct: CTNow): boolean {
  if (!row || row.is_closed || !row.opens_at || !row.closes_at) return false;
  const [oh, om] = row.opens_at.split(":").map(Number);
  const [ch, cm] = row.closes_at.split(":").map(Number);
  if ([oh, om, ch, cm].some((n) => Number.isNaN(n))) return false;
  const open = oh * 60 + om;
  let close = ch * 60 + cm;
  let now = ct.minutes;
  // Post-midnight close: if close <= open, the closing time rolls into the
  // next day. Push close past 24h, and shift now if it hasn't crossed open
  // yet (we may be in the early-morning tail of yesterday's session).
  if (close <= open) {
    close += 24 * 60;
    if (now < open) now += 24 * 60;
  }
  return now >= open && now < close;
}

// Format a HH:MM:SS time string as "5:30 PM" / "9:00 AM"
export function formatTime(t: string | null | undefined): string {
  if (!t || typeof t !== "string" || !t.includes(":")) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  if (Number.isNaN(hour)) return "";
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}
