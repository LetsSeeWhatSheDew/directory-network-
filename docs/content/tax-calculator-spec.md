# Illinois cannabis tax calculator — Code-ready spec
**Date:** 2026-04-28 (night)
**Author:** Cowork (Claude), spec for Code's future implementation
**Status:** Draft spec. Implementation deferred — this document gives Code zero ambiguity when the work picks up.
**Cross-reference:** `docs/out-of-the-box-ideas-from-external-review.md` Idea 1 (drafted, awaiting implementation as of 2026-04-28).

---

## What this is

An interactive calculator that takes a shelf price + product type + city and returns the out-the-door price with a full tax breakdown. Lives at **`/illinois-cannabis-tax-calculator`** (or wherever Code wires it; the URL is not load-bearing). Linked from:

- The bottom of the tax explainer article (`docs/content/illinois-cannabis-tax-explainer-draft.md`).
- A "Why is the price higher at checkout?" link on every deal card.
- A footer link in the legal-info bucket.

This is **Idea 1** from `docs/out-of-the-box-ideas-from-external-review.md`. The original idea has the calculator landing on every deal card. This spec scopes a v1 standalone page first; per-card embedding is v2.

---

## Inputs

| Input | UI | Required | Default |
|---|---|---|---|
| Shelf price | Dollar input, allow $0.00–$999.99, 2-decimal | Yes | empty |
| THC tier | Segmented control, 3 buttons: "Flower / pre-rolls (≤35% THC)", "Concentrate / vape (>35% THC)", "Edible / drink / topical" | Yes | "Flower / pre-rolls" |
| City | Dropdown, the 9 currently-populated CIL cities (no Bartonville, Morton, Washington — they have no licensed dispensary) | Yes | auto-detect via `/api/geo` if available; otherwise "Peoria" |

### UX rules

- **No submit button.** Calculation updates on every input change (debounce 150ms on the dollar field).
- **Empty shelf price → output is blank.** Don't show "$0.00 out-the-door" — show the neutral state with placeholder copy: "Enter a shelf price to see what you'll pay at the register."
- **Auto-detection fallback is silent.** If geo fails, default to Peoria with no error toast. Geo is a convenience, not a contract.

---

## Outputs

```
Shelf price                 $35.00
Cannabis Excise (10%)       +$3.50
State Sales Tax (6.25%)     +$2.41
Peoria County Cannabis ROT  +$0.39
Peoria City Cannabis ROT    +$1.16
Local Sales Tax             +$0.41
─────────────────────────
Total tax                    $7.87
Out-the-door                $42.87        ← display in Geist Display 700, 32px
                            22.5% effective tax
```

### Display rules

- **Out-the-door price is the hero.** Largest number on the page after the shelf-price input.
- **Effective tax rate** displays underneath as a smaller pill (e.g., "22.5% effective tax").
- **Each line of the breakdown** is its own row; don't collapse "state taxes" into one line. The whole point is the user seeing every tax.
- **Tabular numerals on every dollar amount.** (See identity-package §2.3.)

### Status / freshness line

Beneath the breakdown, fixed copy:

> *Tax rates current as of [LAST_UPDATED_DATE]. County and city rates change quarterly; we update them when they do.*

`LAST_UPDATED_DATE` reads from a constant in `lib/taxRates.ts` so a single update on rate change cascades.

---

## Out of scope for v1

- "Save this calculation" / persistent calculation history. v2.
- "Compare cities" view (showing the same shelf price out-the-door in 9 cities side-by-side). v2 — but a one-line CTA at the bottom is fine: *"Coming soon: compare what this product costs across all 9 Central IL cities."*
- Per-deal card embedding. v2. v1 ships standalone first to validate the math on a controlled surface.
- Authenticated / Pro features. v1 is FREE / public.
- Edge cases for medical cannabis (different tax structure). Out of scope; medical patients are <5% of the volume and are paying their own card.

---

## Data model

### Type definitions

```ts
// lib/taxRates.ts

export type ThcTier = 'flower' | 'concentrate' | 'edible';

export interface CityTaxRates {
  /** City name as it appears in master_listings.city */
  city: string;
  /** County the city is in (used for county cannabis ROT) */
  county: string;
  /** State sales tax — 6.25% statewide, never overridden */
  stateSalesTax: number;
  /** County cannabis-specific ROT (0–3%, set by county ordinance) */
  countyCannabisRot: number;
  /** Municipal cannabis-specific ROT (0–3%, set by city ordinance) */
  municipalCannabisRot: number;
  /** Local sales tax (the non-cannabis portion the city/county levy) */
  localSalesTax: number;
  /** Date this row was last verified against the IL DOR rate database */
  verifiedDate: string; // YYYY-MM-DD
}

export const STATE_EXCISE_RATES: Record<ThcTier, number> = {
  flower: 0.10,        // ≤35% THC flower / pre-rolls
  concentrate: 0.25,   // >35% THC, vape carts, concentrates
  edible: 0.20,        // edibles, drinks, topicals
};

export const STATE_SALES_TAX = 0.0625; // 6.25%, statewide
```

### Calculation order (this is load-bearing — match the IL DOR's stacking order exactly)

```ts
function calculateOutTheDoor(
  shelfPrice: number,
  tier: ThcTier,
  rates: CityTaxRates
) {
  const cannabisExcise = shelfPrice * STATE_EXCISE_RATES[tier];
  const subtotalAfterExcise = shelfPrice + cannabisExcise;

  // Sales-style taxes apply to the subtotal AFTER cannabis excise.
  const stateSalesTax = subtotalAfterExcise * rates.stateSalesTax;
  const countyCannabisTax = subtotalAfterExcise * rates.countyCannabisRot;
  const municipalCannabisTax = subtotalAfterExcise * rates.municipalCannabisRot;
  const localSalesTax = subtotalAfterExcise * rates.localSalesTax;

  const totalTax =
    cannabisExcise +
    stateSalesTax +
    countyCannabisTax +
    municipalCannabisTax +
    localSalesTax;

  const outTheDoor = shelfPrice + totalTax;
  const effectiveRate = totalTax / shelfPrice;

  return {
    shelfPrice,
    cannabisExcise,
    stateSalesTax,
    countyCannabisTax,
    municipalCannabisTax,
    localSalesTax,
    totalTax,
    outTheDoor,
    effectiveRate,
  };
}
```

**Stacking order matters.** State sales tax is computed on (shelf + excise), not on shelf alone — that's the IL DOR rule, and it's what makes the effective rate run higher than naive (10% + 6.25% + locals) addition would suggest. Don't shortcut this.

---

## Per-city tax data table — research deliverable

Below: the per-city rates Code wires into `lib/taxRates.ts`. **All rates here are best-current-knowledge placeholders that need verification against the IL Department of Revenue's `MyTax Illinois` rate finder before this calculator ships publicly.** Each row carries a `verifiedDate` to make staleness explicit.

> **Verification source:** [https://mytax.illinois.gov/_/](https://mytax.illinois.gov/_/) → Tax Rate Finder → "Cannabis."
> **Update cadence:** quarterly minimum. Rates can change effective Jan 1, Apr 1, Jul 1, Oct 1.

| City | County | County Cannabis ROT | Municipal Cannabis ROT | Local Sales Tax | Notes |
|---|---|---:|---:|---:|---|
| **Peoria** | Peoria | 0.75% | 3.00% | 1.75% | Has both county and city cannabis-specific tax. Highest CIL combined. |
| **Peoria Heights** | Peoria | 0.75% | 3.00% | 1.50% | Village adopted municipal cannabis tax separately from Peoria. |
| **East Peoria** | Tazewell | 0.50% | 3.00% | 1.50% | Lower county rate than Peoria County. |
| **Pekin** | Tazewell | 0.50% | 2.75% | 1.50% | nuEra Pekin is the only listing as of 2026-04-28. |
| **Bloomington** | McLean | 0.75% | 3.00% | 1.50% | |
| **Normal** | McLean | 0.75% | 3.00% | 1.50% | Same county as Bloomington; municipal varies slightly. |
| **Champaign** | Champaign | 1.00% | 3.00% | 1.75% | Has stacked transit-district sales tax. |
| **Urbana** | Champaign | 1.00% | 3.00% | 1.50% | |
| **Springfield** | Sangamon | 0.50% | 3.00% | 2.00% | Sales tax higher due to municipal infrastructure tax. |

State sales tax is **6.25%** for all rows (statewide, no override).

State cannabis excise is **10% / 20% / 25%** per `STATE_EXCISE_RATES` above; not in this table because it doesn't vary by city.

### Empty cities (no licensed dispensary)

Bartonville, Morton, and Washington are in the public scope but currently have zero dispensaries. The calculator dropdown excludes them (no operator there to charge tax against). If a dispensary opens in any of those cities, add the row before listing the dispensary.

### Verification checklist before going live

1. Pull current rates from `MyTax Illinois Tax Rate Finder` for each of the 9 cities. Confirm the cannabis-specific lines exist (some smaller jurisdictions adopted them via ordinance but didn't submit them to MyTax until later).
2. Cross-check against each city's municipal code (e.g., `peoriagov.org/document-center/code-of-ordinances`). MyTax is current; municipal codes are authoritative.
3. Sanity-check by comparing one real receipt from each city against the calculator output. ±$0.05 rounding is acceptable.
4. Set `verifiedDate` on every row to the date verification completed.
5. Schedule the next verification: calendar reminder for Sep 30, 2026 (next quarterly boundary).

---

## Implementation notes for Code

### File layout

```
lib/taxRates.ts                          ← single source of truth for rates + types + calc fn
app/illinois-cannabis-tax-calculator/page.tsx   ← the calculator route (server component shell)
app/illinois-cannabis-tax-calculator/Calculator.tsx  ← client component for the interactive form
docs/content/illinois-cannabis-tax-explainer-draft.md ← article (linked from calculator)
```

### Server vs client split

- The page route is a server component. It renders the static framing (eyebrow, H1, the explainer prose, footer note).
- The interactive calculator is a client component (`'use client'`) imported into the page. State lives in the client component; the math runs in-browser with no API call.
- No serverless function needed for v1. The math is deterministic and the rate table is static. Rate updates ship via a regular code deploy.

### Accessibility floor

- Every input has a `<label for=>`.
- Segmented control uses `<fieldset>`/`<legend>` per WCAG 2.1.
- The output region has `aria-live="polite"` so screen readers hear the updated total when inputs change.
- Tab order: shelf price → THC tier → city dropdown → output (focusable for read-aloud).
- Color contrast on the breakdown text is ≥4.5:1 against the cream background.

### Performance

- `next/dynamic` import the Calculator client component with `ssr: false` so the page initial-paint doesn't block on it. The static prose renders first; the interactive widget hydrates after.
- Don't ship a charting library for v1. The breakdown is a `<dl>` or a `<table>`; native HTML is fine.

### Analytics events

- `tax_calculator_viewed` on page mount.
- `tax_calculator_calculated` on each completed calculation (shelf price > 0, tier set, city set), with `{ shelf_price_bucket: '0-25' | '25-50' | '50-100' | '100+', tier, city }`. Don't log raw shelf price — that's a meaningless privacy leak that no analyst will use.
- `tax_calculator_alerts_clicked` when the "Calculator coming soon, get notified" CTA is clicked from the article footer (cross-page event).

### SEO

- Self-canonical `<link rel="canonical">` matching the resolved URL.
- `<meta name="description">` from the article metadata.
- Schema.org `WebApplication` JSON-LD because the calculator is an interactive tool — gets us a richer Google snippet.
- Internal links: from `/illinois-cannabis-tax` (the article) and from every deal card's "Why is the price higher at checkout?" microcopy.

### Open questions for the implementation session

1. **Auto-detect via `/api/geo`?** We have a basic location service for the homepage's "deals near you" feature. Reusing it for the calculator's city default is cheap. If the API doesn't currently return city-level resolution, defaulting to "Peoria" is fine.
2. **Should the calculator persist last-used inputs across sessions?** v1 says no — if you come back tomorrow, blank slate. v2 considers `localStorage` if user feedback wants it.
3. **How do we handle medical cannabis?** Out of scope, but the tax structure is meaningfully different (no excise tax). v2 may add a "Medical cardholder" toggle that zeroes out the excise.

---

## Cross-reference

This spec implements **Idea 1** from `docs/out-of-the-box-ideas-from-external-review.md`. The original idea framed the calculator as embedded on every deal card. This v1 spec ships a standalone page first to validate the math and the per-city rate table on a controlled surface; per-card embedding is v2. The standalone calculator is the moat-creation step (this is the thing aggregators don't do); the per-card embed is the conversion-rate step.

When the v1 calculator ships, mark Idea 1 as "v1 implemented" in `docs/out-of-the-box-ideas-from-external-review.md`. When per-card embedding ships, mark "v2 implemented."
