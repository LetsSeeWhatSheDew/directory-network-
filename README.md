# PuffPrice — Illinois cannabis deal intelligence

Live at [puffprice.com](https://puffprice.com). GPS-aware deal finder for Illinois dispensaries — built for a real person in a parking lot who wants to save money on weed.

## Current state (April 2026)

- **61 dispensaries** across **25 Illinois cities**
- **56 active deals** / 82 master listings
- Three deal categories (flower / edibles / vapes / concentrate / all)
- PuffPrice Index — weekly statewide flower price-per-gram benchmark (`/about/index`)
- Full listing detail pages at `/l/[slug]` with map, hours, deals, deal history
- Brand pages scaffolded at `/brand` and `/brand/[slug]` (populate when brands table lands)

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Supabase** — project ref `hnbjufmtmrhexmdrfubw`
- **Vercel** — hosting + deployment
- **Stripe** — Pro subscription ($0.99/mo)
- **Resend** — transactional email
- **Sentry** — error monitoring (scaffolded, DSN pending)

Brand config lives in `lib/brand.ts` — one string change renames the entire site.

## Business model

- **FREE** — no account, full deal access, always
- **PRO** — $0.99/mo for SMS alerts, daily digest, price history, savings dashboard

## Development

```bash
npm install
npm run dev         # local dev server
npm run build       # production build — verify before push
npm run lint        # ESLint
```

### Required Vercel environment variables

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase public
- `SUPABASE_SERVICE_ROLE_KEY` — server-side Supabase
- `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` — optional; Sentry no-ops if unset

## Three-agent workflow

Work is split across three lanes to stay out of each other's way:

- **Cowork** — owns `docs/`, `sql/`, `scripts/`. Schema migrations, SQL research, handoff docs.
- **Code** — owns `app/`, `lib/`, `components/`. Feature work, hardening, shipping.
- **Chrome** — owns browser verification. Manual QA against production after every push.

Lane rule: do not cross. If a shared file needs to change, coordinate via `docs/handoffs/`.

## Migration pattern

SQL migrations land in `sql/` (owned by Cowork). Apply pattern:

1. Cowork writes migration → commits to `sql/migrations/YYYY-MM-DD-name.sql`
2. Matthew reviews and applies via Supabase SQL Editor (or MCP)
3. Code confirms expected schema with a read-only query before relying on new columns

Never apply a migration from Code without explicit sign-off.

## Working agreement

**Watch Vercel to Ready before verifying.** After any push to `main`, the Vercel deploy takes 30–90s. Do not test against production until the deploy has flipped to Ready — you will be verifying the previous build and wasting everyone's time.

**The experience must work for a real person in a parking lot.** Not a developer. Not a PM. Every decision defers to that.

Matthew owns business decisions. Claude Code owns technical execution. Direct and honest. No cheerleading.

## Key routes

- `/` — homepage, deal cards, PuffPrice Index
- `/deals/[category]` — deal engine (flower / edibles / vapes / concentrate / all)
- `/cannabis/illinois` — state directory
- `/cannabis/illinois/[city]` — city landing with intent pages (best / open-now / recreational / deals)
- `/l/[slug]` — listing detail (deals, hours, map, deal history)
- `/dispensary/[slug]` — full profile
- `/brand`, `/brand/[slug]` — brand pages (scaffolded, empty until brands table lands)
- `/about`, `/about/index` — company + Index methodology
- `/upgrade` — Pro subscription

## Session reports

Each autonomous session writes a report to `docs/session-reports/`. Read the most recent one to understand what just shipped before starting new work.
