# Central IL Content Floor Drafts — 2026-04-26 (v2)

**Author:** Cowork
**Purpose:** Factual 150-200 word descriptions for the six Central IL listings added by Code in the April 25 evening license-registry subset migration. Closes the content-floor gap on all but the deferred `ascend-springfield` row.

**Companion docs:**
- `docs/central-il-content-floor-drafts-20260425.md` — the 21 original drafts (applied April 25).
- `docs/missing-contact-research-20260426.md` — web research + SQL fixes for the 2 missing-contact listings.
- `docs/central-il-orphan-review-20260425.md` — now carries an April 26 addendum covering the Ascend Springfield and Consume Cannabis Champaign decisions.

**Voice check:** same flat, factual, trust-building register as the April 25 drafts. No fabricated features or awards.

---

## SQL-ready block — for Code to copy into `sql/migrations/2026-04-26-central-il-content-floor-v2.sql`

```sql
-- 2026-04-26 Central IL content-floor backfill (v2, 6 rows)
-- Sourced from docs/central-il-content-floor-drafts-20260426.md (Cowork)
-- Covers the six rows added by the April 25 evening Central IL
-- license-registry subset migration. The deferred ascend-springfield
-- row is NOT included here (see orphan review addendum).

BEGIN;

UPDATE master_listings SET long_description = $desc$Sunnyside Champaign is at 1704 S Neil St, Suite C, in Champaign, along the Neil Street retail corridor that runs through the city. The dispensary serves adult-use customers age 21+ and Illinois medical cannabis cardholders. Hours are 9 AM to 9 PM every day of the week. Sunnyside is the retail brand of Cresco Labs, one of the largest multi-state cannabis operators in the United States and one of the earliest licensees in Illinois (license 284.000006-AUDO, issued in the first batch under the adult-use framework). Inventory covers the Cresco house-brand catalog (Cresco, FloraCal, Mindy's, High Supply) alongside Illinois-licensed third-party brands across flower, pre-rolls, edibles, concentrates, vape carts, topicals, and accessories. Online pre-ordering is supported for in-store pickup. Free parking on site. Debit cards work via the standard cashless-ATM workaround used across Illinois cannabis retail. Within the Champaign-Urbana cluster, Sunnyside is the Cresco chain option alongside independent and social-equity-licensed alternatives. Phone: (217) 305-4009.$desc$, updated_at = now() WHERE slug = 'sunnyside-champaign';

UPDATE master_listings SET long_description = $desc$Cloud 9 East Peoria is at 406 W Camp St in East Peoria, one of three East Peoria dispensaries alongside nuEra East Peoria and NOXX East Peoria. Hours are 8 AM to 9 PM every day of the week. The dispensary serves adult-use customers age 21+; Illinois medical cardholders receive a 30% discount. Cloud9 Cannabis is a social-equity-licensed Illinois chain with additional locations in Champaign, Edwardsville, and Oswego; license 284.000303-AUDO. Inventory covers Illinois-licensed flower, pre-rolls, edibles, concentrates, vape carts, and accessories. Online ordering is supported for in-store pickup. Free parking on site. The loyalty program offers points on every purchase redeemable for additional discounts, and first-time customers receive 15% off their initial order. Debit cards work via the standard cashless-ATM workaround used across Illinois cannabis retail. East Peoria now carries three adult-use dispensaries within roughly a one-mile radius, making the town the densest Central IL dispensary cluster per capita. Phone: (309) 427-8943.$desc$, updated_at = now() WHERE slug = 'cloud-9-east-peoria';

UPDATE master_listings SET long_description = $desc$nuEra Pekin is at 3249 Court St in Pekin — the first adult-use cannabis dispensary to open in Pekin, Illinois, operating since 2021. The dispensary serves adult-use customers age 21+ and Illinois medical cannabis cardholders. Hours are 10 AM to 7 PM Sunday through Wednesday and 10 AM to 8 PM Thursday through Saturday. nuEra is Illinois-family-owned (the Fitzsimmons family, Chicago-headquartered, vertically integrated following the 2024 Ieso cultivation acquisition) with sister locations in East Peoria, Champaign, Urbana, Aurora, and elsewhere in the state; license 284.000116-AUDO. Inventory spans Illinois-licensed flower, pre-rolls, edibles, concentrates, vape carts, topicals, tinctures, and accessories. Online pre-ordering is supported for in-store pickup. ATM on-site; debit cards work via the standard cashless-ATM workaround used across Illinois cannabis retail. Pekin sits in Tazewell County, which has a friendlier effective cannabis tax rate than Cook County — one reason this location draws customers from across the greater Peoria area. Phone: (309) 201-4086.$desc$, updated_at = now() WHERE slug = 'nuera-pekin';

UPDATE master_listings SET long_description = $desc$Cookies Peoria Heights is at 1209 E War Memorial Dr in Peoria Heights, the second Cookies cannabis dispensary to open in Illinois after the Chicago flagship. The location celebrated its grand opening on December 9, 2023. The social-equity licensee behind Peoria Heights is John Rushing, an Illinois native and disabled United States Marine veteran; license 284.000319-AUDO. The dispensary serves adult-use customers age 21+. Hours are 9 AM to 9 PM Monday through Saturday and 10 AM to 8 PM Sunday. Expect Cookies-branded flower, pre-rolls, and apparel alongside a broader Illinois-licensed product mix spanning edibles, concentrates, vapes, and accessories from other IL brands. Online ordering is supported for in-store pickup. Free parking on site. Debit cards work via the standard cashless-ATM workaround used across Illinois cannabis retail. Peoria Heights sits immediately adjacent to Peoria proper, making this location accessible from Peoria, East Peoria, and surrounding Tri-County residents in 5 to 15 minutes. Phone: (309) 445-5415.$desc$, updated_at = now() WHERE slug = 'cookies-peoria-heights';

UPDATE master_listings SET long_description = $desc$Aroma Hill Peoria is at 1210 W Glen Ave in Peoria, on the Glen Avenue retail corridor in northwest Peoria. Hours run 9 AM to 9 PM Sunday through Thursday and 9 AM to 10 PM Friday and Saturday. The dispensary serves adult-use customers age 21+. Aroma Hill is an Illinois-licensed cannabis chain with additional locations in Belvidere, Kankakee, and Hoffman Estates; license 284.000265-AUDO. Inventory covers Illinois-licensed flower, pre-rolls, edibles, concentrates, vape carts, and accessories at competitive pricing. Online pre-ordering is supported for in-store pickup. Free parking on site. Debit cards and cash are both accepted, with debit processed via the standard cashless-ATM workaround used across Illinois cannabis retail. The Glen Avenue location places Aroma Hill about a ten-minute drive from Trinity on Glen (at 2301 W Glen Ave, a few blocks away on the same street), which makes price-comparison shopping straightforward within the Peoria market. Phone: (309) 839-4080.$desc$, updated_at = now() WHERE slug = 'aroma-hill-peoria';

UPDATE master_listings SET long_description = $desc$Share Springfield is at 3600 S 6th St in Springfield — the only locally-owned-and-operated cannabis dispensary in Springfield, per the operator's own positioning. The dispensary serves adult-use customers age 21+ and Illinois medical cannabis cardholders. Hours are 9 AM to 8 PM Monday through Thursday, 9 AM to 9 PM Friday and Saturday, and noon to 6 PM Sunday; license 284.000346-AUDO. Inventory covers Illinois-licensed flower, pre-rolls, edibles, concentrates, vape carts, and accessories. Online ordering is available through Dutchie; in-store pickup is supported. Free parking on site. Debit cards work via the standard cashless-ATM workaround used across Illinois cannabis retail. Among Springfield's adult-use dispensaries (Ascend Downtown, Ascend Horizon Drive, High Profile, Maribis, Shangri-La), Share is the local-owner-operated alternative to the multi-state operator chains. The S 6th Street corridor runs parallel to Dirksen Parkway on Springfield's south side, which makes Share straightforward to reach from I-55 and I-72. Phone: (217) 441-8820.$desc$, updated_at = now() WHERE slug = 'share-springfield';

COMMIT;

-- Verification:
-- SELECT slug, array_length(regexp_split_to_array(trim(long_description), '\s+'), 1) AS words
-- FROM master_listings
-- WHERE slug IN ('sunnyside-champaign','cloud-9-east-peoria','nuera-pekin','cookies-peoria-heights','aroma-hill-peoria','share-springfield')
-- ORDER BY words;
-- Expected: 6 rows, all >= 150 words.
```

---

## Drafts — per-listing (H2 = slug)

Ordered alphabetically by slug, matching the SQL block order. Each draft below is the exact text applied in the UPDATE above.

### aroma-hill-peoria

Aroma Hill Peoria is at 1210 W Glen Ave in Peoria, on the Glen Avenue retail corridor in northwest Peoria. Hours run 9 AM to 9 PM Sunday through Thursday and 9 AM to 10 PM Friday and Saturday. The dispensary serves adult-use customers age 21+. Aroma Hill is an Illinois-licensed cannabis chain with additional locations in Belvidere, Kankakee, and Hoffman Estates; license 284.000265-AUDO. Inventory covers Illinois-licensed flower, pre-rolls, edibles, concentrates, vape carts, and accessories at competitive pricing. Online pre-ordering is supported for in-store pickup. Free parking on site. Debit cards and cash are both accepted, with debit processed via the standard cashless-ATM workaround used across Illinois cannabis retail. The Glen Avenue location places Aroma Hill about a ten-minute drive from Trinity on Glen (at 2301 W Glen Ave, a few blocks away on the same street), which makes price-comparison shopping straightforward within the Peoria market. Phone: (309) 839-4080.

_Word count: 164._

### cloud-9-east-peoria

Cloud 9 East Peoria is at 406 W Camp St in East Peoria, one of three East Peoria dispensaries alongside nuEra East Peoria and NOXX East Peoria. Hours are 8 AM to 9 PM every day of the week. The dispensary serves adult-use customers age 21+; Illinois medical cardholders receive a 30% discount. Cloud9 Cannabis is a social-equity-licensed Illinois chain with additional locations in Champaign, Edwardsville, and Oswego; license 284.000303-AUDO. Inventory covers Illinois-licensed flower, pre-rolls, edibles, concentrates, vape carts, and accessories. Online ordering is supported for in-store pickup. Free parking on site. The loyalty program offers points on every purchase redeemable for additional discounts, and first-time customers receive 15% off their initial order. Debit cards work via the standard cashless-ATM workaround used across Illinois cannabis retail. East Peoria now carries three adult-use dispensaries within roughly a one-mile radius, making the town the densest Central IL dispensary cluster per capita. Phone: (309) 427-8943.

_Word count: 162._

### cookies-peoria-heights

Cookies Peoria Heights is at 1209 E War Memorial Dr in Peoria Heights, the second Cookies cannabis dispensary to open in Illinois after the Chicago flagship. The location celebrated its grand opening on December 9, 2023. The social-equity licensee behind Peoria Heights is John Rushing, an Illinois native and disabled United States Marine veteran; license 284.000319-AUDO. The dispensary serves adult-use customers age 21+. Hours are 9 AM to 9 PM Monday through Saturday and 10 AM to 8 PM Sunday. Expect Cookies-branded flower, pre-rolls, and apparel alongside a broader Illinois-licensed product mix spanning edibles, concentrates, vapes, and accessories from other IL brands. Online ordering is supported for in-store pickup. Free parking on site. Debit cards work via the standard cashless-ATM workaround used across Illinois cannabis retail. Peoria Heights sits immediately adjacent to Peoria proper, making this location accessible from Peoria, East Peoria, and surrounding Tri-County residents in 5 to 15 minutes. Phone: (309) 445-5415.

_Word count: 163._

### nuera-pekin

nuEra Pekin is at 3249 Court St in Pekin — the first adult-use cannabis dispensary to open in Pekin, Illinois, operating since 2021. The dispensary serves adult-use customers age 21+ and Illinois medical cannabis cardholders. Hours are 10 AM to 7 PM Sunday through Wednesday and 10 AM to 8 PM Thursday through Saturday. nuEra is Illinois-family-owned (the Fitzsimmons family, Chicago-headquartered, vertically integrated following the 2024 Ieso cultivation acquisition) with sister locations in East Peoria, Champaign, Urbana, Aurora, and elsewhere in the state; license 284.000116-AUDO. Inventory spans Illinois-licensed flower, pre-rolls, edibles, concentrates, vape carts, topicals, tinctures, and accessories. Online pre-ordering is supported for in-store pickup. ATM on-site; debit cards work via the standard cashless-ATM workaround used across Illinois cannabis retail. Pekin sits in Tazewell County, which has a friendlier effective cannabis tax rate than Cook County — one reason this location draws customers from across the greater Peoria area. Phone: (309) 201-4086.

_Word count: 163._

### share-springfield

Share Springfield is at 3600 S 6th St in Springfield — the only locally-owned-and-operated cannabis dispensary in Springfield, per the operator's own positioning. The dispensary serves adult-use customers age 21+ and Illinois medical cannabis cardholders. Hours are 9 AM to 8 PM Monday through Thursday, 9 AM to 9 PM Friday and Saturday, and noon to 6 PM Sunday; license 284.000346-AUDO. Inventory covers Illinois-licensed flower, pre-rolls, edibles, concentrates, vape carts, and accessories. Online ordering is available through Dutchie; in-store pickup is supported. Free parking on site. Debit cards work via the standard cashless-ATM workaround used across Illinois cannabis retail. Among Springfield's adult-use dispensaries (Ascend Downtown, Ascend Horizon Drive, High Profile, Maribis, Shangri-La), Share is the local-owner-operated alternative to the multi-state operator chains. The S 6th Street corridor runs parallel to Dirksen Parkway on Springfield's south side, which makes Share straightforward to reach from I-55 and I-72. Phone: (217) 441-8820.

_Word count: 153._

### sunnyside-champaign

Sunnyside Champaign is at 1704 S Neil St, Suite C, in Champaign, along the Neil Street retail corridor that runs through the city. The dispensary serves adult-use customers age 21+ and Illinois medical cannabis cardholders. Hours are 9 AM to 9 PM every day of the week. Sunnyside is the retail brand of Cresco Labs, one of the largest multi-state cannabis operators in the United States and one of the earliest licensees in Illinois (license 284.000006-AUDO, issued in the first batch under the adult-use framework). Inventory covers the Cresco house-brand catalog (Cresco, FloraCal, Mindy's, High Supply) alongside Illinois-licensed third-party brands across flower, pre-rolls, edibles, concentrates, vape carts, topicals, and accessories. Online pre-ordering is supported for in-store pickup. Free parking on site. Debit cards work via the standard cashless-ATM workaround used across Illinois cannabis retail. Within the Champaign-Urbana cluster, Sunnyside is the Cresco chain option alongside independent and social-equity-licensed alternatives. Phone: (217) 305-4009.

_Word count: 158._

---

## Coverage after Code applies this batch

6 new rows hit 150-word floor. Content-floor coverage moves from **21/28** to **27/28 Central IL listings**. The one remaining gap — `ascend-springfield` — is resolved via deactivation in today's orphan review addendum.

| slug | content floor after tonight |
|---|---|
| `aroma-hill-peoria` | ✓ |
| `cloud-9-east-peoria` | ✓ |
| `cookies-peoria-heights` | ✓ |
| `nuera-pekin` | ✓ |
| `share-springfield` | ✓ |
| `sunnyside-champaign` | ✓ |
| `ascend-springfield` | N/A (deactivate per addendum) |
