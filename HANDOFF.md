# CleanList — Session Handoff

**Last updated:** April 14, 2026 (end of day)
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

Site
- Homepage (/) — hero with cannabis SVGs, primary "See all deals near you"
  CTA + 2×2 secondary category grid, hero savings callout ("$23/trip"),
  live ticker with red pulsing LIVE dot + real dispensary names + "Save
  N%", location-aware top-3 deal cards with Deal Score A/B/C/D badges and
  prominent 2rem savings numbers.
- Location detection — GPS-first via `navigator.geolocation` +
  Nominatim reverse geocode. IP fallback only when denied/unavailable.
  Manual override via "Not in {City}? Change location" link + inline
  input. Stored in sessionStorage, propagates to both ticker and deal
  cards which re-fetch filtered to detected city (with statewide
  fallback if <3 local deals).
- Deal engine pages (/deals/[category]) — params awaited, schema.org
  ItemList + BreadcrumbList, "Last updated X ago", price-history trend
  chips (better/worse), A/B/C/D Deal Score badges, **expiration urgency
  badges** (⚡today/⏱soon/{Weekday}).
- Alerts (/alerts) — two tiers only (Free no-account, Pro \$0.99/mo).
  Pro card has email input + Stripe-checkout button + "Less than a
  dollar a week" anchor + J.R. Chicago testimonial. "What Pro actually
  feels like" narrative section. Live-updating 3-input savings
  calculator at the bottom (~$X/week → free-eighths).
- /alerts/preferences — full preference form (city/radius/categories/
  frequency), upserts to deal_alerts by email.
- /dispensaries — 293 dispensaries grouped by city, deal-count chips,
  humanized names from slugs.
- /savings and /savings/dashboard — shareable calculator + personal
  savings log (localStorage, "you saved \$X this month").
- /map — Leaflet map, green `$` pins for dispensaries with deals,
  gray dots otherwise, All/Deals-only toggle.
- /search — ILIKE across master_listings name+city+address1.
- /about, /early-access (now indexable), /claim/[slug], /upgrade.
- /dispensary/submit-deal — dispensary autocomplete, live deal
  preview card, inline validation, confirmed page with Featured
  upsell.
- /api routes: deals/recommend (scored, city-filtered, `&limit=N`),
  location (ipapi), price-history/[slug], alerts/preferences,
  claim, listings/search, stripe/create-checkout, dispensary/
  submit-deal.
- GA4 with event tracking: category_click, deal_click, deal_view,
  deal_cta_click, alert_signup, upgrade_click, search,
  location_detected.

Data & infra
- Supabase: deals, deal_alerts, deal_clicks, master_listings,
  active_deals_with_listings view.
- New SQL pending apply: sql/listing-claims.sql,
  sql/deal-price-history.sql (migrations live in repo, run
  manually in Supabase SQL editor).
- OG image + favicon + sitemap.ts + robots metadata.
- 4/20 banner (auto-gates April 17–20, 2026) already deployed.

## What's pending ❌
- **Stripe keys** (blocks ALL revenue) — `STRIPE_SECRET_KEY`,
  `STRIPE_FEATURED_PRICE_ID`, new $0.99/mo `STRIPE_PRO_PRICE_ID`.
  Checkout route returns a helpful 503 until set.
- **Email system** (blocks alerts) — 201 outreach drafts unsent,
  no SendGrid/Resend wiring yet.
- **Brand name decision** (blocks domain + email + logo final) —
  candidates: PuffPrice (~$11), BudBuck (~$11), GreenRoute, or
  keep CleanList.
- **listing-claims.sql** not yet run in Supabase — claim API
  returns 502 until applied.
- **Price history data** — table exists, but needs a scraper/
  cron populating it before trend chips actually render. Right
  now they quietly never show.

## Immediate priorities (in order)
1. **Register domain tonight** — PuffPrice.com or GetBudBuck.com
   (both ~$11 on Namecheap/Cloudflare). Decide-and-pull-trigger is
   the blocker for everything branded.
2. **Stripe account + keys in Vercel** — unblocks Pro \$0.99/mo +
   Featured \$49/mo + first revenue.
3. **Send 5 4/20 outreach emails** from Gmail drafts created today
   (Terrace Moline, High Haven Elgin, NOXX East Peoria, Ivy Hall
   Peoria, Seven Point Danville). Before Friday 4/18.
4. **Run listing-claims.sql + deal-price-history.sql** in Supabase
   SQL editor.

## Key decisions made today (April 14)
- **Two consumer tiers only.** GPT advised killing Standard; Matthew
  agreed. Free (no-account browse + weekly digest) + Pro (\$0.99/mo,
  instant SMS + price history + Beat-My-Last-Price + flash early
  access + monthly savings report).
- **Pro starts at \$0.99/month.** Deliberately cheap — remove
  friction, build habit, raise later.
- **Deal engine is the product, not a directory.** Everything
  optimizes for "where should I go right now, and why?" — the
  directory surface is a byproduct.
- **Location detection = GPS-first.** IP is only a fallback (was
  routing Peoria users to Chicago through ISP hubs). Manual
  override always wins.
- **Visual hierarchy on homepage:** "See all deals" is the primary
  full-width action; categories are secondary in a 2×2 grid.
- **4/20 framing:** banner auto-gates Apr 17–20; outreach template
  is "4/20 is Sunday — here's how to not lose your biggest
  weekend."

## Tool stack
- **Claude Code** — primary builder (this repo, features, fixes).
- **Chrome (with Claude browser MCP)** — browser automation + QA.
- **Cowork** — long autonomous sessions when work spans hours.
- **Chat (ChatGPT/Claude.ai)** — strategy, naming, outreach copy
  review.

## Key files (skip the rest of the tree)
- `app/page.jsx` — homepage (hero + location-aware ticker + cards)
- `app/components/HomeTicker.tsx`, `HomeDealCards.tsx`,
  `LocationAware.tsx` — location-aware client islands
- `app/deals/[category]/page.tsx` — deal engine
- `app/alerts/page.tsx` + `AlertsCalculator.tsx` + `ProCheckoutButton.tsx`
- `app/dispensary/submit-deal/page.tsx` + `DispensaryAutocomplete.tsx`
  + `confirmed/page.tsx`
- `app/api/deals/recommend/route.ts` — scored recommender (+&limit, city)
- `app/api/price-history/[slug]/route.ts`, `app/api/location/route.ts`,
  `app/api/listings/search/route.ts`, `app/api/stripe/create-checkout/route.ts`
- `lib/dealScoring.ts` — savings estimation + A/B/C/D grading
- `sql/deals-schema.sql`, `sql/deals-seed.sql`, `sql/create-view.sql`,
  `sql/listing-claims.sql`, `sql/deal-price-history.sql`
- `outreach/420-drafts.md` — 5 4/20 email draft IDs

## Supabase
- URL: `https://hnbjufmtmrhexmdrfubw.supabase.co`
- Anon key hardcoded as fallback in every server fetch so builds
  don't break without env.
- View: `active_deals_with_listings` (deals ⨝ master_listings).

## Workflow rules
- Commit with descriptive messages · push `main` for deploy.
- Never heredoc in zsh — use `python3 -c` for multi-line writes.
- Never hardcode secrets in committed files.
- Check Vercel after every push.
