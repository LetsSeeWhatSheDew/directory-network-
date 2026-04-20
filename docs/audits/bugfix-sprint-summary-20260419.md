# Bugfix Sprint Summary — 2026-04-19

One-page roll-up of the five ship-blockers Matthew found testing from Peoria at 7pm CT on April 19. Evidence and reasoning are in the companion audit files. This doc tells Code what to touch and in what order.

## The five bugs at a glance

| # | Bug | Root cause | Fix scope |
|---|---|---|---|
| 1 | Hours "open now" shows 0 dispensaries | Predicate uses UTC instead of CT | ~80 LOC, 3 files touched, 1 file added |
| 2 | Location doesn't persist across routes | `sessionStorage` unreadable by server components; internal links leak | ~40 LOC, cookie + server helper, 5 files touched |
| 3 | "See details →" appears broken | `<details>/<summary>` widget mistaken for a link | 1 file, ~10 LOC |
| 4 | "DirectoryNetwork" still shows | Pre-rebrand brand markup in 14 files | Mechanical find-replace, ~20 lines touched |
| 5 | "$23 per trip" overclaims savings | Copy implies aggregate stat over a single deal | 1 component, ~15 LOC |

Plus two carry-overs from earlier flags: Supabase module-eval fragility and missing `/dispensaries` / `/about` (the latter probably already exists — verify).

## Order of operations for Code

Recommended sequence (each step safe to commit independently if time runs out):

### Step 1 — Create `lib/hours.ts` and `lib/location.ts` (foundations)

These two helpers unblock every other change. Write them first, verify with unit-level mental checks, then use them.

**`lib/hours.ts`** — see reference implementation in `hours-bug-diagnostic-20260419.md` (Files 1–3 section). Export `nowInCT()` and `isOpen(row, ct)`.

**`lib/location.ts`** — see reference implementation in `location-bug-diagnostic-20260419.md`. Export `getServerLocation()` that reads cookie `pp_loc`, plus a client-side `saveLocationCookie(loc)` helper to be called from `LocationAware.tsx`.

### Step 2 — Wire hours helper into the 3 pages

| File | Replace |
|---|---|
| `app/cannabis/illinois/open-now/page.tsx` | Lines 57–69 (`isOpenNow`), lines 81–92 (day-index for fetch). Import `nowInCT`, `isOpen` from `lib/hours.ts`. |
| `app/dispensary/[slug]/page.tsx` | Lines 123–140 (`todayOpenStatus`). Same import. |
| `app/cannabis/illinois/[slug]/[intent]/page.tsx` | Line 12 (`on2`), line 27 (`di`). Same import. |

Verification: in dev, visit `/cannabis/illinois/open-now` at current CT time; count should be >0 (unless it's genuinely between ~10pm and ~9am CT). Sanity-check one dispensary's detail page (`/dispensary/nuera-east-peoria`) for a correct "Open until 6 PM" / "Closed" badge.

### Step 3 — Wire location cookie + server read

**Write side (client)** — in `app/components/LocationAware.tsx`:
- In `save()` (line 27): after the `sessionStorage` writes, also set `document.cookie = pp_loc=${encodeURIComponent(JSON.stringify(loc))}; max-age=${30*24*3600}; path=/; samesite=lax`.
- No other client changes — existing event-dispatch pattern continues to work for client-side consumers.

**Read side (server)** — in these server components, call `getServerLocation()` and fall through priority `URL param → cookie → null`:
- `app/deals/[category]/page.tsx` — at line 394 where `rawCity` is read.
- `app/page.jsx` — at the top of `HomePage()` around line 444–451, pass the city into `getTopDeals(city)`, `getDealPool(city)`, etc. (these functions currently don't take a city param — add the optional argument and a city filter in the Supabase URL when provided, same pattern as `getDeals()` in `deals/[category]/page.tsx`).
- `app/cannabis/illinois/page.tsx` — same pattern.
- `app/cannabis/illinois/open-now/page.tsx` — use city to prioritize the user's metro in the display grouping.
- `app/cannabis/illinois/[slug]/page.tsx` — already city-scoped by URL param; nothing to change.

Verification: in dev, set a cookie manually (`document.cookie = 'pp_loc=' + encodeURIComponent(JSON.stringify({city:"Peoria"}))` in devtools), then navigate to `/deals/flower` with no query string. Peoria-area deals should be the Our Recommendation.

### Step 4 — Fix "See details" disclosure affordance

In `app/deals/[category]/page.tsx` line 673–680:
- Keep the `<details>/<summary>` if you want the inline-expand behavior — but change the summary text to `<summary>More details ▾</summary>` (disclosure triangle makes the affordance obvious) and kill the link-colored CSS at 484–485 so it reads as "expand" not "link".
- Add a separate real link just below, e.g.:

```tsx
<Link
  href={`/dispensary/${topDeal.slug || topDeal.listing_slug}`}
  className="deal-view-dispensary"
>
  View this dispensary →
</Link>
```

Verification: tap the summary → expands inline (no navigation). Tap "View this dispensary" → lands on detail page.

### Step 5 — Guard GO HERE hrefs against empty slugs

Extract a helper in `lib/links.ts` (or inline — 5 lines):

```ts
export function listingHref(slug: string | null | undefined, city: string | null): string | null {
  if (!slug || !String(slug).trim()) return null;
  return city ? `/l/${slug}?city=${encodeURIComponent(city)}` : `/l/${slug}`;
}
```

Apply to:
- `app/deals/[category]/page.tsx:683, 741`
- `app/components/HeroDealCard.tsx:175`
- `app/components/HomeDealCards.tsx:263`
- `app/components/EndingSoonRow.tsx:81`
- `app/dispensary/[slug]/page.tsx:462`
- `app/deal/[id]/page.tsx:332`

When `listingHref()` returns null, render the button disabled or skip rendering it. Never render `/l/undefined?city=…`.

### Step 6 — Kill DirectoryNetwork residuals

14 files listed in `directorynetwork-residual-20260419.md`. All mechanical. Use the PuffPrice wordmark from `app/page.jsx:877`:

```jsx
<span className="logo-text">puff<span>price</span></span>
```

Or match the existing styling in each file's CSS (most have a `*-nav-name` and `*-nav-accent` class pair).

Also clean `app/api/leads/route.ts:133` (hardcoded `directory-network-eta.vercel.app` → `brand.url + "/admin"`).

Verify with:
```bash
grep -rn "DirectoryNetwork\|directoryNetwork" --include='*.ts' --include='*.tsx' --include='*.jsx' app/ components/ lib/
```
Must return zero.

### Step 7 — Savings copy honest

`app/components/SavingsCallout.tsx` lines 41–72. Replace with the Variant 1 JSX in `savings-claim-fix-20260419.md`. Also update the stale comment block at the top of the file and the one in `lib/dealScoring.ts:22–23`.

### Step 8 — Carry-over: Supabase lazy-init

From the prior sprint flag: `/api/digest/preview` and `/cannabis/illinois/[slug]/deals` create Supabase clients at module-evaluation time. Wrap in a `getSupabase()` lazy getter so env-less builds don't crash. Pattern in the original sprint brief (Task 6 for Code).

### Step 9 — Carry-over: `/dispensaries` and `/about`

- `app/dispensaries/page.tsx` — file exists. Verify it renders cleanly; if not, wire up a minimal listings index (61 active IL rows; 82 green-tag rows total). Confirm it's in `app/sitemap.ts` (line 108 — already there).
- `app/about/page.tsx` — directory does NOT exist per `ls app/ | grep about`. Create minimal page with the PuffPrice Promise copy. Add to `app/sitemap.ts` (line 109 — already there but points to a non-existent route).

## Build + ship checklist

After all steps:

```bash
npm run build
```

Must pass clean. Local smoke test:

1. `npm run dev` → visit `/` → location detects (check `document.cookie` includes `pp_loc`)
2. Click "Flower" category → URL is `/deals/flower` with no query string → Our Recommendation is a Peoria/your-city deal (cookie read)
3. Visit `/cannabis/illinois/open-now` at current CT time → count > 0 (expect 30–40 mid-afternoon)
4. Visit `/dispensary/nuera-east-peoria` → correct open/closed badge for right now
5. Tap "See details" on a deal card → expands inline, doesn't navigate
6. Tap "GO HERE" → lands on `/l/nuera-east-peoria?city=Peoria` with working content
7. Grep for DirectoryNetwork → zero hits

Commit message:

```
p0 fixes: open-now predicate (UTC→CT), location cookie + server read, detail-page affordances, brand residuals, honest savings copy, supabase lazy init, /about
```

## Genuine risk points (flag if hit, don't force)

- **Hours data gap (~16 dispensaries with no listing_hours rows)** — not a code fix, needs scraper re-run. Flag for Matthew. Predicate fix ships regardless.
- **`/l/[slug]` vs `/dispensary/[slug]` duality** — architectural, not a sprint fix. Decide with Matthew before unifying. Ship with both routes working.
- **Internal links missing `?city=`** — the cookie fix covers this without rewriting links. If cookie write isn't working reliably (cookie blocked, cross-subdomain issues), fall back to rewriting the leaky links listed in `location-bug-diagnostic-20260419.md`.

## Companion files in `docs/audits/`

- `hours-bug-diagnostic-20260419.md` — full hours/predicate analysis
- `location-bug-diagnostic-20260419.md` — location flow and fix strategy
- `directorynetwork-residual-20260419.md` — all 14 brand-residual hits
- `dispensary-detail-bug-20260419.md` — See details / GO HERE analysis
- `savings-claim-fix-20260419.md` — three copy variants + recommendation
