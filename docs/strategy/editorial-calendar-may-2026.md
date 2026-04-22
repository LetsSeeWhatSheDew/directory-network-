# Editorial calendar — May 2026

**Goal:** establish PuffPrice as the editorial voice for Illinois cannabis pricing — not just a deal aggregator. Predictable cadence builds reader trust, SEO, and the "we have a content moat" pitch for brand partnerships.

**Constraint:** Matthew's time. Budget: 4-6 hours per week of editorial work, mostly review + posting (Cowork drafts).

**Editorial standards (apply to every piece):**
- No affiliate language without disclosure
- No price claims without a documented source
- All deal references must be live at time of publish (not stale)
- Freshness date stamp on every post
- "Sponsored" labeled at top + bottom for paid pieces
- No claims PuffPrice can't verify (e.g., "the most popular brand" only if PuffPrice has data showing it)

---

## Recurring cadences

### Monthly — PuffPrice Index publish (1st of month)

The flagship editorial product. Statewide flower price-per-gram benchmark, computed from anchor SKUs.

| When | Author | What |
|---|---|---|
| 1st of month, 9 AM CT | Cowork drafts → Matthew approves | New PuffPrice Index value, MoM comparison, top 5 dispensaries by value, methodology recap |
| 1st of month, noon CT | Code | Push to /about/index page (already wired via `lib/puffpriceIndex.ts`) |
| 1st of month, 3 PM CT | Matthew | Republish summary as `/blog/puffprice-index-MMM-2026` |
| 2nd of month, AM | Matthew | Newsletter blast: "April Index: flower averaged $X/g across IL. Up/down vs March." |

**May 1 specific:** First Index publish post-4/20. Expect a downward shift (4/20 was peak promotion volume). Lead with that — "Illinois flower averaged the lowest PPG of 2026 in April thanks to 4/20 promotional intensity."

### Weekly — Deal of the Week (Mondays, ~10 AM CT)

A single hand-picked deal that exemplifies value. Not the deepest discount (those are auto-surfaced), but the "best buy" combining discount + brand quality + fairness.

| When | Author | What |
|---|---|---|
| Sunday evening | Cowork pulls candidates | Top 5 deals by `scoreDeal()`, filtered for: still active Monday, not previously featured, 4+ weeks since same dispensary featured |
| Monday 9 AM | Matthew | Pick 1 of 5, write 80-word editorial blurb |
| Monday 10 AM | Matthew | Post to `/deal-of-the-week` page + IG story + LinkedIn |
| Monday 10:15 AM | Matthew | Pin to PuffPrice Twitter / Bluesky |

### Weekly — Newsletter (Thursdays, 8 AM CT)

5-section template:
1. **This week's hero deal** (the Monday Deal of the Week)
2. **3 honorable mentions** (other strong deals from the week)
3. **PuffPrice Index pulse** (if changed materially — usually monthly)
4. **One dispensary spotlight** (brief — 80 words pulled from the long_description audit)
5. **What's coming** (next week's expected promos, new dispensary openings, etc.)

| When | Author | What |
|---|---|---|
| Wednesday afternoon | Cowork drafts all 5 sections | Pull data from active feed + `deal_clicks` for "popular" |
| Thursday 7 AM | Matthew | Final review, send via Resend |

---

## Episodic content — May 2026 specific

### Week of May 4 — 4/20 recap (publish May 5)

Post-mortem on April 20 performance. What deals dropped? What did consumers click most? PuffPrice Index trajectory through the month?

**Hook:** "The 4/20 effect on Illinois cannabis prices — by the numbers."

**Data sources:**
- `deal_clicks` (April 14-22 timeframe) — what got clicked
- `deal_price_history` (if populated) — actual price drops
- Manual count of unique brands surfaced in active feed during 4/20 week

**Length:** 600-900 words. Charts via `data:create-viz` skill if Matthew wants visuals.

**Cross-post:** r/ILTrees, r/CannabisIllinois, IL cannabis Facebook groups.

### Week of May 11 — Mother's Day cannabis gifting guide (publish May 8)

Edibles + topicals focus. Genuinely useful angle — Mother's Day is a non-trivial cannabis edibles holiday.

**Sections:**
- 5 best edibles deals in IL right now (auto-pulled, filtered by category=edibles)
- Topicals + bath products primer (less common, harder to find — editorial value-add)
- Discreet/low-dose options for cannabis-curious moms
- "Skip the dispensary, here's a delivery option" (only for the 4 IL dispensaries with `delivery=true` in master_listings)

**Length:** 500-700 words.

**Tone caveat:** Don't be cheeky here. Mother's Day cannabis content gets read by people who are nervous about cannabis. Plain, kind, practical.

### Week of May 18 — Spring strain spotlight + outdoor consumption

Memorial Day weekend lead-in. Cover trending sativa-dominant strains for the season.

**Sections:**
- 3 IL craft sativas in current rotation (Aeriz, Bedford Grow, Revolution brand)
- Where to buy each (data pull from `deals` filtered by brand mention)
- Outdoor-consumption legality refresh (Illinois law — only on private property, not in vehicles even parked)
- Pre-roll deals for outdoor use

**Length:** 500-700 words.

### Week of May 25 — Memorial Day deals roundup (publish May 22)

Holiday weekend deal density spikes. Same template as 4/20 forecasting but smaller.

**Sections:**
- "What promotions to expect" (based on previous-year holiday patterns)
- Veterans-only specific deals (3 IL dispensaries already run veteran discounts year-round per current `deals` data)
- The PuffPrice Index Memorial Day reading

**Length:** 400-600 words.

---

## Quarterly — Dispensary Spotlight series

Pick 1 dispensary per month for a deep editorial profile. May's spotlight: **nuEra East Peoria** (highest deal density on PuffPrice + Peoria-local for Matthew's coverage).

**Content:**
- 800-1,200 words
- Interview-style (Matthew calls the manager during Tier 1 outreach — kills two birds)
- Photos (manager-supplied or Matthew-shot if he visits)
- Data: average deal density, brand mix, unique SKUs vs peers
- Reader takeaway: "Why nuEra East Peoria is on PuffPrice's radar"

**Publish:** Last Friday of the month. May 30, June 27, July 25, etc.

This is the type of content brands cite. Long-tail, evergreen, builds the editorial moat.

---

## Channel mix per piece

| Content type | Site | Newsletter | Twitter/Bluesky | LinkedIn | IG | Reddit |
|---|---|---|---|---|---|---|
| PuffPrice Index | ✅ | ✅ | ✅ | ✅ | ✅ | r/ILTrees |
| Deal of the Week | ✅ | ✅ | ✅ | — | ✅ | — |
| Newsletter | — | ✅ | — | — | — | — |
| 4/20 recap | ✅ | ✅ | ✅ | ✅ | — | r/ILTrees |
| Mother's Day | ✅ | ✅ | — | — | ✅ | — |
| Strain spotlight | ✅ | ✅ | ✅ | — | ✅ | r/ILTrees |
| Memorial Day | ✅ | ✅ | ✅ | — | — | — |
| Dispensary spotlight | ✅ | ✅ | — | ✅ | ✅ | — |

---

## Production capacity check

| Week | Recurring | Episodic | Total Matthew hours |
|---|---|---|---|
| May 4 | DoW + Newsletter | 4/20 recap | 5 |
| May 11 | DoW + Newsletter | Mother's Day guide | 5 |
| May 18 | DoW + Newsletter | Spring strain spotlight | 5 |
| May 25 | DoW + Newsletter | Memorial Day roundup + Dispensary spotlight (nuEra) | 7 |

May 25 is the heavy week (7 hours). Matthew should pre-write the Dispensary Spotlight earlier in May to spread load.

---

## Metrics to track

Per-piece:
- Page views (GA)
- Time on page
- Newsletter open rate (if RSVP'd)
- Outbound clicks (brand pages, dispensary pages, deal cards)
- Backlinks earned (manual quarterly check)

Aggregate:
- Total editorial publish count (target: 9 pieces in May = monthly Index + 4 weekly DoWs + 4 episodic)
- Newsletter list growth (need Resend wired first)
- Repeat visitor rate (GA)
- "Trusted source" mentions in IL cannabis Reddit / Twitter (manual sentiment check)

---

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Matthew runs out of bandwidth in week 4 | Pre-write Dispensary Spotlight in week 1 or 2 |
| 4/20 recap data is thin (only 1 week of `deal_clicks` data) | Lean editorial, light on stats — narrative over numbers |
| Dispensary doesn't want to participate in spotlight interview | Switch to next-priority dispensary; don't force participation |
| Mother's Day topic feels exploitative | Frame as harm reduction + practical — not push |
| Memorial Day deals are weak (no holiday-specific promos) | Pivot to "summer prep" content instead |

---

## Companion files

- `docs/strategy/content-depth-plan-20260422.md` — dispensary description production plan
- `docs/ops/index-data-workflow-20260422.md` — PuffPrice Index publish mechanics
- `app/about/index/page.tsx` — Index methodology page
- `lib/puffpriceIndex.ts` — Index computation
