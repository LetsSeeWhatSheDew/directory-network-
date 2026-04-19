# PuffPrice — Cowork Sprint Handoff Update
Created: April 15, 2026
Sprint type: Cowork health audit (Claude Sonnet 4.6 in browser)
Note: This supplements HANDOFF.md (Code session output). Read both.

---

## What This Sprint Did

This Cowork session ran a full project health audit without touching the code.
Tasks completed: file structure audit, deployment analysis, env var documentation,
launch checklist, ZONE4 strategy doc, and this handoff update.

See HANDOFF.md for the detailed Code session state (user journey, per-task status, etc.)

---

## Project Identity (as of April 15, 2026)

- **Brand:** PuffPrice
- **Domain:** puffprice.com (being registered — ~$11 on Namecheap/Cloudflare)
- **Live site:** https://cleanlist.co (migrating to puffprice.com post-registration)
- **Repo:** https://github.com/LetsSeeWhatSheDew/directory-network-
- **Stack:** Next.js 16 (App Router, React 19) · Supabase · Tailwind v4 · Vercel
- **Contact:** hi@puffprice.com (not yet active), matthew@jacarandapeoria.com

---

## Stack (full detail)

- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript 5
- **Styling:** Tailwind v4 (PostCSS plugin) plus a lot of inline `style={...}` for one-off layouts
- **Data:** Supabase (Postgres + RLS) — anon key for reads, service_role for admin/scripts
- **Payments:** Stripe (Pro $0.99/mo + Featured $49/mo — both wired via env-driven Price IDs)
- **Hosting:** Vercel (production = main branch, previews per PR)
- **Repo:** github.com/LetsSeeWhatSheDew/directory-network-

---

## Current Deployment Status

Two Vercel projects for the same repo (different domains):

| Vercel Project | Domain | Build | Notes |
|---|---|---|---|
| directory-network | cleanlist.co | PASSING | Current live site |
| directory-network- | puffprice.com | FAILING | Missing env vars |

The puffprice.com environment fails with: Error: supabaseUrl is required
Root cause: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
are not set in the directory-network- Vercel project.

Fix is 2 minutes of work: copy those vars from the working project.

---

## MCP Tools Configured

The following MCP tools are configured for Claude Code sessions:
- desktop-commander — terminal/file system access
- playwright — browser automation for enrichment scripts
- filesystem — direct file read/write
- memory — session context persistence
- supabase — direct database queries

---

## Supabase Database State (as of April 15)

- **Project URL:** https://hnbjufmtmrhexmdrfubw.supabase.co
- **Active deals:** 56 (post data-audit deactivation of expired deals)
- **Master listings (dispensaries):** 293+ (shown on live site as "293 dispensaries")
- **Cities covered:** 162 cities shown on live site

Pending SQL migrations (Matthew must run these — anon key is RLS-blocked):
- sql/dedupe-deals-2026-04-15.sql — deactivates 44 duplicate deal rows
- sql/backfill-orphan-listings-2026-04-15.sql — fixes 13 Chicago/Peoria area orphan slugs

Known quirk: active_deals_with_listings view returns city='Illinois' for orphan
slugs (deals with no matching master_listings row). This is shimmed client-side
by lib/cityNormalize.ts until the backfill SQL runs.

---

## Business Model

FREE tier (no account required):
- See all deals near you
- Click GO HERE to get deal instructions
- City filter, category filter
- Deal scoring and savings calculation

PRO tier ($0.99/month):
- Deal alerts by email when new deals drop in your city
- Stripe checkout: /api/stripe/create-checkout (currently 503 — needs STRIPE keys)

FEATURED tier ($49/month) — for dispensaries:
- Highlighted deal cards with B badge
- Priority ranking in deal feed
- Direct placement in "Top deal" hero position

---

## 4/20 Launch Window

April 20, 2026 is Sunday. Launch window: April 17-20.

Key item: FourTwentyBanner component is already coded and auto-gates to show
April 17 00:00 through April 20 23:59 CT. Nothing to code — just needs domain live
and env vars fixed by April 17.

Critical path to April 17:
1. Register puffprice.com domain (tonight if possible)
2. Add missing env vars to directory-network- Vercel project (2 minutes)
3. DNS configured (Vercel → Settings → Domains → add puffprice.com)
4. Set STRIPE_SECRET_KEY + price IDs (unblocks Pro checkout)
5. Set NEXT_PUBLIC_GA_ID (real value, not G-PLACEHOLDER)

---

## File Structure Changes This Sprint

New files created:
- docs/ directory (new)
- docs/ENV-VARS.md — complete env variable reference, build blocker documented
- docs/LAUNCH-CHECKLIST.md — 4/20 pre-launch checklist with audit status
- docs/ZONE4-strategy.md — 4-phase SEO entity establishment plan
- HANDOFF-UPDATE.md — this file

Files at root that should be reviewed for cleanup:
- column-audit.txt — likely temp audit file, safe to archive or delete
- correct — appears to be a temp/test file, safe to delete
- top-10-illinois-cities-content-plan.md — content strategy doc, could move to docs/

### Sprint deltas (April 15 Cowork run)

- **Fixed** duplicate `background` property on `app/cannabis/illinois/[slug]/deals/page.tsx:140`
- **Fixed** `next.config.ts` — removed the `eslint` block that Next 16's `NextConfig` type no longer accepts (eslint-config-next + flat config still drives lint via `npm run lint`)
- **Created** `docs/ENV-VARS.md`
- **Created** `docs/LAUNCH-CHECKLIST.md`
- **Created** this file (`HANDOFF-UPDATE.md`)
- **Moved** `top-10-illinois-cities-content-plan.md` → `docs/`
- **Moved** `PROJECT_STATE.md` → `docs/`
- **Moved** `column-audit.txt` → `docs/audits/`
- **Removed** empty stub file `correct`

Nothing in `app/`, `lib/`, `components/`, `scripts/`, `sql/`, or `public/` was touched beyond the two TS-error fixes above. Claude Code's in-flight work is undisturbed.

### Commit context as of April 15

```
8005886 docs: handoff updated — user journey verified clean April 15
f695d74 fix: full walk-through verification — all user journey issues resolved
d35ab6f fix: data audit — expired deals deactivated, orphaned deals flagged, null cities noted
28ec4db fix: map page loading + error states, brand-matched white nav
b892957 fix: listing page is now a GO HERE confirmation screen with deal, directions, hours, instructions
abd899c fix: open/closed display — muted "May be closed" not red, open-now ranking bonus
7e27e5c fix: human language throughout — no developer-speak visible to users
f9db91c fix: single expiration label — never duplicate day and date
b4f4089 fix: never show $0 savings + align savings math with $23 callout
84b6383 fix: deal score algorithm — discount-first weighting, no D badge on hero card
```

The user journey was verified clean as of April 15. Any regression introduced after that commit needs a re-walk before launch.

---

## Current Blockers (Ranked by Priority)

1. **[BLOCKING] Missing env vars in puffprice.com Vercel env**
   - NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY not set
   - Every push to main fails to deploy to directory-network- project
   - Fix: 2 min in Vercel UI (see docs/ENV-VARS.md for instructions)

2. **[BLOCKING] puffprice.com domain not yet registered**
   - Without the domain, can't configure DNS, can't go live on puffprice.com
   - cleanlist.co continues to work in the meantime

3. **[HIGH] Stripe keys not set**
   - Pro ($0.99/mo) and Featured ($49/mo) checkouts return 503
   - Users who click "Get Pro" see an error
   - Fix: Add STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID, STRIPE_FEATURED_PRICE_ID

4. **[HIGH] GA4 placeholder not replaced**
   - NEXT_PUBLIC_GA_ID = "G-PLACEHOLDER" — no analytics firing
   - Fix: Get real GA4 Measurement ID, add to Vercel env vars

5. **[MEDIUM] Two SQL migrations not yet run**
   - 44 duplicate deals still active in DB
   - 13 orphan slugs showing city="Illinois" instead of real city name
   - Fix: Run sql/dedupe-deals-2026-04-15.sql and sql/backfill-orphan-listings-2026-04-15.sql

6. **[MEDIUM] hi@puffprice.com not set up**
   - Email on brand.ts but inbox doesn't exist yet
   - Fix: Create hi@puffprice.com (via Cloudflare Email or Google Workspace)

---

## What Is Working (Verified Against Live Site)

- cleanlist.co is live and passing all health checks
- 56 active deals loading correctly
- Location detection (GPS → Peoria, not Chicago)
- Hero deal card → GO HERE → /l/[slug] journey
- City filter, category filter
- Deal scoring (discount-first, no D badges, no $0 savings)
- Mobile hamburger nav
- FourTwentyBanner code ready (activates April 17)
- LocalBusiness + Product schema on listing and deal pages
- UTM capture (UtmCapture.tsx)
- Admin dashboard (password: cleanlist2026 — change before launch)
- Sitemap.ts and robots.ts configured

---

## Workflow Rules (for next Code session)

- Read HANDOFF.md first — it has the complete user journey verification and per-task log
- Read docs/ENV-VARS.md for env var context before touching any API route
- Commit with descriptive messages, push main for auto-deploy (~40s)
- Never heredoc in zsh — use python3 -c for multi-line file writes
- Never hardcode secrets in committed files
- Claude Code does NOT touch Gmail. Outreach is owned by Cowork.
- Check Vercel after every push

---

## Outreach Status

- Wave 1: Sent (Cowork owns this — do not touch in Code)
- Wave 2: Drafted — waiting on domain name confirmation before sending
- Target: 20 dispensary outreach emails after puffprice.com is confirmed

---

## Key Contacts

- Matthew Burns — matthew@jacarandapeoria.com (project owner)
- Support email: hi@puffprice.com (not yet active)
- Admin email in Resend notifications: matthew@jacarandapeoria.com
