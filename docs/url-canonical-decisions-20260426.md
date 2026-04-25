# URL Canonical Decisions — 2026-04-26
**Date:** 2026-04-26 (late session)
**Author:** Cowork (Claude), documenting parallel Code session.
**Status:** Active. The canonical patterns below are the single source of truth for city and listing URLs going forward.

---

## TL;DR

| Surface | Canonical pattern | Status |
|---|---|---|
| City page | `/city/[city]` | **Canonical** |
| Listing page | `/dispensary/[slug]` | **Canonical** |
| Legacy city tree | `/cannabis/illinois/[city]` | **Deprecated** as of 2026-04-26 — redirects to `/city/[city]` |
| Content pages (non-city, non-listing) | `/cannabis/illinois/first-time-guide`, `/cannabis/illinois/laws`, `/cannabis/illinois/open-now` | **Stay** at current paths — they are content, not city/listing pages |

Everything else under `/cannabis/illinois/*` that is a city or listing template should 301 to its canonical equivalent. The redirect work is landing in a parallel Code session tonight (8–10 commits expected).

---

## The decision

`/city/[city]` is the canonical city URL pattern.
`/dispensary/[slug]` is the canonical listing URL pattern.

`/cannabis/illinois/[city]` is **deprecated as of 2026-04-26**. The Code lane is redirecting all city-tree URLs under `/cannabis/illinois/*` that match a known CIL city to `/city/[city]` tonight. That collapses the two parallel template trees into one.

Three URLs stay where they are:

- `/cannabis/illinois/first-time-guide`
- `/cannabis/illinois/laws`
- `/cannabis/illinois/open-now`

These are content pages — pillar articles for SEO and AI-citation, not city or listing pages. They keep their long-form `/cannabis/illinois/*` paths because (a) they pre-date the city tree, (b) they have inbound search equity, and (c) they describe the state of cannabis in Illinois broadly, which fits the URL semantically. Moving them would lose links and confuse the topical model with no upside.

---

## Why this matters

### SEO consolidation

Two parallel template trees rendering the same content at different URLs is an internal-duplication problem. Search engines were splitting authority across `/city/peoria` and `/cannabis/illinois/peoria`, neither of which ranked as well as either could have alone. 301-redirecting one to the other consolidates link equity, anchor text, and crawl budget on a single canonical URL.

### Single source of truth for city navigation

Internal links from the homepage, deal cards, and dispensary pages should all point to one place when they say "Peoria." Having two valid city URL patterns guarantees that, over time, half the internal links go to one and half to the other. That's exactly how the bug surfaced this evening — the homepage had been "rewritten" but the rewrite only landed on `/city/[city]`, while `/cannabis/illinois/peoria` continued to render the unmigrated content. From the user's perspective, "the rewrite shipped" was a half-truth.

### Prevents future template-drift bugs

The class-of-problem here is **two template trees rendering the same conceptual page at different URLs**. Once that exists, any change has to be made in two places, or it ships incompletely. The `/cannabis/illinois/*` deprecation removes the possibility of this specific drift recurring for city pages. The discipline going forward: if the same content has two URLs, fix the URL routing — do not keep two templates in sync.

### Aligns URL patterns with mental model

`/city/peoria` and `/dispensary/ivy-hall-dispensary` are short, semantic, and memorable. They describe what the page is — a city, a dispensary — without leaking the geographic scope (`/illinois/`) into URLs that already constrain to that scope at the app level. Once Central IL scope reverses, the URL pattern doesn't have to change.

---

## What to do if you encounter a `/cannabis/illinois/[city]` URL

- **In code:** stop linking to it. Use `/city/[city]` instead. The redirect will preserve links that already exist in the wild, but new links should go straight to canonical.
- **In docs:** if it's a docs cross-reference, update to `/city/[city]`. The legacy URLs will keep working via redirect, but docs should reflect canonical.
- **In sitemap:** the sitemap should only emit canonical URLs. After the Code session lands, audit `app/sitemap.ts` (or equivalent) to confirm no `/cannabis/illinois/[city]` entries remain.
- **In content pages (`first-time-guide`, `laws`, `open-now`):** these are exempt and keep their existing paths. Update internal city/listing links inside them to canonical.

---

## What to do if you encounter `/cannabis/illinois/[anything-else]`

If it's a city-template page for a city in `CENTRAL_IL_CITIES`: it's getting redirected.

If it's a city-template page for an out-of-scope city: it should be returning 404 already (per `docs/central-illinois-scope.md`). If it isn't, file a follow-up.

If it's a listing template under `/cannabis/illinois/dispensary/...` or similar: route it to `/dispensary/[slug]`.

If it's neither — a one-off content page like a guide, an FAQ, a glossary — leave it. Document the exception here:

| URL | Reason kept |
|---|---|
| `/cannabis/illinois/first-time-guide` | Pillar content page (first-time buyer guide). Has inbound search equity. |
| `/cannabis/illinois/laws` | Pillar content page (state law summary). Has inbound search equity. |
| `/cannabis/illinois/open-now` | Real-time utility page (currently-open dispensaries). Different from city pages — cross-cuts cities by hours-of-operation. |

If the list above grows, add to it rather than silently shipping new `/cannabis/illinois/*` URLs.

---

## The class-of-problem this prevents

Tonight's audit (see `docs/site-audits/2026-04-26-evening-audit-claude.md`) surfaced that "Phase 2 hub rewrite complete" had been claimed in a prior commit message, but production at `/cannabis/illinois/peoria` did not show the rewrite — only `/city/peoria` did. The user-visible state was that the rewrite hadn't shipped. The commit-visible state was that it had.

The root cause was a **two-template-tree** structural issue: the same conceptual page existed at two URLs, both rendering, only one updated. No verification step caught the mismatch because no one fetched the legacy URL on production after the deploy.

The post-deploy verification runbook (`docs/runbooks/post-deploy-verification.md`) addresses the verification gap. This document addresses the structural cause: collapse the two trees so future rewrites can only land in one place.

---

## Owners and follow-ups

- **Code lane:** owns the redirects landing tonight. Should produce a follow-up note in the next session report listing the exact source paths redirected and confirming production responses.
- **Cowork lane:** owns this doc and any future canonical decisions. Document new URL patterns here before they ship.
- **Chrome lane:** owns smoke-testing the redirects after deploy. Specifically: hit each `/cannabis/illinois/[city]` for the 12-city scope on production and confirm 301 → `/city/[city]`.
