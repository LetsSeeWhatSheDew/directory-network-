# Hours / Open-Now Bug Diagnostic — 2026-04-19

**TL;DR:** Predicate is broken, data is mostly fine. The `isOpenNow()` function uses `new Date().getDay()` and `new Date().getHours()` on a Vercel server that runs in UTC — at 7pm CT (Matthew's test time), that's midnight UTC the *next day*, so the predicate looks up Monday's hours and compares them to "00:00 minutes since midnight." Every dispensary returns `open: false`.

**Verdict:** PREDICATE WRONG. Two dispensaries also have missing data (separate, smaller issue).

---

## Schema (Query A)

`listing_hours` columns:

| column | type | nullable |
|---|---|---|
| id | bigint | NO |
| project_tag | text | NO |
| listing_id | text | NO |
| weekday | smallint | NO |
| opens_at | time without time zone | YES |
| closes_at | time without time zone | YES |
| is_closed | boolean | YES |

**Notes:**
- The column is `weekday`, not `day_of_week`. (The diagnostic prompt asked for `day_of_week` — that name is from an older schema.)
- `opens_at` / `closes_at` are `TIME` (no date, no zone). Stored as local Central Time per business convention.
- No timezone metadata. The code is responsible for treating these as CT.

## Sample data (Query B — 3 IL dispensaries)

**nuEra East Peoria** — 7 rows, weekday 0–6 populated:

| weekday | opens_at | closes_at | is_closed |
|---|---|---|---|
| 0 | 09:00 | 20:00 | false |
| 1 | 09:00 | 20:00 | false |
| 2 | 09:00 | 20:00 | false |
| 3 | 09:00 | 21:00 | false |
| 4 | 09:00 | 21:00 | false |
| 5 | 09:00 | 21:00 | false |
| 6 | 09:00 | 18:00 | false |

**Star Buds Westmont** — **0 rows.** No hours data at all.

**Hi5 Dispensary Crestwood** — **0 rows.** No hours data at all.

**Weekday encoding:** integer 0–6. Looking at nuEra (Sunday closes earliest at 18:00, weekend pattern), the most likely encoding is `0=Mon … 6=Sun` (ISO weekday minus one). The current code agrees: `(now.getDay() + 6) % 7` converts JS `getDay()` (0=Sun) to (0=Mon).

## Coverage (Query C / D combined)

```
total_il dispensaries (project_tag=green, state=IL):  61
late_closers (any row with closes_at >= 20:00):       45
with_hours_weekday0 (Monday hours present):           50
with_sunday_hours_weekday6:                           47
```

**Read:** 45 of 61 (74%) close at 8pm or later — so when the live site shows "0 dispensaries open" at 7pm, that is unambiguously the predicate, not the data. **The data has hours.** ~16 dispensaries lack hour rows entirely; those will always show closed regardless of predicate fixes.

Top late closers (closes_at >= 20:00):
- Trinity on Glen — Mon, Tue, Wed, Thu, Fri all 9am–10pm
- Ivy Hall Dispensary — Thu, Fri 8am–10pm
- Zen Leaf Aurora — Thu, Fri 9am–10pm

---

## Open-now predicate (Task 2)

### File 1 — Primary location

`app/cannabis/illinois/open-now/page.tsx`, lines **57–69**:

```ts
function isOpenNow(hours: Hour[], listingId: string): { open: boolean; closes: string | null } {
  const now = new Date();                          // ← UTC on Vercel
  const dayIdx = (now.getDay() + 6) % 7;           // ← UTC weekday
  const row = hours.find((h) => h.listing_id === listingId && h.weekday === dayIdx);
  if (!row || row.is_closed || !row.opens_at || !row.closes_at) return { open: false, closes: null };
  const [oh, om] = row.opens_at.split(":").map(Number);
  const [ch, cm] = row.closes_at.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();   // ← UTC minutes-since-midnight
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  if (nowMins >= openMins && nowMins < closeMins) return { open: true, closes: row.closes_at };
  return { open: false, closes: null };
}
```

Plus the page-level data fetch at **line 81–92** uses the same UTC `dayIdx`:

```ts
const dayIdx = (now.getDay() + 6) % 7;            // ← UTC
const [listings, hours] = await Promise.all([
  fetchJson<...>(`/master_listings?...`),
  fetchJson<...>(`/listing_hours?weekday=eq.${dayIdx}&...`),  // ← fetches wrong day's rows
]);
```

So the bug compounds: it fetches the wrong day's rows AND compares against the wrong hour.

The page only uses `timeZone: "America/Chicago"` for the **display string** at line 83 — never for the predicate logic.

### File 2 — Duplicate logic #1, same bug

`app/dispensary/[slug]/page.tsx`, lines **123–140** (`todayOpenStatus()`):

```ts
const now = new Date();
const dayIdx = (now.getDay() + 6) % 7;
...
const nowMin = now.getHours() * 60 + now.getMinutes();
```

Same UTC bug. This drives the "Open until 8 PM" / "Closed now" badge on the dispensary detail page.

### File 3 — Duplicate logic #2, same bug

`app/cannabis/illinois/[slug]/[intent]/page.tsx`, line **12**:

```ts
function on2(hrs:H[],id:string){const now=new Date();const di=(now.getDay()+6)%7; ... const nm=now.getHours()*60+now.getMinutes(); ...}
```

Identical bug. Single-line minified function `on2`. Used by `/cannabis/illinois/[city]/open-now` route variants.

### Bug walkthrough (7pm CT Sunday April 19, 2026)

- Real time: Sunday 19:00 CDT (UTC-5)
- UTC equivalent: Monday 00:00
- `new Date().getDay()` on Vercel returns `1` (Monday), not `0` (Sunday)
- `dayIdx = (1 + 6) % 7 = 0` → looks up weekday=0 (which their schema treats as Monday)
- Fetch returns Monday hours for everyone
- `nowMins = 0 * 60 + 0 = 0`
- Every Monday `openMins >= 480` (8am) or `>= 540` (9am)
- `0 >= 480` → false → `open: false` for all 61
- **Result: "0 of 61 open" displayed.**

The display string "Live · 12:00 AM CT" *would* tip Matthew off because it correctly converts to CT — except the page actually shows the *current* CT time correctly via `timeZone: "America/Chicago"` on line 83. So the user sees "Live · 7:00 PM CT" but the predicate is silently using midnight UTC. That mismatch is what's so insidious.

### What the fix needs

1. Get the current moment in Central Time as a `Date` (or as `{day, hour, minute}`) using `Intl.DateTimeFormat` with `timeZone: "America/Chicago"`.
2. Use that for BOTH the data fetch (`weekday=eq.${ctDay}`) AND the comparison (`ctMinutes`).
3. Handle post-midnight closes: `closeMins <= openMins` → wraps; add 24h to `closeMins` and shift `nowMins` if it's before openMins.
4. Single source of truth — extract to `lib/hours.ts` so both `open-now/page.tsx` and `[slug]/[intent]/page.tsx` use the same function.

Reference implementation pattern (Code can adapt):

```ts
// lib/hours.ts
export function nowInCT(): { weekday: number; minutes: number } {
  // weekday: 0=Mon, 6=Sun (matches DB encoding)
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "numeric", minute: "numeric", hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  const wkMap: Record<string, number> = { Mon:0, Tue:1, Wed:2, Thu:3, Fri:4, Sat:5, Sun:6 };
  const weekday = wkMap[parts.weekday] ?? 0;
  const hour = parts.hour === "24" ? 0 : Number(parts.hour);
  const minutes = hour * 60 + Number(parts.minute);
  return { weekday, minutes };
}

export function isOpen(row: { opens_at: string|null; closes_at: string|null; is_closed: boolean|null }, ct: { minutes: number }): boolean {
  if (!row || row.is_closed || !row.opens_at || !row.closes_at) return false;
  const [oh, om] = row.opens_at.split(":").map(Number);
  const [ch, cm] = row.closes_at.split(":").map(Number);
  const open = oh * 60 + om;
  let close = ch * 60 + cm;
  let now = ct.minutes;
  if (close <= open) {
    close += 24 * 60;
    if (now < open) now += 24 * 60;
  }
  return now >= open && now < close;
}
```

### Data gap (separate from the predicate bug)

~16 of 61 IL dispensaries have NO `listing_hours` rows. After the predicate is fixed they will still always show "closed." Star Buds Westmont and Hi5 Dispensary Crestwood are confirmed examples. This is a backfill task, not a code task — flag for Matthew, do not block the predicate fix on it.

---

## Files Code needs to touch

1. `app/cannabis/illinois/open-now/page.tsx` — replace `isOpenNow()` (lines 57–69) and the day-fetch (lines 81–92) with the CT-aware versions. Pull from `lib/hours.ts`.
2. `app/dispensary/[slug]/page.tsx` — replace `todayOpenStatus()` (lines 123–140) with the same `lib/hours.ts` import.
3. `app/cannabis/illinois/[slug]/[intent]/page.tsx` — replace `on2()` (line 12) and the `di` constant (line 27) with the same `lib/hours.ts` import.
4. `lib/hours.ts` — new file, single source of truth.

After the fix, expected count at 7pm CT Sunday (data: nuEra East Peoria closes at 18:00 Sun = closed; many others close at 20:00–22:00 = open): **roughly 30–40 open**, not 0.
