# Post-scrape review — 20-min checklist for Matthew (2026-04-22)

**Run this AFTER:** Chrome's scrape JSON has landed AND Code's ingest dry-run has populated `deal_submissions`.

**Goal:** decide between `--apply` (promote with manual review), `--apply --auto-approve` (promote without manual review), or `abort` (the scrape data is bad — don't touch `deals`).

**Time budget:** 20 minutes. If you find yourself spending more than 30 minutes, abort and ask Cowork to dig into the problem before re-running.

---

## Step 1 — Read the dry-run stdout (3 min)

Code's ingest script runs in dry-run mode by default and prints to stdout:

```
[ingest] Read JSON from /Users/matthew/Desktop/DN-Research/2026-04-22-scrape/ALL-DEALS-2026-04-22.json
[ingest] Total candidates: 167
[ingest] Sanity-rejected: 8
  - 4x sanity_price_too_high
  - 2x sanity_ppg_too_low
  - 1x no_title
  - 1x sanity_price_too_low
[ingest] Strict-dedup skipped: 23
[ingest] Fuzzy-dedup flagged: 12
[ingest] Apr 14 UPDATE-in-place candidates: 31
[ingest] Net-new submissions: 93
[ingest] DRY RUN — no rows written. Re-run with --apply to insert.
```

**What to check:**
- Total candidates is in the 100-300 range (15 dispensaries × 5-15 deals each)
- Sanity rejections < 10% of total
- Fuzzy-flagged < 20% of total
- The Apr 14 UPDATE-in-place number isn't suspiciously high (>75% means the scrape didn't find anything new — could be a scraper config issue)

If any of these are off → fix the scraper or abort. Don't move to Step 2.

---

## Step 2 — Run the 5 collision-detection queries (8 min)

Open Supabase SQL editor → paste contents of `sql/queries/scrape-collision-detection.sql`. Run all 5 queries.

### Q1: Submissions per dispensary

Expected: 15 rows (one per Tier-1 dispensary), each with `total_submissions` between 3 and 25.

**Red flags:**
- Any dispensary with 0 or 1 submissions → scraper missed that store
- Any dispensary with 50+ submissions → scraper double-counted (recurring days as separate deals?)
- `<no-slug>` rows present → scraper didn't resolve a dispensary slug, the JSON is missing the link

**Action:** if any red flag, abort. The fix is in Code's ingest mapping or Chrome's scraper output.

### Q2: Strict-dedup rejections (last 7 days)

Expected: 0 rows OR a small number of rows that all have `duplicate_count = 2` (one fresh submission + one stale from a prior run).

**Red flags:**
- Any row with `duplicate_count` > 3 → ingest dedup logic is broken
- The total number of duplicate rows > 50 → repeated runs without dedup

**Action:** if red flag, abort and tell Code to inspect the `INSERT` path.

### Q3: Apr 14 UPDATE-in-place candidates

Expected: 20-50 rows (matches Code's stdout estimate).

**Read the `price_delta_pct` column.** Any row with `|price_delta_pct| > 10`:
- Open the `submission_id`'s `source_url` in a browser
- Compare the scrape's `submission_sale_price` to what's actually on the dispensary's site
- If the scrape is right → reject the existing deal manually before approving (price changed)
- If the scrape is wrong → reject this submission with reason `wrong_price_extracted`

**Action:** if any rows have `|price_delta_pct| > 10`, do NOT `--auto-approve`. Run `--apply` only and review the price-conflict rows manually before promoting.

### Q4: Brand coverage delta

Expected: 0-5 brands.

For each new brand:
- Quick web search ("BRAND illinois cannabis") to confirm it's a real licensed brand
- If real, note it in `docs/anchor-skus-pending.md` (create file if needed) for the next anchor SKU expansion

**Action:** brand-coverage findings are informational, not blocking. Move on.

### Q5: PPG outliers

Expected: 0-10 rows.

For each row marked `PPG_TOO_LOW` or `PPG_TOO_HIGH`:
- Open `source_url`
- Check if the deal title or category was misparsed (e.g., scraper grabbed "$25" from a 1g vape but flagged it as flower)
- If misparsed → reject the submission with reason `unit_mismatch`
- If correctly parsed but unusual → keep but flag for `dedup_status='price_conflict'` and approve only after a manual lookup

**Action:** if more than 10 rows here, the scraper's price-extraction logic is unreliable. Abort and report to Code.

---

## Step 3 — Spot-check 10 random submissions (5 min)

```sql
SELECT id, dispensary_slug, deal_title, sale_price_usd, source_url
FROM public.deal_submissions
WHERE submitted_at > now() - interval '24 hours'
  AND approved = false
  AND rejected_at IS NULL
ORDER BY random()
LIMIT 10;
```

For each row:
- Open `source_url`
- Spend 30 seconds verifying the deal exists and the price matches

If 9 of 10 check out → proceed.
If 7-8 of 10 check out → proceed but no `--auto-approve`. Manual review per row.
If <7 of 10 check out → abort. Scraper accuracy is too low.

---

## Step 4 — Decide (2 min)

| Outcome | Decision | Command |
|---|---|---|
| All checks pass, scrape accurate, no price conflicts | Auto-approve | `npx tsx scripts/ingest-deal-submissions.ts --apply --auto-approve` |
| Mostly clean but 1-5 price conflicts found | Manual approve | `npx tsx scripts/ingest-deal-submissions.ts --apply` then approve individual submissions |
| 10+ price conflicts OR > 25% rejected OR scraper accuracy < 70% | Abort | Report problems to Code via a new handoff in `docs/handoffs/` |

---

## Step 5 — Watch the live site (2 min)

After promotion runs, open `puffprice.com` in incognito and:

1. Confirm deal count rises (homepage hero + `/deals/all` count)
2. Click 3 random deal cards → confirm GO HERE → 200 OK on listing page
3. Check `/about/index` → PuffPrice Index recompute should reflect new data within 5 min (cache TTL)

If anything looks broken: `git revert` the deal table changes is hard (UPDATEs can't be reverted from migrations). Best recovery is to run a corrective UPDATE based on the audit trail in `deal_submissions.promoted_deal_id`.

---

## Recovery: how to undo a bad promotion

If you've run `--apply --auto-approve` and the deals look wrong:

```sql
-- Mark every deal that was just promoted as inactive
UPDATE deals
SET is_active = false, status_reason = 'manual', updated_at = now()
WHERE id IN (
  SELECT promoted_deal_id
  FROM deal_submissions
  WHERE submitted_at > now() - interval '2 hours'
    AND approved = true
)
AND verified_at > now() - interval '2 hours';
```

This deactivates only the freshly-promoted deals, leaves the Apr 14 imports alone (because their `verified_at` is older).

---

## Companion files

- `docs/ops/scrape-dedup-strategy-20260422.md` — the rules
- `sql/queries/scrape-collision-detection.sql` — the 5 diagnostic queries
- `docs/handoffs/path-a-scraper-spec-20260422.md` — the scraper itself
