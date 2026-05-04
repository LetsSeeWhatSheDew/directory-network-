# Sitewide Visual System Audit — Scope Evolution
**Date:** 2026-05-04
**Author:** Cowork (Claude)
**Companion docs:** `docs/brand-system.md` (the spec), `docs/design-references/asset-manifest.md` (imagery), `docs/design-references/README.md` (orientation).
**Status:** Decisions logged. Code's session implements against the brand system.

---

## 1. Scope evolution

The shape of this rollout shifted three times before landing. Documenting the path so future sessions don't repeat the loop.

**Initial proposal — homepage refresh, Phase 2 deferred.** First framing was a single-page polish: wordmark cleanup, hero treatment, type scale. Listing index, detail pages, admin, and the funnel fixes would be a separate Phase 2. Quick to ship, narrow risk surface.

**Matthew correction 1 — pivot to premium aesthetic with cannabis imagery.** Bud photography was off the table in the April 28 identity package on cliché grounds. Matthew pushed back: Leafly and Dutchie at their best moments use bud photography at the edges of compositions, and refusing the entire category to differentiate forces the site into "generic SaaS minimalism" territory that loses category recognition. The line that holds: presence is fine, consumption is not. Bud at the edge of a hero panel is a category signal; a person smoking is regulatory and processor risk. Imagery decisions reopened.

**Matthew correction 2 — P0 funnel fixes ship in the same PR, not separate.** The original split (visual now, funnel fixes later) was rejected on user-experience grounds: a broken funnel under premium chrome reads as worse than the dated baseline because users trust the new look, hit the broken funnel, and bail with higher disappointment. Folded the P0 fixes in.

**Matthew correction 3 — sitewide rollout, every route, every component.** Final scope: not a homepage refresh and not even a "marketing-pages" refresh. Every public route, every admin route, every shared component refactored to consume the new tokens. Premium funnel requires consistency end-to-end; partial polish creates seams the user feels.

---

## 2. Final scope

What ships in this PR:

- **Foundational design system.** Tokens (color, type, spacing), shared component refactor, `next/font/google` Manrope wiring, Lucide-react icon swap, leaf-pattern SVG, OG card template, favicon set.
- **Every public route updated.** Homepage, `/about`, `/about/index`, `/upgrade`, `/alerts`, `/get-listed`, `/claim`, `/early-access`, `/privacy`, `/dispensaries`, `/deals/[category]`, `/city/[city]`, `/dispensary/[slug]`, `/l/[id]`, `/deal/[uuid]`, `/brand`, `/brand/[slug]`, `/map`, `/open-now`, `/savings`, `/grow`, `/cannabis/illinois/*` content pages.
- **Every admin route updated.** `/admin/*` adopts the system in its austere form — same tokens, no decorative imagery, no leaf pattern, mono wordmark.
- **P0 funnel fixes folded in:** location context on detail pages, `/open-now` timezone correctness, "vs. area average" copy purged, "City, IL" labels on city pages, `/admin` counts reflecting Central IL scope only (the multi-tenant `master_listings` discipline from the April 27 site audit).
- **Component library refactored to consume tokens.** Hard-coded hex values become token references; hard-coded font sizes/weights become Tailwind utility references that pull from the type scale; hard-coded paddings become scale references. No new components except where the brand system explicitly calls for them.
- **Asset manifest committed before Code starts.** `docs/design-references/asset-manifest.md` is in place; Code's first action is to acquire the listed assets per the manifest's checklist.

---

## 3. What's NOT in this PR

Tracking the line so we don't accidentally pull in adjacent work:

- **Stripe onboarding + checkout flow.** Blocked on Stripe signup completion. The `/upgrade` page consumes the new design system but the conversion path stays a placeholder until Stripe is live.
- **148-row IL license registry migration.** Separate workstream — schema + data import. Not visual.
- **`/dispensaries` and `/about` GSC indexing.** Separate sitemap + indexing pass. The pages themselves are styled in this PR.
- **150-word content floor for listings.** Editorial workstream tracked in `docs/central-il-content-floor-drafts-*.md`. Visual chrome is in scope; copy is not.
- **Database schema changes.** None in this PR. `master_listings`, `deals`, and the rest of the schema stay as-is. The `project_tag='green'` filter rule from `docs/architecture/db-scope-discipline.md` is enforced in any query the visual refactor touches but not changed.

---

## 4. Lessons logged

Five things to keep in mind on the next rollout-shaped piece of work.

1. **"Phase 1" framing was too small for the actual ask.** The instinct to scope down — homepage now, everything else later — assumed the user wouldn't notice the seams. That assumption is wrong for a directory product where the user moves between homepage, search, listing index, and detail page on a single visit. If we're going to look polished, we look polished everywhere on the user's path.
2. **Splitting visual from funnel fixes creates broken-funnel risk.** Premium chrome over a broken funnel reads worse than the dated baseline. When we tighten the visual, we tighten the conversion paths in the same release — not a follow-up.
3. **Sitewide consistency is the standard, not the stretch goal.** Tokens + shared components + a ruthless component refactor is the cheap path to consistency. We didn't have it before because we didn't make tokens load-bearing; this rollout fixes that and the next visual change becomes routine.
4. **"Premium" bar = Dutchie/Leafly's better moments, not generic SaaS minimalism.** Differentiation by refusing the category's visual vocabulary loses category recognition. We adopt the vocabulary at the edges (bud photography at edge crops, leaf pattern at 6% on dark surfaces) without adopting the cliché (no joints/bongs in cards, no smoke clouds, no neon). The word "premium" stays banned in copy; it's an internal target, not a public tagline.
5. **Sandbox-restricted environments can't download external imagery.** Cowork's environment can't fetch URLs to acquire assets. The pattern that worked: Cowork writes the asset manifest naming sources and slots; Code's environment fetches and places. Don't try to invert this — Cowork shouldn't pretend it can fetch and Code shouldn't be left to invent the manifest. Clean lane separation, asset acquisition lives with Code.

---

## 5. Open questions for post-PMF

These are explicitly out of scope for this rollout. Logged here so we don't lose them when the visual upgrade ships and we move on.

- **Dark mode toggle.** A dark surface (deep-green primary) ships in this rollout as a design surface, not as a user toggle. Whether to add a real prefers-color-scheme implementation is a post-PMF decision — it requires re-deriving the entire palette and re-validating contrast on every component, and we don't earn that work pre-revenue.
- **Richer media on detail pages.** The detail-page header is logo-led in this rollout. Eventually we may want a dispensary photo, an interior shot, or a rotating gallery. That's a content-acquisition workstream ($-budget for photographers, or a structured user-submitted-photo flow), not a visual-system workstream.
- **Animation system.** Pulse-dot on "live" verified pills exists; nothing else animates in this rollout. Hover transitions are CSS-default. A real motion system (entrance animations, scroll-triggered reveals, page transitions) is post-PMF — it's a multiplier on a working product, not a path to one.
- **Marketing page expansion.** Blog (`/blog`), guides, content hubs (`/cannabis/illinois/first-time-guide`, `/cannabis/illinois/laws`, `/cannabis/illinois/open-now`) exist as content pages and adopt the system. Net-new marketing surfaces — long-form essays, video embeds, editorial features — are post-PMF.
- **Custom category icons.** Lucide-react covers every category we currently render. Custom icon commissioning (a unique flower glyph, a unique vape glyph, etc.) is post-PMF — it's identity work that should follow the wordmark commission, not lead it.
- **Custom photography commissions.** Pexels covers the bud-photography slots in the asset manifest. Commissioning a Central Illinois photographer to shoot original imagery (storefront exteriors at golden hour, downtown Peoria, dispensary interiors with permission) is post-PMF — high cost for marginal differentiation pre-revenue.
- **Definitive wordmark refinement.** The Manrope 800 sage-green wordmark is good-enough-to-ship through Phase 1. A commissioned designer pass — custom letterforms, a real pin mark, a complete lockup system — is post-PMF.
