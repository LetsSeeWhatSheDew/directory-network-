# Design References — PuffPrice Sitewide Visual System
**Date:** 2026-05-04
**Owner:** Cowork (writes/maintains). Code (consumes).
**Scope:** Sitewide rollout. Every public route, every admin route, every shared component. Not a homepage refresh.

---

## What lives here

This folder is the design reference dock for the sitewide visual upgrade landing the week of 2026-05-04. It pairs with `docs/brand-system.md` (the spec) and `docs/audits/2026-05-04-sitewide-visual-system-audit.md` (the scope-evolution log).

**Authoritative file:** `asset-manifest.md`. If anything in this folder conflicts with the manifest, the manifest wins.

---

## File inventory

### `asset-manifest.md` — authoritative

Single source of truth for every image, SVG, icon, and logo asset the upgrade depends on. Code's environment fetches the URLs and places assets under `public/`; Cowork specifies what/why/where. **Read this before touching any visual code.**

### Reference images (intended)

The original prompt referenced four design comp JPGs that were intended to live in this folder:

| File (planned) | Purpose |
|---|---|
| `01-desktop-hero-reference.jpg` | Primary visual target — desktop hero composition |
| `02-deal-card-reference.jpg` | Card structure reference for deal cards and listing tiles |
| `03-mobile-reference.jpg` | Mobile expression — how the system collapses on narrow screens |
| `04-do-not-replicate.jpg` | **Anti-reference** — broken AI render with hallucinated city names and placeholder text. Catalogued so future agents don't accidentally copy from it. |

**Status:** these four JPGs were not attached to the 2026-05-04 prompt. Matthew provided the Pexels imagery URLs (folded into `asset-manifest.md`) as a substitute brief. If the four comps surface in a follow-up commit, they override anything they conflict with in `asset-manifest.md` — *except* for `04-do-not-replicate.jpg`, which is anti-spec by definition and stays anti-spec.

### DO NOT REPLICATE — `04-do-not-replicate.jpg`

This is a reference for *what to avoid*, not what to build. The image (when surfaced) shows an AI-generated layout with:

- Broken / hallucinated city names ("Peeoria," "Champagne-Urbana," etc.)
- Lorem-ipsum placeholder text rendered as if it were copy
- Cannabis imagery with anatomical errors (extra leaflets, impossible bud structures)
- AI-typical text artifacts inside images (warped letters, garbled signage)

**Rule:** any image, layout, or copy that resembles `04-do-not-replicate.jpg` does not ship. Cross-check the brand voice rules in `brand-system.md` § 9 — the "no fabricated counters" line covers the same failure mode in copy form.

---

## Scope reminder — read before starting any visual work

This is a **sitewide rollout**, not a homepage refresh. The decision history is in `docs/audits/2026-05-04-sitewide-visual-system-audit.md`. The short version:

- Foundational design system: tokens, type scale, spacing, shared components.
- Every public route updated to consume the system.
- Every admin route updated to consume the system.
- P0 funnel fixes (location context on detail pages, `/open-now` timezone, "vs. area average" purge, "City, IL" labels, `/admin` counts) ship in the same PR — not split out.

What's NOT in this rollout: Stripe checkout, the 148-row IL license registry migration, indexing of `/dispensaries` and `/about`, the 150-word listing content floor, database schema changes. Those are separate workstreams.

---

## How to use this folder

### If you're Code

1. Open `asset-manifest.md` first. It tells you what to download and where to place it.
2. Cross-reference `docs/brand-system.md` for tokens, type scale, and component decisions.
3. The four reference JPGs aren't here — work from the manifest + brand system. If you hit a "I'd want to see the comp" moment, ask in `docs/handoffs/`.

### If you're Cowork (a future session)

1. Don't add assets to this folder without updating `asset-manifest.md` in the same commit.
2. The design comp JPGs slot is a *known gap* — if Matthew uploads them later, drop them in with the planned filenames and add a one-line note here that they're now present.
3. The manifest is authoritative; the brand system is the spec; this README is the orientation. Keep them in that order of authority.

### If you're Chrome

This folder is informational. You verify against production using `brand-system.md` as the rubric, not these files.

---

## Open questions

- Will Matthew surface the four comp JPGs? If yes, when? (Tracked but not blocking — the manifest covers the imagery decisions either way.)
- Should `asset-manifest.md` ever absorb the dispensary-logo acquisition log, or does that stay in `docs/handoffs/`? Default: stays in handoffs to keep the manifest stable.

---

## Cross-references

- `docs/brand-system.md` — the spec
- `docs/audits/2026-05-04-sitewide-visual-system-audit.md` — scope-evolution log
- `docs/brand/2026-04-28-identity-package.md` — prior identity package (superseded in part — see brand system decision log for what carries forward and what doesn't)
- `CLAUDE.md` § "Brand identity locked (April 28, 2026)" — needs an addendum line after this rollout ships
