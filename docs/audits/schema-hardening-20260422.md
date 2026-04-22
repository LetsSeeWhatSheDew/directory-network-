# Schema hardening + tech debt audit (2026-04-22)

**Source:** Supabase MCP `get_advisors` (security + performance) + manual FK / index inspection.
**Status:** Audit findings only. Proposed migration is at `sql/migrations/2026-04-22-schema-hardening-proposals.sql` — **NOT YET APPLIED**, all marked for review.
**Risk tier conventions:** LOW = additive (no data loss), MEDIUM = behavioral change (FKs may reject inserts), HIGH = destructive (column drops, data movement).

---

## Headline findings

| Severity | Count | Issue |
|---|---|---|
| 🔴 **ERROR** | 5 | Public-exposed tables without RLS (worst: `master_listings` exposes `license_number`) |
| 🔴 **ERROR** | 2 | `SECURITY DEFINER` views (active_deals_with_listings, deal_submissions_pending) |
| 🔴 **ERROR** | 1 | Sensitive column exposure (`master_listings.license_number` PII unprotected) |
| 🟡 **WARN** | 4 | Functions with mutable `search_path` |
| 🟡 **WARN** | 1 | Materialized view `deal_rankings` exposed to API |
| 🟡 **WARN** | 8 | RLS "always true" policies (mostly intentional — anon INSERT for forms) |
| 🟡 **WARN** | 4 | `auth.<function>()` re-evaluated per row (performance at scale) |
| 🟡 **WARN** | many | Multiple permissive policies on same role+action (performance at scale) |
| 🟢 **INFO** | 1 | Unindexed FK: `deal_submissions.promoted_deal_id` |
| 🟢 **INFO** | 13 | Unused indexes (low traffic — informational only) |

---

## What's already healthy

* `master_listings.slug` UNIQUE constraint persists ✅ (Matthew added this morning, verified `master_listings_slug_key`)
* `deals.listing_slug` is indexed (`idx_deals_listing_slug`)
* `deals.is_active`, `deals.expires_at`, `deals.category` all indexed
* Partial indexes on `deals` for `is_active=true` queries (`deals_active_created_idx`, `deals_active_expires_idx`)
* `listing_hours.listing_id` indexed
* `master_listings (state, city)` composite indexed
* `deal_submissions` has 4 indexes including a useful partial `pending_moderation` index
* `anchor_skus.brand_normalized` indexed (and `brand+weight_grams` composite)
* All major FKs are present and use sensible `ON DELETE` actions

The schema is in better shape than the symptoms (orphans, GO HERE 404s) suggested. Most issues are at the RLS / multi-tenancy layer, not the data layer.

---

## Section A — Security (RED)

### A1. Five public tables with RLS disabled

These tables are reachable via PostgREST with the anon key. Without RLS, anyone with the anon key (which is in the client bundle) can SELECT every row. Today the data is mostly editorial (dispensary names + hours), but `master_listings.license_number` is flagged as PII by the security advisor.

| Table | RLS | Rows | Why it matters |
|---|---|---|---|
| `master_listings` | ❌ | 105 | Contains `license_number`, `email`, `phone`, `owner_user_id` |
| `listing_hours` | ❌ | 613 | Public-fact data, low risk |
| `listing_attributes` | ❌ | 0 | Low risk (empty) |
| `products_or_services` | ❌ | 0 | Low risk (empty) |
| `events` | ❌ | 0 | Telemetry — should not be readable to anon |

**Recommended fix:** enable RLS + add minimal "anon SELECT" policies that mirror what the app already needs (see proposals SQL §A1). For `master_listings`, redact `license_number` from the anon-readable shape via a dedicated view or column-level grants. **Risk: LOW** (additive). **Defer if:** the polices break PostgREST queries the app makes — verify in preview env first.

### A2. SECURITY DEFINER views

Two views run with the creator's permissions instead of the querying user's:

* `active_deals_with_listings` — the workhorse view backing `/api/deals/recommend` and most deal feeds
* `deal_submissions_pending` — admin moderation view

For `active_deals_with_listings`, this is probably intentional (it joins `deals` to `master_listings` and the anon key needs to read it without enabling RLS bypass on the underlying tables). But Postgres best practice is to use `SECURITY INVOKER` and rely on RLS policies on the base tables instead.

**Recommended fix:** convert both views to `SECURITY INVOKER` after A1's RLS policies are in place. **Risk: MEDIUM** (could break anon reads if RLS policies aren't permissive enough). **Defer until A1 is settled.**

### A3. `master_listings.license_number` PII exposure

Same root cause as A1 but called out explicitly. Two paths to fix:

1. **Move license info to a separate `master_listing_licenses` table** with strict RLS. Cleaner long-term, requires app-side join changes (Code work).
2. **Drop `license_number` from the anon-readable view + restrict it via a column-level grant.** Faster, no app changes, but the column still exists in the public table.

**Recommended:** path 2 for this week, path 1 in a follow-up. **Risk: MEDIUM** (could break if Code reads `license_number` somewhere — quick grep needed first).

### A4. Functions with mutable `search_path`

Four functions: `update_deals_updated_at`, `set_updated_at`, `deal_submissions_compute_ppg`, `anchor_skus_normalize_brand`.

This is a stock Supabase warning. Fix is a one-liner per function (`SET search_path = public, pg_temp` in the function definition). **Risk: LOW.** Included in the proposals SQL §A4.

---

## Section B — Missing FK protection (MEDIUM)

### B1. `deals.listing_slug` → `master_listings.slug` (THE ORPHAN PREVENTER)

The biggest single schema gap. Today there's no FK from `deals.listing_slug` to `master_listings.slug`. That's how the 7-deal orphan situation happened: the import created deal rows pointing at slugs that didn't exist in `master_listings`. A FK would have rejected those inserts at write time.

**Recommended fix:** add `FOREIGN KEY (listing_slug) REFERENCES master_listings(slug) ON UPDATE CASCADE ON DELETE RESTRICT`.

* `ON UPDATE CASCADE` so renaming a slug propagates
* `ON DELETE RESTRICT` so we never lose deals just because a master listing was accidentally deleted

**Risk: MEDIUM.** Pre-conditions:
1. There must be ZERO `deals` rows with a `listing_slug` not in `master_listings`. Verified — confirmed by Task 1 ground truth (orphan count = 0 for unmatched slugs because the orphans are deactivated AND will be re-matched once the orphan-listings migration applies).
2. The FK can't be added until the orphan-listings migration applies (because the 7 orphans currently DO have a NULL match, even though they're inactive — postgres still checks).

**Sequence:** apply orphan-listings migration FIRST → then this FK.

### B2. `deal_price_history.listing_slug` → `master_listings.slug`

Same logic as B1. Currently no FK; orphans possible. Same fix pattern. **Risk: LOW** (table is empty today, no risk of pre-existing violations).

### B3. Unindexed FK: `deal_submissions.promoted_deal_id`

Performance advisor flagged. Adding `CREATE INDEX deal_submissions_promoted_deal_id_idx ON deal_submissions(promoted_deal_id)` will speed up the audit-trail queries that join submissions back to their promoted deals. **Risk: LOW** (additive index).

---

## Section C — Performance (LOW)

### C1. Composite index for the active-deals-by-project-tag query

`active_deals_with_listings` view filters: `is_active=true AND project_tag='green' AND (expires_at IS NULL OR expires_at > now())`. Today this uses partial indexes (`deals_active_expires_idx`) but doesn't have a composite that covers all three. At 100 rows, irrelevant. At 10,000 rows, the planner will appreciate it.

**Proposed index:**

```sql
CREATE INDEX deals_active_green_idx
  ON deals (project_tag, is_active, expires_at)
  WHERE is_active IS TRUE AND project_tag = 'green';
```

**Risk: LOW.** Defer until row count > 5000 — no current pain.

### C2. `auth.<function>()` re-evaluated per row

4 RLS policies hit this:
- `deals` — "Service role can do everything on deals"
- `deal_alerts` — "Service role can manage deal alerts"
- `deal_clicks` — "Service role can view deal clicks"
- `anchor_skus` — "Authenticated full access to anchor SKUs"

Fix is a one-liner per policy (wrap `auth.<function>()` in `(select auth.<function>())`). **Risk: LOW.** Defer — no perf pain today.

### C3. Multiple permissive policies on same role+action

Several tables (anchor_skus, deal_alerts, deals) have two SELECT policies for the same role. Postgres runs both and ORs the results. Cleaner is one combined policy. **Risk: LOW.** Defer — perf irrelevant at current scale.

---

## Section D — Materialized view in API

`deal_rankings` is a materialized view selectable by anon. This is fine if the data is non-sensitive (it's deal rankings — public by design), but the advisor flag is worth knowing about. **No action needed** unless the underlying refresh logic ever populates non-public data.

---

## Section E — Dead column candidates (HIGH RISK — NEVER DROP WITHOUT MATTHEW SIGN-OFF)

A casual scan of `deals` columns suggests these may be unused (need Code-side verification before dropping):

| Column | Used? | Notes |
|---|---|---|
| `deals.raw_text` | unclear | Stored at import time but no UI reads it. May be intentional for debugging. |
| `deals.unit` | unclear | Distinct from `discount_unit`. May be flower-weight unit ("g", "oz"). |
| `master_listings.cash_only` | unlikely | `accepts_credit` covers the inverse. |
| `master_listings.atm_onsite` | unclear | Could be a profile-page detail. |
| `master_listings.online_ordering` | unclear | Distinct from `delivery`. |

**Recommendation: do NOT drop any column in this round.** A column drop is irreversible without a backup. The cost of carrying 5 unused columns at this row count (105) is approximately zero. Defer to a future audit when these are explicitly retired in the app.

The proposals SQL leaves these as comments only.

---

## Section F — What's missing that would be nice

These aren't blockers but would help:

* **`deals.brand text`, `deals.weight_grams numeric`, `deals.mg_thc numeric`, `deals.count integer`** — ✅ **migration queued by Code at `sql/migrations/2026-04-22-add-deal-brand-weight-columns.sql` (commit `a1815f9`)**. NOT YET APPLIED to live DB (verified via `information_schema.columns` query). Apply alongside the orphan-listings + scrape-dedup-related migrations.
* **`deals.dedup_status text`** — proposed in Task 2 scrape strategy. Add when the ingest script lands.
* **`master_listings.leafly_slug text`** — proposed in Task 3 scraper spec for URL mapping.
* **A `deal_verifications` table** — to store the source-of-truth audit trail for each verified deal (which scraper run, what URL, what HTML hash). Useful when the scraper goes unattended.

These are forward-looking. Don't add until the consumer code is ready to read them.

---

## Recommended apply order

If Matthew wants to clear the highest-impact items in one pass:

1. **Apply orphan-listings migration FIRST** (already pending — `sql/migrations/2026-04-22-create-orphan-master-listings.sql`)
2. **Then apply the LOW_RISK section** of proposals SQL (RLS enables, function search_path fixes, unindexed FK index)
3. **Code-side change for license_number** (drop from anon-readable view if path 2 is chosen)
4. **Verify nothing broke in preview** before promoting RLS changes to production
5. **Defer MEDIUM_RISK** items (FKs on deals.listing_slug) until 24h after orphan-listings is verified working in production
6. **Do not apply HIGH_RISK** in this round

---

## Companion files

* `sql/migrations/2026-04-22-schema-hardening-proposals.sql` — concrete SQL for each recommendation, grouped by risk tier
* `sql/migrations/2026-04-22-create-orphan-master-listings.sql` — pre-requisite for §B1
