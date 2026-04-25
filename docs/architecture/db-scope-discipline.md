# DB Scope Discipline — `master_listings` is multi-tenant

**Date:** 2026-04-27
**Owner:** Cowork (this doc) + Code (enforcement in app code)
**Status:** Active. Required reading for any session that adds or modifies a query touching `master_listings`.
**Triggered by:** 2026-04-27 site audit Finding C2 — apartment rentals (`project_tag='rent'`) and a public-works contractor bid (`project_tag='bid'`) rendered as PuffPrice dispensaries on `/l/ivy-hall-dispensary` because the related-listings widget was missing the `project_tag` filter. See `docs/site-audits/2026-04-27-claude-audit.md`.

---

## The reality

`master_listings` is a shared multi-tenant table. It is not a PuffPrice-only table.

Live `project_tag` distribution as of 2026-04-27:

| project_tag | rows | What it represents |
|---|---:|---|
| `green` | 94 | PuffPrice — cannabis dispensaries (this codebase's project) |
| `bid` | 5 | Public-works contractor bidding directory |
| `rent` | 4 | Apartment rentals directory |
| `heal` | 5 | Wellness practitioners (breathwork coaches, healers) |
| `her` | 4 | Women's-health clinics |
| `machine` | 5 | AI tools directory |

Any other `project_tag` value Matthew adds in the future joins this table. PuffPrice does not own `master_listings` — it shares it.

Same shape applies to `state='IL'`-filtered queries. The 'green' rows are 73 of the 79 IL rows; the other 6 are split between `bid` (1) and `rent` (2) and others. So even within Central Illinois cities, an unscoped query bleeds.

The `slug` column happens to be unique across the table today, which is why some single-row queries (e.g., `/l/[slug]` direct lookups) work without an explicit `project_tag` filter — the slug fully disambiguates. But this is a coincidence of current data, not a contract. Multi-row queries (any `WHERE city=` or `WHERE state=` query) will bleed across project tags every time, and even single-slug queries should encode the scope explicitly so that a future slug collision (e.g., a `bid` listing with the same slug as a `green` listing) doesn't silently break.

---

## The policy

**Every public-facing query touching `master_listings` MUST include `project_tag = 'green'`. No exceptions.**

This applies whether the query is:

- Read or write.
- Single-row or multi-row.
- Server-side or in a route handler.
- Backed by Supabase JS client, raw SQL, or PostgREST URL.
- Fronted by a view, a function, or an RPC.

The discipline lives at the call site. There is no DB-level enforcement today (no RLS — see "Future improvements" below).

---

## The seven query categories that need this filter

Each of these touches `master_listings`. Each must include `.eq('project_tag', 'green')` (Supabase JS) or `WHERE project_tag = 'green'` (raw SQL).

### 1. City-page primary listings query

Lives in `app/city/[city]/page.tsx`. Renders the dispensary list for a city.

This is also subject to C1 (metro bleed) — the city query should be exact-city, not metro-aware, for the primary list. See `docs/site-audits/2026-04-27-claude-audit.md` Finding C1. The two filters compose: exact `city` + `project_tag='green'` + `is_active=true`.

### 2. Listing-page main row query

Lives in `app/l/[id]/page.tsx` and `app/dispensary/[slug]/page.tsx` (whichever is canonical — see `docs/url-canonical-decisions-20260426.md` v2 open question).

The slug is currently unique across the table, so the lookup works without the filter. Enforce the filter anyway. If a future slug collision happens — say, a 'bid' contractor with slug `ivy-hall-dispensary` — the filter is the difference between the right row and a wrong row.

### 3. "Other dispensaries in {city}" related-listings widget

Lives on the listing-detail page. This is the C2 failure point. Must filter `project_tag='green'` plus the same exact-city + active-status filters as category #1.

### 4. "Nearby cities" widget

Wherever this lives in the codebase (likely a homepage or city-page sidebar component). If it pulls from `master_listings` to count or list nearby-city dispensaries, it must filter `project_tag='green'`.

### 5. Map view markers

Anything that renders pins on a map. Each pin is a row from `master_listings`. Every pin-source query must filter `project_tag='green'`. Otherwise apartment rentals appear as cannabis dispensaries on the map.

### 6. Search/filter results

Any "search by city," "filter by category," "sort by distance" query that hits `master_listings`. These are notoriously the place where multi-axis filters miss a dimension.

### 7. All API routes under `/api/`

Public API routes that serve listings (current or future) must filter `project_tag='green'` before returning data. This includes any future MCP-server route and any data-feed endpoint we expose.

---

## Scraper and backfill scripts

The deal scraper (`lib/scraper/cil-deal-scraper.ts`) and any Places-backfill script (geocoding, phone, hours enrichment) must also enforce `project_tag='green'` before touching a row.

A scraper that writes to a `bid` row's deals would corrupt a sibling project's data. A geocoder that runs against a `rent` row burns Places API quota for no PuffPrice value.

The pattern at the top of every batch script:

```ts
// SCOPE GUARD — PuffPrice only.
const { data: listings, error } = await supabase
  .from('master_listings')
  .select('*')
  .eq('project_tag', 'green')
  .eq('is_active', true)
  .eq('state', 'IL');
```

If a script needs to operate across all tenants for some reason, that's a privileged admin script, not a public flow. It should live outside the normal scraper path with a clear comment ("Cross-tenant; do not import from public code paths").

---

## Code-review checklist

Add this line to the project's PR review checklist:

> **Does this change touch `master_listings`? If yes, every query (read or write) must include `project_tag = 'green'`. Review the seven categories in `docs/architecture/db-scope-discipline.md` and confirm every applicable call site is covered.**

If a PR adds a new query category that isn't in the seven above, the PR adds a corresponding entry to this doc as part of the same commit.

---

## Anti-patterns

These are the patterns that produced C2. Treat any of them in a PR as an automatic review reject pending fix.

### Anti-pattern 1 — direct city/state filter without project_tag

```ts
// WRONG — bleeds rentals + bids into a public dispensary list.
const { data } = await supabase
  .from('master_listings')
  .select('*')
  .eq('city', 'Peoria')
  .eq('is_active', true);
```

Right version:

```ts
// RIGHT — scoped.
const { data } = await supabase
  .from('master_listings')
  .select('*')
  .eq('project_tag', 'green')
  .eq('city', 'Peoria')
  .eq('is_active', true);
```

### Anti-pattern 2 — JOIN from related table without verifying project_tag downstream

```ts
// SUSPICIOUS — the join is fine, but any consumer of `dealsWithListing`
// that doesn't recheck listing.project_tag inherits the bleed.
const { data: dealsWithListing } = await supabase
  .from('deals')
  .select('*, listing:master_listings(*)');
```

The `deals` table is currently scoped to PuffPrice deals (today, 100% of `deals.project_tag` = `'green'` as far as we've seen), so this *might* be safe today. But the safer pattern is to filter the joined master_listings rows explicitly:

```ts
const { data: dealsWithListing } = await supabase
  .from('deals')
  .select('*, listing:master_listings!inner(*)')
  .eq('listing.project_tag', 'green');
```

If the related table grows multi-tenant later (which it eventually will), the explicit filter prevents the silent bleed.

### Anti-pattern 3 — view or RPC that wraps an unscoped query

The `active_deals_with_listings` view is currently scoped (it filters by `master_listings.is_active`). If anyone adds a new view that selects from `master_listings` without `project_tag='green'`, the consumer code looks clean but the view bleeds. Every view definition is a contract; treat it like any other query.

### Anti-pattern 4 — caching an unscoped result

If a query returns the unscoped result and a downstream cache stores it, the bleed propagates to cache. ISR, tag-based revalidation, and any in-memory cache all multiply the effect. Filter at the query, not at the render.

### Anti-pattern 5 — `select('*')` followed by an in-memory `.filter()`

Two reasons:

1. The wire payload is wider than needed (waste).
2. If the in-memory filter is forgotten or removed in a refactor, the bleed surfaces.

Always filter at the SQL layer.

---

## Future improvement — DB-level enforcement (RLS)

Today, `master_listings` has `rls_enabled=false`. Every query trusts the app code to filter correctly. The 2026-04-27 audit demonstrates that the app code does not always do so.

The structural fix is a Row-Level Security policy that filters by `project_tag` based on the API key's tenant claim. Concretely:

- Each project (green / rent / bid / heal / her / machine) has its own Supabase API key, scoped to its tenant.
- An RLS policy on `master_listings` allows `SELECT` only where `project_tag = current_setting('app.tenant')` (or equivalent JWT claim).
- The PuffPrice service-role key carries the `green` claim. Any forgotten filter at the app layer is silently 0 rows instead of 8 rows of the wrong tenant.

This is a non-trivial migration:

1. Audit and fix every existing call site to include `project_tag='green'` (the short-term work in flight after the 2026-04-27 audit).
2. Decide on the tenant-claim mechanism (per-project API key vs. JWT-claim middleware).
3. Write the RLS policy and apply it.
4. Verify every existing call site still works after RLS turns on (because the policy is now enforcing the filter even when the app code forgets).
5. Add a synthetic test that explicitly omits the filter and confirms 0 rows return — proves the policy is binding.

Until then: the policy lives at the app layer, in this doc, and in the code-review checklist.

This is a long-term fix worth queueing for a dedicated session, not bolting onto a patch session.

---

## Related findings

- **2026-04-27 site audit C2** — apartment-rental and public-works rows rendered as PuffPrice dispensaries on `/l/ivy-hall-dispensary`. Direct trigger for this doc.
- **2026-04-26 morning Cowork doc count drift** (Finding 5 in the prior audit) — three Springfield, **MO** rows were swept into a CIL coverage table by a `city='Springfield'` query missing `state='IL'`. Same class of bug (missing filter axis), expressed in a doc rather than a runtime widget.

Both surfaced as user-visible content errors. Both are fixable at the query and structurally preventable with stronger typing or DB-level enforcement.
