-- directory_leads table
-- Stores lead submissions from directory landing pages (e.g. /grow)

create table if not exists directory_leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  business_name  text not null,
  email          text not null,
  phone          text,
  tier_interest  text not null,   -- e.g. 'free' | 'boost'
  niche          text not null,   -- e.g. 'cannabis'
  region         text not null,   -- e.g. 'Illinois'
  source         text not null,   -- e.g. 'grow-landing'
  status         text not null default 'new'  -- 'new' | 'reviewed' | 'converted'
);

-- Auto-update updated_at on every row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists directory_leads_updated_at on directory_leads;
create trigger directory_leads_updated_at
  before update on directory_leads
  for each row execute procedure set_updated_at();

-- Row Level Security
alter table directory_leads enable row level security;

-- Anonymous users can INSERT (submit the lead form)
create policy "anon can insert leads"
  on directory_leads for insert
  to anon
  with check (true);

-- Authenticated users have full access (operator inbox, admin)
create policy "authenticated full access"
  on directory_leads for all
  to authenticated
  using (true)
  with check (true);
