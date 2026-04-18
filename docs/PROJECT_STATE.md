# Directory Network - Project State
Last updated: April 12, 2026

## START NEW SESSION WITH THIS
Paste this file content into Claude and say: Continue Directory Network work.

## Project
Illinois cannabis directory. Stack: Next.js, Supabase, Vercel.
Repo: https://github.com/LetsSeeWhatSheDew/directory-network-
Local: ~/Desktop/ACTIVE/Directory-Network/Project - Directory/project-green/
Domains: cleanlist.co + ilgreen.co
Admin: cleanlist.co/admin password: cleanlist2026

## Current Status: Pre-Revenue | Build Deploying

### Key Numbers
- MRR: $0 (Stripe not connected)
- Dispensaries in DB: 50 (47 enriched + 3 Chicago stubs)
- Pages live: 200+
- Outreach drafts ready: 50+
- Emails sent: 0 (Wave 1 scheduled for Monday)
- Pricing: Free listing, Boost $49/mo, Featured $149/mo

## Supabase
URL: https://hnbjufmtmrhexmdrfubw.supabase.co
Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300
Tables: master_listings, listing_hours, listing_attributes, products_or_services, leads
ALL queries need project_tag=eq.green or you get wrong data.
listing_hours INSERT needs project_tag: green in every row or you get HTTP 400.

## Routing - CRITICAL
Intent pages (best/open-now/recreational/deals) route through:
app/cannabis/illinois/[slug]/[intent]/page.tsx
NOT through static city subfolders. Those exist but are dead code - never served.
Do NOT create more static city intent pages. [slug]/[intent] handles everything.

## What is live
- / — Homepage (consumer-first)
- /cannabis/illinois — hub
- /cannabis/illinois/[city] — 34 static city guides
- /cannabis/illinois/[city]/best|open-now|recreational|deals — intent pages via [slug]/[intent]
- /cannabis/illinois/chicago/near-wrigley-field|near-ohare|near-navy-pier|near-magnificent-mile
- /cannabis/illinois/first-time-guide|laws|open-now
- /l/[slug] — 50 listing pages
- /upgrade — Pricing page (Listed Free / Boost $49 / Featured $149)
- /admin — dashboard
- /admin/pipeline — lead pipeline
- /get-listed — lead capture form
- /sitemap.xml /robots.txt

NOINDEX: emerald-city-dispensary-chicago-il, emerald-leaf-collective-chicago-il, lakefront-cannabis-co-chicago-il

## Enriched dispensaries (47 - do not re-enrich)
nuera-aurora, zen-leaf-aurora, cookies-bloomington, beyond-hello-bloomington,
nuera-champaign, the-dispensary-champaign, sunnyside-wrigleyville, nuera-chicago,
ascend-collinsville, ivy-hall-dispensary, trinity-on-glen, trinity-on-university,
beyond-hello-peoria, nuera-east-peoria, noxx-east-peoria, revolution-dispensary-normal,
high-haven-normal, ayr-wellness-normal, beyond-hello-normal, ascend-cannabis-horizon-drive,
ascend-cannabis-downtown-springfield, high-profile-cannabis-springfield, shangri-la-springfield,
maribis-springfield, rise-dispensary-naperville, zen-leaf-naperville, lyfe-dispensary,
sunnyside-rockford, nuera-urbana, rise-joliet-colorado, rise-joliet-rock-creek,
auralight-dispensary, rise-effingham, bloom-wellness-quincy-east, bloom-wellness-quincy-west,
rise-quincy, sunnyside-danville, seven-point-danville, high-haven-elgin, verilife-schaumburg,
sunnyside-schaumburg, revolution-schaumburg, planet-13-waukegan, ivy-hall-waukegan,
terrace-cannabis-moline, revolution-moline, north-star-remedies-peoria-il

## Outreach - send Monday morning
1. nuEra Aurora - support@nueracannabis.com - 10:00 CT
2. nuEra Champaign - support@nueracannabis.com - 10:02 CT
3. nuEra Chicago - support@nueracannabis.com - 10:04 CT
4. Zen Leaf Aurora - support-il@zenleafdispensaries.com - 10:20 CT
5. Ascend Collinsville - ir@awholdings.com - 10:35 CT
6. Sunnyside Wrigleyville - store101@sunnyside.shop
7. Beyond Hello Bloomington - customercare@beyond-hello.com
8. Cookies Bloomington - info@cookiesbloomington.com
9. The Dispensary Champaign - CALL 815-208-7701 (no email)
37 additional dispensaries drafted in outreach-master-v2.xlsx (Waves 2-3)
Price pitch: We are $49/mo vs Leafly $600+ vs Weedmaps $495+

## This Week Plan
- Monday: Wave 1 emails (8 dispensaries) + call The Dispensary Champaign
- Tuesday: Wave 2 emails (15 dispensaries) + Stripe setup
- Wednesday: Wave 3 emails (14 dispensaries) + Wave 1 follow-ups
- This week: In-person visits to Peoria-area dispensaries (NOXX, nuEra, Beyond Hello, Ivy Hall)
- This week: Google Business Profile setup (checklist in DN-Research/gbp-setup-checklist.txt)

## Strategic Direction
- Consumer-first positioning: serve the person searching, not the dispensary owner
- "Open Now" is the wedge feature — exploit in marketing, SEO, alerts
- Price is supporting evidence, not the headline — lead with "we bring you customers"
- In-person visits are the unfair advantage for Peoria-area dispensaries
- Google Business Profile is free traffic — create immediately
- Deals engine is Phase 2 (after first paying customer)
- Second niche (Healers) is Phase 3

## Next actions
1. Monday: send 8 drafts, call Champaign dispensary
2. Post reddit-post-draft.txt to r/ILTrees
3. Push enrichment-batch-3.json to Supabase when Chrome delivers it
4. Connect Stripe to /upgrade page
5. In-person visits to Peoria dispensaries (see in-person-visit-prep.txt)
6. Set up Google Business Profile (see gbp-setup-checklist.txt)
7. Verify intent pages live after CDN cache clears (check age header)

## Vercel CDN warning
After fixing build errors, wait 5-10 min before testing. Stale 404s cache.
x-vercel-cache: HIT with high age = cached response, not real error. Just wait.

## DN-Research files (on Desktop)
Key reference files in ~/Desktop/DN-Research/:
- outreach-master-v2.xlsx — full pipeline (50 dispensaries, 37 drafted)
- monday-call-sheet-v2.txt — 5 dispensaries with scripts
- sales-pitch-card.txt — cold call one-pager
- competitor-analysis-april2026.txt — Leafly/Weedmaps/Jane/Dutchie pricing
- content-calendar-week1.md — 5 blog posts planned
- city-seo-content.md — SEO content for 5 city pages
- scripts/push-enrichment.py — Supabase push script
- scripts/push-enrichment-3.py — batch-3 variant (scheduled watcher running)
