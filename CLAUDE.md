# CLAUDE.md — PuffPrice Project Context
> Read automatically by Claude Code at session start.

## What This Is
PuffPrice — Central Illinois cannabis deal intelligence.
GPS-aware deal finder. Built for a real person in a parking lot who wants to save money on weed.

Live at puffprice.com.

**Scope (hard lock, April 24, 2026):** Public surface is Central Illinois only — 12 cities, 9 currently with licensed dispensaries. Non-Central-IL listings remain in the DB but are hidden at the app level. See `docs/central-illinois-scope.md`.

**Deal data policy (April 26, 2026):** Deals are pulled from direct dispensary websites and official social only — never Leafly, Weedmaps, or other aggregators. Re-verified every 6 hours. Legacy aggregator-sourced deals were deactivated April 26 in a single cutover. See `docs/deal-data-policy.md`.

## Stack
- Frontend: Next.js 16 (App Router, Turbopack)
- Database: Supabase — project ref: hnbjufmtmrhexmdrfubw
- Hosting: Vercel
- Repo: LetsSeeWhatSheDew/directory-network-
- Error monitoring: Sentry (scaffolded with env-var gating, DSN pending)
- Brand config: lib/brand.ts — one string change renames entire site

## Current State (April 26, 2026 — HEAD: see git)
- **Scope:** Central Illinois only — 12 cities, 9 with dispensaries, 3 empty-with-nearest-alternative placeholder (Bartonville, Morton, Washington)
- **Central IL active listings:** 31 in DB today; two flagged for deactivation in this session (`ascend-springfield`, `consume-cannabis-champaign`) → 29 post-cutover. See `docs/scrape-coverage-20260426.md` for the full list.
- **Central IL active deals (pre-cutover):** 11 — 9 from Leafly, 2 from direct-source. All Leafly/Weedmaps deals being deactivated April 26 under the new deal policy. Post-cutover starting point: ~2 direct-source deals, growing as direct-source scraper + direct-contact verification catch up.
- **Scrape policy (April 26 onward):** Direct dispensary websites + official social only. No Leafly, Weedmaps, iHeartJane, Dutchie marketplace, or any aggregator. Dispensary-owned pages that embed a POS menu widget (Dutchie, Jane, Cookies.co, etc.) count as direct. See `docs/deal-data-policy.md`.
- **Scrape cadence:** every 6 hours per scrapable listing. Deals unverified for 72+ hours render with a "verification pending" state; 7+ days auto-deactivate.
- **Statewide DB (not publicly rendered):** preserved; hidden at the app level via `lib/constants/regions.ts` scope filter. One-line reversal.
- **Enhanced Places backfill complete** — phone + website + hours populated for enriched rows; GPS seeded for Central IL listings
- **Content floor:** Central IL listing drafts landed through April 25; ongoing maintenance pass per session
- PuffPrice Index — statewide flower price-per-gram benchmark at /about/index
- Brand pages scaffolded at /brand and /brand/[slug] (populate when brands table lands)
- Content depth layer on /l/[id] — monogram fallback, stat strip, serif prose, map iframe, report-outdated link
- Sitemap scoped to Central IL cities/listings/brands/deals only; out-of-scope URLs return 404

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
