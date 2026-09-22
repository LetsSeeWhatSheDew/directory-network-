-- 2026-09-22-listing-reviews.sql — dispensary reviews (moderated)
-- ============================================================
-- STATUS: NOT YET APPLIED. Matthew applies via Supabase SQL Editor.
-- Until applied, the review form says "Reviews open soon" and the review
-- list renders nothing — no errors, no fake reviews.
--
-- Model:
--   • Anyone can SUBMIT a review (anon INSERT), but it lands as 'pending'.
--   • The public can only READ 'approved' reviews.
--   • Matthew approves/rejects in /admin/reviews (service role).
--   • No email/IP stored. display_name is optional, free text, capped.
--
-- Google note: third-party reviews of OTHER businesses are eligible for
-- review stars (the "self-serving" rule only bars a business reviewing
-- itself). Keep it honest: never seed, never incentivize, never edit text.
-- ============================================================

create table if not exists public.listing_reviews (
  id            uuid primary key default gen_random_uuid(),
  project_tag   text        not null default 'green',
  listing_slug  text        not null,
  rating        smallint    not null check (rating between 1 and 5),
  body          text        check (body is null or char_length(body) <= 1500),
  display_name  text        check (display_name is null or char_length(display_name) <= 40),
  visit_month   text,       -- optional 'YYYY-MM' the reviewer visited
  status        text        not null default 'pending'
                            check (status in ('pending','approved','rejected')),
  user_agent    text,
  created_at    timestamptz not null default now(),
  moderated_at  timestamptz
);

create index if not exists listing_reviews_slug_status_idx
  on public.listing_reviews (project_tag, listing_slug, status, created_at desc);

alter table public.listing_reviews enable row level security;

-- Anon may insert ONLY a pending, green review. Cannot self-approve.
drop policy if exists listing_reviews_anon_insert on public.listing_reviews;
create policy listing_reviews_anon_insert
  on public.listing_reviews
  for insert
  to anon
  with check (project_tag = 'green' and status = 'pending' and moderated_at is null);

-- Anon may read ONLY approved green reviews.
drop policy if exists listing_reviews_anon_read_approved on public.listing_reviews;
create policy listing_reviews_anon_read_approved
  on public.listing_reviews
  for select
  to anon
  using (project_tag = 'green' and status = 'approved');

-- Per-listing rollup of APPROVED reviews (for stars + JSON-LD).
create or replace view public.listing_review_stats
with (security_invoker = true) as
  select listing_slug,
         count(*)::int                       as review_count,
         round(avg(rating)::numeric, 1)      as avg_rating
  from public.listing_reviews
  where project_tag = 'green' and status = 'approved'
  group by listing_slug;

-- Views need explicit grants (RLS alone is not enough — see ways-of-working).
grant select on public.listing_review_stats to anon, authenticated, service_role;
grant select, insert on public.listing_reviews to anon;
grant all on public.listing_reviews to service_role;
