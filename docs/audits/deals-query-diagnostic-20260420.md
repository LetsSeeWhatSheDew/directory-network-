# Deals Query Diagnostic — April 20, 2026

## Question

NOXX East Peoria's page shows no deals. Root cause?

## Findings

### Deals Table Schema

Columns: id, listing_slug, project_tag, title, description, category, discount_type, discount_value, discount_unit, original_price, sale_price, unit, price_per_gram, is_recurring, recurring_days, starts_at, expires_at, is_active, source, source_url, raw_text, created_at, updated_at, verified_at, verified_by

FK pattern: listing_slug (TEXT) — NOT dispensary_id (uuid). Confirmed by running dispensary_id query which returned error: "column deals.dispensary_id does not exist."

### NOXX master_listings row

id: c7944a46-a38f-459c-9954-bee8e1f0d09e
slug: noxx-east-peoria
name: NOXX East Peoria
city: East Peoria

### NOXX deals query result

Query: deals?listing_slug=eq.noxx-east-peoria
Result: [] — 0 rows.

## Conclusion

Root Cause: **Hypothesis A — NOXX genuinely has no deals in the deals table.**

The query is correct. The FK is listing_slug. NOXX has 0 deal rows.

## Code Action (Task 2)

SKIP this task. The empty-state is correct behavior.

Verify the empty-state renders cleanly on /l/noxx-east-peoria.

Live check confirms: the page renders Hero, Hours, About, Related Dispensaries — but no deals card. This is correct (conditional render when deals.length > 0).

## All Deals Distribution (56 total)

| listing_slug | count |
|---|---|
| altius-dispensary-carol-stream | 6 |
| nuera-east-peoria | 6 |
| zen-leaf-naperville | 4 |
| seven-point-danville | 4 |
| nuera-aurora | 4 |
| nuera-champaign | 4 |
| star-buds-westmont | 4 |
| natures-treatment-galesburg | 3 |
| prairie-cannabis-naperville | 3 |
| terrace-cannabis-moline | 3 |
| hi5-dispensary-crestwood | 2 |
| high-haven-elgin | 2 |
| ivy-hall-peoria | 2 |
| natures-treatment-milan | 2 |
| bisa-lina-carol-stream | 1 |
| bisa-lina-joliet | 1 |
| cookies-chicago | 1 |
| curaleaf-morris | 1 |
| mood-shine-chicago-heights | 1 |
| perception-cannabis-chicago | 1 |
| zen-leaf-aurora | 1 |

NOXX East Peoria: 0 deals (correct — no row needed to fix)
