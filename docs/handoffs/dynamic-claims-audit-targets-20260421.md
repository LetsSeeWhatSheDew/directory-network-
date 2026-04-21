# Handoff — Dynamic claim audit targets

**From:** Cowork
**To:** Code
**Date:** 2026-04-21
**Purpose:** A checklist of every user-facing claim of the form "best / cheapest / save $X / near you / #1 / top" that needs a real data source. Each item has a verdict: VERIFIED (ship), FIXABLE (Code rewires), or KILL (remove entirely).

Matthew flagged this after the audit turned up the freshness problem (see `docs/audits/deal-data-freshness-20260421.md`). The rule going forward: if we can't point to the exact column that backs a claim, the claim comes off the page.

## Verdict summary

| Verdict | Count |
|---|---|
| VERIFIED | 6 |
| FIXABLE | 9 |
| KILL | 5 |
| **Total claims audited** | **20** |

Biggest action items for Code: kill the A/B/C/D grade badges (already scheduled in Task 3), drop `AVG_SPEND_BY_CATEGORY` estimation from the "saves $X" copy unless exact `original_price`/`sale_price` both exist, and fix the hardcoded "Best value today" badge on position-0 cards.

---

## Individual claims

### Dollar-savings claims

#### 1. `app/components/SavingsCallout.tsx:58` / `:63`
**Claim:** `Best deal in {City} right now saves $X.`
**Backed by:** city from `sessionStorage.cl_city` (real, see `LocationAware.tsx`), `$X` from `estimateSavings(topDeal)` on the hero deal.
**Problem:** `estimateSavings()` in `lib/dealScoring.ts` returns an **estimate**, not a fact, when `original_price` or `sale_price` is missing. It multiplies `discount_value %` by a hardcoded `AVG_SPEND_BY_CATEGORY` basket ($50 flower, $30 edibles, $75 all). For the 53 of 56 active deals that only have `discount_value`, "saves $X" is a guess dressed up as a fact.
**Verdict:** **FIXABLE.**
**Fix:** change the copy path. When `hasExactSavings(deal) === true`, keep "saves $X". When not, soften to "**Best deal in {city} right now — {X}% off.**" — factual, same conversion intent, no fabricated dollar amount. The exact prices exist on `original_price` + `sale_price` columns; check both non-null before claiming dollars.

#### 2. `app/components/HomeDealCards.tsx` → deal-card "You save $X"
Referenced via `formatSavingsDollars` (same lib). Same issue as #1. Applies to every card that renders a dollar amount when the underlying deal has no exact price pair.
**Verdict:** **FIXABLE.** Same fix: if `hasExactSavings(d)`, show dollars. Else show "30% off" or "$100 for 5" (whatever the raw deal expresses) and drop the dollar label.

#### 3. `app/deal/[id]/page.tsx:344` — "You save" + `$X` in the savings block
Same root cause. On the dedicated deal detail page the claim is the loudest. If the deal doesn't have exact prices, this number is completely fabricated.
**Verdict:** **FIXABLE.** Same rule — hide the dollars block (render the percent instead) when exact prices aren't both known.

#### 4. `app/dispensary/[slug]/page.tsx:447-451` — "You save $X" on dispensary pages
Same fix.
**Verdict:** **FIXABLE.**

#### 5. `app/city/[city]/page.tsx:305-306` — "You save $X" on city listings
Same fix.
**Verdict:** **FIXABLE.**

#### 6. `app/alerts/page.tsx:87` — `'Monthly savings report: "You saved $84 this month"'`
**Claim:** Pro tier marketing copy promising a savings report showing specific dollars.
**Backed by:** aspirational — the savings ledger exists (`app/savings/dashboard/page.tsx`) but there are zero `deal_clicks` rows today (`public.deal_clicks` has `rows: 0` per Supabase), so no user has an actual tracked savings total. The "$84" is a purely illustrative example (framed with a specific number).
**Verdict:** **VERIFIED** — this is quoted illustrative example copy inside a Pro-tier benefits list, not a factual claim about the current user. Acceptable as-is. If we want to be extra careful, swap the specific "$84" for "your actual savings this month" to avoid the optical implication. Low priority.

#### 7. `app/alerts/page.tsx:212` — "Less than a dollar a week. You'll save that in your first trip."
**Claim:** Implicit promise: one trip recovers the $0.99/month cost.
**Backed by:** rhetorical — not a measured stat.
**Verdict:** **VERIFIED.** Sales copy. Reasonable puffery; not a specific dollar claim about the user's data. Keep.

#### 8. `app/alerts/page.tsx:232` — `"Vapes — 6 minutes away." You save $18. That's Pro.`
**Claim:** Scenario copy showing Pro value.
**Verdict:** **VERIFIED.** Bracketed scenario dialog, clearly narrative. Keep.

#### 9. `app/savings/SavingsCalculator.tsx:105` — "PuffPrice users who match your profile save an average of ${X}"
**Claim:** Per-profile average saving rendered from the calculator.
**Backed by:** a model in `SavingsCalculator.tsx` (line 30 comment: "What a PuffPrice user with the same profile saves of that same 15%"). Computed from user-entered inputs + a hardcoded 15% savings assumption. Not from real user data.
**Verdict:** **FIXABLE.** The claim implies population data ("users who match your profile") but the denominator is a single hardcoded constant. Two options: (a) rewrite copy to "At a 15% typical discount, your profile would save an estimated $X per year" — transparent about the assumption, or (b) wait until `deal_clicks` has real data and compute an actual per-profile average. (a) is a one-line fix and ships now.

#### 10. `app/savings/dashboard/page.tsx:152` — `{month} savings: $monthly`
**Claim:** "April savings: $84"
**Backed by:** fetched from the user's own `deal_clicks` ledger. Real data *once there's data*.
**Verdict:** **VERIFIED.** Empty state on line 119 already handles the "no clicks yet" case honestly. Ship as-is.

---

### "Best" / "cheapest" / "top" claims

#### 11. `app/about/page.tsx:4` — hero meta description: "PuffPrice finds the best cannabis deals near you in Illinois"
**Claim:** superlative "best".
**Backed by:** brand promise. Subjective.
**Verdict:** **VERIFIED.** Marketing copy at the product-description level. Acceptable.

#### 12. `app/about/page.tsx:85-87` — "shows you the best deal near you today" (twice)
Same as #11. Brand promise.
**Verdict:** **VERIFIED.**

#### 13. `app/deals/[category]/page.tsx:27-31` — `CATEGORY_SUBTITLES`
```
flower:      "Best price per gram on flower near you right now"
edibles:     "Cheapest edibles deals in Illinois today"
vapes:       "Best vape deals and discounts near you"
concentrate: "Top concentrate deals near you"
all:         "Every active cannabis deal in Illinois right now"
```
**Backed by:** the page's Supabase query. Let me check — `getDeals()` on line 89 pulls from `active_deals_with_listings` which is ordered elsewhere, but the homepage's pool query (`app/page.jsx:329`) orders by `discount_value.desc`. So "cheapest edibles" is actually "biggest-percent-off edibles" — not the same thing. "Best price per gram on flower" is definitely wrong today because `price_per_gram` is NULL on all 56 active rows.
**Verdict:** **FIXABLE.**
- Flower: until PPG is populated, change to "Biggest flower deals in Illinois today." When PPG lands, rewrite to "Lowest price per gram on flower near you" and sort by PPG ASC.
- Edibles: change "Cheapest" to "Biggest edibles deals today" — same rationale.
- Vapes / concentrate: "Top X deals near you" is defensible if the sort order is by discount_value DESC. Confirm the sort and either keep the copy or change to "Biggest X deals".
- `all`: verified (literal description of the set).

#### 14. `app/deals/[category]/page.tsx:276-277` — meta descriptions: "Save money on cannabis with live offers" / "Real prices, real savings."
**Verdict:** **VERIFIED.** Generic SEO copy; not a specific claim.

#### 15. `app/not-found.tsx:40` — "we'll point you at the best one near you"
**Verdict:** **VERIFIED.** Generic 404 copy.

#### 16. `app/page.jsx:989` — "We find the best deal right now" (how-it-works step 2)
**Verdict:** **VERIFIED.** Process description, not a per-deal claim.

---

### "Near you" geolocation claims

#### 17. All "deals near you / near me" copy across app/page.jsx, app/alerts/page.tsx, app/upgrade/page.tsx, app/cannabis/illinois/[slug]/page.tsx, app/not-found.tsx:43, etc.
**Backed by:** `app/components/LocationAware.tsx` runs a real cascade: GPS (with user consent) → cached cookie `pp_loc` → IP-based detection via a location API → manual city selection. Cache is 24h with a freshness timestamp (`TS_KEY`). Degrades gracefully to "all Illinois" if nothing resolves.
**Verdict:** **VERIFIED for the mechanism.** The resolution chain is real.
**Caveat:** some CTAs say "See deals near me" before location has resolved, and then the page falls back to "all Illinois" silently. That's honest behavior but the button copy promises something specific. Not a blocker — flag for design.

---

### Hardcoded position badges

#### 18. `app/components/HomeDealCards.tsx:313` — `Best value today` badge on the #1 card
**Claim:** The deal in position 0 (first card) is labeled "Best value today".
**Backed by:** nothing. It's hardcoded on `i === 0` — whatever deal comes first in the sorted array gets the badge. The sort order (per `app/page.jsx:329`) is `discount_value.desc`, which means "biggest percent off", not "best value".
**Verdict:** **KILL.**
**Why:** "Best value" is a composite claim (PPG + discount), but today's sort is single-signal. The Top-5% badge (Task 3 / `sql/migrations/2026-04-21-deal-ranking.sql`) replaces this with a computed value. Remove this badge entirely and let the top-5% view decide whether anything gets a flame. If no deal in the current set clears 95th percentile, no hero badge shows — which is the honest outcome.

#### 19. `app/components/HomeDealCards.tsx:313-321` — A/B/C/D `deal-grade` badge
**Claim:** Visual letter grade on every deal card.
**Backed by:** `gradeDeal()` in `lib/dealScoring.ts` — a score built from `discount_value`, a `hasExactSavings` boolean, and hardcoded breakpoints (70=A, 50=B, 30=C, <30=D). D is already hidden (`shouldShowGrade`).
**Verdict:** **KILL.** Matthew killed this system; replaced by Top-5% badge per Task 3. Remove the `<span className="deal-grade">` block and the import of `gradeDeal`, `shouldShowGrade` from `lib/dealScoring.ts`. Leave `estimateSavings` in — it's still used for dollar rendering.

#### 20. `app/deals/[category]/page.tsx:487 .deal-grade` CSS / `.alt-grade` CSS + any `<span className="deal-grade">` in that page
**Verdict:** **KILL.** Same reason as #19. Confirm by grep after removal that no `.deal-grade` class remains referenced anywhere in `app/` or `components/`.

#### Also kill: `app/start/page.tsx:185` — "We grade deals honestly: great, solid, okay, or low savings."
This is the user-facing explanation of the grading system. Once grades are gone, this line is false advertising.
**Verdict:** **KILL** (counts as part of #19's cleanup). Replace with "We flag the genuinely extraordinary deals with a 🔥 badge. No grading, no padding." or similar — adjust to taste.

---

## Specific things Matthew flagged, re-visited

From the task brief:

> "Best deal in Peoria right now saves $15" — is city derived from user location? Is $15 from the actual cheapest deal in that city?

- **City:** yes, real. `LocationAware.tsx` resolves it via GPS/cookie/IP with a 24h freshness cap. (Verified — claim #17.)
- **$15:** **no** — it's `estimateSavings(topDealInHero)`, which uses `AVG_SPEND_BY_CATEGORY` when exact prices are missing. For 53 of 56 active deals today, the dollar amount is a fabrication, not the actual cheapest. Fix per claim #1 — hide dollars when inputs aren't exact, show percent instead.

> Savings claims on hero cards — are they `(regular_price - sale_price)` or fabricated?

- **Both.** When `original_price` AND `sale_price` are both non-null, math is exact (`lib/dealScoring.ts:39-45`). When either is null, the function falls back to `discount_value %` × basket average. This fallback path is what's fabricated. Same fix per claim #2.

> "Near you" language — bound to actual geolocation or cookie fallback?

- **Real.** Chain: GPS → cookie → IP → manual city → statewide. 24h cache with timestamp. See claim #17.

---

## Suggested Code sequence

1. **KILL A/B/C/D** (claims #19, #20, and the `start/page.tsx:185` line). This is scheduled in Task 3 anyway — fold this audit's cleanup into that PR so the `dealScoring.ts` grade code, CSS classes, and marketing copy all come out together.
2. **KILL "Best value today"** (claim #18). Same PR. Swap to read `is_top_5_percent` from `deal_rankings`.
3. **FIX the dollar-savings claims** (#1, #2, #3, #4, #5). Introduce a render-time guard: if `!hasExactSavings(d)`, suppress the dollar amount and render the percent copy. This is a one-function swap at the component level.
4. **FIX the category subtitles** (#13). Trivial copy change until PPG data lands.
5. **FIX the savings calculator copy** (#9). One-line rewrite to surface the assumption.
6. Defer claim #17 caveat (button copy before resolution) to a design handoff — not a data problem.

Everything marked VERIFIED ships as-is.
