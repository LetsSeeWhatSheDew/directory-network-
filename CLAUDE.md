# CLAUDE.md — PuffPrice Project Context
> Read automatically by Claude Code at session start.

## What This Is
PuffPrice — Central Illinois cannabis deal intelligence.
GPS-aware deal finder. Built for a real person in a parking lot who wants to save money on weed.

Live at puffprice.com.

**Scope (hard lock, April 24, 2026):** Public surface is Central Illinois only — 12 cities, 9 currently with licensed dispensaries. Non-Central-IL listings remain in the DB but are hidden at the app level. See `docs/central-illinois-scope.md`.

**Deal data policy (April 26, 2026):** Deals are pulled from direct dispensary websites and official social only — never Leafly, Weedmaps, or other aggregators. Re-verified daily (Vercel Hobby cron limit; was originally specced every 6 hours, see `docs/session-reports/2026-04-26-code-ci-fix.md`). Legacy aggregator-sourced deals were deactivated April 26 in a single cutover. See `docs/deal-data-policy.md`.

**URL canonical (April 26, 2026):** `/city/[city]` is the canonical city URL pattern; `/dispensary/[slug]` is the canonical listing URL pattern; `/cannabis/illinois/*` is deprecated except for content pages (`first-time-guide`, `laws`, `open-now`). See `docs/url-canonical-decisions-20260426.md` (v2 addendum dated 2026-04-27 covers the open `/l/[id]` vs `/dispensary/[slug]` question and the `/deal/[uuid]` GSC canonical warning).

**DB scope discipline (April 27, 2026):** `master_listings` is multi-tenant — it serves PuffPrice (`project_tag='green'`), an apartment-rentals project (`'rent'`), a public-works bidding directory (`'bid'`), wellness practitioners (`'heal'`), women's-health clinics (`'her'`), and an AI-tools directory (`'machine'`). **Every public query touching `master_listings` MUST include `.eq('project_tag', 'green')`. No exceptions.** Required reading for any session that adds or modifies a query touching this table: `docs/architecture/db-scope-discipline.md`. The 2026-04-27 audit caught apartment rentals and a public-works bid rendering as PuffPrice dispensaries on `/l/ivy-hall-dispensary` because the related-listings widget was missing this filter (`docs/site-audits/2026-04-27-claude-audit.md`).

## Stack
- Frontend: Next.js 16 (App Router, Turbopack)
- Database: Supabase — project ref: hnbjufmtmrhexmdrfubw
- Hosting: Vercel
- Repo: LetsSeeWhatSheDew/directory-network-
- Error monitoring: Sentry (scaffolded with env-var gating, DSN pending)
- Brand config: lib/brand.ts — one string change renames entire site

## Current State (2026-04-26 night — parent HEAD: 64d2087 + this docs commit)

All counts in this section verified against the live `master_listings` and `deals` tables in Supabase (project ref `hnbjufmtmrhexmdrfubw`) at 2026-04-26 night. Earlier sessions inherited stale numbers; this block is rewritten from the DB, not from prior memory.

- **Scope:** Central Illinois only — 12 cities, 9 populated with dispensaries, 3 empty-with-nearest-alternative placeholder (Bartonville, Morton, Washington). Pekin moved off the empty list when nuEra Pekin was added April 25.
- **Central IL active listings:** **26** (verified). Filter: `state='IL' AND is_active=true AND type='dispensary' AND city IN (12-city scope)`. Two earlier rows (`ascend-springfield`, `consume-cannabis-champaign`) deactivated this evening; three Springfield, **MO** rows that briefly polluted the Cowork count (`flora-farms-springfield`, `key-cannabis-springfield`, `terrabis-springfield`) were never CIL.
- **Central IL active deals:** **10** (verified), all `source='website'` (direct dispensary sites). Zero from Leafly, Weedmaps, iHeartJane, or Dutchie marketplace. NOXX "50% off vape" deactivated this evening as a BOGO false positive (scraper rule tightened — see `docs/session-reports/2026-04-26-code-ci-fix.md`).
- **Per-city distribution (live DB):**

  | City | Listings | Deals |
  |---|---:|---:|
  | Springfield | 6 | 1 |
  | Peoria | 5 | 3 |
  | Normal | 4 | 0 |
  | Champaign | 3 | 0 |
  | East Peoria | 3 | 1 |
  | Bloomington | 2 | 3 |
  | Pekin | 1 | 0 |
  | Peoria Heights | 1 | 2 |
  | Urbana | 1 | 0 |
  | Bartonville | 0 | 0 |
  | Morton | 0 | 0 |
  | Washington | 0 | 0 |
  | **Total** | **26** | **10** |

- **Scrape policy:** direct dispensary websites + official social only. No Leafly, Weedmaps, iHeartJane, Dutchie marketplace, or any aggregator. Dispensary-owned pages that embed a POS menu widget (Dutchie, Jane, Cookies.co, etc.) count as direct. See `docs/deal-data-policy.md`.
- **Cron status:** registered in `vercel.json`. `/api/cron/scrape-deals` runs **daily at 09:00 UTC** (Vercel Hobby plan caps cron at once per day; original spec was every 6 hours and is documented in the deal data policy as the long-term target). `/api/cron/mark-stale-deals` runs daily at 04:00 UTC. `CRON_SECRET` is required in Vercel env (Production, Sensitive); the route returns 401 until it's set.
- **Freshness rules:** deals unverified for 72+ hours render with a "verification pending" state; 7+ days auto-deactivate via `mark-stale-deals` cron.
- **Statewide DB (not publicly rendered):** preserved; hidden at the app level via `lib/constants/regions.ts` scope filter. One-line reversal.
- **URL canonicalization:** `/city/[city]` and `/dispensary/[slug]` are the canonical patterns. The legacy `/cannabis/illinois/[city]` template tree is being redirected to `/city/[city]` in a parallel Code session tonight. See `docs/url-canonical-decisions-20260426.md`.
- **Enhanced Places backfill complete** — phone + website + hours populated for enriched rows; GPS seeded for Central IL listings.
- **Content floor:** Central IL listing drafts landed through April 25; ongoing maintenance pass per session.
- PuffPrice Index — statewide flower price-per-gram benchmark at `/about/index`.
- Brand pages scaffolded at `/brand` and `/brand/[slug]` (populate when brands table lands).
- Content depth layer on `/l/[id]` — monogram fallback, stat strip, serif prose, map iframe, report-outdated link.
- Sitemap scoped to Central IL cities/listings/brands/deals only; out-of-scope URLs return 404.

## Business Tiers
- FREE: No account, full deal access, always
- PRO: $0.99/month — SMS alerts, daily digest, price history, savings dashboard

## Environment Variables in Vercel
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase public
- SUPABASE_SERVICE_ROLE_KEY — server-side Supabase
- STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID, NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL
- RESEND_API_KEY
- NEXT_PUBLIC_GA_MEASUREMENT_ID (G-TML9Y6VMC2 currently)
- NEXT_PUBLIC_SENTRY_DSN, SENTRY_DSN — pending

## Three-agent workflow

Work is split across three lanes:
- **Cowork** — owns docs/, sql/, scripts/. Schema migrations, research, handoffs.
- **Code** — owns app/, lib/, components/. Feature work, hardening, shipping.
- **Chrome** — owns browser verification against production.

Lane rule: do not cross. Coordinate shared-file changes via docs/handoffs/.

## Migration pattern
- Cowork writes to sql/migrations/YYYY-MM-DD-name.sql
- Matthew reviews and applies via Supabase SQL Editor or MCP
- Code confirms expected schema with a read-only query before relying on it
- Never apply a migration from Code without explicit sign-off

## How We Work
- Matthew owns business decisions. Claude owns technical execution.
- One rule above all: the experience must work for a real person in a parking lot. Not a developer.
- Direct and honest. No cheerleading.
- **Watch Vercel to Ready before verifying.** After any push to main, wait for the deploy to flip Ready (30–90s) before testing production. Otherwise you're testing the previous build.

## Skills Loaded
- ~/.claude/skills/cleanlist/cleanlist-supabase.md
- ~/.claude/skills/cleanlist/cleanlist-seo.md
- ~/.claude/skills/cleanlist/cleanlist-brand.md

## Zone 4 — Data Layer Strategy
Goal: become the source AI systems cite for Illinois cannabis deals.
See: docs/ZONE4-strategy.md
Phase 3 target: public MCP server at mcp.puffprice.com — Month 3-6.

## Key files
- app/page.jsx — homepage
- app/deals/[category]/page.tsx — deal engine pages
- app/l/[id]/page.tsx — listing detail with content depth layer
- app/brand/page.tsx, app/brand/[slug]/page.tsx — brand pages (scaffolded)
- app/alerts/page.tsx — consumer signup
- app/upgrade/page.tsx — pricing page
- app/about/page.tsx, app/about/index/page.tsx — company + Index methodology
- lib/brand.ts — brand config (site name / tagline / URL)
- lib/brands.ts — brand data layer (stub until Cowork's research lands)
- lib/decisionEngine.ts — ranking algorithm
- lib/puffpriceIndex.ts — Index computation
- sentry.*.config.ts, instrumentation*.ts — error monitoring scaffold
- app/error.tsx, app/global-error.tsx — error boundaries

## Session reports
Each autonomous session writes a report to docs/session-reports/. Read the most recent before starting new work.

## Mac automation
Desktop Commander MCP handles Mac filesystem automation when needed.
