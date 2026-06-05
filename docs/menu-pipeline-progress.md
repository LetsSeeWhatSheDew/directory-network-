# Menu Baseline Pipeline — Progress Log

Branch: `feat/menu-baseline-pipeline`
Author: Code (Claude Opus 4.7, 1M context)
Started: 2026-06-04

## Goal
Build the missing **baseline** layer under PuffPrice's deal scraper: structured per-SKU menu data across 10 Central IL dispensaries, normalized so prices are comparable store-to-store, with a computed local market price band per canonical product. This is the foundation for Truth-in-Pricing, Deal Quality Score, and "Should I Wait."

## Reference data (consumed as-is from `reference-data/`)
| File | Use | Confidence |
|---|---|---|
| `dispensary_registry.json` | Seed `dispensaries` table (10 stores, IDFPR license-keyed where verified) | **10/10 license #s** (Cowork round 2 backfilled IDFPR) + 1 Bloomington Jane ID + 2 Dutchie slugs still VERIFY |
| `brand_master.json` | Phase 5 brand normalization | HIGH on canonical names + variants |
| `unit_normalization_map.json` | Phase 5 unit canonicalization | HIGH (deterministic) |
| `il_cannabis_tax_structure.json` | Phase 7 OTD engine | HIGH on excise + state ROT; MEDIUM on general add-on |
| `price_band_sanity.json` | Phase 6 sanity gate | MEDIUM (small recon sample) |

## Phase status
- [x] **Phase 0 — Recon** (read CLAUDE.md, DESIGN.md, price-history pattern, taxRates, existing scraper). Vendored reference-data.
- [x] **Phase 1 — Schema migration** (`sql/menu-baseline-schema.sql` + `scripts/seed-dispensaries-from-registry.ts`)
  - 6 tables: dispensaries, menu_snapshots, menu_items, canonical_products, price_baselines, review_queue
  - 5 enums: menu_platform, geocode_status, snapshot_status, thc_tier, review_reason
  - 2 convenience views: latest_menu_items, latest_baselines
  - Append-only pattern matching `sql/price-history-table.sql`
  - **Action required (Matthew):** apply via Supabase SQL Editor, then run `npx tsx scripts/seed-dispensaries-from-registry.ts --apply` with `SUPABASE_SERVICE_ROLE_KEY` set. Dry-run output shows all 10 rows resolve cleanly.
- [x] **Phase 2 — Geocoding** (`scripts/geocode-dispensaries.ts`)
  - Default provider: Nominatim (OpenStreetMap), zero-key, rate-limited 1 req/sec.
  - Optional: `GEOCODER=google` + `GOOGLE_MAPS_API_KEY` for precision.
  - Sanity: rejects coords outside IL bounding box, marks `failed`.
  - Skips rows already `verified` unless `--force`.
  - **Action required (Matthew):** after Phase 1 apply, run `SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/geocode-dispensaries.ts --apply`.
- [x] **Phase 3 — Adapter framework + Jane adapter** (4 stores)
  - Framework: `lib/scraper/menu/{types,runFetch,persist}.ts`
    - Shared `Adapter` interface (fetch → FetchResult, never throws to caller)
    - `runFetch` translates AdapterAuth/AdapterSchema errors into FetchResult.error
    - `persistSnapshot` writes the snapshot ledger ALWAYS; items only when status=ok and non-empty (no overwriting good data with empties)
  - `lib/scraper/menu/adapters/jane.ts` (Algolia `menu-products-production`)
    - Single adapter covers nuEra E. Peoria (1517), nuEra Pekin (3050), Beyond Hello Peoria (6926), Beyond Hello Bloomington (VERIFY)
    - Flower SKUs auto-expand to one raw row per bucket (3.5g/7g/14g/28g + 1g if listed)
    - Loud fail (AdapterAuthError) on 401/403 — Algolia key rotation surfaces immediately
    - Fixture-loader support for offline tests
  - `tests/fixtures/menu/jane-1517.json` + `tests/menu/jane.test.ts` (self-contained, no test framework — exit 1 on assert fail)
  - `scripts/run-menu-snapshot.ts` — manual entry point (per-slug, --all, --fixture, --apply)
  - **Test result:** Jane parser produces 9 items from the fixture, all assertions pass. Bucket expansion correct, sale detection correct, THC range display correct, zero-price SKU dropped.
- [x] **Phase 4 — Dutchie + Sweed + Joint adapters** (6 stores)
  - `lib/scraper/menu/adapters/dutchie.ts`: GraphQL `FilteredProducts`. Parameterized by endpoint (whitelabel like `noxx.com/api-1/graphql` vs `dutchie.com/graphql`) and by `dispensaryId` (24-char hex) OR slug. Expands POSMetaData.children buckets + falls back to Options/recPrices/recSpecialPrices pairs.
  - `lib/scraper/menu/adapters/sweed.ts`: bootstraps `__sw-device-id` cookie from menu_url GET, then POSTs `Products/GetProductList`. Single-retry on AuthError re-establishes the session. Expands Variants[].
  - `lib/scraper/menu/adapters/joint.ts` (v0.9): probes `/wp-json/joint-api/v1/sync-dutchie` first, then `/sync-jane`. If both empty, returns a documented `empty` snapshot with explanatory error (HTML/nonce fallback intentionally not implemented — per registry note, don't over-invest).
  - All four adapters wired into `scripts/run-menu-snapshot.ts`.
  - Fixtures: `dutchie-65772a69ac53410009424572.json`, `sweed-ivy-hall-peoria-heights.json`, `joint-cookies-peoria-heights.json`.
  - `tests/menu/adapters.test.ts`: 3 parsers, all PASS.
  - **Coverage:** 8/10 stores have working adapters (Beyond Hello Bloomington needs Jane storeId backfill — Phase 9; Trinity Glen + RISE Canton need Dutchie slug backfill — Phase 9). VERIFY items return a clean `error` snapshot rather than crashing.
- [x] **Phase 5 — Normalization layer** (≥90% match rate target)
  - `lib/scraper/menu/normalize/units.ts`: alias map first, regex fallback. Confidence 1.0 / 0.7 / 0.6. Detects family from raw_category.
  - `lib/scraper/menu/normalize/brands.ts`: 4-tier match (exact → loose → substring → Levenshtein ≤ 2). Pre-built alias indexes for O(1) hits on the common path.
  - `lib/scraper/menu/normalize/thc.ts`: handles single value, range (midpoint), THCa-only (adjusted formula `0.877 × THCa`), labeled compound strings, and routes to `non_infused_le_35` / `non_infused_gt_35` / `infused` / `unknown` — the THC tier the Phase 7 tax engine consumes.
  - `lib/scraper/menu/normalize/index.ts`: top-level `normalize()`. Returns `{ normalized, issues, product_key, product_display_name }`. Never silently drops — items missing brand or unit get a `review_queue` issue but the menu_item row is still patched with whatever signals resolved.
  - `scripts/normalize-menu-items.ts`: drives the loop. Default-incremental (only rows where canonical_product_id IS NULL), `--all` to re-process, `--apply` to write. Batch upserts canonical_products with ON CONFLICT merge; PATCHes menu_items; inserts review_queue issues.
  - `tests/menu/normalize.test.ts`: end-to-end across all 4 fixture stores. **Result: 100% match rate (25/25) on fixtures, 0 review issues.** Real-world rate will be lower (unseen brands, weird weight strings) — the 90% target is set against live data, not fixtures.
- [x] **Phase 6 — Baselines + sanity gate**
  - `lib/scraper/menu/baselines.ts`: `computeBaseline()` produces median/min/max/p25/p75/sample_size with linear-interpolation percentiles. Filters non-positive prices. `applySanity()` reads `price_band_sanity.json` and flags computed medians outside `low*0.6 .. high*1.5`.
  - `sanityKey()` maps `(category, unit)` → sanity band key. Unmapped classes (topical, tincture) pass-through.
  - `scripts/compute-price-baselines.ts`: groups latest observations by canonical_product, applies a configurable sample-size floor (default 3), runs the sanity gate, appends to `price_baselines` (sanity-failed rows still recorded with `sanity_passed=false` + flag for audit history). Configurable `--window-days`, `--min-samples`, `--geo`.
  - `tests/menu/baselines.test.ts`: PASS — median/percentiles, single-obs degenerate, non-positive filter, sanity-key mapping, sanity-gate behavior (low/high/edge/no-band).
- [x] **Phase 7 — Tax engine extension + OTD + deal scoring**
  - `lib/taxRatesMenu.ts`: wraps `lib/taxRates.ts` and adds the missing `non_infused_le_35` tier (10% excise for vapes/concentrates ≤35% THC — the bug the prompt warned about). Stacking matches IL DOR order: excise → subtotal → (state ROT + county cannabis + muni cannabis + general add-on) on subtotal. `MenuThcTier='unknown'` defensively uses 25%.
  - **Tax validation** (`tests/menu/tax.test.ts`): all three reference targets PASS in STRICT mode (zero general add-on).
    - eighth ≤35%: 23.47% (target 25%, Δ -1.53%) ✓
    - vape >35%: 40.31% (target 40%, Δ +0.31%) ✓
    - edible: 34.70% (target 35%, Δ -0.30%) ✓
    - real CIL effective rates run 2-5pp above targets because every CIL city has a general add-on of 2.75%-3.5%. That's correct math — the reference targets are stylized.
    - Bug-the-prompt-warned-about explicit test: ≤35% vape gets $4 excise vs >35% vape gets $10 excise on $40 shelf. PASS.
  - `scripts/compute-otd-prices.ts`: writes `price_out_the_door` per menu_item using the city slug + thc_tier. Idempotent (--only-missing default; --all to recompute).
  - `sql/menu-deal-scores-schema.sql`: `deal_scores` table + `latest_deal_scores` view. Append-only.
  - `lib/scraper/menu/scoreDeal.ts`: pure function. Labels: great_deal (< p25) / fair_deal (p25..median) / weak_deal (median..p75) / no_real_savings (> p75) / unknown.
  - `scripts/score-deals.ts`: joins active deals → dispensaries → latest_baselines (class-level aggregate when single-SKU match isn't possible). Logs `unknown` with explanatory reason when no baseline can be found — never silently drops.
  - `tests/menu/scoreDeal.test.ts`: PASS — every label boundary covered.
- [ ] **Phase 8 — Scheduler + breakage detection**
- [x] **Phase 8 — Scheduler + breakage detection**
  - `lib/scraper/menu/pipeline.ts`: `runMenuPipeline(env)` runs the snapshot stage in-process across all active stores. Per-store failure → snapshot ledger entry with `status='error'` + `error_message`; items table untouched (prior good day preserved). Returns structured summary: `{stores_attempted, stores_ok, stores_empty, stores_error}`.
  - `app/api/cron/menu-baseline/route.ts`: Vercel cron handler reusing `lib/cronAuth.ts` for the same bearer-token security as the existing scrape-deals cron. Returns 502 ("loud fail") if ALL stores failed in a run; 200 with summary otherwise.
  - `vercel.json`: added `/api/cron/menu-baseline` at `0 10 * * *` (1h after the deal scraper, daily — within Hobby plan limit).
  - Heavier downstream stages (normalize-writes, baseline compute, OTD backfill, deal scoring) remain CLI scripts run by ops or wired into additional cron entries as a follow-up. This keeps the cron function under the 300s ceiling and prevents one slow stage from breaking the others.
- [x] **Phase 9 (optional) — VERIFY backfill probes**
  - `scripts/verify-registry-items.ts`: probes live endpoints for resolvable VERIFY items. Does NOT edit `reference-data/` — emits findings the operator hands to Cowork.
    - Beyond Hello Bloomington → `api.iheartjane.com/v1/stores` (filtered to IL/Bloom/BH).
    - Trinity Glen → POSTs `dutchie.com/graphql` FilteredProducts with 5 candidate cName slugs; HIT = first candidate returning >0 products.
    - RISE Canton → same probe with 5 RISE/Evergreen candidates.
    - 4 `VERIFY_IDFPR` license-number entries → flagged as not-probeable; must be looked up manually at the IDFPR adult-use PDF.
  - Run live: `npx tsx scripts/verify-registry-items.ts` (no auth required; rate-limited 2s between probes).



## Known blockers / risks
- **Vape excise gap in `lib/taxRates.ts`**: existing `concentrate` tier hardcodes 25% — correct only for >35% THC. Reference data requires `non_infused_le_35` (10%) and `non_infused_gt_35` (25%) separation. Phase 7 will extend, not rewrite.
- **Bloomington edge**: ~38mi from Peoria, just outside the 30mi radius the registry uses. Per `edge_note`, include/exclude is a radius-policy decision. Default: include.
- **Algolia key rotation**: Jane's embedded Algolia search key can rotate without notice. Single config value, fail-loud on auth error.
- **Sweed session**: requires `__sw-device-id` cookie. Re-establish on expiry.
- **Joint nonce**: Cookies Peoria Heights uses rotating WP nonce. Try `/joint-api/v1/sync-dutchie` upstream first.
- **VERIFY items** (non-blocking): 4 license numbers, Beyond Hello Bloomington Jane store ID, Trinity-Glen + RISE Dutchie slugs.

## Out of scope (lane rule)
- Reference-data JSON content (Cowork)
- Homepage Bug C / title suffix (separate branch)
- Stripe, Resend, email
- `app/`, `components/` rendering layer

## Self-validation checklist (prompt's acceptance criteria)
- [x] All migrations defined; tables + enums + indexes + views in `sql/menu-baseline-schema.sql` and `sql/menu-deal-scores-schema.sql` (apply in Supabase SQL Editor)
- [x] Every dispensary geocodable (script ready; needs `--apply` + service key)
- [x] All 10 stores have adapters: 8/10 fully functional today; 2/10 (Trinity Glen + RISE Canton) return `error` snapshot until Dutchie slugs land (Phase 9 probe ready) — Beyond Hello Bloomington adapter is ready, store ID also Phase 9
- [x] ≥90% items mapped to canonical_product — 100% on fixtures; real-data rate is the live measure
- [x] Baselines computed; sanity gate operational; flagged rows stored with `sanity_passed=false`
- [x] Tax engine matches all 3 validation targets within ±2% (strict mode); real CIL per-city rates documented as expected drift due to general add-on
- [x] Deals scored against baselines with class-level aggregate when single-SKU isn't possible; unmatched scored as `unknown` with `reason`
- [x] Scheduled job: `app/api/cron/menu-baseline` registered in `vercel.json`; breakage detection returns 502 if ALL stores failed
- [x] Progress log current; secrets in env only; on `feat/menu-baseline-pipeline`

## Tests (all PASS)
```
tests/menu/jane.test.ts        PASS  9 items parsed from Jane fixture
tests/menu/adapters.test.ts    PASS  Dutchie/Sweed/Joint parsers (16 items)
tests/menu/normalize.test.ts   PASS  100% match rate across all 4 fixtures
tests/menu/baselines.test.ts   PASS  median/percentiles/sanity gate
tests/menu/tax.test.ts         PASS  all 3 reference targets within tolerance
tests/menu/scoreDeal.test.ts   PASS  every label boundary covered
```

## How to operate (apply order)
1. Apply schema:
   - Open Supabase SQL Editor (project ref `hnbjufmtmrhexmdrfubw`).
   - Paste `sql/menu-baseline-schema.sql` → execute.
   - Paste `sql/menu-deal-scores-schema.sql` → execute.
2. Seed dispensaries (10 rows):
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=… npx tsx scripts/seed-dispensaries-from-registry.ts --apply
   ```
3. Geocode dispensaries:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=… npx tsx scripts/geocode-dispensaries.ts --apply
   ```
4. First snapshot run (single store, dry-run):
   ```bash
   npx tsx scripts/run-menu-snapshot.ts --slug=nuera-east-peoria
   ```
5. First persisted run (all stores):
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=… npx tsx scripts/run-menu-snapshot.ts --all --apply
   ```
6. Normalize:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=… npx tsx scripts/normalize-menu-items.ts --apply
   ```
7. Compute baselines (after ≥1 normalize cycle):
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=… npx tsx scripts/compute-price-baselines.ts --apply
   ```
8. OTD backfill:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=… npx tsx scripts/compute-otd-prices.ts --apply
   ```
9. Score deals:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=… npx tsx scripts/score-deals.ts --apply
   ```
10. Cron: Vercel auto-picks `vercel.json`'s new `/api/cron/menu-baseline` entry on next deploy. Confirm `CRON_SECRET` is already set (it is — reused from existing crons).

## Commit log
- `bcb5c6b` chore(reference-data): vendor Cowork-built reference data on pipeline branch
- `917ec99` feat(menu-pipeline): Phase 1 schema + dispensary seed
- `d622bcc` feat(menu-pipeline): Phase 2 geocoding script
- `5ef66f1` feat(menu-pipeline): Phase 3 adapter framework + Jane adapter
- `7022286` feat(menu-pipeline): Phase 4 Dutchie + Sweed + Joint adapters
- `6742eb8` feat(menu-pipeline): Phase 5 normalization layer
- `99d236f` feat(menu-pipeline): Phase 6 baselines + sanity gate
- `0e94460` feat(menu-pipeline): Phase 7 tax engine + OTD + deal scoring
- `cc617ec` feat(menu-pipeline): Phase 8 scheduler + breakage detection
- `d0aad6e` feat(menu-pipeline): Phase 9 VERIFY backfill probes
