# Orphan Dispensary Research — 2026-04-22 Cowork morning

**Trigger:** the Apr 22 morning migration `2026-04-22-fix-deal-listing-joins.sql` deactivated 7 deals (`status_reason='orphaned'`) because their `listing_slug` had no matching `master_listings.slug` row. Six unique slugs were involved.

**Outcome:** all 6 confirmed real, currently-operating Illinois adult-use dispensaries. Mood Shine — flagged as suspect — is woman-owned, BBB-listed, and absolutely real. **No scraper artifacts.** Migration `sql/migrations/2026-04-22-create-orphan-master-listings.sql` creates the 6 master_listings rows + 42 listing_hours rows + reactivates the 7 deals to `imported_not_verified`.

**Note on sourcing:** the IDFPR Adult Use Dispensary PDF surfaced in several searches (`idfprapps.illinois.gov/.../AdultUseDispensaries.pdf`) but per the session brief, IDFPR direct links were skipped due to a malware redirect Chrome flagged on Apr 21. Primary sourcing relied on dispensary websites, Patch local-news coverage, BBB business profiles, Yelp listings, and Curaleaf's own corporate site.

---

## 1. Bisa Lina — Joliet
- **Slug:** `bisa-lina-joliet`
- **Legal name:** Bisa Lina (cannabis dispensary outlet)
- **Address:** 2121 W Jefferson St, Joliet, IL 60435
- **Phone:** (815) 418-0200
- **Website:** https://bisalina.com/locations/joliet-illinois-dispensary/
- **Status:** Active. Newly opened on W Jefferson (occupies the former NAPA Auto Parts site)
- **Hours:** Mon–Sun 6:00 AM – 10:00 PM (per Patch coverage of opening)
- **Sources:**
  - https://bisalina.com/locations/joliet-illinois-dispensary/
  - https://patch.com/illinois/joliet/joliets-new-cannabis-store-bisa-lina-opens-lowest-prices-state
  - https://patch.com/illinois/joliet/adult-use-cannabis-dispensary-coming-west-jefferson-street-joliet
  - https://www.shawlocal.com/the-herald-news/2026/03/31/cannabis-dispensary-opening-joliet-location/

## 2. Cookies — Chicago
- **Slug:** `cookies-chicago`
- **Legal name:** Mint Ventures LLC d/b/a Cookies Chicago (license cultivated/distributed via Revolution Cannabis)
- **Address:** 215 N Clinton St, Chicago, IL 60661
- **Phone:** (312) 313-7374
- **Website:** https://cookieschicago.co/
- **License:** Adult Use Dispensing Organization 284.000157-AUDO, issued 2024-01-19
- **Hours:** Mon–Sat 9:00 AM – 9:00 PM, Sun 10:00 AM – 8:00 PM
- **Sources:**
  - https://cookieschicago.co/
  - https://www.yelp.com/biz/cookies-chicago-3
  - https://www.revcanna.com/learn/welcome-to-illinois-cookies-x-revolution/

## 3. Curaleaf — Morris
- **Slug:** `curaleaf-morris`
- **Legal name:** Curaleaf IL Morris Dispensary
- **Address:** 2400 Hiawatha Pioneer Trail, Morris, IL 60450
- **Phone:** (815) 513-0124
- **Website:** https://curaleaf.com/dispensary/illinois/curaleaf-il-morris
- **Status:** Active (medical + adult use)
- **Hours:** Mon–Thu 9–7, Fri 9–8, Sat 9–7, Sun 10–6
- **Sources:**
  - https://curaleaf.com/dispensary/illinois/curaleaf-il-morris
  - https://morrisil.org/business_directory/curaleaf-cannabis/
  - https://www.yelp.com/biz/curaleaf-morris-2

## 4. Nature's Treatment of Illinois — Milan
- **Slug:** `natures-treatment-milan`
- **Legal name:** Nature's Treatment of Illinois (NTI)
- **Address:** 973 Tech Dr, Milan, IL 61264
- **Phone:** (309) 283-7642
- **Website:** https://www.ntillinois.com/
- **Status:** Active (medical + adult use); open 365 days/year
- **Hours:** Mon–Sat 6:30 AM – 9:45 PM, Sun 8:00 AM – 9:00 PM
- **Sources:**
  - https://www.ntillinois.com/
  - https://www.ntillinois.com/contact-us
  - https://www.yelp.com/biz/natures-treatment-milan
  - https://www.leafly.com/dispensary-info/nature-s-treatment-of-illinois

## 5. Perception Cannabis — Chicago (Rogers Park)
- **Slug:** `perception-cannabis-chicago`
- **Legal name:** Perception Cannabis (locally owned, independent)
- **Address:** 7000 N Clark St, Chicago, IL 60626
- **Phone:** (872) 302-4920
- **Website:** https://www.perceptioncannabis.com/
- **Status:** Active. Opened June 2024.
- **Hours:** Mon–Sun 9:00 AM – 9:00 PM
- **Sources:**
  - https://www.perceptioncannabis.com/
  - https://www.yelp.com/biz/perception-cannabis-chicago
  - https://nationwidedispensaries.com/illinois/chicago-perception-cannabis-dispensary/

## 6. Mood Shine — Chicago Heights
- **Slug:** `mood-shine-chicago-heights`
- **Verdict on the "scraper artifact?" suspicion:** **NOT a scraper artifact.** Real, woman-owned-and-operated dispensary with a BBB profile, 4.9-star Yelp, and 89+ photos.
- **Legal name:** Mood Shine Cannabis Dispensary
- **Address:** 628 W Lincoln Hwy, Chicago Heights, IL 60411
- **Phone:** (708) 833-8474
- **Website:** https://www.moodshine.com/
- **Status:** Active (recreational); social-equity owned
- **Hours:** Mon–Sat 9:00 AM – 9:00 PM, Sun 10:00 AM – 5:00 PM
- **Sources:**
  - https://www.moodshine.com/
  - https://www.bbb.org/us/il/chicago-heights/profile/cannabis/mood-shine-0654-1000107570
  - https://www.yelp.com/biz/mood-shine-cannabis-dispensary-chicago-heights
  - https://weedmaps.com/dispensaries/mood-shine

---

## Migration ready to apply

`sql/migrations/2026-04-22-create-orphan-master-listings.sql`

- Creates 6 `master_listings` rows: `green-007` through `green-012`
- Creates 42 `listing_hours` rows (6 dispensaries × 7 days)
- Reactivates 7 deals: `is_active=true, status_reason='imported_not_verified'`
- Wrapped in `BEGIN/COMMIT` with a `DO $$ ... $$` sanity-check that aborts the txn if counts are off
- Includes a commented-out rollback at the bottom

**lat/lng deliberately left NULL** — Task 2's Google Places backfill will populate coords + logos in one pass.

## After Matthew applies

Verify with:

```sql
SELECT COUNT(*) FROM public.master_listings WHERE id LIKE 'green-0%' AND id >= 'green-007';
-- expect 6

SELECT status_reason, COUNT(*) FROM public.deals GROUP BY status_reason ORDER BY 2 DESC;
-- expect: imported_not_verified=53, NULL=44, expired=3, orphaned=0
```

Then bump active-deal count in CLAUDE.md from 56 → 53 active is misleading; actual active = `imported_not_verified` (53) + NULL-status (44) = 97 once the join view picks them up. Code should re-query `active_deals_with_listings` after apply to confirm.
