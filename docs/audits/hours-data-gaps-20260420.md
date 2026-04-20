# Hours Data Gaps — April 20, 2026

Queried Supabase master_listings (state=IL, project_tag=green) and listing_hours tables on 2026-04-20.

| Metric | Count |
|--------|-------|
| Total IL dispensaries (project_tag=green) | 61 |
| Have at least one listing_hours row | 50 |
| MISSING hours entirely | 11 |

Note: Matthew's earlier estimate was ~16. Today's query shows 11. This count is authoritative as of 2026-04-20.

## Dispensaries Missing listing_hours Rows

| slug | name | city |
|------|------|------|
| star-buds-westmont | Star Buds Westmont | Westmont |
| hi5-dispensary-crestwood | Hi5 Dispensary | Crestwood |
| consume-cannabis-champaign | Consume Cannabis | Champaign |
| nature-treatment-galesburg | Natures Treatment | Galesburg |
| rise-mundelein | Rise Dispensary | Mundelein |
| altius-carol-stream | Altius Dispensary | Carol Stream |
| bisa-lina-carol-stream | Bisa Lina | Carol Stream |
| bloom-wellness-quincy | Bloom Wellness | Quincy |
| ascend-springfield | Ascend Cannabis | Springfield |
| rise-naperville | Rise Dispensary | Naperville |
| prairie-cannabis-naperville | Prairie Cannabis | Naperville |

## Impact on /open-now Page

The /cannabis/illinois/open-now page silently excludes these 11 dispensaries because it requires a listing_hours JOIN to return rows.

## Code Decision Required (Task 7)

Code must choose ONE:
- Option A (recommended): Show these with status badge "Check hours" (gray). Never "May be closed."
- Option B: Hide from /open-now. Add note: "Showing X of Y dispensaries."
- Option C: Show with "Hours unavailable" filter toggle.

Recommendation: Option A — honest, doesn't hide businesses, matches the status-badge fix.

## Fix Path

This requires a scraper run, not a code fix. Cannot be resolved today.
Steps for tomorrow:
1. Run hours scraper for these 11 slugs
2. Populate listing_hours with day-of-week open/close times
3. Re-verify /open-now includes them

## Queries Used

    curl -s "https://hnbjufmtmrhexmdrfubw.supabase.co/rest/v1/master_listings?state=eq.IL&project_tag=eq.green&select=id,slug,name,city&limit=300"
    curl -s "https://hnbjufmtmrhexmdrfubw.supabase.co/rest/v1/listing_hours?select=listing_id&limit=3000"
