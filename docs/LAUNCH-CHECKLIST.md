# PuffPrice 4/20 Launch Checklist
Last updated: April 15, 2026
Audited by: Cowork sprint (Claude Sonnet 4.6)

Status key: [x] = done/verified  [ ] = still needed  [~] = partial/pending

---

## CRITICAL: Fix Before Anything Else

- [ ] Add NEXT_PUBLIC_SUPABASE_URL to Vercel project "directory-network-" (puffprice env)
- [ ] Add NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel project "directory-network-" (puffprice env)
  > These two missing vars are causing every build to the puffprice.com environment to fail.
  > Go to: Vercel → directory-network- → Settings → Environment Variables
  > Values are identical to what is already in the "directory-network" project.

---

## Must-Have Before April 17 (Banner Deploy Day)

### Domain & DNS
- [ ] puffprice.com domain registered (~$11 on Namecheap or Cloudflare)
- [ ] DNS configured to point to Vercel (add domain in Vercel → directory-network- → Settings → Domains)
- [ ] Domain verified and SSL certificate provisioned

### Environment Variables (Vercel — directory-network- project)
- [ ] NEXT_PUBLIC_SUPABASE_URL — copy from directory-network project
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY — copy from directory-network project
- [ ] STRIPE_SECRET_KEY — from Stripe Dashboard → Developers → API Keys
- [ ] STRIPE_PRO_PRICE_ID — create $0.99/mo product in Stripe first
- [ ] NEXT_PUBLIC_GA_ID — real GA4 ID (replace G-PLACEHOLDER)
- [ ] RESEND_API_KEY — from resend.com

### Brand
- [x] lib/brand.ts updated to PuffPrice (name, domain, url, supportEmail, tagline)
- [x] Brand cascaded to all page titles, OG tags, footer via brand.ts import
- [ ] hi@puffprice.com email address set up (currently not active)
- [ ] og-image.png updated to PuffPrice branding (if not done yet)

### Deals & Data (Supabase)
- [x] 56 active deals showing on cleanlist.co
- [x] Expired deals deactivated (data audit ran Apr 15)
- [ ] sql/dedupe-deals-2026-04-15.sql run in Supabase SQL editor (Matthew — RLS-blocked)
- [ ] sql/backfill-orphan-listings-2026-04-15.sql run in Supabase SQL editor (Matthew — RLS-blocked)
- [x] City filter working — Peoria, Chicago, Springfield, etc.
- [x] Metro aliasing (Peoria → East Peoria + Bartonville) live via lib/cityNormalize.ts
- [x] GO HERE button functional on all listing pages

### Core UX Verified
- [x] Homepage → hero deal card → GO HERE → /l/[slug] journey works end-to-end
- [x] Deal cards: discount-first scoring, no D badges, no $0 savings
- [x] Location detection: GPS-first, IP fallback, no Chicago flash for Peoria users
- [x] Mobile hamburger nav working
- [ ] Mobile layout verified at 390px viewport width

### 4/20 Banner
- [x] FourTwentyBanner component exists — auto-gates April 17 00:00 — April 20 23:59 CT
- [ ] Banner copy reviewed and approved
- [ ] Banner verified to appear on homepage on April 17 (check after banner date hits)

---

## Nice-to-Have Before April 20

### SEO & Schema
- [x] LocalBusiness JSON-LD schema added to listing pages (PuffPrice rebrand commit Apr 15)
- [x] SpecialAnnouncement / Product / ItemList schema on deal cards
- [x] Meta titles updated across all pages (PuffPrice rebrand commit Apr 15)
- [ ] City pages answer-formatted (H1, paragraph structure for featured snippets)
- [ ] Sitemap.xml submitted to Google Search Console
- [x] robots.ts configured
- [x] sitemap.ts configured

### Content
- [ ] Listing enrichment — phone numbers and hours for Chicago listings
  (Use Playwright enrichment script in scripts/ directory)
- [x] top-10-illinois-cities-content-plan.md exists (in repo root — could move to docs/)

### Performance
- [ ] Lighthouse baseline run on puffprice.com after launch
  (Lighthouse not available in current environment — run manually: npx lighthouse https://puffprice.com)

---

## Post-Launch Week of April 21+

### Outreach
- [x] Wave 1 outreach sent
- [x] Wave 2 outreach drafted
- [ ] Wave 2 outreach sent (after domain name confirmed — DO NOT touch Gmail, Cowork owns this)

### Automation
- [ ] Playwright enrichment for remaining listings (phones, hours, amenities)
- [ ] n8n deal expiry automation (auto-deactivate deals past their end_date)
- [ ] Weekly digest email (lib/weeklyDigest.ts ready — needs cron job + RESEND_API_KEY)

### Zone 4 Strategy (see docs/ZONE4-strategy.md)
- [x] Phase 1: LocalBusiness schema, city page structure, meta optimization (done Apr 15)
- [ ] Phase 2: Entity establishment (Google Business Profile, citations, backlinks)
- [ ] Phase 3: Content expansion (more city pages, category pages, blog)

### Admin & Operations
- [ ] ADMIN_PASSWORD changed from default "cleanlist2026"
- [ ] Stripe webhook configured for subscription provisioning
- [ ] Alert email system live (needs RESEND_API_KEY + cron job)

---

## Verification scripts (run before banner deploy)

```bash
# 1. Build is green
npm run build

# 2. Types are clean
npx tsc --noEmit

# 3. Required env vars present in production
vercel env ls production | grep -E "(SUPABASE|STRIPE|GA_ID|SITE_URL|ADMIN_PASSWORD)"

# 4. Live homepage warms in <1s
for i in 1 2 3; do curl -L -o /dev/null -s -w "TTFB: %{time_starttransfer}s\n" https://puffprice.com/; done

# 5. Sitemap returns 200 and contains city pages
curl -sI https://puffprice.com/sitemap.xml | head -1
curl -s https://puffprice.com/sitemap.xml | grep -c "/cannabis/illinois/"

# 6. Stripe price IDs resolve
node -e "require('stripe')(process.env.STRIPE_SECRET_KEY).prices.retrieve(process.env.STRIPE_PRO_PRICE_ID).then(p => console.log('Pro:', p.id, p.unit_amount, p.currency))"
node -e "require('stripe')(process.env.STRIPE_SECRET_KEY).prices.retrieve(process.env.STRIPE_FEATURED_PRICE_ID).then(p => console.log('Featured:', p.id, p.unit_amount, p.currency))"
```

### Performance baseline (measured April 15, 2026)

| Page | Warm TTFB | Total | Payload |
|---|---|---|---|
| `/` (homepage) | 0.55s | 0.63s | 100 KB |
| `/cannabis/illinois/peoria` | 0.91s | 1.00s | 79 KB |
| `/deals/all` | 0.92s | 0.98s | 43 KB |

Cold-start penalty observed: homepage first hit was 10.8s. Mitigation: ISR or cache the homepage Supabase reads.

When Lighthouse is available (`npm i -g lighthouse` or via Chrome devtools), capture LCP / TBT / CLS scores and append them here so we have a real before/after for the SEO push.

---

## Anything in this list that requires Matthew specifically

- Domain registration (puffprice.com)
- DNS changes (Namecheap Advanced DNS + Vercel domain add)
- Vercel env var entry (Stripe, GA, Resend keys he holds)
- Supabase service-role SQL run for dedupe (anon is RLS-blocked)
- Manual send of Wave 2 outreach + Monday digest (Cowork does not auto-send)

---

## Current Deployment Status

| Environment | URL | Build Status |
|---|---|---|
| Production – directory-network | cleanlist.co | PASSING |
| Production – directory-network- | puffprice.com (not yet configured) | FAILING — missing env vars |
| Preview | Vercel preview URLs | PASSING |

Latest commit: 536d198 — feat: PuffPrice rebrand, schema markup, SEO meta, Zone 4 Phase 1 (Apr 15, 2026)

---

## Key Files for Launch

- lib/brand.ts — brand name, domain, tagline (update once, cascades everywhere)
- app/components/FourTwentyBanner.tsx — 4/20 promotional banner (auto-dates)
- sql/dedupe-deals-2026-04-15.sql — deactivates 44 duplicate deals (needs manual run)
- sql/backfill-orphan-listings-2026-04-15.sql — fixes 13 Chicago/Peoria orphan slugs (needs manual run)
- docs/ENV-VARS.md — this project's full environment variable reference
- HANDOFF.md — full session state and what's working end-to-end
- HANDOFF-UPDATE.md — Cowork sprint summary (April 15 health audit)
