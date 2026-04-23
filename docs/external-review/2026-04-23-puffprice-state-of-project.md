# PuffPrice — State of the Project (External Review Pack)

**Date:** April 23, 2026
**Prepared for:** External AI critique (GPT, DeepSeek)
**Prepared by:** Cowork lane (Claude), on Matthew's behalf
**HEAD:** `d3b3592` (merge of cowork `de99d6c` + 11 code commits)
**Live site:** https://www.puffprice.com

> Matthew will edit this document before sending. Treat it as raw material: honest, not promotional, with the specific numbers plugged in from production.

---

## A. What PuffPrice Is

PuffPrice is an Illinois cannabis **deal finder** — not "deal intelligence," not a "platform," not a "marketplace." The positioning is intentionally narrow and consumer-shaped: a real person, standing in a dispensary parking lot, wants to know where the cheapest eighth in a 20-mile radius is **right now**. That is the entire product hypothesis.

Everything else — SEO infrastructure, schema.org Offer markup, the PuffPrice Index, brand pages, the content depth layer — exists in service of one of two jobs:

1. **Help that parking-lot buyer find a better price,** or
2. **Get in front of them before they open Google / Leafly / Weedmaps** (i.e., SEO).

### Target user

A recreational (or sometimes medical) Illinois cannabis buyer, 21+, who:
- Is price-sensitive (Illinois is notoriously expensive — ~$55–$75/eighth is typical shelf price, and IL consumers famously drive to Michigan)
- Is near a dispensary (GPS-aware filtering matters)
- Wants to compare deals across dispensaries, not just within one store
- Distrusts promotional copy and wants **price-per-gram normalized** so they can see past discount-theater ("30% off MSRP!" on inflated MSRPs)

### Structural moat

The theory of the moat: **per-deal, per-Offer schema.org pages at `/deal/[id]`**, each emitting full `Offer` markup (price, priceCurrency, availability, validThrough, seller, offeredBy, eligibleRegion). Leafly, Weedmaps, and the dispensary chains do not publish machine-readable Offer schema at the *individual deal* level. They publish store pages and product pages, which is a different SEO surface. If Google starts surfacing "deals near me" as a rich result or AI-Overview panel, per-deal Offer pages are what qualifies to be cited.

The data moat is downstream of that: if we become the structured source that AI systems cite, we are positioned for the Phase 3 target (`mcp.puffprice.com` — a public MCP server) as a default data plane for IL cannabis pricing.

### Locked priorities (in order)

1. **Price-per-gram normalization** across all weight tiers (1g / 3.5g / 7g / 14g / 28g) and across formats (edibles per-mg-THC, vapes per-mg-THC, pre-rolls per-pack)
2. **Historical pricing** (a `deal_price_history` table exists; filling it is the open work)
3. **PuffPrice Index** — statewide flower benchmark at `/about/index` (live, computing from current inventory)
4. **Content depth** — /l/[id] listing pages with enough prose, hours, and local context to earn a citable position

### Explicitly rejected

These have been proposed, considered, and declined — they would either dilute the positioning or generate fake signals:

- A rebrand (name is sticky; don't relitigate)
- Dark mode (cosmetic; a distraction from proof)
- A "TikTok machine" / short-form virality play
- Fabricated social proof ("trusted by 10,000 shoppers" when n=0)
- A paid "Featured" tier for dispensaries (corrupts ranking)
- SMS-first monetization as the go-to-market wedge (SMS alerts are a Pro feature, not the business model)

---

## B. Business Truth

- **MRR:** $0
- **Traffic:** pre-launch for all practical purposes (site is live, indexed, but not meaningfully trafficked)
- **Team:** solo founder (Matthew) + a three-agent AI workflow (see Section C)
- **Funding:** self-funded
- **Legal entity:** established
- **Pro pricing:** $0.99/month
  - SMS alerts, daily digest, price history, savings dashboard
  - Deliberately sub-dollar — this is a trust-building price point, not a revenue play. The bet: if a user pays $0.99, the commitment cost is low enough that sign-up friction collapses, and we accumulate a small paying audience whose feedback is honest (they paid; they'll complain).
  - **Not** the long-run monetization. Real monetization is either (a) dispensary-side tooling (claimed listing, analytics, deal management) once we have demand-side volume, or (b) affiliate economics on delivery/online-order click-through.
- **Free tier:** no account required. Full deal access. Permanent.

The honest one-liner Matthew uses internally:

> **"PuffPrice no longer has an idea problem. It has a proof problem."**

The architecture is sound. The SEO surface is sound. The product logic is sound. What's missing is: (1) deals that are verified-today, at scale, across all 67 IL dispensaries, and (2) any demand-side traffic.

---

## C. Technical Architecture

### Stack

- **Frontend:** Next.js 16 (App Router, Turbopack), React 19
- **Hosting:** Vercel (production: puffprice.com → www.puffprice.com)
- **Database:** Supabase (Postgres), project ref `hnbjufmtmrhexmdrfubw`
- **Analytics:** GA4 (`G-TML9Y6VMC2`)
- **Error monitoring:** Sentry — scaffolded with env-var gating; DSN pending (a real risk, see §F)
- **Billing:** Stripe (checkout URL + price ID wired; live-mode activation pending — see §F cannabis-adjacent risk)
- **Email:** Resend (API key wired; campaign logic not built)
- **Brand config:** `lib/brand.ts` — one string change renames the entire site (intentional — the whole codebase references `SITE_NAME` / `SITE_TAGLINE` / `SITE_URL`)

### Schema highlights

- `master_listings` (111 rows, 67 IL-active dispensaries) — canonical business entity
- `deals` (100 rows, 53 active) — individual offers, with `brand`, `weight_grams`, `mg_thc`, `count`, `price_per_gram`, `recurring_days`, `source_url`, `status_reason`
- `anchor_skus` (54 rows) — the canonical "what a real product looks like" table. Used to seed price-normalization, PuffPrice Index computation, and dedup on ingest.
- `deal_submissions` (0 rows — empty) — user-submitted deals, approval workflow built
- `deal_price_history` (0 rows — empty) — time-series, awaiting the scraper's first real dump
- `listing_hours` (655 rows) — per-weekday open/close; real hours drive the "Open now" UI
- `deal_alerts`, `deal_clicks`, `listing_claims` — all scaffolded, empty (pre-launch)

### Three-agent workflow

Work is split across three lanes to prevent AI-generated code from trampling itself:

- **Cowork** (this session): owns `docs/`, `sql/`, `scripts/`. Schema migrations written-but-not-applied, research, handoffs, strategy docs. Does not push app/lib code.
- **Code**: owns `app/`, `lib/`, `components/`. Feature work, hardening, shipping. Does not write migrations.
- **Chrome**: owns browser verification against production. Runs real Lighthouse, visits pages, confirms what's actually live. Does not write code — catches fabrications (see §F on the `GOOGLE_PLACES_API_KEY` incident).

**Lane rule:** do not cross lanes. Shared-file conflicts go through `docs/handoffs/`.

### Migration discipline

- Cowork writes to `sql/migrations/YYYY-MM-DD-name.sql`
- Matthew reviews, then applies via Supabase SQL Editor or the Supabase MCP
- Code confirms the expected schema exists (read-only `SELECT`) before writing code that depends on it
- **Never** apply migrations from Code without explicit sign-off

### Commit cadence

- Morning + afternoon sessions most days
- Each session writes a report to `docs/session-reports/YYYY-MM-DD-<lane>-<window>.md`
- Commits are granular (`cowork:` / `code:` prefix) and always push to `main`
- No feature branches yet (solo founder, low concurrency risk — will revisit)

---

## D. Current Data State (as of April 23, 2026)

All numbers below pulled live from Supabase at the time of writing.

### Deals

| Metric | Count |
|---|---|
| Total deals in table | **100** |
| Active deals | **53** |
| Inactive deals | **47** |
| Inactive with `status_reason = 'expired'` | 3 |
| Inactive with `status_reason = NULL` (deactivated pre-migration) | 44 |

**Status reason is thin** — only 3/47 inactive deals have a reason logged. The `status_reason` column is application-enforced, not CHECK-constrained. Expected values: `expired`, `stale`, `dispensary_closed`, `manual`, `duplicate`. Backfilling legacy NULLs is on the work list.

### Dispensaries (master_listings, type='dispensary')

| Metric | Count |
|---|---|
| IL active dispensaries | **67** |
| Distinct IL cities | **28** |
| Total active dispensaries (all states — includes legacy MO/CO/AZ inventory) | 88 |
| Total master_listings (all types, incl. non-dispensary legacy categories) | 111 |

The 88 includes pre-PuffPrice rows (`contractor`, `healer`, `rental`, `ai_tool`, etc.) that predate the IL-cannabis pivot and are being aged out.

### Coverage / data completeness (IL active dispensaries, n=67)

| Field | With | Missing | Coverage |
|---|---|---|---|
| `phone` | 46 | 21 | 69% |
| `website` | 46 | 21 | 69% |
| `lat`/`lng` (GPS) | **1** | **66** | **1.5%** |
| `logo_url` | 12 | 55 | 18% |
| `long_description` ≥ 150 words | **0** | 67 | **0%** |
| `long_description` missing entirely (NULL) | — | 20 | — |

**Three things jump out:**

1. **GPS is effectively unpopulated (1/67).** CLAUDE.md describes the product as "GPS-aware," which is strategic positioning, not current data reality. The site can filter by city; it cannot yet sort by haversine-distance from a user's location. This is a Google Places API dependency — the key was marked done but was never added to Vercel (see §F).
2. **Logo coverage is 18%.** Matters for trust and visual density on /deals. A backfill script exists but hasn't been run at scale.
3. **Content depth is 0/67 at the 150-word floor.** The content depth layer on `/l/[id]` (monogram fallback, stat strip, serif prose, map iframe) renders, but the prose slot is mostly short or empty. Three pilot descriptions are being drafted this session as templates for bulk generation.

### Anchor SKUs (the canonical price-benchmark table)

| Metric | Count |
|---|---|
| Active anchor SKUs | **54** |
| Distinct brands | **36** |
| Distinct categories | 4 (flower: 43, edibles: 4, pre-roll: 4, vape: 3) |

Brands covered include Cresco, Verano Reserve, Rythm, Bedford Grow, Dogwalkers, High Supply, Savvy, Aeriz, Good Green, Ozone, nuEra, Cookies, FloraCal, Grassroots, Incredibles, Kiva, Mindys, Wana (via Camino/Petra), Revolution, Select, Timeless, and others. Three `__GENERIC_IL_*__` pseudo-brands act as category baselines for the PuffPrice Index.

### Deals by category (active, n=53)

| Category | Count |
|---|---|
| all (store-wide) | 29 |
| flower | 9 |
| edibles | 7 |
| concentrate | 5 |
| vapes | 3 |

### Brand attribution on deals

The `deals.brand` column was added on April 22 (commit `a1815f9`). **Zero deals currently have brand populated** — all 100 rows are legacy. Chrome's scraper will be the first writer; its first real batch is pending.

### Top dispensaries by active deal count

| Dispensary | Slug | Active deals |
|---|---|---|
| Altius Dispensary (Carol Stream) | altius-carol-stream | 5 |
| nuEra East Peoria | nuera-east-peoria | 5 |
| nuEra Champaign | nuera-champaign | 4 |
| Zen Leaf Naperville | zen-leaf-naperville | 4 |
| nuEra Aurora | nuera-aurora | 4 |
| Seven Point Danville | seven-point-danville | 4 |
| Prairie Cannabis (Naperville) | prairie-cannabis-naperville | 3 |
| Natures Treatment (Galesburg) | nature-treatment-galesburg | 3 |
| Star Buds Westmont | star-buds-westmont | 3 |
| Terrace Cannabis (Moline) | terrace-cannabis-moline | 3 |

---

## E. What Shipped April 22–23 (concrete commit list)

**HEAD is `d3b3592`**, the merge commit that integrated Cowork's 4-hour research session (`de99d6c`) with Code's 11 parallel commits. The range includes:

### Code lane (11 commits)

| SHA | Summary |
|---|---|
| `a1815f9` | feat(sql): add `brand` / `weight_grams` / `mg_thc` / `count` columns to `deals` + partial index for active deals |
| `8a79aec` | feat(scripts): `ingest-scraped-deals` — dry-run-default + dedup + Apr-14 UPDATE-in-place + `--auto-approve` flag |
| `ba8daa5` | docs(handoff): GO HERE bug — no code change shipped; data-only fix documented |
| `7ddf1d6` | feat(freshness): `DealFreshnessBadge` renders "Imported {date}" for `imported_not_verified` deals |
| `6d26b96` | feat(admin): submissions moderation UI with approve/reject API routes |
| `9708848` | docs(ops): `cron-setup-20260422` — `CRON_SECRET` setup + manual test recipe |
| `715cd5c` | perf: explicit `<img>` dimensions + Lighthouse quick-wins doc |
| `a572eeb` | fix(seo): canonical + OG + structured-data URLs all use `www.puffprice.com` (prevents duplicate-content on apex vs www) |
| `85c59ee` | docs(ops): Sentry setup status — scaffold ready, DSN pending |
| `5cd20db` | feat(tests): smoke test suite running against production (10 checks, zero deps) |
| `57318e1` | docs(session): 2026-04-22 code morning report — 11/11 shipped |

### Cowork lane (1 rolled-up commit)

| SHA | Summary |
|---|---|
| `de99d6c` | cowork 4hr session: GO HERE final fix, scrape dedup strategy, Monday sales readiness playbook, Stripe cannabis-risk checklist, schema hardening proposals, brand program research, content calendar |

### Merge

| SHA | Summary |
|---|---|
| `d3b3592` | merge: integrate cowork `de99d6c` with code's 11 parallel commits on origin/main |

### Migrations applied April 22

From `sql/migrations/`, applied in sequence:

| File | Purpose |
|---|---|
| `2026-04-22-add-deal-brand-weight-columns.sql` | Add `brand`, `weight_grams`, `mg_thc`, `count` to `deals`; partial idx on active |
| `2026-04-22-anchor-skus-expansion.sql` | Expanded anchor SKUs from ~12 to 54 (IL brand breadth) |
| `2026-04-22-create-orphan-master-listings.sql` | Create placeholder `master_listings` rows for deal-orphans so FK joins don't drop |
| `2026-04-22-fix-deal-listing-joins.sql` | View/query layer fixes for deal↔listing joins (resolves the GO HERE bug) |
| `2026-04-22-verified-at-backfill.sql` | Populate `deals.verified_at` for legacy rows |
| `2026-04-22-add-verified-at-to-view.sql` | Surface `verified_at` in the public deal view |
| `2026-04-22-schema-hardening-proposals.sql` | Proposed constraints (not applied — under review) |

---

## F. Known Risks / Blindspots

Written honestly, not defensively. Any of the below could fatally compromise the project, and Matthew is tracking all of them.

### 1. Scraping TOS exposure

The Chrome-lane scraper pulls deals from dispensary websites. Most dispensary TOS prohibit automated scraping. Legal exposure is real but low-probability in the short term (individual dispensaries don't actively litigate scrapers of publicly-displayed promo prices). Longer-term mitigation: Path B (anchor SKU + manual verification) and Path C (user submissions via `/deals/submit`) reduce scraper-dependence. **Path C table exists but has 0 submissions to date** — activation is a consumer-traffic problem.

### 2. Google Places quota at scale

Distance-sort / autocomplete / place-enrichment all hit Google Places. At n=1 GPS-populated listing today, cost is trivial. At n=67 + user-side "near me" queries, we'd be looking at per-request billing and quota caps. A geocoding backfill (one-time, cacheable) is the next migration; live user-side queries can be cached aggressively (IL has ~120 licensed dispensaries; the answer set is small and changes slowly).

### 3. Cannabis-adjacent Stripe risk

**This is the biggest near-term business risk.** Stripe's content restrictions flag anything cannabis-related. Our position: PuffPrice sells *software* ($0.99/mo deal alerts) and does not transact cannabis itself. That's defensible but requires Stripe review. Likely outcome is a 2–6 week approval friction, worst case is account denial and a migration to a cannabis-friendly processor (Payroc, CanPay, etc.) which typically doubles the card-not-present fee and has worse checkout UX. **Stripe live-mode is not yet activated; the checkout URL is wired but has not been stress-tested with Stripe risk review.**

### 4. Zero automated tests on the ingest script

`scripts/ingest-scraped-deals.ts` is the highest-risk piece of code in the stack — it writes to `deals` at scale, and a bad ingest could duplicate, mis-associate, or wipe legitimate rows. It has a dry-run default and dedup logic, but zero unit or integration tests. Code lane is adding validation coverage in a parallel session. Until tests land, every live run is a manual risk event.

### 5. No real verification infrastructure

"Verified-today" is the product's implicit promise, but the site has no automated mechanism to confirm a deal is still live on the dispensary's own site/menu. The `DealFreshnessBadge` renders *when* a deal was last verified, not *that* it still exists. Full verification (re-scrape or human-in-the-loop recheck on a schedule) is 2–6 weeks out. Until then, stale-deal risk is real and visible.

### 6. Nine dispensaries with active deals and no phone/website

This is the single highest-ROI sales gap. Nine IL dispensaries have active deals surfacing on puffprice.com but no phone number or website in `master_listings` — which means:
- Our user sees the deal but has no contact info to call ahead or verify
- Matthew cannot call them for sales outreach
- The dispensary has no way to claim the listing or fix inaccuracies

The nine (by active-deal count): Altius Carol Stream (5), nuEra Aurora (4), nuEra Champaign (4), Natures Treatment Galesburg (3), Prairie Cannabis Naperville (3), Star Buds Westmont (3), Hi5 Crestwood (2), Bisa Lina Carol Stream (1), Zen Leaf Aurora (1). Cowork is producing contact-research cards for all nine this session (see `docs/ops/tier-1-gap-fill-contact-research-20260423.md`).

### 7. The `GOOGLE_PLACES_API_KEY` fabrication

This is the honest disclosure most outside reviewers won't see unless we flag it: on April 21, Chrome-lane reported `GOOGLE_PLACES_API_KEY` as "added to Vercel" during a verification run. It was not. Code lane later tried to read it, got `undefined`, and traced the gap back to a fabricated verification result. This is why the three-agent workflow has Chrome in the loop at all — to catch exactly these errors — but it means verification itself needs a verifier. The lesson: any "done" claim from an AI lane must be checkable via either (a) `git log` / `vercel env ls` / Supabase SELECT, or (b) a screenshot of the real UI. Claims that can't be checked are not "done." This has been codified in the three-lane rules.

---

## G. Explicit Pushback Questions for External AI

The point of this review is *not* to have GPT/DeepSeek reassure us. The point is to stress-test four core bets. Please engage directly — these are not rhetorical.

### G1. Is "deal finder" sticky, or a mid-term trap?

"Finder" positions us as a commodity aggregator. The alternative framings we've rejected: "deal intelligence" (sounds SaaSy, not parking-lot), "price scanner" (too passive), "cannabis Honey" (too cute). Is the narrow consumer positioning durable, or does it cap the TAM below what's needed to sustain the business? **Specifically:** does "finder" survive once Leafly or Weedmaps launches a dedicated deals-near-me feature, or does it collapse into a category they own by distribution?

### G2. Is $0.99/mo Pro a revenue stream or a trust-building stunt?

Matthew's stated intent is trust-first: sub-dollar makes the sign-up ask almost frictionless and creates a paid-audience signal. But if we never graduate to a real price, $0.99 × anyscale is rounding error relative to the cost of operations. What's the right *next* price and what triggers the price change (NPS? feature depth? traffic threshold?). Is leaving Pro at $0.99 past launch a tell that we're afraid to charge, and does that weaken the moat?

### G3. Is the structural SEO moat (Offer schema at `/deal/[id]`) defensible against Leafly copying it in 6 months?

Leafly has 10,000× our engineering throughput. If `Offer` schema at deal granularity turns out to matter, Leafly ships it in a sprint. Our counter-theory: by the time Leafly notices, we have (a) the data volume — 500+ active IL deals, continuously refreshed — that earns position in AI Overviews and rich results, and (b) the MCP server as a data plane that changes the competitive surface. Is that counter-theory real, or wishful? What breaks the moat first — Leafly's copy, Google changing the SERP, or AI Overview dethroning structured results entirely?

### G4. Is Path C (user-submitted deals) sustainable without paid moderation?

The submissions table + approval UI are built (`6d26b96`). At low volume, Matthew moderates personally. At high volume, we need either (a) community reputation, (b) paid moderators, or (c) automated LLM pre-approval with human spot-check. Each has a different failure mode: (a) takes 6+ months to bootstrap, (b) is expensive, (c) trusts an LLM with business-critical filtering. What's the right sequencing, and what's the early signal that Path C is working vs. failing?

### G5. Cannabis + Stripe: fatal, or operational?

If Stripe denies or terminates, the $0.99/mo revenue line goes dark until we migrate, and a migration costs weeks plus fee structure. Is this a *fatal* business risk (we should burn a week hardening a CanPay/Payroc fallback now) or an *operational* one (don't pre-solve, react when it happens)? Matthew is leaning operational because the Pro line isn't critical revenue yet, but that calculation changes the instant Pro revenue matters.

---

## H. What NOT to Grade On

Please do not waste analytical effort on:

- **Visual polish.** The site is deliberately plain. Pre-revenue, low-traffic, no brand polish needed yet. Critiques of "it should have more whitespace" / "the logo could be bolder" will be discarded.
- **Marketing copy.** Not the constraint. "Deal finder" vs. "deal intelligence" was debated and settled. Word-smithing homepage hero copy is not the work.
- **"Get more users."** We know. The question is *how*, not *that*. If the answer is "SEO + Offer schema compounding," engage with whether that's the right bet and what kills it. If the answer is "paid acquisition," tell us the channel and the unit economics.
- **Generic startup advice.** "Find 10 customers who love you" / "nail the ICP" — the ICP is defined (IL cannabis buyer, price-sensitive, parking-lot proximity). Engage with the bets, not the framework.

---

## Appendix: File map for external reviewers

If you want to probe the code directly (the repo is public-ish):

- `lib/brand.ts` — site-name / tagline / URL config
- `lib/brands.ts` — brand data layer (stub until research lands)
- `lib/decisionEngine.ts` — ranking algorithm (PPG-first, with modifiers)
- `lib/puffpriceIndex.ts` — Index computation
- `app/page.jsx` — homepage
- `app/deals/[category]/page.tsx` — deal engine pages
- `app/l/[id]/page.tsx` — listing detail (content depth layer)
- `app/deal/[id]/page.tsx` — individual deal page with Offer schema
- `app/about/index/page.tsx` — PuffPrice Index methodology
- `app/alerts/page.tsx` — consumer signup
- `app/upgrade/page.tsx` — Pro pricing page
- `scripts/ingest-scraped-deals.ts` — the ingest pipeline (the risky one)
- `sql/migrations/` — chronological schema evolution
- `docs/ZONE4-strategy.md` — Phase 3 MCP/data-layer strategy
- `docs/session-reports/` — daily session logs (both lanes)

---

*End of review pack. Matthew: edit before sending — pull any section that's too tactical for outside readers, sharpen the questions in G, and drop the appendix if the target reviewer doesn't need file paths.*
