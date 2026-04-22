# Scrape dedup + data quality strategy (2026-04-22)

**Audience:** Code (writing the ingest script) + Matthew (approving promotion runs).
**Trigger:** Chrome's parallel scrape of 15 IL dispensaries lands JSON at `~/Desktop/DN-Research/2026-04-22-scrape/ALL-DEALS-2026-04-22.json`. Code's ingest reads that JSON, stages rows in `deal_submissions`, and a separate promote step migrates approved submissions to `deals`.

**Goal of this doc:** define the rules so the ingest doesn't (a) double-write deals that already exist, (b) silently overwrite a verified deal with a sketchy scrape, or (c) trample the Apr 14 import that's currently the entire active feed.

---

## 1. Two-phase pipeline

```
JSON file → INSERT into deal_submissions (with computed dedup key + collision flag)
          → diagnostic queries (Matthew runs) → APPROVE or REJECT in submissions
          → promote: UPDATE-in-place existing deal OR INSERT new deal in deals
```

Never write directly to `deals` from the scraper. `deal_submissions` is the audit trail and the human-in-the-loop checkpoint.

---

## 2. Dedup keys

### Strict dedup (auto-flag, do not insert)

A submission is a strict duplicate if there's already a row in `deal_submissions` from the last 7 days with the same:

```
(dispensary_slug, lower(trim(deal_title)), sale_price_usd)
```

This catches: same scraper running twice in the same week, two different scrapers picking up the same Leafly card, a manual submission of an already-scraped deal.

Implementation: `INSERT ... ON CONFLICT DO NOTHING` won't work without a unique index. The ingest script should pre-check before insert:

```sql
SELECT 1 FROM deal_submissions
WHERE dispensary_slug = $1
  AND lower(trim(deal_title)) = lower(trim($2))
  AND sale_price_usd IS NOT DISTINCT FROM $3
  AND submitted_at > now() - interval '7 days'
LIMIT 1;
```

If the row exists, log `[dedup-strict]` and skip. Do NOT insert a duplicate submission row.

### Fuzzy dedup (auto-flag, allow insert with warning)

Same dispensary + same brand + same `weight_grams` (or `mg_thc` / `count`) within 7 days = likely a variant title for the same deal. Examples:

* "Cresco Lab Notes — 3.5g — $25" vs. "Cresco LabNotes 1/8oz $25 sale"
* "GTI Rythm $40 1g vape" vs. "Rythm 1g distillate $40"

Implementation: don't block the insert, but set a flag column `dedup_status='fuzzy_match'` on the new row and write the matched submission's id into `notes`.

> **Schema add required for this** (propose for Matthew's approval, included in Task 5 hardening migration): add a `dedup_status text` column to `deal_submissions` with values: `null` (clean), `'strict_match'` (would block), `'fuzzy_match'` (allow with review), `'first_of_kind'` (no prior match found).

### Cross-table dedup (against currently-active `deals`)

A submission whose `(dispensary_slug, lower(trim(deal_title)))` already exists in an `is_active=true` row of `deals` is a **collision with the existing feed**. This is the Apr 14 import collision case — half of what the scraper picks up will already be there as `imported_not_verified`.

The collision is good news, not bad: the scraper just **verified** an unverified import. Promotion logic (below) handles this as `UPDATE-in-place`.

---

## 3. Trust hierarchy

Submitter trust determines auto-approval default:

| `submitter_email` pattern | Default state | Notes |
|---|---|---|
| `scraper@puffprice.com` | `verified=true, approved=false` | Auto-flagged as machine-verified, requires Matthew or `--auto-approve` flag |
| `*@<dispensary-domain>` matching the listing's `website` host | `verified=false, approved=false` | High signal, requires manual review (could be marketing intern or real owner) |
| Random consumer email | `verified=false, approved=false` | Low signal, requires manual review |
| Empty / null | Reject before insert | Don't store junk submissions |

When Code's ingest runs with `--auto-approve` (or has the flag baked in for the scraper bot), submissions from `scraper@puffprice.com` go straight to promotion. All other submitter types stay in the queue.

> The ingest script should NEVER auto-approve a submission that has `dedup_status='fuzzy_match'`. Matthew always reviews fuzzy.

---

## 4. Apr 14 collision: UPDATE-in-place vs. INSERT-new

**Recommendation: UPDATE-in-place** (Option A from the brief).

When a scrape submission collides with an existing `deals` row that has `status_reason='imported_not_verified'`:

```sql
UPDATE deals
SET
  -- promote the import to verified
  status_reason = NULL,
  verified_at = now(),
  verified_by = 'scraper@puffprice.com',
  source = COALESCE(NULLIF($source_url, ''), source),
  -- refresh pricing fields if the scrape has them
  original_price = COALESCE($regular_price_usd, original_price),
  sale_price = COALESCE($sale_price_usd, sale_price),
  price_per_gram = COALESCE($ppg_computed, price_per_gram),
  expires_at = COALESCE($end_date::timestamptz, expires_at),
  description = COALESCE(NULLIF($deal_description, ''), description),
  raw_text = COALESCE(NULLIF($raw_text, ''), raw_text),
  updated_at = now()
WHERE id = $existing_deal_id
RETURNING id;
```

Then write the submission row's `promoted_deal_id` to that `deals.id` so the audit trail is complete.

**Why not Option B (INSERT-new + deactivate-old)?**

* Breaks the existing `/deal/{id}` URL — old URL 404s, new URL has no SEO history
* Orphans any `deal_clicks` rows that referenced the old `id`
* Loses the historical `created_at` (the deal has been on the site since Apr 14, that's real freshness data)

Option A preserves the URL, the click history, and the freshness window while doing exactly what the scraper is supposed to do: **verify** the deal.

### Edge case: pricing diverges materially

If the scraped `sale_price_usd` differs from the existing `deals.sale_price` by more than 10% (after discount math), don't auto-update. Flag the submission as `dedup_status='price_conflict'` and require manual review. A 30% drop or jump usually means the scraper grabbed the wrong row OR the dispensary genuinely changed the deal — Matthew has to look.

### Edge case: scraper says deal expired

If the scraped `end_date` is in the past (or the scraper logged "deal not found" for a previously-active title), and the existing deal is `is_active=true` with `status_reason='imported_not_verified'`:

```sql
UPDATE deals
SET is_active = false,
    status_reason = 'expired',
    updated_at = now()
WHERE id = $existing_deal_id;
```

This is the natural promotion path: scraper verifies the deal is gone, we deactivate.

---

## 5. Sanity guards (auto-reject before insert)

Reject (with `rejected_at`, `rejected_reason`) any submission where:

| Guard | Reason string |
|---|---|
| `sale_price_usd < 2` (improbable for any cannabis product except a single pre-roll) | `sanity_price_too_low` |
| `sale_price_usd > 500` | `sanity_price_too_high` |
| `weight_grams IS NOT NULL AND price_per_gram_computed < 2` | `sanity_ppg_too_low` (likely unit mix-up — eighth at $3? probably 1g at $24) |
| `weight_grams IS NOT NULL AND price_per_gram_computed > 50` | `sanity_ppg_too_high` (likely premium concentrate flagged as flower) |
| `dispensary_slug IS NULL AND dispensary_name_freetext IS NULL` | `no_dispensary` |
| `deal_title IS NULL OR length(trim(deal_title)) < 3` | `no_title` |

These rejections still write a row (so the bad submissions are auditable) but with `approved=false, rejected_at=now()`.

---

## 6. Brand normalization

The scraper output likely uses canonical brand names ("Cresco", "GTI", "Verano"). The `anchor_skus` table is the canonical brand list (54 rows today). On insert, the ingest should:

1. `lower(trim(brand))`
2. Look up against `anchor_skus.brand_normalized` for a match
3. If found, set `brand` to the canonical `anchor_skus.brand` value
4. If not found, accept the new brand but flag it for the brand-coverage delta query (see `scrape-collision-detection.sql` query 4)

This keeps the brand vocabulary clean as the dataset grows.

---

## 7. What success looks like after promotion

* Active deal count rises from 46 to ~80-150 (depending on scrape yield)
* `imported_not_verified` count drops materially (Apr 14 imports getting verified)
* The 15 Tier-1 dispensaries each have 3-8 active deals (currently averaging 2-3)
* `verified_at` is populated on >75% of active deals
* Brand coverage on `deals.brand` jumps to >70% (currently effectively zero — `deals` table has no brand column today, see Task 5 schema audit)
* No orphan `/deal/{id}` 404s in the wild

---

## 8. Open questions for Matthew

1. **Do we need a `brand` column on `deals`?** Today only `deal_submissions.brand` exists. If we want to surface brand on deal cards, the promote step needs somewhere to write it. Recommend adding `deals.brand text` and `deals.weight_grams numeric` (Task 5 hardening proposal).
2. **Auto-approve scraper submissions on first run?** Recommended NO for the first run — let Matthew eyeball 50-200 rows manually. Auto-approve once we've seen the scraper output is consistent (probably run 3-4).
3. **What's the cadence?** Daily at 03:30 CDT (matches the Path A scraper spec). Or weekly to start, then daily once trust is built.

---

## 9. Companion files

* `sql/queries/scrape-collision-detection.sql` — 5 diagnostic queries to run after dry-run
* `docs/handoffs/2026-04-22-post-scrape-matthew-review.md` — 20-min checklist for Matthew after Code's dry-run
* `docs/handoffs/path-a-scraper-spec-20260422.md` — the upstream scraper spec
