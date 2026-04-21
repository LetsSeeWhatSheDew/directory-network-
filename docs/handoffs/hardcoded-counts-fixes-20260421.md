# Handoff — Hardcoded Counts Across `app/` (post-293 sweep)
> **For:** Claude Code, next session.
> **Why:** Cowork (tonight) audited every public-facing count on the site. Several hardcoded numbers beyond the already-queued 293 fixes are stale and user-visible. Each fix below is a trivial single-number replacement.
> **Source of truth:** `docs/audits/real-numbers-as-of-20260421.md` — the canonical current-state numbers as of end-of-day April 20, 2026.
> **Operating principle (carried from 293 handoff):** never round up coverage. Use real counts.

## Priority 1 — Homepage stats strip (user-facing)

The hero-adjacent credibility line on `/` carries a false `34 cities` claim. Real count: **25 distinct Illinois cities** with at least one active listing.

**File:** `app/page.jsx`
**Line:** 1060

**Find (exact):**
```
<strong>{dealCount !== null ? dealCount : "—"}</strong> active deals · <strong>61</strong> Illinois dispensaries · <strong>34</strong> cities
```

**Replace with (exact):**
```
<strong>{dealCount !== null ? dealCount : "—"}</strong> active deals · <strong>61</strong> Illinois dispensaries · <strong>25</strong> cities
```

**Ideal follow-up (defer to next sprint):** wire the `25` to a dynamic SELECT COUNT(DISTINCT city) so this auto-heals as we add dispensaries in new cities. The tonight-level fix is static-but-accurate.

## Priority 2 — `/cannabis/illinois` FAQ + meta description

Two user-visible 35+ claims, one 270+ claim. Breakdown:

### 2a. Meta description (line 8)

**File:** `app/cannabis/illinois/page.tsx`
**Line:** 8

**Find (exact):**
```
description: "Find licensed cannabis dispensaries across Illinois. Browse by city, view real hours, and discover deals. 270+ dispensaries listed across 35+ Illinois cities.",
```

**Replace with (exact):**
```
description: "Find licensed cannabis dispensaries across Illinois. Browse by city, view real hours, and discover deals — 61 listed across 25 Illinois cities, growing weekly.",
```

### 2b. FAQ answer body (line 266)

**File:** `app/cannabis/illinois/page.tsx`
**Line:** 266

**Find (exact):**
```
<p className="il-faq-a">Illinois has over 270 licensed cannabis dispensaries operating statewide, with the largest concentration in the Chicago metro area. PuffPrice lists dispensaries across 35+ Illinois cities.</p>
```

**Replace with (exact):**
```
<p className="il-faq-a">Illinois has roughly 290 licensed adult-use cannabis dispensaries operating statewide (per IDFPR), with the largest concentration in the Chicago metro area. PuffPrice currently lists 61 of them across 25 Illinois cities, and we add more weekly.</p>
```

**Notes:**
- The "roughly 290" statewide figure is the current IDFPR licensed-dispensary count. Preserving this claim intact (as statewide market data) keeps the FAQ informative; the `61 / 25` framing makes clear what PuffPrice's coverage share is without lying about it.
- If Code wants to harden this further, pull the 290 into a `lib/marketFacts.ts` constant with a `lastVerified` date so it doesn't silently drift.

## Priority 3 — `/cannabis` index "35 cities covered" pill

**File:** `app/cannabis/page.tsx`
**Line:** 131

**Find (exact):**
```
<span className="text-[#7FE3C7]">35 cities</span> covered
```

**Replace with (exact):**
```
<span className="text-[#7FE3C7]">25 Illinois cities</span> covered
```

**Why the "Illinois" qualifier:** the `/cannabis` page is the multi-state root, so "25 cities" alone reads as "across all states PuffPrice covers" (Illinois + Missouri marketing pages). Qualifying to Illinois matches the underlying coverage.

## Priority 4 — `/cannabis/illinois` FAQ schema data

**File:** `app/cannabis/illinois/page.tsx`
**Line:** 55

Same "over 270" claim, this time in the FAQPage JSON-LD schema (Google-facing, not user-facing but it's what shows up in AI answer engines).

**Find (exact):**
```
text: "Illinois has over 270 licensed cannabis dispensaries operating across the state, with the highest concentration in the Chicago metro area.",
```

**Replace with (exact):**
```
text: "Illinois has roughly 290 licensed adult-use cannabis dispensaries operating across the state (per IDFPR), with the highest concentration in the Chicago metro area. PuffPrice currently tracks 61 across 25 Illinois cities.",
```

## Priority 5 — Missouri page hardcoded dispensary count pills (LOW)

**File:** `app/cannabis/missouri/page.tsx`
**Lines:** 21–57 (per-city dispensary counts), 118 (body copy), 126 (stat card)

**Action:** Defer. The Missouri page's per-city counts and "100+ licensed dispensaries across 10+ major cities" claim are statewide MO market figures, not PuffPrice coverage. They need a separate verification pass (PuffPrice doesn't actively maintain MO listing data — zero MO entries in `master_listings`). Two options:

- **Option A (recommended):** Add a banner to `/cannabis/missouri` that says "Missouri coverage is editorial — we're not yet tracking live Missouri deals. Illinois is our primary market." Removes the promise that the `100+` relates to PuffPrice coverage.
- **Option B:** Noindex the entire `/cannabis/missouri` subtree until we actually seed MO data. Clean but removes SEO surface.

Flag for Matthew business-decision. Not a morning fix.

## Verification after Code applies Priority 1–4

```bash
# Should return zero results (or only the Missouri and first-time-guide matches
# that we're intentionally leaving):
grep -rn "35 cities\|35+ Illinois\|34 cities\|270+\|over 270" --include='*.tsx' --include='*.ts' --include='*.jsx' app/ components/ lib/
```

Expected surviving matches after Priority 1–4:
- `app/cannabis/missouri/page.tsx:118` — `100+` (out-of-scope Missouri claim)
- `app/cannabis/illinois/first-time-guide/page.tsx:67` — `10–25%` (first-time discount range, not a count)
- `app/cannabis/illinois/first-time-guide/page.tsx:293` — `10–25%` (ibid)

All three are either intentionally-deferred (Missouri) or not count-of-dispensary claims at all (discount ranges). Everything else should be gone.

## Blast radius / re-test plan

- `/` (homepage) — visual check that the stats strip reads `56 active deals · 61 Illinois dispensaries · 25 cities` (or whatever dealCount is at render time).
- `/cannabis/illinois` — re-render; confirm the FAQ answer to "How many dispensaries are in Illinois?" reads correctly on mobile (the 290 / 61 / 25 phrasing wraps differently).
- `/cannabis/` — stat pill reads "25 Illinois cities covered".
- Structured-data test (Google Rich Results Test on the /cannabis/illinois URL) — FAQ schema should parse cleanly with the new text.

No DB / API surface changed. No TypeScript narrowing risk.

## Cross-reference

The real-numbers source of truth lives at `docs/audits/real-numbers-as-of-20260421.md`. Any future hardcoded count on the site should be cross-referenced against that doc before shipping. If you add a number to a page without a comment pointing back to a query or that audit, a future Cowork pass will flag it.
