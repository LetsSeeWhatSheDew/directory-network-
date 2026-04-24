# Missing-Contact Research — 2026-04-26

**Author:** Cowork
**Purpose:** Manually web-research the two Central IL dispensaries that Code's enhanced Places backfill flagged for name-mismatch in the April 25 evening session (`consume-cannabis-champaign`, `the-dispensary-champaign`). Provide phone + website + hours where the research holds up, or flag the row for a different action if it doesn't.

**Bottom line before the details:**

| slug | outcome | action for Code |
|---|---|---|
| `consume-cannabis-champaign` | **Ghost row. Not a real dispensary.** | Deactivate (`is_active=false`) + blank/overwrite the April 25 long_description that wrongly attributed this address to Consume Cannabis |
| `the-dispensary-champaign` | **Real dispensary.** Found real (chain-shared) phone + website + hours. | Apply backfill UPDATE provided below |

---

## `consume-cannabis-champaign` — ghost row

### What the research found

The row's slug implies "Consume Cannabis" operates a Champaign location. **It does not.** The Consume Cannabis chain (website: `consumecannabis.com`) lists Illinois locations in Carbondale, Marion, Chicago, Oakbrook Terrace, Antioch, and St. Charles. No Champaign location is listed on the chain's own locations page, no Champaign location appears on Weedmaps or Leafly under the Consume brand, and no Google search surfaces a "Consume Cannabis Champaign" presence.

The address on file for this row — 505 W Town Center Blvd, Champaign, IL 61822 — **is a different operator.** 505 W Town Center Blvd is the home of **Cloud9 Cannabis Champaign**, part of the same Cloud9 chain that operates in East Peoria (already in the DB as `cloud-9-east-peoria`), Edwardsville, and Oswego.

### How this got into the DB

The April 23 license-registry audit's Suspect tier contained a garbled row at license 284.000259-AUDO:

> `"9 Cannabis Champai (21"` / `"505 W Town"` / `"Center Blvd"` / 61822

The `docs/central-il-orphan-review-20260425.md` I wrote on April 25 read that fragment as a parser-mangled version of "Consume Cannabis Champaign" — that categorization was **wrong.** The "9" is the end of **Cloud9**, not the end of "Consume." The license 284.000259-AUDO corresponds to **Cloud9 Champaign**, not Consume.

The April 25 content floor drafts doc (`docs/central-il-content-floor-drafts-20260425.md`) built a 171-word long_description for `consume-cannabis-champaign` on top of that wrong categorization, and Code's Phase 7 applied it. **That description is now live on the public site and it attributes a Cloud9 location to a different chain.** That's the credibility leak this research doc is the first step in fixing.

### Sources

- [Consume Cannabis — contact / locations page](https://consumecannabis.com/) — Champaign is not on the chain's own locations list.
- [Cloud9 Cannabis — corporate site](https://cloud9cannabis.com/) — confirms the 505 W Town Center Blvd, Champaign location as one of four Cloud9 stores ("Champaign, Edwardsville, Oswego, & East Peoria").
- [Cloud9 Champaign (Leafly dispensary page)](https://www.leafly.com/dispensary-info/cloud9-champaign-) — independent confirmation of the operator at 505 W Town Center Blvd.
- [Champaign, IL dispensary list (Weedmaps)](https://weedmaps.com/dispensaries/in/united-states/illinois/champaign) — lists Cloud9 Champaign at 505 W Town Center Blvd; no Consume Cannabis Champaign anywhere in the Champaign market.
- [Active Adult Use Dispensing Organization Licenses (IDFPR PDF)](https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/licenselookup/adultusedispensaries.pdf) — 284.000259-AUDO is the Cloud9 Champaign license (garbled in our current parser output; visible intact in the PDF).

### Recommendation for Code

Two actions, both tonight, both wrapped in `BEGIN / COMMIT`:

1. **Deactivate the wrong-identity row.** Do not delete — preserve for audit trail.
2. **Blank the bad long_description.** Even while `is_active=false`, the description would be retained in the DB. Because the April 25 draft made a false attribution, it should be removed, not just hidden.

The creation of a new `cloud-9-champaign` row at 505 W Town Center Blvd (license 284.000259-AUDO) is a **follow-up task for Code**, not part of tonight's backfill. The license is in Suspect tier of the April 23 audit and needs the parser section-scoping follow-up before the row gets added cleanly.

### SQL (for Code's migration)

```sql
-- 2026-04-26 fix — consume-cannabis-champaign is a wrong-identity ghost
-- Cowork's April 25 orphan review mis-categorized this row as a
-- PARSER_MISS for Consume Cannabis. Research on April 26 confirms the
-- address 505 W Town Center Blvd is actually Cloud9 Champaign, and
-- Consume Cannabis does not operate a Champaign location.

BEGIN;

UPDATE master_listings
SET is_active       = false,
    long_description = '',
    short_description = '',
    updated_at       = now()
WHERE slug = 'consume-cannabis-champaign';

COMMIT;

-- Follow-up (NOT part of this migration): add a new master_listings row
-- for cloud-9-champaign at 505 W Town Center Blvd, license
-- 284.000259-AUDO. That should go through the same Central IL license
-- registry subset migration pattern used for the six rows on April 25
-- (sql/migrations/2026-04-25-central-il-license-registry-sync.sql).
```

### Cascade effects Matthew should know about

- **Champaign active-listing count drops from 4 to 3** after deactivation (Sunnyside, nuEra Champaign, The Dispensary Champaign remain).
- **Total Central IL active listings drops from 28 to 27** (pre–Ascend-Springfield decision). After both tonight's deactivations (this + ascend-springfield), the count lands at **26**.
- **Content-floor coverage ratio stays clean** — the row's long_description is blanked, but the row is inactive so it doesn't affect the public surface or the "X of Y hit floor" metric.

---

## `the-dispensary-champaign` — real dispensary, chain-shared contact data

### What the research found

The Dispensary Champaign is a real adult-use dispensary at 1826 Glenn Park Dr in Champaign. It is one of several locations in "The Dispensary" chain (Fulton, Champaign, Alton), operated under a shared corporate umbrella — which is why Code's Places backfill caught a phone with an 815 area code when running against a 217/309/447 area-code guard for Central IL: the chain's answering line is in Fulton, not Champaign.

The chain's answering number is genuinely where calls about the Champaign store get answered (same way many chain dispensaries route inquiries to a central CX line). **The phone is real even though it's not geographically "Champaign."** If we apply it, a customer calling it will reach The Dispensary's corporate line and can be routed to Champaign-specific information.

### Confirmed values

| field | value | source |
|---|---|---|
| Address | 1826 Glenn Park Dr, Champaign, IL 61821 | IDFPR license entry, chamber of commerce listing, chain site |
| Phone | (815) 208-7701 | chain corporate number (shared with Fulton); same number that Code's Places run flagged |
| Website | https://www.thedispensaryfulton.com/ | chain site; the Champaign-specific page is at `/champaign-store/` |
| Hours | Mon–Wed: 9:00 AM – 7:00 PM; Thu–Sat: 9:00 AM – 8:00 PM; Sun: 9:00 AM – 2:00 PM | operator site, MMJ.com, wheree directory |

The hours on file in our DB already match these values (from Code's April 25 backfill), so no `listing_hours` UPDATE is needed.

### Recommendation for Code

Override the name-mismatch guard for this row. The Places write Code rejected is actually correct — Code just couldn't distinguish a chain-shared phone from a cross-business mismatch without this external confirmation. Apply phone + website.

### SQL (for Code's migration)

```sql
-- 2026-04-26 backfill — the-dispensary-champaign
-- Cowork-verified contact data. The phone is the chain's shared
-- corporate line (815 area code despite Champaign location) — same
-- number Code's Places run flagged. Override the area-code guard for
-- this row and apply.

UPDATE master_listings
SET phone      = '(815) 208-7701',
    website    = 'https://www.thedispensaryfulton.com/',
    updated_at = now()
WHERE slug = 'the-dispensary-champaign';
```

No change required to `short_description`, `long_description`, `address1`, or `listing_hours` — those are already correct or already set.

### Cascade effects

- Phone coverage for Central IL moves from 26/29 to 27/29.
- Website coverage moves from 26/29 to 27/29.
- No impact on active-listing or content-floor counts.

---

## Sources (combined)

- [Consume Cannabis — official chain site](https://consumecannabis.com/)
- [Cloud9 Cannabis — official chain site](https://cloud9cannabis.com/)
- [Cloud9 Champaign (Leafly)](https://www.leafly.com/dispensary-info/cloud9-champaign-)
- [Cloud9 Cannabis Dispensary in Champaign (NationwideDispensaries)](https://nationwidedispensaries.com/illinois/champaign-cloud9-cannabis/)
- [Champaign, IL Weed Dispensaries (Weedmaps)](https://weedmaps.com/dispensaries/in/united-states/illinois/champaign)
- [The Dispensary — official chain site](https://www.thedispensaryfulton.com/)
- [The Dispensary Champaign Store page](https://www.thedispensaryfulton.com/champaign-store/)
- [The Dispensary Champaign (Champaign County Chamber of Commerce)](https://business.champaigncounty.org/list/member/the-dispensary-champaign-30697)
- [The Dispensary Champaign (MMJ.com)](https://www.mmj.com/illinois-dispensaries/champaign-the-dispensary/)
- [Active Adult Use Dispensing Organization Licenses (IDFPR PDF)](https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/licenselookup/adultusedispensaries.pdf)
