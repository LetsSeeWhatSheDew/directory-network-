# Listing Completeness Matrix — 2026-04-20

**Source:** Supabase `master_listings` + `listing_hours` + `deals`, filtered `project_tag='green' AND is_active=true AND state IN ('IL','il','Illinois','illinois')`.
**Scope:** 61 active IL dispensaries.
**Scoring:** address 10 + phone 10 + website 10 + description 15 + logo 10 + hours (2.5/day × 0–7) + lat/lng 15 + deals-exist 10 → max 100.

## Schema Note — `has_google_place_id`

The `master_listings` schema has **no `google_place_id` column**. Tomorrow's scraping/enrichment work should add it (`alter table master_listings add column google_place_id text;`) before backfill. For this matrix the column is scored as **N/A (0 weight)**.

## Fleet-wide gaps (61 listings)

| Field | With data | Missing | % missing |
|---|---|---|---|
| Address | 40 | 21 | 34% |
| Phone | 40 | 21 | 34% |
| Website | 40 | 21 | 34% |
| Description (>50 chars) | 50 | 11 | 18% |
| Logo URL | 12 | 49 | **80%** |
| Lat/Lng | 1 | 60 | **98%** |
| Hours (all 7 days) | 49 | 12 partial + 11 zero | 20% |

**Ship-blocker signal:** only 1 of 61 dispensaries has lat/lng populated, so map, "near me," and radius filters are non-functional for 60 listings. Logos are missing on 80%. These are the top-priority enrichment targets for tomorrow.

## Matrix (sorted ascending by completeness score)

| # | Slug | Name | City | Addr | Phone | Web | Desc | Logo | Hours | Lat/Lng | Deals | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | altius-carol-stream | Altius Dispensary | Carol Stream | 0 | 0 | 0 | 0 | 0 | 0/7 | 0 | 0 | **0.0** |
| 2 | ascend-springfield | Ascend Cannabis | Springfield | 0 | 0 | 0 | 0 | 0 | 0/7 | 0 | 0 | **0.0** |
| 3 | bloom-wellness-quincy | Bloom Wellness | Quincy | 0 | 0 | 0 | 0 | 0 | 0/7 | 0 | 0 | **0.0** |
| 4 | consume-cannabis-champaign | Consume Cannabis | Champaign | 0 | 0 | 0 | 0 | 0 | 0/7 | 0 | 0 | **0.0** |
| 5 | nature-treatment-galesburg | Natures Treatment | Galesburg | 0 | 0 | 0 | 0 | 0 | 0/7 | 0 | 0 | **0.0** |
| 6 | rise-mundelein | Rise Dispensary | Mundelein | 0 | 0 | 0 | 0 | 0 | 0/7 | 0 | 0 | **0.0** |
| 7 | rise-naperville | Rise Dispensary | Naperville | 0 | 0 | 0 | 0 | 0 | 0/7 | 0 | 0 | **0.0** |
| 8 | bisa-lina-carol-stream | Bisa Lina | Carol Stream | 0 | 0 | 0 | 0 | 0 | 0/7 | 0 | 1 | **10.0** |
| 9 | hi5-dispensary-crestwood | Hi5 Dispensary | Crestwood | 0 | 0 | 0 | 0 | 0 | 0/7 | 0 | 2 | **10.0** |
| 10 | prairie-cannabis-naperville | Prairie Cannabis | Naperville | 0 | 0 | 0 | 0 | 0 | 0/7 | 0 | 3 | **10.0** |
| 11 | star-buds-westmont | Star Buds Westmont | Westmont | 0 | 0 | 0 | 0 | 0 | 0/7 | 0 | 4 | **10.0** |
| 12 | emerald-leaf-collective-chicago-il | Emerald Leaf Collective | Chicago | 0 | 0 | 0 | 1 | 0 | 7/7 | 0 | 0 | **32.5** |
| 13 | lakefront-cannabis-co-chicago-il | Lakefront Cannabis Co. | Chicago | 0 | 0 | 0 | 1 | 0 | 7/7 | 0 | 0 | **32.5** |
| 14 | north-star-remedies-peoria-il | North Star Remedies | Peoria | 0 | 0 | 0 | 1 | 0 | 7/7 | 0 | 0 | **32.5** |
| 15 | beyond-hello-bloomington | Beyond Hello Bloomington | Bloomington | 0 | 0 | 0 | 1 | 1 | 7/7 | 0 | 0 | **42.5** |
| 16 | nuera-chicago | nuEra Chicago | Chicago | 0 | 0 | 0 | 1 | 1 | 7/7 | 0 | 0 | 42.5 |
| 17 | sunnyside-wrigleyville | Sunnyside Wrigleyville | Chicago | 0 | 0 | 0 | 1 | 1 | 7/7 | 0 | 0 | 42.5 |
| 18 | the-dispensary-champaign | The Dispensary Champaign | Champaign | 0 | 0 | 0 | 1 | 1 | 7/7 | 0 | 0 | 42.5 |
| 19 | nuera-aurora | nuEra Aurora | Aurora | 0 | 0 | 0 | 1 | 1 | 7/7 | 0 | 4 | 52.5 |
| 20 | nuera-champaign | nuEra Champaign | Champaign | 0 | 0 | 0 | 1 | 1 | 7/7 | 0 | 4 | 52.5 |
| 21 | zen-leaf-aurora | Zen Leaf Aurora | Aurora | 0 | 0 | 0 | 1 | 1 | 7/7 | 0 | 1 | 52.5 |
| 22 | ascend-collinsville | Ascend Cannabis — Collinsville | Collinsville | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 23 | ascend-cannabis-downtown-springfield | Ascend Cannabis Downtown Springfield | Springfield | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 24 | ascend-cannabis-horizon-drive | Ascend Cannabis Horizon Drive | Springfield | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 25 | auralight-dispensary | AuraLight Dispensary | Aurora | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 26 | ayr-wellness-normal | AYR Wellness Normal | Normal | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 27 | beyond-hello-normal | Beyond Hello Normal | Normal | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 28 | beyond-hello-peoria | Beyond Hello Peoria | Peoria | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 29 | bloom-wellness-quincy-east | Bloom Wellness Quincy East | Quincy | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 30 | bloom-wellness-quincy-west | Bloom Wellness Quincy West | Quincy | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 31 | cookies-bloomington | Cookies Dispensary Bloomington | Bloomington | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 32 | high-profile-cannabis-springfield | High Profile Cannabis Springfield | Springfield | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 33 | ivy-hall-waukegan | Ivy Hall Waukegan | Waukegan | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 34 | lyfe-dispensary | Lyfe Dispensary | Rockford | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 35 | maribis-springfield | Maribis Springfield | Springfield | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 36 | noxx-east-peoria | NOXX East Peoria | East Peoria | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 37 | planet-13-waukegan | Planet 13 Waukegan | Waukegan | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 38 | revolution-dispensary-normal | Revolution Dispensary Normal | Normal | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 39 | revolution-moline | Revolution Moline | Moline | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 40 | revolution-schaumburg | Revolution Schaumburg | Schaumburg | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 41 | rise-dispensary-naperville | Rise Dispensary Naperville | Naperville | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 42 | rise-effingham | Rise Effingham | Effingham | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 43 | rise-joliet-colorado | Rise Joliet Colorado Ave | Joliet | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 44 | rise-joliet-rock-creek | Rise Joliet Rock Creek | Joliet | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 45 | rise-quincy | Rise Quincy | Quincy | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 46 | shangri-la-springfield | Shangri-La Springfield | Springfield | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 47 | sunnyside-danville | Sunnyside Danville | Danville | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 48 | sunnyside-rockford | Sunnyside Rockford | Rockford | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 49 | sunnyside-schaumburg | Sunnyside Schaumburg | Schaumburg | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 50 | trinity-on-glen | Trinity on Glen | Peoria | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 51 | trinity-on-university | Trinity on University | Peoria | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 52 | verilife-schaumburg | Verilife Schaumburg | Schaumburg | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 0 | 62.5 |
| 53 | emerald-city-dispensary-chicago-il | Emerald City Dispensary | Chicago | 1 | 1 | 1 | 1 | 0 | 2/7 | 1 | 0 | 65.0 |
| 54 | high-haven-normal | High Haven Normal (The Puff Palace) | Normal | 1 | 1 | 1 | 1 | 1 | 7/7 | 0 | 0 | 72.5 |
| 55 | ivy-hall-dispensary | Ivy Hall Dispensary | Peoria | 1 | 1 | 1 | 1 | 1 | 7/7 | 0 | 0 | 72.5 |
| 56 | nuera-urbana | nuEra Urbana | Urbana | 1 | 1 | 1 | 1 | 1 | 7/7 | 0 | 0 | 72.5 |
| 57 | seven-point-danville | Seven Point Danville | Danville | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 4 | 72.5 |
| 58 | terrace-cannabis-moline | Terrace Cannabis Moline | Moline | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 3 | 72.5 |
| 59 | zen-leaf-naperville | Zen Leaf Naperville | Naperville | 1 | 1 | 1 | 1 | 0 | 7/7 | 0 | 4 | 72.5 |
| 60 | high-haven-elgin | High Haven Elgin (The Record Store) | Elgin | 1 | 1 | 1 | 1 | 1 | 7/7 | 0 | 2 | 82.5 |
| 61 | nuera-east-peoria | nuEra East Peoria | East Peoria | 1 | 1 | 1 | 1 | 1 | 7/7 | 0 | 6 | **82.5** |

## Ship-blockers (bottom 15 — rows 1–15)

These should be hidden from `/dispensaries`, `/map`, city pages, and deal card linking until enriched. They will produce bad pages today. Enrichment priority = exact row order above.

1. altius-carol-stream — empty shell, drop or scrape
2. ascend-springfield — empty shell (note: `ascend-cannabis-downtown-springfield` and `ascend-cannabis-horizon-drive` already cover Springfield; this slug may be a dedupe target)
3. bloom-wellness-quincy — empty shell (`bloom-wellness-quincy-east` + `bloom-wellness-quincy-west` cover Quincy; likely dedupe)
4. consume-cannabis-champaign — empty shell (no duplicate Champaign Consume location present)
5. nature-treatment-galesburg — empty shell
6. rise-mundelein — empty shell
7. rise-naperville — empty shell (`rise-dispensary-naperville` covers Naperville; likely dedupe)
8. bisa-lina-carol-stream — only deals; no listing fields at all → deal still appears, but its "GO HERE" page is effectively empty
9. hi5-dispensary-crestwood — 2 live deals, no detail
10. prairie-cannabis-naperville — 3 live deals, no detail
11. star-buds-westmont — 4 live deals, no detail
12. emerald-leaf-collective-chicago-il — has description + hours, zero contact info
13. lakefront-cannabis-co-chicago-il — same pattern
14. north-star-remedies-peoria-il — same pattern
15. beyond-hello-bloomington — description + logo + hours, zero contact info

Tomorrow's scraping/enrichment target list is items 1–15 first, then the 21 rows still missing address/phone/website among the otherwise-complete 62.5-scoring cohort.

## Top-quartile leaders (score ≥ 72.5)

nuera-east-peoria (82.5), high-haven-elgin (82.5), high-haven-normal, ivy-hall-dispensary, nuera-urbana, seven-point-danville, terrace-cannabis-moline, zen-leaf-naperville (all 72.5). Use these as the "gold standard" page templates when validating the enrichment flow.

## Gaps the matrix can't capture (flag for tomorrow)

- **`lat/lng` = 1/61.** Google Places backfill (Code Task 5 / Chrome Wave 2) is the unlock; without it the map page is decoration and "open now near me" is fiction.
- **`google_place_id` column does not exist.** Add before backfill so Places-ID caching isn't wasted.
- **No `product_categories`, `payment_methods` coverage** in `master_listings` beyond scattered booleans (`accepts_credit`, `cash_only`, `atm_onsite`, `delivery`, `drive_thru`, `online_ordering`, `loyalty_program`). All booleans currently default-null — no listing has any filled. These exist but are unused data today.
- **`hero_image_url`** column exists; zero listings have it populated. Low-priority vs. logo/lat-lng but worth flagging.
