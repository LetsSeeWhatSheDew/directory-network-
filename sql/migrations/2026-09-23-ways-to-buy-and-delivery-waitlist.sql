-- 2026-09-23 — Ways to buy (drive-thru, curbside, order-ahead, medical) + delivery waitlist
-- Every feature row carries the evidence + URL it came from. No row = unknown.

create table if not exists public.listing_features (
  id uuid primary key default gen_random_uuid(),
  project_tag text not null default 'green',
  listing_slug text not null,
  feature text not null check (feature in ('drive_thru','curbside','order_ahead','medical','delivery')),
  status text not null check (status in ('yes','no','announced')),
  evidence text not null,
  source_url text not null,
  verified_at timestamptz not null default now(),
  unique (project_tag, listing_slug, feature)
);
create index if not exists listing_features_slug_idx on public.listing_features (project_tag, listing_slug);
alter table public.listing_features enable row level security;
drop policy if exists listing_features_read on public.listing_features;
create policy listing_features_read on public.listing_features for select to anon, authenticated using (project_tag = 'green');
grant select on public.listing_features to anon, authenticated;
grant all on public.listing_features to service_role;

create table if not exists public.delivery_waitlist (
  id uuid primary key default gen_random_uuid(),
  project_tag text not null default 'green',
  zip text not null check (zip ~ '^[0-9]{5}$'),
  email text,
  source text,
  created_at timestamptz not null default now()
);
create index if not exists delivery_waitlist_zip_idx on public.delivery_waitlist (zip);
alter table public.delivery_waitlist enable row level security;
-- no anon policies: writes go through /api/delivery-waitlist with the service key
grant all on public.delivery_waitlist to service_role;

-- Public, email-free demand map (ZIP → count) for the delivery page.
create or replace view public.delivery_waitlist_by_zip as
  select zip, count(*)::int as signups from public.delivery_waitlist where project_tag = 'green' group by zip;
grant select on public.delivery_waitlist_by_zip to anon, authenticated, service_role;
