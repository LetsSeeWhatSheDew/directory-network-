# Null Slug Links Audit — April 20, 2026

## Method

Live page source inspection (RSC payloads) from puffprice.com visits.
Note: filesystem grep was not available from browser agent.
Code agent should run the grep commands below to confirm.

## Findings from Live Page Source

### Pattern 1: Deal card CTA "GO HERE ->" (/deals/[category])

In /deals/flower RSC payload:

    href={'/l/' + deal.dispensary + '?city=' + city}

Risk: If deal.dispensary (listing_slug) is null: renders /l/undefined?city=Chicago
Status: RISK — needs null guard.

### Pattern 2: Deal card profile link (/dispensary/[slug])

    href={'/dispensary/' + deal.dispensary}

Risk: Same as above.
Status: RISK — needs null guard.

### Pattern 3: Related dispensaries widget (/l/[id]/page)

    href={'/l/' + relatedDispensary.slug}

Status: LOW RISK — slug column non-null in DB for all 61 IL listings.

### Pattern 4: Detail page footer (/dispensary/[slug])

    href={'/dispensary/' + slug}

Status: OK — route param, always defined.

### Pattern 5: Detail link (/deal/[id])

    href={'/deal/' + deal.id}

Status: LOW RISK — Supabase uuid always present.

## Summary Table

| Location | Pattern | Risk | Action |
|----------|---------|------|--------|
| Deal card CTA "GO HERE" | /l/ + deal.listing_slug | RISK | Add null guard |
| Deal card profile link | /dispensary/ + deal.listing_slug | RISK | Add null guard |
| Related dispensaries | /l/ + related.slug | Low | OK — non-null in DB |
| Detail page footer | /dispensary/ + slug | Low | OK — route param |
| Detail link | /deal/ + deal.id | Low | OK — uuid always present |

## Recommended Fix

    // BEFORE
    href={'/l/' + deal.listing_slug}
    
    // AFTER
    href={deal.listing_slug ? '/l/' + deal.listing_slug : undefined}

## Grep Commands (for Code agent)

    cd "/Users/matthew/Desktop/ACTIVE/Directory-Network/Project - Directory/project-green"
    grep -rn "/l/\${" --include='*.tsx' --include='*.ts' app/ components/
    grep -rn "href={.*slug.*}" --include='*.tsx' --include='*.ts' app/ components/
    grep -rn "`/dispensary/\${" --include='*.tsx' --include='*.ts' app/ components/
