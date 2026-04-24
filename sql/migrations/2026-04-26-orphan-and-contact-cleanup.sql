-- 2026-04-26 orphan + contact cleanup — APPLIED
-- Applied via Supabase REST PATCH; Supabase MCP is read-only in this workspace.
--
-- Three changes, all wrapped in one transaction in this file for the
-- audit trail:
--   1. the-dispensary-champaign — apply chain-shared contact data
--      (Cowork-verified in docs/missing-contact-research-20260426.md;
--      Code's area-code guard is overridden intentionally for this row).
--   2. consume-cannabis-champaign — deactivate + clear incorrect
--      long_description (the April 25 draft wrongly attributed a
--      Cloud9 Champaign address to the Consume chain).
--   3. ascend-springfield — deactivate + clear stub description
--      (confirmed duplicate of ascend-cannabis-horizon-drive per
--      docs/central-il-orphan-review-20260425.md addendum).

BEGIN;

-- 1. the-dispensary-champaign — contact backfill (chain-shared number)
UPDATE master_listings
SET phone      = '(815) 208-7701',
    website    = 'https://www.thedispensaryfulton.com/',
    updated_at = now()
WHERE slug = 'the-dispensary-champaign';

-- 2. consume-cannabis-champaign — deactivate + clear wrong-identity description
UPDATE master_listings
SET is_active         = false,
    long_description  = '',
    short_description = '',
    updated_at        = now()
WHERE slug = 'consume-cannabis-champaign';

-- 3. ascend-springfield — deactivate + clear duplicate stub
UPDATE master_listings
SET is_active         = false,
    long_description  = '',
    short_description = '',
    updated_at        = now()
WHERE slug = 'ascend-springfield';

COMMIT;
