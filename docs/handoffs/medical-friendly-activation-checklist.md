# Handoff — Medical-Friendly Filter Activation Checklist
> **For:** Matthew (product decisions), Code (UI), Cowork (data backfill).
> **Current state:** Column `master_listings.is_medical_friendly boolean` authored in `sql/migrations/add-is-medical-friendly.sql`. **NOT YET APPLIED** (Supabase MCP is read-only this session). UI toggle currently hardcoded `disabled=true` and must stay that way until this checklist clears.

## Why the toggle is disabled today

We have 107 master listings. Zero of them have `is_medical_friendly` data — the column doesn't exist yet, and even after it's added the default is NULL (intentional — NULL means "unknown", better than guessing). Flipping the filter on before coverage is populated would produce either "0 results" or a misleading partial list. Both are worse than hiding the filter.

## Activation checklist — must clear all four before enabling

### 1. Apply the migration
- [ ] Open Supabase SQL editor.
- [ ] Run `sql/migrations/add-is-medical-friendly.sql`.
- [ ] Verify: `SELECT COUNT(*) FROM master_listings WHERE is_medical_friendly IS NULL;` should equal total listing count (107 as of 2026-04-20). All NULL = column exists, nothing populated yet. That is expected.
- [ ] Bump the migration header from `NOT YET APPLIED` to `APPLIED YYYY-MM-DD HH:MM`.

### 2. Decide the source of truth (Matthew)

Three options, each with trade-offs:

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **A. Manual — each dispensary site + IDFPR** | Accurate, defensible. | 107 dispensaries × ~3 min = ~5 hrs. Decays — sites change medical posture quietly. | Time only. |
| **B. Owner self-report via claim flow** | Scales automatically, keeps data fresh (owner-maintained). | Depends on claim adoption, which is currently ~0. Won't cover the long tail. | Claim flow work (already partially built). |
| **C. Scrape dispensary sites nightly** | Scales, auto-refreshes. | Brittle — dispensary sites structure their "medical" pages inconsistently. False positives are reputation risk. | Build + maintain scraper. |

**Recommendation:** hybrid A+B. Cowork manually populates the 15–20 dispensaries we can verify in one sitting (top-traffic IL metros + Peoria). Claim flow handles the rest over time. Scraper deferred until volume justifies.

### 3. Populate the initial seed (≥30% coverage threshold)

- [ ] Cowork or Matthew fills `is_medical_friendly` for at least **33 of the 107 listings** (30% threshold). Below 30%, the filter will feel broken — user toggles on, sees ⅓ of the dispensaries, thinks the site is empty.
- [ ] Use an `UPDATE master_listings SET is_medical_friendly = true WHERE slug IN (...)` statement, checked into `sql/backfill/2026-MM-DD-is-medical-friendly-seed.sql` for audit trail.
- [ ] Source of truth: note in the commit message which method populated (IDFPR list URL, dispensary website URLs, owner self-report date).

### 4. Enable the UI toggle (Code)

- [ ] Flip `disabled={true}` → `disabled={false}` on the medical-friendly filter in the deals page / dispensary page.
- [ ] Update the filter's empty-state copy: when the toggle is ON and results = 0, show "No medical-friendly dispensaries in this filter set" — NOT "No dispensaries found". The distinction matters.
- [ ] For listings where `is_medical_friendly IS NULL` (unknown), the filter should **exclude** them when toggle is on (strict) rather than include them (permissive). Unknown ≠ yes.
- [ ] Add a small "Why?" popover on the toggle: "Medical-friendly dispensaries honor the Illinois medical cannabis tax rate (~1%) for patients with active cards. Most also accept cards at the point of sale." Matthew to confirm copy before ship.

## Post-activation monitoring

- [ ] Weekly: `SELECT is_medical_friendly, COUNT(*) FROM master_listings GROUP BY 1;` — track coverage growth.
- [ ] If `NULL` share drops below 20% (i.e., we've populated 80%+), Matthew decides whether to change the filter's unknown-handling from strict-exclude to permissive-include.

## Non-goals tonight

- Do NOT implement the UI toggle this session. It lives behind this gate.
- Do NOT backfill `is_medical_friendly` from assumptions or general knowledge — every populated row must have a verifiable source.
