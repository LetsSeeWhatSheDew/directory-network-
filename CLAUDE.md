# CleanList.co — Project Context for Claude Code

## What this project is
Illinois cannabis deal intelligence engine. Answers one question:
"Where's the best deal on weed near me right now?"

## Brand
- Name: CleanList (changing soon — candidates: PuffPrice, BudBuck, GreenRoute)
- Headline: "Best Bud For Your Buck$ — Low Prices. High Times."
- Colors: navy `#0f1f3d`, green `#16a34a`
- Font: Georgia serif + system-ui

## Stack
- Next.js 16 App Router
- Supabase (postgres + RLS)
- Vercel (auto-deploy from GitHub main)
- GitHub: https://github.com/LetsSeeWhatSheDew/directory-network-
- Live site: https://cleanlist.co

## Supabase
- URL: `https://hnbjufmtmrhexmdrfubw.supabase.co`
- Anon key (public): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300`
- Tables: `deals`, `deal_alerts`, `deal_clicks`, `master_listings`
- View: `active_deals_with_listings` (joins `deals` + `master_listings`)

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

## Current critical bug
`/deals/flower`, `/deals/edibles`, `/deals/all` all show "No active deals" despite:
- 45 deals in Supabase confirmed via direct API call
- `active_deals_with_listings` view confirmed working (returns 3 rows when queried directly)
- Env vars set in both `.env.local` and Vercel dashboard
- `force-dynamic` and `cache: no-store` both set

Suspected cause: unknown — Claude Code should diagnose and fix this as first task.

## Git workflow
- Always commit with descriptive messages
- Push to `main` — Vercel auto-deploys in ~40 seconds
- Never use heredoc syntax (breaks zsh) — use `python3 -c` for multi-line file writes

## Admin
- `cleanlist.co/admin` — password: `cleanlist2026`
- Vercel: https://vercel.com/matthews-projects-6520d24c/directory-network

## Revenue model
- Dispensaries: Free listing / $49/month Featured / $149/month Boost
- Consumers: Free weekly digest / $3.99 daily email / $4.99 instant SMS
- Stripe scaffold built but keys not yet entered

## What NOT to do
- Never use heredoc (`<<EOF`) in terminal commands — use `python3 -c` instead
- Never hardcode secrets in committed files
- Never break the build — check Vercel after every push
