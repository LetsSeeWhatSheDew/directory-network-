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

**Look: Gold Leaf (November 11, 2026) — current, supersedes Breathe and the April identity package below.** Taken from the three Nov 10 flyers Matthew approved and is using (Gold Leaf, Big Leaf, Leaf Code). Deep forest + cream + gold; the drawn leaf (`lib/leaf.ts`, `public/gold-leaf.svg`) as the signature; Fraunces (self-hosted soft-display cut) for display, Instrument Sans for everything else; the best deal as a cream coupon; hand-drawn category pictures; "Best Bud For Your Buck$" voice. One theme (no day/night). Header and footer render once in `app/layout.tsx`; pages compose `app/components/gold/Kit.tsx`; the `--pp-*` tokens in `app/globals.css` are remapped to this palette. Design system of record: https://claude.ai/artifact/C2wPEV9q47JsdxUhWpe7uy (updated Nov 11). Matthew rejected Breathe, Best Bud, Scout, Vault, Gallery and Instrument as cheap/generic; the brief is "not generic, not cookie-cutter, not AI-looking, not a data dump, visual for a stoned audience but not overwhelming." Don't start another reskin without his ask; extend Gold Leaf. Session report: `docs/session-reports/2026-11-11-code-gold-leaf.md`.

**Brand identity locked (April 28, 2026), superseded by Gold Leaf above:** Wordmark + color palette + typography + photography + icon system + voice guidelines locked in `docs/brand/2026-04-28-identity-package.md`. Code's visual upgrade session implements against this. About-page draft and the Illinois cannabis tax explainer + calculator spec are in `docs/content/`. Prior brand exploration deck (referenced as "Concept 02 wordmark, Concept 03 pin mark") is **not in the repo** — the identity package is a fresh-recommendation pass; if Matthew's deck surfaces later, it overrides.

## Stack
- Frontend: Next.js 16 (App Router, Turbopack)
- Database: Supabase — project ref: hnbjufmtmrhexmdrfubw
- Hosting: Vercel
- Repo: LetsSeeWhatSheDew/directory-network-
- Error monitoring: Sentry (scaffolded with env-var gating, DSN pending)
- Brand config: lib/brand.ts — one string change renames entire site

## Current State (2026-11-11 night, verified against Supabase; main at Gold Leaf)

Counts verified against the live `master_listings` and `deals` tables (project `hnbjufmtmrhexmdrfubw`) on Nov 11, 2026 ~9 PM CT. Re-query before quoting; deals change every run.

- **Scope:** Central Illinois only — 12 cities, 9 with licensed dispensaries (Bartonville, Morton, Washington have none).
- **Central IL active listings:** **26.** Filter: `project_tag='green' AND state='IL' AND is_active AND type='dispensary' AND city IN (12-city scope)`.
- **Active deals:** **337 at 20 stores.** 321 from the Mac-hosted rendered menu reader (`source='website_rendered'`), 16 from the Vercel cron (`source='website'`). One live row per deal since the Nov 10 dedupe.
- **Per city (live DB):**

  | City | Listings | Stores with deals | Deals |
  |---|---:|---:|---:|
  | Springfield | 6 | 6 | 157 |
  | East Peoria | 3 | 2 | 130 |
  | Peoria | 5 | 3 | 28 |
  | Champaign | 3 | 2 | 8 |
  | Normal | 4 | 2 | 4 |
  | Bloomington | 2 | 2 | 4 |
  | Peoria Heights | 1 | 1 | 4 |
  | Urbana | 1 | 1 | 1 |
  | Pekin | 1 | 1 | 1 |
  | **Total** | **26** | **20** | **337** |

- **Concentration:** NOXX East Peoria (~129) and SHARE Springfield (~80) post most deals as single-product menu specials. Counts are honest but tilt town totals.
- **No deals today and why:**
  - The Dispensary Champaign: no website.
  - The three RISE/Bloom stores (beyond-hello-peoria, revolution-dispensary-normal, ayr-wellness-normal): their deal pages sit behind Cloudflare, which we don't bypass.
  - Trinity on University: age gate / run deadline.
  - Cloud 9 East Peoria: read, nothing posted.
- **Scrapers:**
  - Vercel cron `/api/cron/scrape-deals`: daily 09:00 UTC, static HTML; it only retires its own `source='website'` deals, at stores read cleanly.
  - Mac rendered reader: `~/puffprice-scraper`, `scripts/run-rendered-scrape.sh`, pulls main each run; it only retires `website_rendered` deals. It runs only while the Mac is awake.
  - `scraper_runs.dispensary_results` lists every store read (since Nov 11), including clean reads with no deals.
- **Freshness rules:** 72h without verification → "verification pending"; 7 days → auto-deactivate (`mark-stale-deals`).
- **Free alerts:** a weekly Monday email (`/api/alerts/signup`, tier `free`, double opt-in). Pro ($0.99) is instant, but there's no card processor yet: Stripe prohibits cannabis-related businesses.
- **Design:** Gold Leaf (see the Look paragraph above). Accessibility, smoke and Lighthouse budget run in CI (`.github/workflows/ci.yml`); home and city score ~93–97.

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
