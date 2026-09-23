-- 2026-09-22-deal-observations.sql — keep EVERY day's scrape as history
-- ============================================================
-- STATUS: NOT YET APPLIED. Paste into Supabase SQL Editor and Run once.
-- Safe to re-run (idempotent).
--
-- Why: the daily scraper (GitHub Action 09:00 UTC) updates rows in `deals`
-- IN PLACE — verified_at moves forward, discounts get overwritten, and the
-- history is gone. This adds an append-only log that fills itself:
--   • a trigger on `deals` writes one row per deal per day it's seen,
--     plus 'created', 'changed' (discount/price/title moved), 'deactivated'
--   • works no matter which code path writes to `deals` (scraper, admin,
--     cron) — nothing to remember, nothing to run by hand
--   • backfills what we can recover today (created_at / verified_at)
-- Read side: two views the site uses for "typical discount at this store",
-- "best we've seen here", and per-city daily market stats.
-- ============================================================

create table if not exists public.deal_observations (
  id               bigserial primary key,
  project_tag      text        not null default 'green',
  deal_id          uuid        not null,
  listing_slug     text,
  event            text        not null check (event in ('created','seen','changed','deactivated')),
  observed_at      timestamptz not null default now(),
  observed_day     date        not null,            -- Central Time calendar day
  title            text,
  category         text,
  discount_type    text,
  discount_value   numeric,
  discount_unit    text,
  discount_pct     integer,
  original_price   numeric,
  sale_price       numeric,
  price_per_gram   numeric,
  unit             text,
  weight_grams     numeric,
  brand            text,
  source_url       text
);

-- At most one 'seen' row per deal per day (the scraper can touch a row
-- several times in a run).
create unique index if not exists deal_observations_seen_once_per_day
  on public.deal_observations (deal_id, observed_day) where event = 'seen';
create index if not exists deal_observations_slug_day
  on public.deal_observations (project_tag, listing_slug, observed_day desc);
create index if not exists deal_observations_day
  on public.deal_observations (project_tag, observed_day desc);

-- Public deal info — anon may read, nobody but the trigger/service writes.
alter table public.deal_observations enable row level security;
drop policy if exists deal_observations_anon_read on public.deal_observations;
create policy deal_observations_anon_read on public.deal_observations
  for select to anon using (project_tag = 'green');
grant select on public.deal_observations to anon, authenticated;
grant all on public.deal_observations to service_role;

create or replace function public.log_deal_observation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ev   text;
  pct  integer;
  day  date := (now() at time zone 'America/Chicago')::date;
begin
  if new.project_tag is distinct from 'green' then
    return new;
  end if;

  pct := coalesce(
    new.discount_pct,
    case when lower(coalesce(new.discount_unit,'')) in ('percent','%','pct')
         then round(new.discount_value)::int end
  );

  if tg_op = 'INSERT' then
    ev := 'created';
  elsif old.is_active and not coalesce(new.is_active, false) then
    ev := 'deactivated';
  elsif (new.discount_value, new.discount_pct, new.sale_price, new.original_price, new.title)
        is distinct from
        (old.discount_value, old.discount_pct, old.sale_price, old.original_price, old.title) then
    ev := 'changed';
  elsif new.verified_at is distinct from old.verified_at and coalesce(new.is_active, false) then
    ev := 'seen';
  else
    return new;
  end if;

  -- Event row (created / changed / deactivated). 'seen' is handled below.
  if ev <> 'seen' then
    insert into public.deal_observations (
      project_tag, deal_id, listing_slug, event, observed_at, observed_day,
      title, category, discount_type, discount_value, discount_unit, discount_pct,
      original_price, sale_price, price_per_gram, unit, weight_grams, brand, source_url
    ) values (
      'green', new.id, new.listing_slug, ev, now(), day,
      new.title, new.category, new.discount_type, new.discount_value, new.discount_unit, pct,
      new.original_price, new.sale_price, new.price_per_gram, new.unit, new.weight_grams, new.brand, new.source_url
    );
  end if;

  -- One 'seen' row per live deal per day, always holding the latest values
  -- for that day (so a mid-day discount change is what the day records).
  if ev in ('created','changed','seen') and coalesce(new.is_active, false) then
    insert into public.deal_observations (
      project_tag, deal_id, listing_slug, event, observed_at, observed_day,
      title, category, discount_type, discount_value, discount_unit, discount_pct,
      original_price, sale_price, price_per_gram, unit, weight_grams, brand, source_url
    ) values (
      'green', new.id, new.listing_slug, 'seen', now(), day,
      new.title, new.category, new.discount_type, new.discount_value, new.discount_unit, pct,
      new.original_price, new.sale_price, new.price_per_gram, new.unit, new.weight_grams, new.brand, new.source_url
    )
    on conflict (deal_id, observed_day) where event = 'seen' do update set
      observed_at    = excluded.observed_at,
      title          = excluded.title,
      category       = excluded.category,
      discount_type  = excluded.discount_type,
      discount_value = excluded.discount_value,
      discount_unit  = excluded.discount_unit,
      discount_pct   = excluded.discount_pct,
      original_price = excluded.original_price,
      sale_price     = excluded.sale_price,
      price_per_gram = excluded.price_per_gram,
      unit           = excluded.unit,
      weight_grams   = excluded.weight_grams,
      brand          = excluded.brand,
      source_url     = excluded.source_url;
  end if;

  return new;
end;
$$;

drop trigger if exists deals_log_observation on public.deals;
create trigger deals_log_observation
  after insert or update on public.deals
  for each row execute function public.log_deal_observation();

-- ---------- Backfill (only runs if the table is still empty) ----------
do $$
begin
  if not exists (select 1 from public.deal_observations) then
    insert into public.deal_observations (
      project_tag, deal_id, listing_slug, event, observed_at, observed_day,
      title, category, discount_type, discount_value, discount_unit, discount_pct,
      original_price, sale_price, price_per_gram, unit, weight_grams, brand, source_url)
    select 'green', d.id, d.listing_slug, 'created', d.created_at,
           (d.created_at at time zone 'America/Chicago')::date,
           d.title, d.category, d.discount_type, d.discount_value, d.discount_unit,
           coalesce(d.discount_pct, case when lower(coalesce(d.discount_unit,'')) in ('percent','%','pct') then round(d.discount_value)::int end),
           d.original_price, d.sale_price, d.price_per_gram, d.unit, d.weight_grams, d.brand, d.source_url
    from public.deals d where d.project_tag = 'green' and d.created_at is not null;

    insert into public.deal_observations (
      project_tag, deal_id, listing_slug, event, observed_at, observed_day,
      title, category, discount_type, discount_value, discount_unit, discount_pct,
      original_price, sale_price, price_per_gram, unit, weight_grams, brand, source_url)
    select 'green', d.id, d.listing_slug, 'seen', d.verified_at,
           (d.verified_at at time zone 'America/Chicago')::date,
           d.title, d.category, d.discount_type, d.discount_value, d.discount_unit,
           coalesce(d.discount_pct, case when lower(coalesce(d.discount_unit,'')) in ('percent','%','pct') then round(d.discount_value)::int end),
           d.original_price, d.sale_price, d.price_per_gram, d.unit, d.weight_grams, d.brand, d.source_url
    from public.deals d where d.project_tag = 'green' and d.verified_at is not null
    on conflict do nothing;
  end if;
end $$;

-- ---------- Read side ----------
-- Per store, last 90 days: how often it runs deals, typical + best discount.
create or replace view public.listing_deal_history
with (security_invoker = true) as
  select o.listing_slug,
         count(distinct o.observed_day) filter (where o.observed_day > current_date - 30) as deal_days_30d,
         count(distinct o.deal_id)                                                         as deals_seen_90d,
         percentile_disc(0.5) within group (order by o.discount_pct)                       as typical_discount_pct,
         max(o.discount_pct)                                                               as best_discount_pct,
         max(o.observed_day)                                                               as last_seen_day,
         min(o.observed_day)                                                               as first_seen_day
  from public.deal_observations o
  where o.project_tag = 'green' and o.event = 'seen' and o.observed_day > current_date - 90
  group by o.listing_slug;

-- Per city per day: how many verified deals were live, and the average discount.
create or replace view public.daily_market_stats
with (security_invoker = true) as
  select o.observed_day,
         m.city,
         count(distinct o.deal_id)            as deals_live,
         count(distinct o.listing_slug)       as stores_with_deals,
         round(avg(o.discount_pct))::int      as avg_discount_pct
  from public.deal_observations o
  join public.master_listings m
    on m.slug = o.listing_slug and m.project_tag = 'green'
  where o.project_tag = 'green' and o.event = 'seen'
  group by o.observed_day, m.city;

grant select on public.listing_deal_history to anon, authenticated, service_role;
grant select on public.daily_market_stats   to anon, authenticated, service_role;
