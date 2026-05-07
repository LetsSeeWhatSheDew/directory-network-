-- 2026-11-06-scraper-runs.sql
-- One row per scraper invocation. Powers /admin/scrapers panel.

BEGIN;

CREATE TABLE IF NOT EXISTS scraper_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running','success','partial','failed')),
  trigger TEXT NOT NULL CHECK (trigger IN ('cron','manual','admin')),
  dispensary_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_deals_added INT DEFAULT 0,
  total_deals_updated INT DEFAULT 0,
  total_deals_deactivated INT DEFAULT 0,
  duration_ms INT,
  error_summary TEXT
);

CREATE INDEX IF NOT EXISTS scraper_runs_started_at_idx
  ON scraper_runs (started_at DESC);

COMMENT ON TABLE scraper_runs IS
  'One row per scraper invocation. Powers /admin/scrapers panel.';

COMMIT;
