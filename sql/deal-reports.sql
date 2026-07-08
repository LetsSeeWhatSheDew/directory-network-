-- deal-reports.sql — durable "report an issue" storage
-- ============================================================
-- STATUS: NOT YET APPLIED. Written by the Code lane during the July 2026
-- assessment sprint. Per the migration pattern in CLAUDE.md, Cowork/Matthew
-- reviews and applies this via the Supabase SQL Editor or MCP; Code does not
-- apply migrations without sign-off.
--
-- Until this is applied, the UI ships the report control as a mailto: link
-- (app/components/ReportIssueLink.tsx). Once the table exists, add an
-- /api/deals/report route that inserts a row and point ReportIssueLink at it
-- (POST) instead of mailto — no caller changes needed.
--
-- Multi-tenant discipline (docs/architecture/db-scope-discipline.md):
-- master_listings + deals are shared across projects, so this table carries
-- project_tag and every read MUST filter project_tag='green'.
-- ============================================================

create table if not exists public.deal_reports (
  id            uuid primary key default gen_random_uuid(),
  project_tag   text        not null default 'green',
  -- Soft references — deals/listings are multi-tenant and rows can be
  -- deactivated, so we don't hard-FK; we keep the identifiers for triage.
  deal_id       uuid,
  listing_slug  text,
  -- What the reporter said. `reason` is a coarse enum-ish bucket; `detail`
  -- is free text. Both optional so a one-tap report still lands.
  reason        text,        -- e.g. 'price_changed' | 'expired' | 'wrong_store' | 'other'
  detail        text,
  page_url      text,
  -- Lightweight abuse triage without storing PII we don't need.
  user_agent    text,
  created_at    timestamptz not null default now(),
  -- Workflow: new reports start 'open'; admin resolves/dismisses.
  status        text        not null default 'open'  -- 'open' | 'resolved' | 'dismissed'
);

create index if not exists deal_reports_project_created_idx
  on public.deal_reports (project_tag, created_at desc);
create index if not exists deal_reports_deal_idx
  on public.deal_reports (deal_id);

-- RLS: the public (anon) may INSERT a report but never read them back.
-- Only the service role (server-side admin) can select/update.
alter table public.deal_reports enable row level security;

drop policy if exists deal_reports_anon_insert on public.deal_reports;
create policy deal_reports_anon_insert
  on public.deal_reports
  for insert
  to anon
  with check (project_tag = 'green');

-- No select/update/delete policy for anon => anon cannot read or mutate.
-- Service role bypasses RLS for the admin queue.
