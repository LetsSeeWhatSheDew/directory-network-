# Copy Audit — April 20, 2026

## Method

Live page source inspection of puffprice.com (RSC payloads from browser visit).

---

## 1. "vs. area average" / Averages

CONFIRMED PRESENT on live site.

Location: /deals/flower (and all /deals/[category] pages)
HTML: <div class="save-vs">vs. area average</div>
CSS class: .save-vs

Grep:

    grep -rn "area average|save-vs|vs. area|area_average|buyers save up to|avg. price" --include='*.tsx' --include='*.ts' app/ components/

Fix: Remove the .save-vs div entirely. Zero grep hits required after fix.

Schema.org JSON-LD on /deals/flower also has:
"addressLocality": "Illinois" — related to Issue 2 below.

---

## 2. "Illinois" as Location Fallback

CONFIRMED PRESENT on deal cards.

Location: /deals/flower deal cards
HTML: <div class="disp-detail">Illinois</div>
RSC payload: {"children":["Illinois",false]}

The city field is null/empty for some listings (perception-cannabis-chicago has no city).
Component falls through: deal.city || deal.state_name || 'Illinois'

Grep:

    grep -rn "'Illinois'|"Illinois"|disp-detail|state_name" --include='*.tsx' --include='*.ts' app/ components/

Fix:

    // BEFORE
    <div className="disp-detail">{deal.city || 'Illinois'}</div>
    // AFTER
    <div className="disp-detail">
      {deal.city ? deal.city + ', ' + (deal.state_abbrev || 'IL') : 'IL'}
    </div>

---

## 3. Dispensary Name Shows as Raw Slug (BONUS)

CONFIRMED PRESENT — not in original audit scope but flagged.

Location: /deals/flower top card
Shows: "perception-cannabis-chicago" instead of "Perception Cannabis Chicago"

Component renders deal.listing_slug as the dispensary display name.
Needs join to master_listings.name.

Grep:

    grep -rn "listing_slug|disp-name|deal.dispensary" --include='*.tsx' --include='*.ts' app/ components/

---

## 4. "May be closed"

NOT confirmed on current live pages. NOXX shows "Open until 9:00 PM" correctly.
Code path exists in codebase for hours-gap cases.

Grep:

    grep -rn "May be closed|might be closed|maybe closed|maybeClosed|may_be_closed" --include='*.tsx' --include='*.ts' app/ components/

Fix per Task 7 (see bugfix-sprint-summary-20260420.md).

---

## 5. Matthew's Name / Personal Info

CONFIRMED PRESENT on live /about page.

Exact text:
"I'm Matthew Burns. I live in Peoria, Illinois. I got tired of driving to a dispensary
only to find out the deal I saw on Instagram was expired..."

Contact: matthew@jacarandapeoria.com

File: app/about/page.tsx

Grep:

    grep -rn "Matthew Burns|matthew@jacaranda|I'm Matthew|I live in Peoria" --include='*.tsx' --include='*.ts' --include='*.mdx' app/ components/

Fix: Replace opening paragraph with Variant A (see bugfix-sprint-summary-20260420.md).
Replace contact email: matthew@jacarandapeoria.com -> hello@puffprice.com

Keep: "PuffPrice aggregates deals..." and "We cover all 293 licensed..." paragraphs.
Keep: "Built in Peoria, Illinois. Plant" closing line.

---

## Summary Table

| Issue | Confirmed | Estimated File | Action |
|-------|-----------|----------------|--------|
| "vs. area average" | YES (live) | app/deals/[category]/page.tsx | Remove .save-vs div |
| "Illinois" location | YES (live) | app/deals/[category]/page.tsx | Use city,state |
| Slug as display name | YES (live) | app/deals/[category]/page.tsx | Join to master_listings.name |
| "May be closed" | NOT seen | app/l/[id]/page.tsx or StatusBadge | Grep to confirm |
| "Matthew Burns" | YES (live) | app/about/page.tsx | Replace paragraph + email |
