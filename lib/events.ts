// lib/events.ts — the three big dispensary sale days PuffPrice tracks.
//
// One place for the date, the hub path and the words each hub uses, so the
// Green Wednesday, 4/20 and 7/10 pages, the "email me that morning" watch
// (lib/dealWatch.ts, alert_type 'event_watch') and the daily sender
// (lib/watchRuns.ts) all agree. Dates are Central Time calendar days.
//
// Pure data + date helpers only: safe to import from client components.

export type SaleEvent = {
  /** Stable id stored on the watch row as 'event:<id>'. Includes the year. */
  id: string;
  /** Hub page path. */
  path: string;
  /** "Green Wednesday" */
  name: string;
  /** YYYY-MM-DD, Central Time. */
  date: string;
  /** "Wednesday, November 25, 2026" */
  dateLabel: string;
  /** One or two plain sentences: what the day is. */
  what: string;
  /** Deal titles that mention the day (used for "announced early"). */
  match: RegExp;
};

export const SALE_EVENTS: SaleEvent[] = [
  {
    id: "green-wednesday-2026",
    path: "/green-wednesday",
    name: "Green Wednesday",
    date: "2026-11-25",
    dateLabel: "Wednesday, November 25, 2026",
    what: "The day before Thanksgiving. It has become one of the busiest dispensary days of the year, and a lot of stores save their biggest fall sales for it.",
    match: /green\s*wednesday|thanksgiving|black\s*friday|turkey/i,
  },
  {
    id: "420-2027",
    path: "/420",
    name: "4/20",
    date: "2027-04-20",
    dateLabel: "Tuesday, April 20, 2027",
    what: "April 20, the biggest sale day on the cannabis calendar. Many stores run their deepest discounts of the spring, and some announce them ahead of time.",
    match: /\b4\s*\/\s*20\b|\b4-20\b|\b420\b/i,
  },
  {
    id: "710-2027",
    path: "/710",
    name: "7/10",
    date: "2027-07-10",
    dateLabel: "Saturday, July 10, 2027",
    what: "July 10. Flip 710 upside down and it reads OIL, so it's the day stores discount concentrates, vape carts and other extracts.",
    match: /\b7\s*\/\s*10\b|\b7-10\b|\b710\b/i,
  },
];

export function eventById(id: string | null | undefined): SaleEvent | null {
  return SALE_EVENTS.find((e) => e.id === id) || null;
}

export function eventByPath(path: string): SaleEvent | null {
  return SALE_EVENTS.find((e) => e.path === path) || null;
}

/** Today's date in Central Time, YYYY-MM-DD. */
export function ctToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Whole days from today (Central Time) to the event. 0 = today, negative = past. */
export function daysUntil(ev: Pick<SaleEvent, "date">, now: Date = new Date()): number {
  const today = Date.parse(`${ctToday(now)}T00:00:00Z`);
  const day = Date.parse(`${ev.date}T00:00:00Z`);
  return Math.round((day - today) / 86_400_000);
}

/** Events happening today (Central Time). */
export function eventsOn(day: string): SaleEvent[] {
  return SALE_EVENTS.filter((e) => e.date === day);
}
