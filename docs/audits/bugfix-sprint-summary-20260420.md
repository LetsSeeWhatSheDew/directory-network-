# Bugfix Sprint — April 20, 2026

COWORK audit complete. See individual audit docs for details.
Green light: this file exists = Code can start.

## Critical Finding: lat/lng Gap
Only 1 of 61 IL dispensaries has lat/lng populated (column names: lat, lng NOT latitude/longitude).
This affects Task 3 ranking — all dispensaries except Emerald City Chicago get distance=0.
Flag in final report, fix tomorrow with geocoding run.

## Execution Order

### 1. Logo Render + Cleanup
- NULL out ivy-hall-waukegan (High Haven logo mismatch from April 11 enrichment)
- SQL: UPDATE master_listings SET logo_url = NULL WHERE slug = 'ivy-hall-waukegan' AND logo_url LIKE '%highhavencanna%'
- Run in Supabase SQL Editor (project: hnbjufmtmrhexmdrfubw)
- Wire <img onError={hide}> with letter-fallback in dispensary components
- grep: grep -rn "logo_url" --include="*.tsx" --include="*.ts" app/ components/
- REVIEW: the-dispensary-champaign uses thedispensaryfulton.com domain — verify correct location

### 2. NOXX No-Deals Query
ROOT CAUSE: A — NOXX genuinely has 0 deals in deals table.
ACTION: SKIP. The empty-state display is correct behavior.
CONFIRM: deals table FK is listing_slug (text), NOT dispensary_id (uuid).

### 3. Ranking-Reads-Cookie (HIGHEST IMPACT)
- Live /deals/flower shows Chicago result for ALL users (no location awareness)
- grep: grep -rn "rankDeals|sortDeals|rank_deals|.sort.*savings" --include="*.ts" --include="*.tsx" app/ lib/ components/
- Three callers: /deals/[category], /deals/all Near me, / homepage below-fold
- Column names in master_listings: lat, lng (confirmed)
- For null lat/lng dispensaries: score as distance=0 (rank by savings)

### 4. Kill "vs. area average"
- CONFIRMED LIVE: <div class="save-vs">vs. area average</div> on /deals/flower
- grep: grep -rn "area average|save-vs|vs. area" --include='*.tsx' --include='*.ts' app/ components/
- Fix: remove the .save-vs div entirely
- Zero grep hits required after fix

### 5. City, State Labels
- CONFIRMED: Deal cards show "Illinois" not city name
- BONUS BUG: Dispensary name shows as slug not proper name
- Fix: {deal.city ? deal.city + ', ' + (deal.state_abbrev || 'IL') : 'IL'}
- Also fix dispensary name: need join from deals to master_listings.name

### 6. Anonymize About Page
- File: app/about/page.tsx
- CONFIRMED PRESENT: "I'm Matthew Burns. I live in Peoria, Illinois."
- CONFIRMED PRESENT: matthew@jacarandapeoria.com
- Replace with Variant A (see copy-audit doc)
- Change email to hello@puffprice.com

### 7. "May be closed" -> Confident Status
- Not seen on live pages currently but code path exists
- grep: grep -rn "May be closed|maybeClosed" --include='*.tsx' app/ components/
- Fix: "Check hours" for missing hours, "Open until X" / "Closed - opens Y" for known hours

### 8. Mobile Address Formatting
- File: app/l/[id]/page.tsx (dn-hero-location element)
- Live: single-line address wraps on mobile
- Fix: Split into address1 + city/state/zip on separate lines

### 9. Map Fix or Hide
- Not audited. grep mapbox|leaflet|MAPBOX_TOKEN in app/ lib/ components/
- If fix >20min: redirect /map -> /dispensaries
- Fix "0 dispensaries" count query regardless (add project_tag=eq.green filter)

### 10. Google Places Logo Backfill — WAITS ON CHROME WAVE 4
- PRECONDITION: GOOGLE_PLACES_API_KEY in Vercel env
- NOTE: No place_id column in master_listings. Use Text Search by name+city.
- Script: scripts/backfill-logos-google-places.ts

### 11. Admin Dashboard Queries
- CONFIRMED: Shows "0 TOTAL LISTINGS" and "56 PAGES LIVE"
- FINDING: 56 = count of deals table rows (not site pages)
- Fix: Change count query to master_listings with project_tag=eq.green filter
- File: app/admin/page.tsx

## Flag-If-Hit Risks
- lat/lng gap: 60/61 dispensaries have no geocoordinates (fix tomorrow)
- Hours data gap: 11 dispensaries missing hours (use "Check hours" label, fix tomorrow)
- Route duality /l/ vs /dispensary/: both exist, address tomorrow
- Stripe tasks: SKIP entirely
- Pre-existing TS errors in admin-auth and stripe/webhook: do not touch
