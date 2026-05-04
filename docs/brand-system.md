# PuffPrice Brand System
**Date:** 2026-05-04
**Status:** Active spec for the sitewide visual rollout. Supersedes parts of `docs/brand/2026-04-28-identity-package.md` — see § 10 (Decision log).
**Authoritative companions:** `docs/design-references/asset-manifest.md` (imagery), `docs/audits/2026-05-04-sitewide-visual-system-audit.md` (scope log).
**Tone:** reference doc. Not marketing copy.

---

## 1. Identity

### Wordmark

`PuffPrice` set in **Manrope 800**, sage green, single line, letter-spacing −0.025em. The wordmark is the primary mark across all surfaces where space allows (≥24px height).

### Pin mark companion

A small geometric map-pin silhouette with an embedded leaf glyph, sage-green stroke, no fill. Used wherever the wordmark won't survive — favicons, app icon, OG-card corner stamp, future merch, and any sub-32px context.

### Status note

This identity is **good-enough-to-ship through Phase 1**. Definitive brand work — commissioned wordmark refinement, custom pin mark, custom photography, full type-pairing exploration — is deferred until post-PMF. Code implements the spec as written; we don't bikeshed the mark before we have a business that earns the bikeshed.

### Tagline (locked)

> **Best Bud For Your Buck$ — Low Prices. High Times.**

Don't rewrite either half. Don't sub a synonym for "buck" or drop the dollar-sign accent on `Bucks` — the `$` is the visual signature in copy form and parallels the `P` accent in the wordmark.

### Geographic positioning (locked)

PuffPrice is **Central Illinois only** through Phase 1: 12 cities, 9 currently with licensed dispensaries. Every wordmark instance, OG card, and footer line carries the geographic anchor — most cleanly via "Built in Peoria, Illinois 🌿". Do not soften this to "the Midwest," "Illinois," or "the heartland." The scope is the brand.

---

## 2. Color tokens

**Note on values:** the hex codes below are the *intent*. Authoritative hexes are the values committed to `app/globals.css` after Code's PR lands. If a hex below differs from `globals.css` post-PR, `globals.css` wins and this section is updated in a follow-up.

### Brand primitives

| Token | Intent | Approximate hex |
|---|---|---|
| `--brand-primary-deep` | Deep brand surface — homepage hero panel, footer band, OG-card background, "premium" surfaces. Near-black with a green tint; reads serious without reading goth. | `#050F09` |
| `--brand-accent-green` | The signature accent — CTAs, the `$` glyph in the tagline, "verified" pills, hover transitions, the wordmark fill. | `#50C878` (sage / emerald) |
| `--brand-sand` | Warm earth-tone secondary — section accent rules, pull-quote highlights on long-form content, terracotta-adjacent without going full terracotta. | `#C8A877` *(directional — Code finalizes)* |
| `--brand-cream` | Default light page background. Warmer than pure white — reads "publication," not "form." | `#F0EDE8` |
| `--brand-cream-pure` | Card and input surfaces only. Cream is the page; pure cream is the surface. | `#FAFAF7` |
| `--brand-text-on-deep` | Body and headline color when the surface is `--brand-primary-deep`. | `#F0EDE8` |

### Neutral scale

Tailwind-style 50/100/.../900 with a warm tint at the 100–300 steps so neutrals coexist with cream without going cold-blue.

| Step | Use |
|---|---|
| `gray-50` | Inverse text on dark surfaces |
| `gray-100` | Subtle card hover background |
| `gray-200` | Borders, dividers (warm-tinted to match cream) |
| `gray-300` | Disabled borders |
| `gray-400` | Placeholder text |
| `gray-500` | Metadata: "verified 2h ago," "0.4 mi away" |
| `gray-600` | Secondary body text |
| `gray-700` | Primary body text on cream backgrounds |
| `gray-900` | Aliased to `--brand-primary-deep` for code clarity |

### Status colors

| Token | Use |
|---|---|
| `--status-verified` | Same as `--brand-accent-green`. "Verified 2h ago" dot, "live" pill. |
| `--status-pending` | Amber — `~#D97706`. "Verification pending" pill at 72h+ unverified. |
| `--status-expired` | Deep red — `~#B91C1C`. "Expired" badge, error toast borders. |
| `--status-info` | Blue — `~#2563EB`. Reserved for "coming soon" pills. |

### Usage rules

The accent green is the **only CTA fill color**. Body text on cream is `gray-700`, not the deep brand primary. Sand is rare — if more than one sand element appears on a screen, it's been overused. Status colors only appear in status contexts.

---

## 3. Typography

**Decision: Manrope, all weights, single family.** A geometric sans that scales from 11px metadata to 72px hero without needing a paired display face. Available via `next/font/google`. Free, well-supported, tree-shakable per weight.

### Weights in use

| Weight | Use |
|---|---|
| `400` | Body text, paragraph copy, list items, table cells |
| `500` | Metadata, secondary navigation, button labels in low-stakes contexts |
| `600` | Subheads (H3, H4), card titles, primary navigation, button labels in primary contexts |
| `800` | Wordmark, hero `<h1>`, page H1, pricing/discount values, "verified" timestamps |

We do not use `100/200/300/700/900`. If a weight is needed it gets approved in a follow-up; we don't ship faux-weights.

### Type scale

| Role | Size | Weight | Tracking | Line-height |
|---|---|---|---|---|
| Hero (homepage `<h1>`) | 56–72px (clamp) | 800 | −0.04em | 1.05 |
| Page H1 | 40–52px (clamp) | 800 | −0.035em | 1.10 |
| H2 | 32–40px (clamp) | 600 | −0.030em | 1.15 |
| H3 | 22–28px (clamp) | 600 | −0.020em | 1.20 |
| H4 / card title | 17–18px | 600 | −0.010em | 1.30 |
| Body — UI / chrome | 16px | 400 | 0 | 1.55 |
| Body — long-form | 17–18px | 400 | 0 | 1.65 |
| Metadata | 13px | 500 | 0.010em | 1.40 |
| Eyebrow / kicker | 11px | 800 | 0.140em UPPERCASE | 1.40 |
| Price / discount | inherits parent | 800 | −0.020em + tabular-nums | 1.00 |

### Tabular numerals — non-negotiable

`.price`, `.discount`, `.distance`, `.timestamp` use `font-variant-numeric: tabular-nums` and `font-feature-settings: "tnum"`. A list of "$35 / $40 / $42" without tabular-nums rags at the dollar signs. With tabular-nums it lines up. One CSS rule defines whether the site looks polished or sloppy.

### When to use which weight

- Page identity (wordmark, hero, H1): **800**.
- Section identity (H2, H3, card titles, primary nav): **600**.
- Reading text and chrome that must never compete with identity: **400**.
- Metadata that needs to be findable but quiet: **500**.

### Don'ts

No font-stretching. No oblique fakes. No body paragraphs longer than two sentences in 800 — Manrope 800 is a display weight, reading 200 words of it is uncomfortable. No serif anywhere except `<code>` blocks (which inherit the system mono via `font-mono`).

---

## 4. Spacing and layout

### Spacing scale

`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128` (px). Anything outside this scale is a smell — push back before shipping.

### Section padding rules

| Section type | Desktop vertical padding | Mobile vertical padding |
|---|---|---|
| Hero | `8rem` (128px) | `4rem` (64px) |
| Standard section | `6rem` (96px) | `3rem` (48px) |
| Compact section (utility, sub-section) | `4rem` (64px) | `2rem` (32px) |
| Footer | `4rem` top, `3rem` bottom | `3rem` top, `2rem` bottom |

### Container widths

| Container | Max-width | Notes |
|---|---|---|
| Marketing wide | `1280px` | Hero, full-bleed sections |
| Marketing standard | `1120px` | Most marketing content |
| Reading | `720px` | Long-form (`/about`, `/about/index`, content articles) |
| Listing index | `1280px` | Card grid pages |
| Listing detail | `880px` for content, `1120px` for header | `/dispensary/[slug]` and `/l/[id]` |
| Admin | `1440px` | Data-dense, no marketing chrome |

### Breakpoints

| Name | Min-width | Use |
|---|---|---|
| `sm` | 640px | Phones turning landscape, large phones |
| `md` | 768px | Tablets, small laptops |
| `lg` | 1024px | Standard desktop |
| `xl` | 1280px | Wide desktop, marketing hero |
| `2xl` | 1536px | Reserved — no specific designs target this yet |

### Grid

Card grids: `1` column on mobile, `2` at `sm`, `3` at `lg`, `4` at `xl` for high-density listing pages. Gap: `24px` (1.5rem) at all sizes.

---

## 5. Component inventory

The list below is what exists in `app/components/` and `components/` at audit time. Code refactors these to consume tokens; this PR doesn't introduce new components except where called out in § 6.

### Shared components (in `app/components/`)

| Component | Purpose | Page types using it |
|---|---|---|
| `Logo.tsx` | Renders the wordmark (currently raster `/logo-512.png`; migrating to inline SVG per § 1) | Sitewide nav, footer, OG card |
| `HeroDealCard.tsx` | Featured deal hero card | Homepage |
| `HomeDealCards.tsx` | Deal card grid for homepage | Homepage |
| `HomeTicker.tsx` | "Recently verified" ticker | Homepage |
| `TopDealsRow.tsx` | Top deals horizontal scroll row | Homepage, city pages |
| `EndingSoonRow.tsx` | "Ending soon" deal row | Homepage, city pages |
| `RecentlyViewedRow.tsx` + `RecentlyViewedTracker.tsx` | Returning-user recently viewed | Sitewide, conditional |
| `DealBadge.tsx` | Single deal badge (price/discount) | Cards across all pages |
| `DealCtaLink.tsx` + `TrackedLink.tsx` | Click-tracked deal CTAs | Cards across all pages |
| `DealFreshnessBadge.tsx` | "Verified Xh ago" pill | Cards, detail pages |
| `ShareDealButton.tsx` | Share affordance for deals | Detail pages |
| `LocationAware.tsx` | Geolocation prompt + "near you" UX | Homepage, deal pages |
| `MobileNavMenu.tsx` | Mobile nav drawer | Sitewide on mobile |
| `MedicalFriendlyToggle.tsx` | Toggle between rec / med friendly views | Homepage, listing index |
| `CityEmailCapture.tsx` | "Tell me when this city has deals" | City pages with no active deals |
| `ClaimForm.tsx` | "Claim this listing" for dispensary owners | Detail pages |
| `GetListedForm.tsx` | "Get listed" form for new dispensaries | `/get-listed` |
| `PuffPriceIndexCard.tsx` | Statewide price-per-gram index display | Homepage, `/about/index` |
| `SavingsCallout.tsx` | "You'd save $X" callout | Homepage, deal pages |
| `FourTwentyBanner.tsx` | Holiday banner (4/20 etc.) | Sitewide, conditional |
| `SearchTracker.tsx`, `TrackView.tsx`, `UtmCapture.tsx` | Analytics — not visual but listed for completeness | Sitewide |

### Page-level components (in `components/`)

| Component | Purpose |
|---|---|
| `CityPage.tsx` | City detail page composition (`/city/[city]`) |
| `CitySeoSection.tsx` | SEO content block within city pages |
| `DirectoryLandingPage.tsx` | `/dispensaries` landing template |

### What this PR refactors

Every component above gets a token-pass: hard-coded hex values become token references, hard-coded font sizes/weights become Tailwind utility references that pull from the type scale, hard-coded paddings become scale references. No new visual capabilities — same components, consistent system.

---

## 6. Page-type templates

Five templates cover every public surface. Admin gets a sixth template that's intentionally austere.

### 6.1 Marketing pages

Homepage, `/about`, `/about/index`, `/upgrade`, `/alerts`.

- **Hero:** deep-green brand panel with leaf-pattern watermark at 4–5% opacity, cream wordmark, hero headline (Manrope 800), subhead (Manrope 400), accent bud photography on right edge per `asset-manifest.md`.
- **Sections:** alternating cream and pure-cream surfaces with `6rem`/`3rem` vertical padding. Section accents (4:5 vertical bud sliver, sand-colored 1px divider) used sparingly.
- **Photography:** in scope on these pages — at edges, not centered.
- **Leaf pattern:** in scope on dark sections only (hero, footer band).

### 6.2 Listing / index pages

`/dispensaries`, `/deals/[category]`, `/city/[city]`, `/brand`, search-result surfaces.

- **Header:** compact title band on cream, no hero photography, breadcrumb above, count + filter summary below.
- **Filter bar:** sticky on scroll on desktop, collapsible drawer on mobile. Manrope 500 labels.
- **Card grid:** the inventory cards described in § 5. Dispensary logo in card per `asset-manifest.md` § 3 — never bud photography in the card itself.
- **No leaf pattern** anywhere on these pages — the cards are the texture.

### 6.3 Detail pages

`/dispensary/[slug]`, `/l/[id]`, `/deal/[uuid]`, `/brand/[slug]`.

- **Header band:** dispensary or brand logo on cream tile (96×96), name in Manrope 800, location subhead in Manrope 500 with `MapPin` icon.
- **Content sections:** stat strip, hours, amenity rows (Lucide icons per § 4 of asset manifest), map iframe, content paragraphs in `gray-700` Manrope 400, related deals, "report outdated" link footer.
- **No bud photography on detail pages.** The dispensary's own logo is the visual.
- **Verified-timestamp pattern:** every quantitative claim carries a "Verified Xh ago" or "Verified at 11:09 PM" stamp. Specifics in § 9.

### 6.4 Utility pages

`/alerts`, `/upgrade`, `/get-listed`, `/claim`, `/early-access`, `/privacy`.

- Focused, minimal imagery. One subtle bud-photo accent (per `asset-manifest.md`) where the page is a conversion surface (`/alerts`, `/upgrade`); none on legal/compliance pages.
- Forms in pure-cream surfaces with `gray-200` borders. Manrope 500 labels, Manrope 400 inputs, accent-green submit buttons.

### 6.5 Admin pages

`/admin/*`.

- **Data-dense, no decorative imagery, no leaf pattern, no bud photography.** Cream background, gray-200 dividers, Manrope all weights as the system prescribes.
- **Wordmark** stripped to mono — no accent treatment. Admin is a tool, not a marketing surface.
- P0 fix in this PR: `/admin` counts must reflect Central Illinois scope only. See `docs/audits/2026-05-04-sitewide-visual-system-audit.md` § 2.

### 6.6 Empty states

Empty state cards live in any of the templates above. The card surface is dark when the empty state is the page's main content (e.g., `/city/bartonville` with no deals); leaf pattern appears at 5% on those dark cards. Empty-state copy follows § 9 (voice).

---

## 7. Imagery rules — IN SCOPE

These are the only visual asset categories that ship in this rollout.

1. **Bud photography (edges/accents only, never center-stage).** Six explicit Pexels images, six explicit slots. Treatment: 8% deep-green tint overlay, 30% scrim behind any text. Spec: `asset-manifest.md` § 1.
2. **Leaf SVG patterns (~6% opacity, dark surfaces only).** Single geometric leaf, stroke-only, 96px tile, opacity ≤ 6%. Never on light surfaces. Spec: `asset-manifest.md` § 2.
3. **Dispensary logos in cards.** Each dispensary's own logo (vector preferred, PNG fallback). Monogram fallback when logo is unavailable. Spec: `asset-manifest.md` § 3.
4. **Category icons (Lucide line-art).** `lucide-react`, stroke 1.75, sized per context. Mapping: `asset-manifest.md` § 4. Custom icon commissioning is post-PMF.

That's the entire imagery palette. Anything else is out of scope or a follow-up.

---

## 8. Imagery rules — OUT OF SCOPE

These do not ship under any circumstance in this rollout.

- **Consumption imagery** (smoking, vaping, eating). Federally illegal to depict in advertising in many contexts; processor-hostile (Stripe, Resend); tone-deaf — our user already knows how to consume.
- **Joints, pipes, bongs in hero or cards.** Same processor-risk lens. The bud is fine; the apparatus is not.
- **Dollar-sign motifs as decoration** (giant `$` graphics, dollar-bill backgrounds, cash-fanned hands). The `$` glyph in the tagline does the entire dollar-sign job; anything more triggers payment-processor friction reviews.
- **Cartoon weed / stoner aesthetic.** Tie-dye, googly-eye buds, "420 dudes" iconography. Wrong audience, wrong era.
- **AI stock with hallucinated text.** Any image whose embedded text doesn't read as English at 100% zoom — even decorative, even small. See `docs/design-references/04-do-not-replicate.jpg` (catalogued as anti-reference).
- **Sexualized imagery.** No exceptions. Not tasteful, not artful, not "cannabis lifestyle."
- **People in product photography.** No models holding bud, no hands offering pre-rolls, no lifestyle-shoot people-on-couches. The exception is the eventual founder photo on `/about`, which is not "product photography."
- **Chicago skyline.** Central Illinois lock — visual choices reinforce the scope.

If a future agent or contractor proposes anything in this list, the answer is no. Document the rejection in `docs/decisions/` and move on.

---

## 9. Voice

Voice rules in detail live in `docs/brand/2026-04-28-identity-package.md` § 2.6. The summary that survives:

- **Builder-to-builder.** The reader is a working adult shopping for cannabis; don't explain weed to them and don't apologize for it. Plain-spoken, slightly cheeky, specific over abstract.
- **Factual, Central IL native.** Counts get rounded down, never up. "26 dispensaries" if we have 26. Date-stamp anything that drifts (tax rates, deal counts). Geographic anchoring is real ("Built in Peoria"), not generic ("the Midwest").
- **No fabricated counters.** No vanity metrics on the surface. The April 20 audit caught us claiming "293 dispensaries" when we had 26 in scope. That class of error is a brand killer in this category.
- **Verified-timestamp pattern:** every quantitative claim carries a verification stamp. The canonical form is `Verified 18% · 11:09 PM` for percentages-with-time, `Verified 2h ago` for time-only, `Verified at 11:09 PM` for time-of-day. Always lowercase metadata, always Manrope 500, always `gray-500` color. Always visible on cards, detail pages, and any surface where a price or discount is rendered.
- **Banned phrasebook** (full list in identity package): premium, curated, discover, find your perfect, best-in-class, game-changing, empowering, streamline, robust, scalable, cutting-edge.

---

## 10. Decision log

### Why bud imagery is in scope

The April 28 identity package leaned away from cannabis-product photography on the grounds that it was clichéd. The sitewide rollout reverses that lean for one reason: every category-leading directory we're competing with — Leafly and Dutchie at their best moments — uses bud photography at the edges of compositions. Refusing the entire category to differentiate forces the site into "generic SaaS minimalism" territory, which loses category recognition. The line that holds: **presence is fine, consumption is not.** The bud at the edge of a hero panel is a category signal; a person smoking it is a regulatory and processor-risk problem.

### Why deep-green hero is allowed

Earlier versions of the design system included a "no dark mode" rule to keep the site away from goth/cyberpunk aesthetics. That rule was overgeneralized. Deep green (`~#050F09`) on a marketing hero is **cannabis-native**, not goth — it's the color of a freshly trimmed bud, not the color of a hacker terminal. The rule narrows: no neutral-black surfaces, no purple accents, no neon-on-black combinations. Deep cannabis-green-tinted near-black is the brand surface and ships.

### Why "premium" is an explicit goal

The April 20 brand audit characterized the site as reading "circa 2010." That's not survivable in 2026 against Leafly/Weedmaps. "Premium" here doesn't mean "expensive"; it means "the visual standard of the category leaders' best work." Concretely: tabular-nums on every price, photography at the edges (not nowhere), tokens (not hex literals), shared components (not bespoke per page). The bar isn't generic SaaS minimalism — it's Dutchie at its better moments. The word "premium" stays banned in copy (per § 9); it's an internal target, not a public tagline.

### Why dollar-sign motifs stay rejected

Stripe, Resend, and the rest of our payments + outbound stack run periodic content reviews. Decorative dollar signs at scale flag as "promotion of cannabis sales" and trigger account reviews. The `$` glyph in the locked tagline is small, contextual, and reads as wordplay; a giant `$` background graphic reads as a sales pitch. We don't trade processor risk for decoration.

### Why consumption imagery stays rejected

Same processor lens, plus regulatory: most state advertising codes (Illinois included) prohibit advertising the act of consumption. The bud is product; smoking it is an activity; we depict the former and not the latter. This is an unbroken line — no exceptions for "tasteful" or "editorial" framings.

### Why scope is sitewide, not homepage-only

A premium funnel requires consistency end-to-end. Polishing the homepage and leaving the listing index, detail page, and admin pages on the old system creates a worse experience than the dated baseline because users feel the seams. Sitewide is the standard, not the stretch goal — every public route, every admin route, every shared component refactored to consume the system.

### Why P0 funnel fixes ship in the same PR as the visual refresh

Splitting visual from funnel fixes was floated as a sequencing move. It was rejected because a broken funnel under premium chrome reads as worse — users trust the new look, hit the broken funnel, and bail with higher disappointment than they'd have had on the dated version. The P0 fixes (location context on detail pages, `/open-now` timezone, "vs. area average" purge, "City, IL" labels on city pages, `/admin` counts reflecting Central IL scope) are folded into this PR.

### What carries forward from the April 28 identity package, and what doesn't

| Identity package decision | Status in this rollout |
|---|---|
| Wordmark in geometric sans, two-tone | **Carries forward**, but font changes from Geist Display 700 to **Manrope 800** for sitewide consistency with body. |
| Dollar-sign accent in wordmark | **Carries forward** as the `$` in the tagline; the wordmark glyph itself is plain Manrope 800 (no `$P` accent in the mark). The integrated `$P` was flagged as risky in the identity package; this rollout retreats from it. |
| Pin mark deferred | **Reversed.** A pin-mark companion ships in this rollout for sub-32px contexts (favicon, OG corner stamp). Asset spec in `asset-manifest.md` § 5. |
| Navy `#0F1F3D` as primary | **Reversed.** Deep cannabis-green `#050F09` is the brand primary going forward. Navy retired. |
| Terracotta secondary | **Reversed** to **sand** `~#C8A877`. Terracotta read too "ceramic studio"; sand reads "Central Illinois warm earth tone" without coastal connotations. |
| Geist Display + Inter + Source Serif 4 | **Reversed** to **Manrope single-family**. One family with four weights is easier to maintain, ships faster, and avoids the "we picked three good fonts" optics drift. |
| Bud photography rejected | **Reversed** — see "Why bud imagery is in scope" above. |
| Lucide icon system | **Carries forward** unchanged. |
| Tabular-nums non-negotiable | **Carries forward** unchanged. |
| Voice + banned phrasebook | **Carries forward** unchanged. The voice is the strongest part of the brand; this rollout doesn't touch it. |

The April 28 identity package remains a useful artifact — it captures decisions and tradeoffs from that moment. Where this brand system contradicts it, this brand system wins.
