-- 2026-09-25 — indexes for first-party analytics reads on `events`.
-- NOT APPLIED. Review and run in the Supabase SQL editor.
--
-- /for-dispensaries/[slug] runs count queries filtered by
-- (project_tag, listing_id, event_type, created_at); /admin/traffic scans
-- the last 30 days by created_at. Both are fine on an empty table and will
-- slow down as rows accumulate without these.
--
-- RLS: the service role bypasses RLS, so /api/track inserts and the
-- report/admin reads work regardless of policies. No anon INSERT or SELECT
-- policy is needed (or wanted) on `events` for this feature.

create index if not exists events_listing_created_idx
  on public.events (listing_id, created_at);

create index if not exists events_type_created_idx
  on public.events (event_type, created_at);

create index if not exists deal_clicks_clicked_at_idx
  on public.deal_clicks (clicked_at);
