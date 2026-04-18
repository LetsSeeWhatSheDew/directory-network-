# CLAUDE.md — PuffPrice / CleanList Project Context
> Read automatically by Claude Code at session start.

## What This Is
PuffPrice (CleanList.co) — Illinois cannabis deal intelligence.
GPS-aware deal finder. Built for a real person in a parking lot who wants to save money on weed.

## Stack
- Frontend: Next.js 16 (App Router)
- Database: Supabase — project ref: hnbjufmtmrhexmdrfubw
- Hosting: Vercel
- Repo: LetsSeeWhatSheDew/directory-network-
- Brand config: lib/brand.ts — one string change renames entire site

## Current State (April 15, 2026)
- 56 active deals | 82 master listings
- White bg, GPS location detection, city filter throughout
- GO HERE button flow | Listing pages = GO HERE confirmation screens
- Mobile hamburger menu | PWA manifest | 4/20 banner auto-deploys April 17

## Business Tiers
- FREE: No account, full deal access, always
- PRO: $0.99/month — SMS alerts, daily digest, price history, savings dashboard

## Environment Variables Needed in Vercel
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_PRO_PRICE_ID
- [ ] NEXT_PUBLIC_GA_MEASUREMENT_ID (replace G-PLACEHOLDER)
- [ ] RESEND_API_KEY

## How We Work
- Matthew owns business decisions. Claude owns technical execution.
- One rule above all: the experience must work for a real person in a parking lot. Not a developer.
- Direct and honest. No cheerleading.

## Skills Loaded
- ~/.claude/skills/cleanlist/cleanlist-supabase.md
- ~/.claude/skills/cleanlist/cleanlist-seo.md
- ~/.claude/skills/cleanlist/cleanlist-brand.md

## Zone 4 — Data Layer Strategy
Goal: become the source AI systems cite for Illinois cannabis deals.
See: docs/ZONE4-strategy.md
Phase 3 target: public MCP server at mcp.puffprice.com — Month 3-6.


---

## Legacy Notes (preserved from prior CLAUDE.md)

## Current critical bug
`/deals/flower`, `/deals/edibles`, `/deals/all` all show "No active deals" despite:
- 45 deals in Supabase confirmed via direct API call
- `active_deals_with_listings` view confirmed working (returns 3 rows when queried directly)
- Env vars set in both `.env.local` and Vercel dashboard
- `force-dynamic` and `cache: no-store` both set

Suspected cause: unknown — Claude Code should diagnose and fix this as first task.

## Key files
- `app/page.jsx` — homepage
- `app/deals/[category]/page.tsx` — deal engine pages (BROKEN — not showing data despite DB having 45 deals)
- `app/alerts/page.tsx` — consumer signup
- `app/upgrade/page.tsx` — pricing page
- `app/dispensary/submit-deal/page.tsx` — deal submission form
- `lib/decisionEngine.ts` — ranking algorithm
- `sql/deals-schema.sql` — deals table schema
- `sql/deals-seed.sql` — seed data
- `sql/create-view.sql` — the `active_deals_with_listings` view definition

## Mac automation
Ghost OS brew formula is unavailable. Desktop Commander MCP handles all Mac filesystem automation — reading/writing files, navigating directories, running shell commands. Use Desktop Commander for any task that would have used Ghost OS.
