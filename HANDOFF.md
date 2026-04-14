# CleanList — Session Handoff

**Last updated:** April 14, 2026
**Owner:** Matthew Burns (Peoria, IL) · matthew@jacarandapeoria.com

> Living doc. Any new Claude Code session reads this first to skip re-exploring
> the whole codebase. Keep it short. Update it every time priorities shift.

---

## What this project is
Illinois cannabis deal intelligence engine. Answers one question:
**"Where's the best deal on weed near me right now?"**

- Live site: https://cleanlist.co
- Repo: https://github.com/LetsSeeWhatSheDew/directory-network-
- Deploy: push `main` → Vercel auto-deploys (~40s)
- Stack: Next.js 16 (App Router, React 19) · Supabase · Tailwind v4 · Vercel
- Admin: /admin (password `cleanlist2026`)

---

## What's working ✅
- **Deal engine pages** (`/deals/[category]`) — fixed today: Next.js 16 params
  is a Promise, page was reading synchronously → `category=eq.undefined` →
  0 results despite 45 active deals. Now awaits params. Covers flower,
  edibles, vapes, concentrate, all.
- **Homepage** (`/`) — hero with cannabis plant SVGs, 7-blade leaf / gummy
  bear / vape pen / crystal / flame category icons at 36px, logo mark in
  nav, live deal-count stats strip, 4/20 banner (auto-shows Apr 17–20 only).
- **Alerts signup** (`/alerts`)
- **Listing pages** (`/l/[id]`)
- **City pages** (`/cannabis/illinois/[slug]` and `/[slug]/[intent]`)
- **Upgrade page** (`/upgrade`) — 3-tier pricing, buttons wired to Stripe
  checkout, graceful 503 when keys missing
- **About page** (`/about`) — personal brand story, IDFPR coverage numbers
- **OG / Twitter metadata** — root layout, og-image.png rendered
- **Favicon** — public/favicon.svg (navy + list lines + green dot)
- **Admin**

## What's broken or incomplete ❌
- **Stripe** — scaffold built, env vars not yet set in Vercel
  (`STRIPE_SECRET_KEY`, `STRIPE_FEATURED_PRICE_ID`, `STRIPE_PRO_PRICE_ID`).
  Route returns helpful 503 until keys land.
- **Name change pending** — candidates: PuffPrice, BudBuck, GreenRoute.
  Decide before domain + email + logo finalize.
- **Email system** — not set up. 201 outreach drafts sit unsent.
- **Webhook** — no `/api/stripe/webhook` yet to provision featured listings
  post-payment. Metadata (`tier`, `listing_slug`) is already attached to
  checkout sessions so the webhook can read it when we add it.

## Immediate next priorities (in order)
1. **Name decision** — blocks domain, email, logo lock-in
2. **Stripe keys in Vercel** — unblocks `Featured $49/mo` and `Pro $4.99/mo`
3. **Send outreach emails** — 201 drafts queued; need sending infra +
   from-address on new domain
4. **4/20 deals push** — banner is already live-gated to Apr 17–20; push
   extra deals into Supabase that week

## Key decisions made
- Pivoted from directory to **deal engine** — "where should I go right now, and why?"
- Headline locked: **"Best Bud For Your Buck$"** · subtitle: **"Low Prices. High Times."**
- Pricing: Dispensary Free / **$49/mo Featured** / $149/mo Boost · Consumer Free weekly / $3.99 daily / **$4.99 SMS**
- Visual: navy (#0f1f3d) + green (#16a34a / #4ade80), Georgia serif, real SVG cannabis icons (no emoji)
- Coverage claim: **293 dispensaries, 162 Illinois cities** (IDFPR)

## Open questions
- Final brand name — PuffPrice vs BudBuck vs GreenRoute (or keep CleanList?)
- Email domain — jacarandapeoria.com vs new brand domain
- SMS provider for $4.99 instant alerts — Twilio? MessageBird?

## Revenue status
- **$0 MRR**
- Stripe scaffold built · keys not entered
- 201 outreach emails drafted · 0 sent

---

## Key files (skip the rest of the tree)
- `app/page.jsx` — homepage (hero, stats, how-it-works, deals, cities)
- `app/deals/[category]/page.tsx` — deal engine pages
- `app/about/page.tsx` — about / brand story
- `app/alerts/page.tsx` — consumer alerts signup
- `app/upgrade/page.tsx` — pricing tiers + checkout wiring
- `app/api/stripe/create-checkout/route.ts` — Stripe REST (no SDK)
- `app/layout.tsx` — root metadata (OG, Twitter, favicon)
- `lib/decisionEngine.ts` — ranking algorithm
- `sql/deals-schema.sql`, `sql/deals-seed.sql`, `sql/create-view.sql`
- `public/favicon.svg`, `public/og-image.{svg,png}`

## Supabase
- URL: `https://hnbjufmtmrhexmdrfubw.supabase.co`
- Tables: `deals`, `deal_alerts`, `deal_clicks`, `master_listings`
- View: `active_deals_with_listings` (joins `deals` + `master_listings`)
- Anon key in CLAUDE.md · hardcoded as fallback in server fetches

## Workflow rules
- Commit with descriptive messages · push `main` for deploy
- Never heredoc in zsh (breaks) — use `python3 -c` for multi-line writes
- Never hardcode secrets in committed files
- Check Vercel after every push
