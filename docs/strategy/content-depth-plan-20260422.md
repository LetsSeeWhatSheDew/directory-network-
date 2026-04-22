# Content depth plan — dispensary descriptions (2026-04-22)

**Strategic context:** From the strategic memory: "dispensary page content depth (ranked #1 credibility move)." This doc turns that ranking into an actionable production plan.

---

## Current state (audited via Supabase MCP, 2026-04-22)

| Metric | Value |
|---|---|
| Total IL/green dispensary listings | 61 |
| Have `long_description` populated | 47 (77%) |
| Have `short_description` populated | 50 (82%) |
| Have neither | 11 (18%) |
| Average long_description length | 529 chars / **75 words** |
| Range | 92-722 chars |

**Word count distribution (long_description):**

| Bucket | Count | % |
|---|---|---|
| NULL (no description) | 14 | 23% |
| Under 50 words | 6 | 10% |
| 50-99 words | 40 | 66% |
| 100-149 words | 1 | 2% |
| 150+ words (target) | **0** | 0% |

**Reading: 0 of 61 IL dispensary pages currently meet the 150-word editorial floor.** The bulk (40 listings) sit in the 50-99 word range — short paragraphs, likely AI-generated boilerplate from earlier enrichment passes. Search engines see thin content. Ranking signals are weak.

---

## Target state

* **All 61 IL dispensary listings have ≥150-word editorial descriptions** within 60 days
* **Top 20 by deal density / Peoria proximity have ≥250-word descriptions** within 30 days
* **All descriptions follow a consistent template** so they're scannable for users and crawlable for SEO
* **No description is identical or near-identical to another** (Google penalizes duplicate content)

---

## Content template — what a great dispensary description includes

Six required sections, in this order. Each section is 2-4 sentences. Total: 200-300 words.

### 1. Location anchor (1 sentence)

What city/neighborhood, what's nearby, who they serve.

> *Example:* "Tucked into a converted record store on Elgin's Dundee Avenue corridor, High Haven serves the Fox Valley with curated craft flower."

### 2. Menu strengths (2-3 sentences)

What this dispensary is actually known for. Pull from current deal patterns + brand mentions.

> *Example:* "The shelf leans craft — Aeriz live resin, Bedford Grow flower, and Daze Off pre-rolls are featured rotating discounts. Edibles selection is deeper than peer stores in the corridor, with Wyld and Mindy's gummies typically in stock."

### 3. Pricing positioning (1-2 sentences)

Where they fall on the value spectrum. Avoid hard numbers (those go stale) — talk in shape ("budget-tier eighths typically run X-Y").

> *Example:* "Pricing skews mid-market — flower eighths in the $25-35 range, ounces frequently discounted to under $130 during weekday promotions. Not the cheapest store in the area but with stronger brand variety."

### 4. Recommended for X type of buyer (1-2 sentences)

Help the reader self-identify.

> *Example:* "Best for: shoppers prioritizing brand variety over absolute price. Less ideal if you're hunting for the lowest gram price — Trinity on Glen across town typically wins on bulk flower deals."

### 5. Hours / parking / access notes (1-2 sentences)

Practical detail no one else writes.

> *Example:* "Open 9 AM-9 PM weekdays, opens at 10 AM weekends. Free off-street parking with 12 spaces; ADA-accessible entrance. Drive-thru lane added Q1 2026 for express pickup orders."

### 6. PuffPrice editorial line (1 sentence)

What a buyer should know that isn't obvious from the dispensary's own marketing.

> *Example:* "Best deal density on PuffPrice for craft flower in the Fox Valley — averaging 4-6 active promos vs. peer stores' 1-2."

---

## Production paths — three options

### Option A — AI-assisted with human review (RECOMMENDED)

**Process:** Cowork drafts 5-10 dispensary descriptions per session using the template + ground truth from `master_listings`, `deals`, `listing_hours`, `anchor_skus`. Matthew reviews each in 3-5 minutes for accuracy and voice. Approved drafts go into a single SQL migration that batches the UPDATE.

**Pros:**
- Fastest path to 61 dispensaries
- Voice consistency (same model, same prompt)
- Cheap (~$0 marginal cost)
- Auditable (drafts saved in `docs/drafts/dispensary-descriptions-MM-DD.md`)

**Cons:**
- Risk of AI hallucination on specifics (claims about hours, parking, etc.). Mitigation: use ONLY ground-truth fields from DB; don't invent specifics.
- "AI voice" risk if not tightly templated. Mitigation: enforce the 6-section template, post-process for repetitive phrasing.

**Time estimate:** 2 hours per 10 dispensaries (drafting) + 30 min Matthew review per 10 = ~14 hours total for all 61. Spread over 4 sessions over 2 weeks.

**Cost: ~$0 in marginal AI usage.**

### Option B — Full manual

**Process:** Matthew writes each description longhand. Or hires an IL-based cannabis writer ($0.10-$0.20/word).

**Pros:**
- Authentic voice
- Local knowledge baked in
- No hallucination risk

**Cons:**
- Slow — 30-45 min per description × 61 = 30-45 hours
- $0.20/word × 250 words × 61 = $3,050 if outsourced

**Time estimate:** 6-8 weeks at Matthew's pace. 2 weeks if outsourced.

### Option C — Outsource to a copywriter on Upwork / Fiverr

**Process:** Spec the template, pay a writer per description.

**Pros:**
- Off Matthew's plate
- Variable pricing — $5-50 per description depending on quality tier

**Cons:**
- Coordination overhead
- Quality variance
- Same length needed regardless of dispensary importance

**Cost:** $300-3,000 for 61 dispensaries depending on tier.

---

## Recommended path: Option A, prioritized rollout

Hybrid approach. Cowork drafts in priority order, Matthew reviews in batches.

### Priority ordering — Top 20

Same readiness logic as Tier 1 sales: deal density × Peoria proximity. The first 20 to write:

1. nuEra East Peoria (5 active deals, Peoria metro)
2. Seven Point Danville (4 active deals)
3. Zen Leaf Naperville (4 active deals)
4. Terrace Cannabis Moline (3 active deals)
5. High Haven Elgin (2 active deals)
6. Ivy Hall Dispensary Peoria (2 active deals, Peoria-local)
7. nuEra Urbana (sister to #1)
8. Trinity on University Peoria (Peoria-local)
9. Trinity on Glen Peoria (Peoria-local)
10. NOXX East Peoria (Peoria-metro)
11. Beyond Hello Peoria (Peoria-local)
12. Revolution Normal (ISU market)
13. AYR Wellness Normal (ISU market)
14. Ivy Hall Waukegan (sister to #6)
15. Lyfe Dispensary Rockford
16. Shangri-La Springfield
17. Altius Dispensary Carol Stream (5 deals, no contact)
18. nuEra Aurora (4 deals, sister to #1)
19. nuEra Champaign (4 deals, sister to #1)
20. Hi5 Dispensary Crestwood (2 deals)

### Priority 21-61 — fill in by city/region

Order: Bloomington-Normal, Quad Cities, Chicago, Springfield, Quincy, Galesburg, Rockford, southern IL.

### Production cadence

* **Week of 4/27:** Cowork drafts dispensaries 1-10 in one 90-min session. Matthew reviews + approves over 1-2 evenings.
* **Week of 5/4:** Cowork drafts 11-20. Same review pattern.
* **Week of 5/11:** Cowork drafts 21-40 (less detail per description, ~150 words each since these are lower-priority).
* **Week of 5/18:** Cowork drafts 41-61. Final coverage push.

End of May: all 61 IL dispensaries have ≥150-word editorial descriptions.

---

## Cost summary

| Path | Total cost | Total time | Quality variance |
|---|---|---|---|
| A — AI-assisted with Matthew review | ~$0 | ~14 hours over 4 weeks | Low (one voice, templated) |
| B — Matthew handwrites | $0 (his time) | 30-45 hours | Highest authentic voice |
| B — Outsourced to IL writer | $3,050 | 2 weeks | Variable, depends on writer |
| C — Fiverr / Upwork (low-tier) | $300-600 | 1-3 weeks | Low — likely needs heavy editing |

**Recommended:** Option A. Get 61 listings to floor in 4 weeks at zero marginal cost. Replace specific descriptions with longer/handwritten versions over time as Matthew bandwidth opens up.

---

## What to do with this content once written

1. **SEO:** Each description is wrapped in `<p>` inside the dispensary page (`app/dispensary/[slug]/page.tsx`). Ensure no descriptions are stuffed in image alt or hidden text.
2. **Structured data:** Add the description to the JSON-LD `Dispensary` schema (already partially scaffolded per `schema_org_json` column). Lets Google quote it in rich results.
3. **Newsletter:** Cycle "dispensary spotlight" content from these descriptions in the weekly digest.
4. **Brand pages:** When `lib/brands.ts` populates, cross-link from each brand's distribution map back to the dispensary descriptions where that brand appears.

---

## Companion files

- `docs/strategy/editorial-calendar-may-2026.md` — month-by-week editorial cadence
- `lib/brands.ts` — brand data layer (links from descriptions back to brand pages)
- `app/dispensary/[slug]/page.tsx` — where descriptions render
- `docs/ops/tier-1-monday-outreach-ready-20260422.md` — same priority ordering
