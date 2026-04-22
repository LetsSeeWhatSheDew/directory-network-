# Tier 1 Monday outreach — readiness audit (2026-04-22)

**Pairs with:** `docs/ops/sales-playbook-20260422.md` (the strategy + 15-name list).
**Audience:** Matthew, calling Monday morning.
**Honesty constraint:** Don't pitch "your live deals are on our site" to a dispensary that has zero active deals on the site. The pitch changes per readiness grade.

---

## TL;DR

* **6 of 15 Tier-1 dispensaries have ≥1 active deal on PuffPrice today** (the strong "we surface your deals" pitch is real).
* **9 of 15 have zero active deals on the site today** (the pitch becomes "we cover your market — submit deals so consumers find them" which is weaker but still honest).
* **No Tier-1 dispensary is missing phone, hours, or descriptions.** Contact info is universally ready.
* **No Tier-1 dispensary has lat/lng populated** — every map click currently shows a generic city pin (or no pin until backfill runs).
* **Logo coverage: 4 of 15 have logos** (nuEra East Peoria, nuEra Urbana, High Haven Elgin, Ivy Hall). The other 11 will show monogram fallback on profile pages.

---

## Readiness grid

Legend: ✅ ready · ⚠️ partial · ❌ missing/blocking

| # | Dispensary | City | Phone | Website | Active deals on site | Logo | Hours | Coords | Description | **Grade** |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | nuEra East Peoria | East Peoria | ✅ | ✅ | **5** | ✅ | ✅ | ❌ | ✅ | **A — call first** |
| 2 | Seven Point Danville | Danville | ✅ | ✅ | **4** | ❌ | ✅ | ❌ | ✅ | **A−** |
| 3 | Zen Leaf Naperville | Naperville | ✅ | ✅ | **4** | ❌ | ✅ | ❌ | ✅ | **A−** |
| 4 | Terrace Cannabis Moline | Moline | ✅ | ✅ | **3** | ❌ | ✅ | ❌ | ✅ | **B+** |
| 5 | High Haven Elgin | Elgin | ✅ | ✅ | **2** | ✅ | ✅ | ❌ | ✅ | **B+** |
| 6 | Ivy Hall Dispensary | Peoria | ✅ | ✅ | **2** | ✅ | ✅ | ❌ | ✅ | **B+ (Peoria)** |
| 7 | nuEra Urbana | Urbana | ✅ | ✅ | 0 | ✅ | ✅ | ❌ | ✅ | C — sister-store warm intro |
| 8 | NOXX East Peoria | East Peoria | ✅ | ✅ | 0 | ❌ | ✅ | ❌ | ✅ | C (Peoria) |
| 9 | Trinity on University | Peoria | ✅ | ✅ | 0 | ❌ | ✅ | ❌ | ✅ | C (Peoria) |
| 10 | Trinity on Glen | Peoria | ✅ | ✅ | 0 | ❌ | ✅ | ❌ | ✅ | C (Peoria) |
| 11 | Beyond Hello Peoria | Peoria | ✅ | ✅ | 0 | ❌ | ✅ | ❌ | ✅ | C (Peoria) |
| 12 | Revolution Normal | Normal | ✅ | ✅ | 0 | ❌ | ✅ | ❌ | ✅ | C |
| 13 | AYR Wellness Normal | Normal | ✅ | ✅ | 0 | ❌ | ✅ | ❌ | ✅ | C |
| 14 | Lyfe Dispensary | Rockford | ✅ | ✅ | 0 | ❌ | ✅ | ❌ | ✅ | C |
| 15 | Shangri-La Springfield | Springfield | ✅ | ✅ | 0 | ❌ | ✅ | ❌ | ✅ | C |

---

## What's missing per dispensary

### Coords (lat/lng) — universally missing

All 15 Tier-1 dispensaries have NULL `lat` and `lng`. Same root cause as the Maps tab placeholder problem (Task 1). Will be auto-fixed by `scripts/backfill-logos-from-google-places.ts --apply`. Not a Monday-call blocker — phone calls don't depend on map coords — but the Maps tab won't show pins for the people Matthew is pitching.

### Logos — 11 of 15 missing

Same backfill script populates `logo_url` from Google Places photo metadata. The 4 that already have logos (nuEra East Peoria, nuEra Urbana, High Haven Elgin, Ivy Hall) were manually added or imported earlier.

### Active deals on site — 9 of 15 = ZERO

This is the readiness cliff. The 6 dispensaries with deals on the site have a clean opening:

> "Hey, we surface 4 of your current promos on puffprice.com — Bedford Grow, Ascend, etc. — and consumers in Moline are clicking through to your site from us. I'm calling because we'd like to make sure the deals stay accurate. Mind submitting any new ones via puffprice.com/deals/submit? Takes 5 minutes, no signup."

The 9 without deals need a different opening:

> "Hey, we list your dispensary on puffprice.com — Illinois cannabis deal directory. We don't have any of your current promos on file. Mind submitting 2-3 via puffprice.com/deals/submit so consumers searching for [city] deals see them?"

That's a colder ask. Honest, but doesn't lead with proof.

### Hours — universally present

All 15 have `listing_hours` rows populated (the previous Cowork session backfilled IL hours). Open-now status will render correctly on profile pages.

### Descriptions — universally present

All 15 have both `short_description` and `long_description` populated (per the content-depth work that landed earlier this week).

---

## Suggested call order

**Highest-readiness first (A grade), then Peoria-proximity for B+/C grades:**

1. **nuEra East Peoria** (A, 5 deals, Peoria-metro) — strongest opener
2. **Ivy Hall Dispensary (Peoria)** (B+, 2 deals, Peoria) — local, multi-store chain
3. **Seven Point Danville** (A−, 4 deals) — high deal density
4. **Zen Leaf Naperville** (A−, 4 deals) — Verano gateway
5. **Terrace Cannabis Moline** (B+, 3 deals) — Quad Cities corridor
6. **High Haven Elgin** (B+, 2 deals) — craft brand differentiation
7. **nuEra Urbana** (C → warm intro after #1) — sister store
8. **Trinity on University (Peoria)** (C, Peoria) — local walk-in possible
9. **Trinity on Glen (Peoria)** (C, Peoria) — sister to #8
10. **NOXX East Peoria** (C, Peoria) — covers same market as #1
11. **Beyond Hello Peoria** (C, Peoria)
12. **Revolution Normal** (C, ISU market)
13. **AYR Wellness Normal** (C, ISU market)
14. **Lyfe Dispensary (Rockford)** (C)
15. **Shangri-La Springfield** (C)

**Day-1 target: 5 calls (rows 1-5).** Day-2-3: round out the rest. Don't fire all 15 in one day — pacing produces better notes per call.

---

## What changed since the Apr 21 playbook

**One material change.** The playbook listed `nuEra East Peoria | 6 active deals`. Today it's **5**. One deal must have been deactivated (likely an Apr 14 import that got cleaned up overnight). This doesn't change the call angle — 5 active deals is still the strongest pitch in the deck. But the pitch script saying "we surface 6" should say "we surface 5".

No other Tier-1 entries materially changed since Apr 21.

---

## Brand outreach drafts — spot check

Reviewed the 5 drafts in `docs/drafts/brand-outreach-20260421/`:

| File | Brand | Status | Issue |
|---|---|---|---|
| `cresco-outreach.md` | Cresco Labs | Stale | Cites "8+ Cresco-brand promos" in subject. Today the active feed is 46 deals — re-count Cresco-branded deals before sending. The playbook lists Cresco as deprioritized for Tier 1 (centralized marketing) — make sure this draft flows to Tier 2 outreach, not Tier 1. |
| `gti-outreach.md` | GTI | Likely stale | Same dynamic — references "Dogwalkers / Rythm" promos. Verify count before sending. |
| `kiva-outreach.md` | Kiva Confections | Probably fine | Tier 2 brand, less time-sensitive. |
| `pax-outreach.md` | PAX Labs | Probably fine | Hardware affiliate, not deal-feed-dependent. |
| `wyld-outreach.md` | Wyld | Probably fine | Tier 2 brand. |

**Recommendation:** Don't edit the drafts — that's Matthew's territory. Just flag to him before sending Cresco/GTI: "verify the brand-deal count in the subject line against `active_deals_with_listings WHERE brand ILIKE '%cresco%'` (note: `deals.brand` doesn't exist yet — Task 5 schema audit will propose adding it). For now, count manually by reading deal titles."

---

## Tier 2 fallback list (10 names if Tier 1 has gaps)

Same readiness lens, ordered by Peoria proximity then alphabetical. None have active deals on the site today — these are pure cold-call fallbacks for when Tier 1 gives a hard no or doesn't pick up.

| # | Dispensary | City | Phone | Has logo | Region |
|---|---|---|---|---|---|
| 1 | High Haven Normal (The Puff Palace) | Normal | (309) 585-2500 | ✅ | central IL |
| 2 | Beyond Hello Normal | Normal | (309) 434-5141 | ❌ | central IL |
| 3 | Cookies Dispensary Bloomington | Bloomington | (309) 445-1402 | ❌ | central IL |
| 4 | Maribis Springfield | Springfield | (217) 503-4296 | ❌ | other |
| 5 | High Profile Cannabis Springfield | Springfield | (217) 993-8576 | ❌ | other |
| 6 | Ascend Cannabis Downtown Springfield | Springfield | (217) 679-3283 | ❌ | other |
| 7 | Revolution Moline | Moline | (309) 581-1290 | ❌ | Quad Cities (sister to Tier-1 #4) |
| 8 | Bloom Wellness Quincy East | Quincy | (217) 214-6337 | ❌ | other |
| 9 | Bloom Wellness Quincy West | Quincy | (217) 214-4372 | ❌ | other |
| 10 | Ivy Hall Waukegan | Waukegan | (855) 489-4255 | ❌ | other (sister to Tier-1 #6) |

**Important caveat for the fallback list:** these dispensaries have **zero active deals on PuffPrice**. The pitch becomes pure "we cover your market" — a softer ask. Use only after Tier 1 calls give up nothing usable.

---

## Other dispensaries with active deals not in Tier 1

A real concern: 9 of the 15 Illinois dispensaries with active deals on PuffPrice today are NOT in Tier 1, but cannot be called because they're missing phone OR website data:

| Slug | City | Active deals | Phone? | Website? |
|---|---|---|---|---|
| altius-carol-stream | Carol Stream | 5 | ❌ | ❌ |
| nuera-aurora | Aurora | 4 | ❌ | ❌ |
| nuera-champaign | Champaign | 4 | ❌ | ❌ |
| nature-treatment-galesburg | Galesburg | 3 | ❌ | ❌ |
| prairie-cannabis-naperville | Naperville | 3 | ❌ | ❌ |
| star-buds-westmont | Westmont | 3 | ❌ | ❌ |
| hi5-dispensary-crestwood | Crestwood | 2 | ❌ | ❌ |
| bisa-lina-carol-stream | Carol Stream | 1 | ❌ | ❌ |
| zen-leaf-aurora | Aurora | 1 | ❌ | ❌ |

**26 active deals** sit at these 9 dispensaries with no contact path. That's 56% of the active feed locked behind missing data.

**Recommended next action (separate from Monday calls):** spawn a side task to enrich phone + website for these 9. Quick path: Google search per slug, manual update via Supabase SQL editor. ETA 30 minutes for all 9. Doing this expands the Tier-1 pool from 15 → 24.

---

## Decision points for Matthew

1. **Run logo + coord backfill before Monday calls?** Recommended yes. Not a blocker, but the sales pitch is stronger when the dispensary's own logo + map pin shows up on their profile page. Run after applying the orphan-listings migration.
2. **Enrich the 9 contact-missing dispensaries today?** If you want a 24-name Tier-1 list for next week, yes. If 15 is enough, defer.
3. **Send the brand drafts this week or wait?** Cresco/GTI subject lines need a one-line count update first. Kiva/PAX/Wyld are fine to send as-is.
