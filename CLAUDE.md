# CLAUDE.md — PuffPrice Project Context
> Read automatically by Claude Code at session start.

## What This Is
PuffPrice — Illinois cannabis deal intelligence.
GPS-aware deal finder. Built for a real person in a parking lot who wants to save money on weed.

Live at puffprice.com.

## Stack
- Frontend: Next.js 16 (App Router, Turbopack)
- Database: Supabase — project ref: hnbjufmtmrhexmdrfubw
- Hosting: Vercel
- Repo: LetsSeeWhatSheDew/directory-network-
- Error monitoring: Sentry (scaffolded with env-var gating, DSN pending)
- Brand config: lib/brand.ts — one string change renames entire site

## Current State (April 21, 2026)
- 61 dispensaries across 25 Illinois cities
- 56 active deals | 82 master listings
- PuffPrice Index — statewide flower price-per-gram benchmark at /about/index
- Brand pages scaffolded at /brand and /brand/[slug] (populate when brands table lands)
- Content depth layer on /l/[id] — monogram fallback, stat strip, serif prose, map iframe, report-outdated link
- Sitemap covers: listings, cities, intents, landmarks, dispensary profiles, city landings, brands, deals

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
