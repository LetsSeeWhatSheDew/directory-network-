# Cowork session report — 2026-04-22 morning continuation

**Branch:** main
**Starting commit:** `7f39ee7` (this morning's interrupted Cowork session)
**Ending commit:** see commit hash at end of this report
**Duration:** ~4 hours
**Tasks shipped:** 8 of 8 (all priorities clean)

---

## TL;DR

Closed every task in the brief. Headline outputs:

* **GO HERE bug** — fully diagnosed. Maps tab needs the Places backfill (data, not code). Deal-card GO HERE has no active bug — defended at `listingHref()` + DB invariants. Code shipped a parallel handoff at `2026-04-22-go-here-code-resolution.md` confirming the same conclusion.
* **Scrape dedup strategy** — three deliverables (strategy doc, 5 collision queries, 20-min Matthew review checklist) that are direct companions to Code's freshly-shipped `scripts/ingest-scraped-deals.ts` (commit `8a79aec`).
* **Tier 1 Monday sales readiness** — Matthew has a graded call list. Critical finding: only 6 of 15 Tier-1 dispensaries have active deals on the site, so the pitch script changes per dispensary. 9 additional dispensaries with active deals can't be called because phone/website data is missing.
* **Stripe checklist** — 25-min Path A (Payment Link) + Path B (full Checkout + Webhook) for when MRR justifies the complexity.
* **Schema hardening** — 5 RLS-disabled tables with PII risk on `master_listings.license_number`, missing FK on `deals.listing_slug`, function search_path lockdown. All proposed in a tiered SQL migration; nothing destructive.
* **Brand partnership program** — Bronze/Silver/Gold tiers with explicit conflict-of-interest firewall. Spec only — pitch foundation for post-MRR.
* **Content depth + editorial calendar** — 0 of 61 dispensary descriptions hit the 150-word floor. Production plan + May 2026 publish cadence shipped.

---

## Tasks shipped

### ✅ Task 1 — GO HERE bug investigation (final)

* **Output:** `docs/handoffs/2026-04-22-go-here-bug-investigation-final.md`
* **Findings:**
  - Maps tab placeholder (`points.length < 3`) is intentional — 60/61 IL listings have NULL lat/lng. Only `emerald-city-dispensary-chicago-il` has coords. Fix = run `scripts/backfill-logos-from-google-places.ts --apply` (no code change).
  - All 4 GO HERE button locations route through `lib/links.ts:listingHref()` which rejects empty/junk slugs. Zero active deals have a broken `listing_slug` join (`active_deals_with_listings` view returns 46 clean rows). The 7 orphaned deals (status_reason='orphaned') stay deactivated until the orphan-listings migration applies.
  - **No code change required** for the deal-card GO HERE.
* **Convergence with Code:** Code shipped `docs/handoffs/2026-04-22-go-here-code-resolution.md` at `ba8daa5` with the same conclusion. Two complementary docs, no overlap.

### ✅ Task 2 — Scrape dedup + data quality strategy

* **Outputs:**
  - `docs/ops/scrape-dedup-strategy-20260422.md` — strict + fuzzy dedup keys, Apr 14 UPDATE-in-place vs INSERT-new decision (Option A wins), trust hierarchy, sanity guards, brand normalization
  - `sql/queries/scrape-collision-detection.sql` — 5 diagnostic queries (per-dispensary submissions, dedup rejections, Apr 14 UPDATE candidates with price_delta_pct, brand coverage delta, PPG outliers)
  - `docs/handoffs/2026-04-22-post-scrape-matthew-review.md` — 20-min review checklist, decision matrix (`--apply` vs `--apply --auto-approve` vs abort), recovery SQL
* **Convergence with Code:** Code's `scripts/ingest-scraped-deals.ts` (commit `8a79aec`) implements the strategy spec. The collision queries + Matthew review checklist are the operational counterpart.

### ✅ Task 3 — Tier 1 Monday sales readiness

* **Output:** `docs/ops/tier-1-monday-outreach-ready-20260422.md`
* **Findings:**
  - 6 of 15 Tier-1 dispensaries have active deals (A/A−/B+ grades): nuEra East Peoria (5), Seven Point Danville (4), Zen Leaf Naperville (4), Terrace Cannabis Moline (3), High Haven Elgin (2), Ivy Hall Peoria (2)
  - 9 of 15 have zero active deals (C grade) — need a softer pitch
  - All 15 have phone + website + hours + descriptions populated. None have lat/lng (universal post-Places-backfill problem)
  - 4 of 15 have logos (nuEra East Peoria, nuEra Urbana, High Haven Elgin, Ivy Hall)
  - **Material finding:** 9 OTHER dispensaries with active deals (Altius, nuEra Aurora, nuEra Champaign, Natures Treatment Galesburg, Prairie Cannabis, Star Buds Westmont, Hi5, Bisa Lina, Zen Leaf Aurora) hold 26 active deals (56% of the feed) but have NO phone/website. Recommended next action: 30-min enrichment pass to expand Tier-1 pool from 15 → 24.
  - Tier-2 fallback list of 10 names included.
* **Stale flag for Matthew:** Cresco/GTI brand outreach drafts cite specific deal counts that may have changed. Verify before sending.

### ✅ Task 4 — Stripe onboarding completion checklist

* **Output:** `docs/ops/stripe-onboarding-completion-checklist-20260422.md`
* **Architecture summary:** `/upgrade` page uses `NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL` (Payment Link, Path A — simpler). `/api/stripe/create-checkout` + `/api/stripe/webhook` are wired for Path B (full Checkout Session + webhook handler) but `pro_users` table doesn't exist (`2026-04-18-pro-users.sql` not applied).
* **Recommended path:** Ship Path A first (5 steps, 25 min). Path B unlocks SMS gating but depends on Twilio/Resend wiring not yet done.
* **Common pitfalls covered:** cannabis-adjacent flag, statement descriptor, `NEXT_PUBLIC_` prefix requirement, Vercel env scope, webhook signing secret rotation.

### ✅ Task 5 — Schema hardening + tech debt audit

* **Outputs:**
  - `docs/audits/schema-hardening-20260422.md` — full audit (security advisor + manual FK/index inspection)
  - `sql/migrations/2026-04-22-schema-hardening-proposals.sql` — tiered LOW/MEDIUM/HIGH risk migrations, all marked NOT YET APPLIED
* **Top findings:**
  - 5 tables exposed via PostgREST without RLS (worst: `master_listings.license_number` is PII)
  - 4 functions with mutable `search_path`
  - Missing FK on `deals.listing_slug` → `master_listings.slug` (the orphan preventer — pre-conditioned on orphan-listings migration applying first)
  - Unindexed FK on `deal_submissions.promoted_deal_id`
  - `master_listings.slug` UNIQUE constraint persists ✅
* **Convergence with Code:** Code's commit `a1815f9` adds `brand`, `weight_grams`, `mg_thc`, `count` columns to `deals` (migration NOT APPLIED yet). My audit's "what's missing" section was patched mid-session to reference this.

### ✅ Task 6 — Cannabis brand partnership program spec

* **Output:** `docs/strategy/brand-partnership-program-20260422.md`
* **Tiers:** Bronze ($500/mo) / Silver ($1,000/mo) / Gold ($2,000/mo)
* **Firewall (the differentiator):** explicit list of what is NEVER for sale — deal feed ranking, PuffPrice Index calculation, top-rated dispensary badge, editorial language. Editorial independence commitments to be published at `/why-puffprice`.
* **Launch readiness checklist** specifying what must exist before pitching each tier.
* **5 first-pitch targets** mapped to tiers (Cresco/GTI = Silver, Aeriz = Bronze→Silver, Kiva/PAX = Bronze).
* **Strategic, not operational** — pitch foundation for when MRR creates a credible "we have traction" hook.

### ✅ Task 7 — Content depth + editorial calendar

* **Outputs:**
  - `docs/strategy/content-depth-plan-20260422.md` — audit (0/61 listings hit 150-word floor; avg 75 words), 6-section template, three production paths, recommended Option A (AI-assisted with Matthew review), 4-week production plan
  - `docs/strategy/editorial-calendar-may-2026.md` — recurring (monthly Index, weekly Deal of the Week, weekly newsletter) + episodic (4/20 recap, Mother's Day, Spring strain spotlight, Memorial Day) + Dispensary Spotlight series
* **Editorial standards baked in:** no affiliate language without disclosure, all deal references must be live at publish, "Sponsored" labels on paid content, no claims PuffPrice can't verify.
* **Production capacity check** flags week of May 25 as the heavy week (7 hours Matthew); recommends pre-writing the Dispensary Spotlight in week 1-2.

### ✅ Task 8 — Commit, push, session report

This document. Committed in a single atomic commit alongside the 9 deliverable files.

---

## Decisions queued for Matthew

In rough order of urgency:

1. **Apply `2026-04-22-create-orphan-master-listings.sql`** — re-enables 7 deals, eliminates the orphan tail, unblocks GO HERE 404 risk permanently.
2. **Apply `2026-04-22-add-deal-brand-weight-columns.sql`** (Code's pending migration) — needed for scrape ingest to surface brand on deal cards.
3. **Run `scripts/backfill-logos-from-google-places.ts --apply`** — fixes Maps tab + populates 49 logo gaps (~$2 of Places API).
4. **Read `docs/handoffs/2026-04-22-post-scrape-matthew-review.md` BEFORE Code's ingest dry-run lands the scrape JSON.** This is the operational gate.
5. **Apply LOW_RISK section of `2026-04-22-schema-hardening-proposals.sql`** — RLS enables on 5 tables, function search_path lockdown, unindexed FK index. All additive.
6. **Code-side grep for `license_number`** before applying the column-grant revoke (in same SQL file).
7. **Make Tier-1 calls Monday morning** in the order from `docs/ops/tier-1-monday-outreach-ready-20260422.md` — start with nuEra East Peoria.
8. **Update Cresco + GTI outreach draft subject lines** to reflect actual current brand-deal counts before sending.
9. **Finish Stripe onboarding** using `docs/ops/stripe-onboarding-completion-checklist-20260422.md` Path A — gets Pro CTA live in 25-40 min.

---

## Handoffs to Code

* **Optional defense-in-depth for GO HERE:** spec'd `safeListingHref(knownSlugs)` in Task 1 doc, **rejected as not worth complexity** — DB invariant + listingHref() defender is correct paranoia level. Mentioned for the record.
* **`deals.dedup_status` column** suggested in Task 2 strategy doc. Add when ingest needs the `'fuzzy_match'`/`'price_conflict'` flags.
* **`master_listings.leafly_slug` column** referenced in Task 3 (already in scraper spec from prior session).
* **Schema hardening MEDIUM_RISK section** of `2026-04-22-schema-hardening-proposals.sql` includes the FK on `deals.listing_slug` — pre-conditioned on orphan-listings applying. Don't apply until 24h after that lands.
* **Content depth + editorial calendar** — Cowork drafts dispensary descriptions weekly; Code's only ask is to ensure descriptions render in `app/dispensary/[slug]/page.tsx` JSON-LD `Dispensary` schema (likely already does via `schema_org_json`).

---

## Handoffs to Chrome

* **Verification targets when Vercel goes Ready** after Matthew applies the orphan-listings migration:
  - `puffprice.com` should show 53 active deals (up from 46) on `/deals/all`
  - All 6 newly-created listings should render: `/l/bisa-lina-joliet`, `/l/cookies-chicago`, `/l/curaleaf-morris`, `/l/natures-treatment-milan`, `/l/perception-cannabis-chicago`, `/l/mood-shine-chicago-heights`
  - `/map` page still shows placeholder until Places backfill runs
* **After Places backfill runs:** `/map` should switch from placeholder to MapClient with 50+ pins
* **After Stripe Path A goes live:** `/upgrade` button should navigate to Stripe Payment Link, NOT mailto

---

## Recommended next Cowork session topics

1. **30-min phone/website enrichment** for the 9 missing-contact dispensaries with active deals (Altius, both Carol Stream stores, both nuEra Chicago-area, etc.) — expands Tier-1 pool by 60%
2. **Draft dispensary descriptions for Top 10** (per content-depth plan) — ~90 min Cowork drafting + 2 sessions Matthew review
3. **Populate `lib/brands.ts`** with the 5 pilot brands (Cresco, GTI, PAX, Kiva, Wyld) so brand pages can ship before any partnership pitch
4. **Spec Resend email infrastructure** — required for both Stripe Path B and the editorial calendar's newsletter cadence
5. **Day-2 content calendar** — what does June 2026 look like? Lead time for Father's Day, summer outdoor consumption, mid-summer Index trend story

---

## Files committed this session

* `docs/audits/schema-hardening-20260422.md`
* `docs/handoffs/2026-04-22-go-here-bug-investigation-final.md`
* `docs/handoffs/2026-04-22-post-scrape-matthew-review.md`
* `docs/ops/scrape-dedup-strategy-20260422.md`
* `docs/ops/stripe-onboarding-completion-checklist-20260422.md`
* `docs/ops/tier-1-monday-outreach-ready-20260422.md`
* `docs/strategy/brand-partnership-program-20260422.md`
* `docs/strategy/content-depth-plan-20260422.md`
* `docs/strategy/editorial-calendar-may-2026.md`
* `docs/session-reports/2026-04-22-cowork-morning-continuation.md` (this file)
* `sql/migrations/2026-04-22-schema-hardening-proposals.sql`
* `sql/queries/scrape-collision-detection.sql`

12 files, single atomic commit. `.gitignore` modification left unstaged per session-start instructions.

---

## Operating notes

* Supabase MCP used read-only throughout. No DB writes attempted.
* No `.env` / secrets touched.
* No `cannabis.illinois.gov` lookups needed — relied on existing Cowork research from prior sessions.
* No web fetches — relied on schema audit + git log + previous Cowork docs.
* Time discipline: 8 tasks in ~4 hours = 30 min average per task. Strategic tasks (6, 7) shorter than priority-1 operational tasks (1, 2, 3) which is correct allocation.
