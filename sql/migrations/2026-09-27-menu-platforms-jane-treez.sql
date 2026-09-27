-- 2026-09-27-menu-platforms-jane-treez.sql
-- ============================================================================
-- Menu prices: two new menu readers (lib/scraper/menuCapture.ts).
-- Written by Code, NOT applied. Matthew reviews and runs it.
--
--   jane   nuEra (East Peoria, Champaign, Pekin, Urbana) and High Haven Normal:
--          the Jane menu's own Algolia product search.
--   treez  Trinity on Glen / Trinity on University: server-rendered HTML
--          product cards on trinitydispensaries.com.
--
-- menu_snapshots.platform and dispensaries.menu_platform use the
-- menu_platform enum, which the 2026-09-25 pre-flight showed as
-- dutchie / sweed / joint. Until these two values exist, --apply prints
--   "menu_platform has no 'jane' value yet — apply sql/migrations/…"
-- for those stores and writes nothing for them (other stores are unaffected).
--
-- Safe to re-run (IF NOT EXISTS). ALTER TYPE … ADD VALUE should run on its
-- own, outside an explicit BEGIN/COMMIT block.
-- ============================================================================

-- 0. Pre-flight (read-only): what the enum has today.
-- SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
--  WHERE t.typname = 'menu_platform' ORDER BY e.enumsortorder;

ALTER TYPE menu_platform ADD VALUE IF NOT EXISTS 'jane';
ALTER TYPE menu_platform ADD VALUE IF NOT EXISTS 'treez';

-- After the first --apply run on the Mac:
-- SELECT d.master_listing_slug, s.platform, s.status, s.item_count, s.error_message, s.scraped_at
--   FROM menu_snapshots s JOIN dispensaries d ON d.id = s.dispensary_id
--  WHERE s.adapter_version IN ('rendered-jane-algolia@1.0.0', 'rendered-treez-html@1.0.0')
--  ORDER BY s.scraped_at DESC LIMIT 20;
