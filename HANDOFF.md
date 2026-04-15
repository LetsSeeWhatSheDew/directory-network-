# CleanList — Session Handoff

**Last updated:** April 15, 2026 (end of day)
**Owner:** Matthew Burns (Peoria, IL) · matthew@jacarandapeoria.com

> Living doc. Any new Claude Code session reads this first to skip
> re-exploring the whole codebase. Keep it short. Update it every
> time priorities shift.

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

## USER JOURNEY STATUS (end of Apr 15 integrity pass)

A real person in Peoria can now:
  1. Land on cleanlist.co → see one clear recommendation (the hero
     deal card) — no navy background, no competing clutter
  2. Tap **GO HERE →** → land on /l/nuera-east-peoria → see the deal
     prominently, a **"→ No code needed — deal applies at checkout"**
     instruction, a tap-to-Maps address, a **"Back to Peoria deals"**
     back link, and the phone as a tap-to-call
  3. Tap **3 other deals near Peoria →** → /deals/all?city=Peoria →
     see a city-aware subtitle, a single **"📍 Deals near Peoria, IL"**
     banner, cards with discount-first scoring (no D badges), and
     exactly ONE expiration label per card

End-to-end journey verified against live production with curl +
grep after every commit.

### What was fixed in this session (per-task)
| # | Status | Fix |
|---|--------|-----|
| 1 | ✅ | Purged "DirectoryNetwork" / "Directory Network" / "Project Green" from 36 user-facing files. One brand only |
| 2 | ✅ | Deduplicated deals at UI + DB levels. 44 DB dupes covered by `sql/dedupe-deals-2026-04-15.sql` (needs manual run — anon is RLS-blocked); UI-level dedupeDeals() works today via deal_id / slug+title key |
| 3 | ✅ | Rewrote scoreDeal() — discount-first weights, missing-data no longer penalized, 30%+ floors at C, shouldShowGrade() hides D badges entirely |
| 4 | ✅ | Savings card never renders `$0`. Under-threshold savings now fall back to "30% OFF" instead of an awkward `You save · $0` layout |
| 5 | ✅ | AVG_SPEND storewide: $65 → $75. 30% × $75 = $22.50 ≈ $23 → callout and card math finally agree |
| 6 | ✅ | Single expiration label per card. Clean day ladder: today / tomorrow / weekday / Apr 28 / hide past 30d |
| 7 | ✅ | "Filtered to Peoria" → "Deals near Peoria, IL". "Switch category" → "What are you looking for?". Small-result copy: "2 deals near Peoria right now. More coming soon — get alerts" instead of apologetic "Only 2 local deals..." |
| 8 | ✅ | "Closed" red → "May be closed" muted slate. +25pt open-now bonus in /api/deals/recommend so reachable-right-now deals rank higher |
| 9 | ✅ | /l/[slug] rebuilt: prominent deal card at top, `howToUseDeal()` extracts promo codes or produces instruction line, address is a maps link, city-aware back link |
| 10 | ✅ | /map: white brand nav, page-level loading spinner, 10s CDN timeout → "Browse dispensaries →" error fallback |
| 11 | ✅ | Data audit complete. 0 expired-but-active, 0 null city, 0 null slug. Found 13 orphan slugs that need master_listings rows (SQL backfill shipped). lib/cityNormalize.ts shims orphan cities client-side + broadens "Peoria" → metro (+East Peoria, +Bartonville) |
| 12 | ✅ | Walk-through verified against live production URLs |
| 13 | ✅ | This document |

### Bonus: UTM handling for Reddit/FB/Nextdoor campaigns
`app/components/UtmCapture.tsx` — no-render client island in the
root layout. Writes any `utm_*` params on first landing to
sessionStorage and fires one `campaign_landing` gtag event. UTM
params don't break anything (verified: 200 OK, same page size).

---

## Still needs HUMAN ACTION (Matthew)

### Immediate / blocking
1. **Register domain tonight** — PuffPrice.com or GetBudBuck.com
   (both ~$11 on Namecheap/Cloudflare). Decide-and-pull-trigger is
   the blocker for everything branded.
2. **Run two SQL migrations in Supabase SQL editor** (anon key is
   RLS-blocked from writes):
   - `sql/dedupe-deals-2026-04-15.sql` — deactivates 44 duplicate
     rows. Expected effect: active count drops 100 → 56
   - `sql/backfill-orphan-listings-2026-04-15.sql` — inserts 13
     missing master_listings rows so Chicago/Peoria-area deals
     stop displaying city="Illinois". Review/correct auto-
     derived names post-insert
3. **Stripe keys in Vercel** — unblocks Pro $0.99/mo + Featured
   $49/mo. `STRIPE_SECRET_KEY`, `STRIPE_FEATURED_PRICE_ID`,
   `STRIPE_PRO_PRICE_ID`. `/api/stripe/create-checkout` returns
   a helpful 503 until set.
4. **GA4 real ID** — `NEXT_PUBLIC_GA_ID` is still the placeholder
5. **RESEND_API_KEY** — for the alerts system (whenever that ships)

### Post-name decision
6. Update `lib/brand.ts` with the new brand. It cascades to every
   page title, OG tag, footer. Also the one-pager and pitch script
   reference "CleanList" — same cascade applies.

### Outreach (handled by Cowork — DO NOT TOUCH in Code)
- Wave 1: sent
- Wave 2: drafted
- Claude Code does NOT touch Gmail. Cowork owns outreach.

### 4/20 window
- `FourTwentyBanner` auto-gates to render **April 17 00:00 — April
  20 23:59 CT**. Nothing to do. Verify it appears on the homepage
  on the 17th.

---

## What's working end-to-end ✅

Site
- **Homepage (`/`)** — green money stripe, white nav (desktop
  links + mobile hamburger), location line, big hero deal card
  with GO HERE button, `$X per trip` callout, 3-other-deals
  link, 2×2 category grid below fold, alerts CTA, footer.
- **Location detection** — GPS-first via `navigator.geolocation` +
  Nominatim reverse geocode. IP fallback only after GPS denial.
  Event-driven: hero card shows a shimmer skeleton until GPS
  resolves (no Chicago flash for Peoria users). sessionStorage
  key `cl_city` + CustomEvent `cl:location-resolved`.
- **Deal engine pages (`/deals/[category]`)** — awaits params +
  searchParams per Next 16. City-aware subtitles + banners. Metro
  aliasing (Peoria → East Peoria + Bartonville). Category switcher
  pills preserve `?city=`. `<3 local results` → alerts-CTA panel
  instead of apologetic copy. Deal scoring with discount-first
  weights, no D badges rendered.
- **Listing pages (`/l/[slug]`)** — GO HERE confirmation screen.
  Active deals at top, `howToUseDeal()` instruction line, maps
  link on address, phone tap-to-call, city-aware back link via
  `?city=` param.
- **Alerts (`/alerts`)** — Free + Pro $0.99/mo tiers, Stripe
  checkout button (503s until keys are set), live-updating savings
  calculator at the bottom.
- **Map (`/map`)** — Leaflet + OpenStreetMap tiles, green `$` pins
  for deals, gray dots for listings without deals. Loading state
  + 10s failure fallback.
- **Admin (`/admin`)** — password-gated dashboard of leads &
  alerts.
- **SEO** — og-image, favicon, sitemap, robots, LD+JSON Product
  + ItemList + BreadcrumbList + LocalBusiness schemas.

Data & infra
- Supabase: `deals`, `deal_alerts`, `deal_clicks`, `master_listings`,
  `active_deals_with_listings` view.
- Service-role key in env for SSR queries where the anon key
  wouldn't have RLS permission; anon key hardcoded as fallback on
  read paths so a missing env doesn't hard-break a build.

---

## Key files (skip the rest of the tree)

Homepage + deal flow
- `app/page.jsx` — homepage
- `app/components/HeroDealCard.tsx` — the one-recommendation card
- `app/components/HomeDealCards.tsx` — below-fold top-3 cards
- `app/components/LocationAware.tsx` — GPS+IP detection, event
  dispatcher
- `app/components/SavingsCallout.tsx` — "save up to $X per trip"
  line beneath the hero card
- `app/components/MobileNavMenu.tsx` — hamburger
- `app/components/UtmCapture.tsx` — one-shot UTM → sessionStorage +
  gtag

Deals + listing
- `app/deals/[category]/page.tsx` — city-aware deal engine
- `app/l/[id]/page.tsx` — listing page / GO HERE destination
- `app/api/deals/recommend/route.ts` — scored ranking API with
  open-now bonus + metro-aware city filter

Libs
- `lib/dealScoring.ts` — estimateSavings / formatSavingsDollars /
  scoreDeal / gradeDeal / shouldShowGrade
- `lib/cityNormalize.ts` — displayCity / metroCities / isInMetro /
  cityFromSlug

SQL (manual-run migrations)
- `sql/dedupe-deals-2026-04-15.sql` — pending
- `sql/backfill-orphan-listings-2026-04-15.sql` — pending
- `sql/deals-schema.sql` / `sql/create-view.sql` / `sql/deals-seed.sql` —
  existing

Audit log
- `~/Desktop/DN-Research/data-audit-april15.txt` — duplicate groups,
  orphan slug list, city drift

---

## Supabase
- URL: `https://hnbjufmtmrhexmdrfubw.supabase.co`
- Anon key (public) hardcoded as fallback in every server fetch
- View: `active_deals_with_listings` (deals ⨝ master_listings).
  Known quirk: view returns `city='Illinois'` when no listing row
  matches — shimmed client-side by `displayCity()` until the
  orphan-backfill SQL runs.

---

## Workflow rules
- Commit with descriptive messages · push `main` for deploy.
- Never heredoc in zsh — use `python3 -c` for multi-line writes.
- Never hardcode secrets in committed files.
- Check Vercel after every push (happens via the CLI automatically).
- Code does NOT touch Gmail. Outreach is owned by Cowork.
