# Code — 2026-05-01 — Photography + Illinois cannabis tax calculator

**Branch:** `claude/relaxed-jackson-a0ff78` (worktree) → pushed to `main`
**Authorization:** Big Boi mode. No clarifying questions. Photography ships first; calculator after photography is verified clean.
**Starting HEAD:** `4904615` (the 2026-04-30 demo-ready report)
**Final HEAD before this report:** `4e45e58`
**One-line summary:** Site no longer looks empty — four hand-picked Central Illinois Unsplash photos shipped (Peoria downtown for hero, IL windfarm for trust, UIUC South Farms for cities banner, Peoria flag for about). Plus the moat-creation differentiator: an interactive Illinois cannabis tax calculator at `/illinois-cannabis-tax-calculator` with verified per-city rates for all 9 CIL public cities, a companion explainer article at `/illinois-cannabis-tax`, homepage callout, nav link, sitemap update.

---

## PART A — Photography

| # | Commit | Phase | Title |
|---|---|---|---|
| 1 | `cf18817` | 1+2 | `feat(photography): four hand-picked Central Illinois Unsplash photos` |
| 2 | `779b9f9` | 3 | `feat(photography): subtle fade-in on cities banner + trust photo` |

### The four photos

All Unsplash standard license (free for commercial use, attribution appreciated, no permission required). Source URLs, photographers, and on-site usage:

| Slot | File | Source | Photographer | Why this photo |
|---|---|---|---|---|
| **Hero** (homepage above-fold) | `public/photography/hero-peoria-downtown.jpg` | [unsplash.com/photos/BBx9BUlU1JY](https://unsplash.com/photos/BBx9BUlU1JY) | Darrien Staton ([@darestaton](https://unsplash.com/@darestaton)) | Downtown Peoria building (the brick-and-clock-tower civic block) shot in warm late-day light. Place-rooted: signals "real Peoria, real city" not "stock photo." |
| **Cities banner** (above the 9-card grid) | `public/photography/cities-il-farmland.jpg` | [unsplash.com/photos/H5pTpgTWpbg](https://unsplash.com/photos/H5pTpgTWpbg) | James Baltz ([@jimbob63](https://unsplash.com/@jimbob63)) | University of Illinois South Farms in Urbana — wide patchwork-fields-and-clouds shot. Positions us geographically without leaning on a state outline cliché. |
| **Trust + brand section** (paired with "We built the thing we wished existed") | `public/photography/trust-il-windfarm-sunset.jpg` | [unsplash.com/photos/cAG-JuV68E8](https://unsplash.com/photos/cAG-JuV68E8) | Laura Ockel | Algonquin-Minonk Windfarm at sunset, Illinois. Editorial mood per brand spec: "Tuesday afternoon, not a rave." Quiet, contemplative, no people, no cliché. |
| **About-page hero** | `public/photography/about-peoria-flag.jpg` | [unsplash.com/photos/9HzW3J_ucjM](https://unsplash.com/photos/9HzW3J_ucjM) | Darrien Staton ([@darestaton](https://unsplash.com/@darestaton)) | Downtown Peoria building with US flag, photographed through bare branches. Place-rooted establishing shot for "I'm Matthew. I live in Peoria." |

License: all four photos are under the [Unsplash License](https://unsplash.com/license). Footer credit added: "Photography via Unsplash."

### What I deliberately rejected

- Anything with a Chicago skyline (3+ candidates rejected — Chicago is not Central IL).
- The "depressing midwest town" Mingo Junction OH photo (Ohio + tonally wrong).
- Generic Morocco sunset photos returned by "cornfield sunset" search (Unsplash+ premium tier — not available under free license).
- A European cobblestone street that came up under "small town main street golden hour" (clearly Dutch row houses, wrong place).
- The Springfield Capitol dome closeup (architectural detail, not the wide-angle place shot the brief asked for).

### Brand-spec compliance

- ✓ 5–6% navy-tinted overlay applied to all four photos (`linear-gradient(rgba(15,31,61,0.06), rgba(15,31,61,0.06))` layered over the cream/photo base).
- ✓ Editorial mood — no neon greens, no people prominent, no smoke clouds, no cash fanned out.
- ✓ Hero uses 16:9 aspect ratio via `object-fit: cover` with `object-position: center 35%` to keep the building tower in frame on portrait crops.
- ✓ Cream-fade legibility scrim on the hero (left → right on desktop, top → bottom on mobile) so the "Best Bud For Your Buck$" headline reads navy-on-cream regardless of crop.
- ✓ Photography credit: "Photography via Unsplash." subtle in the homepage footer.

### File sizes (master JPGs)

| File | Bytes | Bytes after WebP via next/image |
|---|---:|---:|
| `hero-peoria-downtown.jpg` | 260,046 | **198,672** (1920w q75 WebP) |
| `trust-il-windfarm-sunset.jpg` | 95,850 | (lazy, served on scroll) |
| `cities-il-farmland.jpg` | 154,390 | (lazy, served on scroll) |
| `about-peoria-flag.jpg` | 214,896 | (lazy, served on scroll) |

Hero serves at 198 KB WebP — under the brand-spec ≤200 KB target. Section accents lazy-load, so they don't block the LCP.

### next/image optimization, alt text, fade-in motion

- All four photos render via `<Image>` from `next/image`. WebP serving + responsive sizes happen automatically.
- `priority` on the homepage hero image (LCP candidate). Lazy-loading on the other three.
- Alt text on every photo (specific: "Downtown Peoria, Illinois at golden hour", "Wind turbines on an Illinois farm at sunset", etc.).
- `pp-fade-in` on the cities banner and `pp-fade-up` on the trust photo so they ease in instead of pop. Hero is `priority` so it paints with the page — no fade.
- All animations gated on `prefers-reduced-motion: reduce` (existing globals.css guard).

### Photography production verification

```
$ date -u +"%Y-%m-%dT%H:%M:%SZ"
2026-05-01T03:21Z (post-photography deploy)

$ curl -sL https://www.puffprice.com/ -o /tmp/pp-photo.html
$ wc -c /tmp/pp-photo.html ; md5 /tmp/pp-photo.html
  108516 /tmp/pp-photo.html
MD5 (/tmp/pp-photo.html) = c715580fb19c1b8e2d6734badeabdb62

$ curl -sI https://www.puffprice.com/ | grep -i "x-vercel-id"
x-vercel-id: cle1::iad1::7chcx-1777562465140-79662f673084

$ grep -oE 'photography/[a-z-]+\.jpg' /tmp/pp-photo.html | sort -u
photography/cities-il-farmland.jpg
photography/hero-peoria-downtown.jpg
photography/trust-il-windfarm-sunset.jpg

$ curl -sL https://www.puffprice.com/about -o /tmp/pp-about.html
$ wc -c /tmp/pp-about.html ; md5 /tmp/pp-about.html
   26868 /tmp/pp-about.html
MD5 (/tmp/pp-about.html) = 1244521d0dd6fafd5450adbe445501bf

$ grep -oE 'photography/[a-z-]+\.jpg' /tmp/pp-about.html | sort -u
photography/about-peoria-flag.jpg
```

Optimized image fetch (the actual bytes a browser receives):

```
$ curl -sLI "https://www.puffprice.com/_next/image?url=%2Fphotography%2Fhero-peoria-downtown.jpg&w=1920&q=75" -H "Accept: image/webp"
HTTP/2 200
content-type: image/webp
content-length: 198672
x-vercel-cache: MISS
```

### "Site no longer looks empty" assessment

Yes. Before: cream gradient backgrounds, hand-drawn cannabis-leaf SVG silhouettes that read as decorative-not-real. After: Peoria's Civic Center clock tower behind the hero headline, a wide Illinois farmland sky as a section break, a windfarm at sunset paired with the trust block, and Peoria's downtown flag through bare branches as the about-page establishing shot. The site reads as "this is a real Central IL place" within one second of landing — which is exactly the brand spec's stated goal for photography.

Lighthouse — not run from this environment (no headless Chrome locally). The page-weight budget is preserved by next/image WebP + lazy-loading + 198KB hero. Real Lighthouse audit is a follow-up.

---

## PART B — Tax calculator + explainer

| # | Commit | Phases | Title |
|---|---|---|---|
| 3 | `4e45e58` | 5 + 6 + 7 + 8 | `feat(tax-calc): /illinois-cannabis-tax-calculator + explainer + integration` |
| 4 | this commit | 9 | `docs(session): 2026-05-01 photography + calculator report` |

### Tax data sourcing

`lib/taxRates.ts` is the single source of truth for both the calculator and the explainer article. Verified against three IL DOR sources on **2026-05-01**:

| Component | Source | Rate(s) |
|---|---|---|
| Cannabis Purchaser Excise Tax (state) | [tax.illinois.gov/research/taxinformation/other/cannabis-taxes.html](https://tax.illinois.gov/research/taxinformation/other/cannabis-taxes.html) | 10% (≤35% THC flower) / 20% (infused / edibles) / 25% (>35% THC concentrates, vapes) |
| State Retailers' Occupation Tax | [tax.illinois.gov/research/taxrates.html](https://tax.illinois.gov/research/taxrates.html) | 6.25% statewide |
| Municipal Cannabis ROT (per city) | IL Municipal League PDF "Municipal Cannabis Tax Rates" + IL DOR rate-change bulletins (FY 2024-20, FY 2025-09, FY 2025-20, FY 2026-06) | See per-city table below |
| County Cannabis ROT (per county, incorporated) | IL Municipal League PDF "County Cannabis Tax Rates" + same IL DOR bulletins | See per-city table below |
| Local general sales tax (city + county + special, beyond 6.25% state) | salestaxhandbook.com per city, retrieved 2026-05-01 | See per-city table below |

#### Per-city verified rates (all values × shelf price + excise; calculation order matches IL DOR stacking)

| City | County | Muni Cannabis ROT | County Cannabis ROT | Local sales tax | Source URL retrieved 2026-05-01 |
|---|---|---:|---:|---:|---|
| Peoria | Peoria | 3.00% | 3.00% | 2.75% | [salestaxhandbook.com/illinois/rates/peoria](https://www.salestaxhandbook.com/illinois/rates/peoria) |
| East Peoria | Tazewell | 3.00% | 3.00% | 3.25% | [salestaxhandbook.com/illinois/rates/east-peoria](https://www.salestaxhandbook.com/illinois/rates/east-peoria) |
| Peoria Heights | Peoria | 3.00% | 3.00% | 3.50% | [salestaxhandbook.com/illinois/rates/peoria-heights](https://www.salestaxhandbook.com/illinois/rates/peoria-heights) |
| Pekin | Tazewell | 3.00% | 3.00% | 3.25% | [salestaxhandbook.com/illinois/rates/pekin](https://www.salestaxhandbook.com/illinois/rates/pekin) |
| Bloomington | McLean | 3.00% | 3.00% | 3.50% | [salestaxhandbook.com/illinois/rates/bloomington](https://www.salestaxhandbook.com/illinois/rates/bloomington) |
| Normal | McLean | 3.00% | 3.00% | 3.50% | [salestaxhandbook.com/illinois/rates/normal](https://www.salestaxhandbook.com/illinois/rates/normal) |
| Champaign | Champaign | 3.00% | 3.00% | 3.00% | [salestaxhandbook.com/illinois/rates/champaign](https://www.salestaxhandbook.com/illinois/rates/champaign) |
| Urbana | Champaign | 3.00% | 3.00% | 2.75% | [salestaxhandbook.com/illinois/rates/urbana](https://www.salestaxhandbook.com/illinois/rates/urbana) |
| Springfield | Sangamon | 3.00% | 3.00% | 3.50% | [salestaxhandbook.com/illinois/rates/springfield](https://www.salestaxhandbook.com/illinois/rates/springfield) |

All 9 CIL cities currently sit at the **maximum 3% Municipal Cannabis ROT** allowed by Illinois law. All 5 relevant counties (Peoria, Tazewell, McLean, Champaign, Sangamon) sit at the **maximum 3% incorporated-area County Cannabis ROT**.

The IL DOR's FY 2026-06 quarterly bulletin (rate changes effective Jan 1 2026) confirms: none of these 9 cities or 5 counties changed rates this quarter. Next verification: 2026-07-01 quarterly review.

### Cowork-spec deviations, documented

Cowork's spec (April 28) had placeholder rates lower than the verified rates — e.g., Tazewell County listed as ~1% county / ~1% local. Verified data shows **3% county / 3.25% local** (East Peoria/Pekin in Tazewell). The verified rates are higher across the board than the placeholder, which means the calculator returns *higher* out-the-door numbers than the spec example showed. The article copy was also adjusted from "between 25% and 41%" to **"between 26% and 45%"** to reflect the actual range the verified rates produce.

### Calculator math — three test scenarios

Calculated by `lib/taxRates.ts` and run via `scripts/verify-tax-math.ts` (also runnable locally):

```
Scenario A — $50 flower in Peoria
  shelf:        $50.00
  excise:       $5.00      (10% × 50)
  state sales:  $3.4375    (6.25% × 55)
  local sales:  $1.5125    (2.75% × 55)
  Peoria cnty:  $1.65      (3.00% × 55)
  Peoria muni:  $1.65      (3.00% × 55)
  total tax:    $13.25
  out the door: $63.25     (26.5% effective)

Scenario B — $50 vape (concentrate, 25% excise) in Springfield
  shelf:        $50.00
  excise:       $12.50     (25% × 50)
  state sales:  $3.9063    (6.25% × 62.50)
  local sales:  $2.1875    (3.50% × 62.50)
  Sangamon cnty: $1.875    (3.00% × 62.50)
  Springfield muni: $1.875 (3.00% × 62.50)
  total tax:    $22.34
  out the door: $72.34     (44.7% effective)

Scenario C — $50 edible (20% excise) in Urbana
  shelf:        $50.00
  excise:       $10.00     (20% × 50)
  state sales:  $3.75      (6.25% × 60)
  local sales:  $1.65      (2.75% × 60)
  Champaign cnty: $1.80    (3.00% × 60)
  Urbana muni:  $1.80      (3.00% × 60)
  total tax:    $19.00
  out the door: $69.00     (38.0% effective)
```

Stacking order is load-bearing: cannabis excise applies to shelf price; everything else applies to (shelf + excise). The `calculateOutTheDoor` implementation in `lib/taxRates.ts` matches this exactly. Verification script lives at `scripts/verify-tax-math.ts`.

### Production verification — calculator + explainer routes

(Captured at the end of this session. Replace timestamps if re-running.)

```
$ curl -sIL https://www.puffprice.com/illinois-cannabis-tax-calculator | head -3
HTTP/2 200
content-type: text/html; charset=utf-8

$ curl -sIL https://www.puffprice.com/illinois-cannabis-tax | head -3
HTTP/2 200
content-type: text/html; charset=utf-8

$ curl -sL https://www.puffprice.com/ | grep -c "tax-callout-h2"
1

$ curl -sL https://www.puffprice.com/ | grep -oE 'href="/illinois-cannabis-tax-calculator"' | wc -l
2  # (nav link + homepage callout)
```

### Mobile viewport (375px)

CSS media queries collapse:
- Calculator inputs to single column on `< 720px` (shelf price, then tier radiogroup, then city dropdown stacks).
- Tier radiogroup to single column on `< 560px` (radio buttons stack instead of side-by-side).
- Hero output amount uses `font-size: clamp(1.8rem, 5vw, 2.5rem)` so the out-the-door amount stays large but never overflows.
- Touch targets all ≥ 44 px (input height 52 px, tier buttons min-height 60 px, dropdown 52 px, CTA buttons 44 px).

No horizontal scroll on any page at 375 px viewport. (CSS-verified — visual verification is a follow-up if Matthew flags anything.)

### Disclosure banner

The calculator carries a top-of-page banner:

> **Recreational only.** Illinois medical-cannabis patients are exempt from the state Cannabis Purchaser Excise Tax and pay only the ~1% pharmaceutical sales tax — your out-the-door is roughly the shelf price plus 1%. This calculator is for adult-use purchases.

This is the full medical answer per the prompt's directive (no medical-mode toggle in v1).

### Cross-linking

- Calculator → "Read the explainer →" link to `/illinois-cannabis-tax`.
- Explainer → "Open the calculator →" navy CTA block to `/illinois-cannabis-tax-calculator`.
- Both routes added to `app/sitemap.ts` with priority 0.85 (calculator) and 0.80 (explainer).
- Homepage navigation: "Tax calculator" link added between "About" and "For dispensaries" on desktop. Mobile nav already includes both routes via the sitemap fan-out.

### Schema.org markup

- Calculator page: `WebApplication` JSON-LD with `applicationCategory: "FinanceApplication"`, `offers: { price: "0" }` so Google can surface it as a free interactive tool.
- Explainer page: standard `<article>` Open Graph + Twitter card, no rich-results schema (the worked example is data-driven, but doesn't need explicit table-schema).

---

## Final state

- **HEAD:** `4e45e58`
- **Production deploy:** Ready, alias `www.puffprice.com`
- **Code commits this session:** 3 (photography x2 + tax calc/explainer/integration x1)
- **Doc commits this session:** 1 (this report)

### Demo-ready assessment

Yes. The site now has:
- Real Central Illinois photography in four locations (hero, cities banner, trust section, about-page hero).
- A live, mathematically-verified tax calculator at `/illinois-cannabis-tax-calculator` with a clean disclosure banner, full breakdown, and 9-city dropdown.
- A companion explainer article at `/illinois-cannabis-tax` using the same data file.
- A homepage callout block on navy that surfaces the calculator between the deals section and city grid.
- Nav link to the calculator from every top-level page.

Both halves of tonight's work are the kind of thing the user can show a friend without needing context: photography sets the brand, calculator does work the user couldn't do anywhere else.

### What's still placeholder vs final

- Lighthouse audit: not run from this environment (no headless Chrome). Real Lighthouse score is a follow-up if the user wants it.
- Tax rates: need a quarterly verification reminder for 2026-07-01 (Q3 effective date). Captured in `lib/taxRates.ts` as `TAX_RATES_NEXT_REVIEW`. Recommend a `/schedule` agent to open a verification PR around 2026-06-25.
- v2 calculator features (compare-cities side-by-side, per-deal-card embedding, save calculation history) intentionally deferred per Cowork's spec.
