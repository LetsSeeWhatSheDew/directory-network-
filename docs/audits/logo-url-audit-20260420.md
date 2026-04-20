# Logo URL Audit — April 20, 2026

## Query

    curl -s "https://hnbjufmtmrhexmdrfubw.supabase.co/rest/v1/master_listings?logo_url=not.is.null&select=slug,name,city,logo_url&limit=300"

## Results

Total populated logo_url rows: 13

| slug | name | logo_url_domain | status |
|------|------|-----------------|--------|
| nuera-chicago | nuEra Chicago | nueracannabis.com | MATCH |
| nuera-champaign | nuEra Champaign | nueracannabis.com | MATCH |
| nuera-aurora | nuEra Aurora | nueracannabis.com | MATCH |
| nuera-east-peoria | nuEra East Peoria | nueracannabis.com | MATCH |
| nuera-urbana | nuEra Urbana | nueracannabis.com | MATCH |
| zen-leaf-aurora | Zen Leaf Aurora | zenleafdispensaries.com | MATCH |
| beyond-hello-bloomington | Beyond Hello Bloomington | beyond-hello.com | MATCH |
| the-dispensary-champaign | The Dispensary Champaign | thedispensaryfulton.com | REVIEW |
| sunnyside-wrigleyville | Sunnyside Wrigleyville | content.sunnyside.shop | MATCH (CDN) |
| high-haven-normal | High Haven Normal | highhavencanna.wpenginepowered.com | MATCH |
| ivy-hall-waukegan | Ivy Hall Waukegan | highhavencanna.wpenginepowered.com | MISMATCH - NULL |
| ivy-hall-dispensary | Ivy Hall Dispensary | ivyhalldispensary.com | MATCH |
| high-haven-elgin | High Haven Elgin | highhavencanna.wpenginepowered.com | MATCH |

## Counts

| Status | Count |
|--------|-------|
| Total populated | 13 |
| MATCH | 11 |
| MISMATCH to NULL | 1 |
| REVIEW | 1 |
| Needs Google Places | 48+ |

## Confirmed Mismatch

ivy-hall-waukegan has High Haven logo URL (April 11 enrichment corruption):
https://highhavencanna.wpenginepowered.com/wp-content/uploads/2024/09/high-haven-dispensary-logo-1200x1200-1x1-v1.jpg

Must be NULLed.

## Review Case

the-dispensary-champaign uses thedispensaryfulton.com. Code: verify this is correct.

## SQL Migration (Task 1-A)

File: sql/migrations/2026-04-20-null-mismatched-logos.sql

    UPDATE master_listings
    SET logo_url = NULL
    WHERE slug = 'ivy-hall-waukegan'
      AND logo_url LIKE '%highhavencanna%';

Run in Supabase SQL Editor (project: hnbjufmtmrhexmdrfubw).

## Render Components to Wire (Task 1-B)

Grep: grep -rn "logo_url" --include="*.tsx" --include="*.ts" app/ components/

Pattern:

    {listing.logo_url ? (
      <img src={listing.logo_url} alt={listing.name + " logo"}
        className="dn-logo-img" loading="lazy"
        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
    ) : (
      <div className="dn-logo-fallback">{listing.name?.[0] ?? '?'}</div>
    )}

Do NOT use Next.js Image component for external CDN URLs.

## Additional Finding: lat/lng Gap

Only 1 of 61 IL dispensaries has lat/lng populated (Emerald City Chicago, id: uuid-g-001).
Column names in master_listings: lat, lng (NOT latitude/longitude — confirmed).
This is critical for Task 3 ranking. Flag in final report, fix tomorrow with geocoding.
logo-url-audit-20260420.md
