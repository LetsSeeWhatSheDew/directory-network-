# 293 vs 61 Reconciliation — 2026-04-20

**Ground truth (Supabase, 2026-04-20):**
- 82 `master_listings` rows tagged `project_tag='green' AND type='dispensary'`
- **61** of those active in IL (`is_active=true AND state IN ('IL','il','Illinois','illinois')`)
- 56 active deals, attached to a subset of the 61

The "293 dispensaries" claim originated from a count of *licensed* IL dispensaries (per IL CROO state register) — not a count of dispensaries we actually have data for. Showing 293 publicly is misleading because the directory cannot deliver on it.

The "162 cities" claim is similarly the count of IL cities with at least one licensed dispensary, not cities we have data for. Per `config/cities/illinois/`, our directory has city records for **34** IL cities.

## Hits requiring fixes

| # | File:Line | Current claim | Recommendation | Rationale |
|---|---|---|---|---|
| 1 | `app/alerts/page.tsx:73` | `"Browse all 293 Illinois dispensaries"` (free-tier feature bullet) | **(b) reframe** → `"Browse every Illinois dispensary in our directory (61 today, growing)"` or simpler `"Browse Illinois dispensaries — every one we cover"` | This is on a public sign-up page. Hard number is not the value prop — completeness within scope is. Stop the count race. |
| 2 | `app/admin/page.tsx:114` | comment `// green-tag master_listings row (~293)` | **(a) change to real number** → `// green-tag master_listings row (61 active in IL)` and update `PAGES_LIVE` constant if it relies on this (it currently equals 400; recalc). | Internal admin comment. The comment is wrong AND the derived constant is wrong. Fix both for accurate pages-live count. |
| 3 | `HANDOFF-UPDATE.md:72` | `Master listings (dispensaries): 293+ (shown on live site as "293 dispensaries")` | **(a) change to real number** → `Master listings (dispensaries): 61 IL active / 82 total green-tag rows` | Internal handoff doc. Updating the source of the fiction stops it from spreading. |
| 4 | `HANDOFF-UPDATE.md:73` | `Cities covered: 162 cities shown on live site` | **(a) change to real number** → `Cities covered: 34 IL cities with config records / 162 IL cities have at least one licensed dispensary (state register)` | Same — pin the distinction internally. |
| 5 | `docs/audits/copy-audit-20260420.md:102` | Reference paragraph mentions `"We cover all 293 licensed..."` to keep | **(c) remove entirely** → strike that paragraph from any "keep" guidance and replace with `"We cover Illinois dispensaries that share their deals with us — and we add new ones every week."` | Audit doc itself contains the fiction as approved copy. That's a load-bearing error — it'll get re-introduced. |
| 6 | `docs/audits/bugfix-sprint-summary-20260419.md:120` | comment `wire up a minimal listings index (293 rows)` | **(a) change to real number** → `wire up a minimal listings index (61 active rows)` | Internal sprint doc; harmless but should be corrected so future devs don't re-internalize 293. |
| 7 | `docs/session-reports/2026-04-20-evening-sprint.md:65` | `should show roughly 293 total listings (post-fix), not 0` | **(a) change to real number** → `should show roughly 61 active IL listings (or 82 total green-tag listings — confirm filter)` | Test-step instruction. As written it would fail today (count is 61, not 293), creating a false-negative. |

Note: `lib/dealScoring.ts:232-233` matched the regex `293` as part of `30}` /grade thresholds, not the count claim. **Excluded** — false positive.

## Source of the fiction (where the 293 number probably came from)

Per `HANDOFF-UPDATE.md:72-73` the live-site number came from an earlier seed of the IL CROO licensing register, which lists ~293 *licensed* adult-use & medical dispensary locations (the number drifts; the IL register changes monthly and includes pending licenses). At some point a marketing page rounded this to "293 dispensaries" without distinguishing between "licensed in IL" and "in our directory."

## Recommended public language going forward

Stop using counts as a value prop on the marketing surface. If a count is needed:

- **Honest framing:** `"Every Illinois dispensary in our directory (61 and growing — we add coverage weekly)"`
- **Aspirational framing (only if true):** `"Tracking 60+ Illinois dispensaries"` — never round up.
- **License-vs-coverage distinction (footer disclosure, optional):** `"Illinois currently licenses 290+ adult-use dispensaries statewide. We cover those that publish deals; new dispensaries are added each week."`

Apply these changes during the brand-voice fix sprint (see brand-voice-audit-20260420.md).

## Net

7 hits total. 5 are documentation/comments (low risk, fix in same commit). 2 are user-facing (admin page comment + alerts marketing copy) — the alerts page bullet is the only one normal users see, and it is currently a lie.
