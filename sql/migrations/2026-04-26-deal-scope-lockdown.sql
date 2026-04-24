-- 2026-04-26 deal scope lockdown — APPLIED via REST PATCH
-- Applied via REST; Supabase MCP is read-only in this workspace.
--
-- Policy change: Matthew locked a decision that PuffPrice scrapes only
-- direct dispensary websites and social media going forward. Leafly,
-- Weedmaps, iHeartJane, and Dutchie are competitor aggregators and no
-- longer qualify as sources. Scope is also narrowed to Central IL only
-- at the deal layer (not just the display layer).
--
-- Before this migration: 53 active deals (30 leafly, 13 weedmaps, 10 website).
-- After this migration:   2 active deals (both Ivy Hall Peoria, source=website).

BEGIN;

-- 1. Deactivate every aggregator-sourced deal. Preserve rows for audit trail.
UPDATE deals
SET is_active     = false,
    status_reason = 'aggregator_source_deprecated',
    updated_at    = now()
WHERE is_active = true
  AND source IN ('leafly', 'weedmaps');

-- 2. Deactivate any remaining non-CIL deal (non-aggregator sources where
--    the associated listing is outside Central IL). Preserve rows.
WITH cil_listings AS (
  SELECT slug
  FROM master_listings
  WHERE is_active = true
    AND project_tag = 'green'
    AND state = 'IL'
    AND lower(city) IN (
      'peoria','east peoria','pekin','bartonville','morton','washington',
      'normal','bloomington','champaign','urbana','springfield','peoria heights'
    )
)
UPDATE deals d
SET is_active     = false,
    status_reason = 'non_cil_scope_deactivation',
    updated_at    = now()
WHERE d.is_active = true
  AND d.listing_slug NOT IN (SELECT slug FROM cil_listings);

COMMIT;

-- Verification:
-- SELECT source, COUNT(*) FROM deals WHERE is_active = true GROUP BY source;
-- Expected: { website: 2 }. All other sources zero until the direct-source
-- CIL scraper (Phase 5) starts writing new rows.
