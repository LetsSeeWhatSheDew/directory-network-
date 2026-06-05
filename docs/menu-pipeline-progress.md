# Menu Baseline Pipeline — Progress Log

Branch: `feat/menu-baseline-pipeline`
Author: Code (Claude Opus 4.7, 1M context)
Started: 2026-06-04

## Goal
Build the missing **baseline** layer under PuffPrice's deal scraper: structured per-SKU menu data across 10 Central IL dispensaries, normalized so prices are comparable store-to-store, with a computed local market price band per canonical product. This is the foundation for Truth-in-Pricing, Deal Quality Score, and "Should I Wait."

## Reference data (consumed as-is from `reference-data/`)
| File | Use | Confidence |
|---|---|---|
| `dispensary_registry.json` | Seed `dispensaries` table (10 stores, IDFPR license-keyed where verified) | 6/10 license #s + 1 Bloomington Jane ID + 2 Dutchie slugs marked VERIFY |
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
- [ ] **Phase 5 — Normalization layer** (≥90% match rate target)
- [ ] **Phase 6 — Baselines + sanity gate**
- [ ] **Phase 7 — Tax engine extension + OTD + deal scoring**
- [ ] **Phase 8 — Scheduler + breakage detection**
- [ ] **Phase 9 (optional) — VERIFY backfill probes**

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

## Commit log
- `bcb5c6b` chore(reference-data): vendor Cowork-built reference data on pipeline branch
