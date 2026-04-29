# URL Canonical Decisions — 2026-04-26 (v1) / 2026-04-27 (v2 addendum)
**Original date:** 2026-04-26 (late session)
**v2 addendum date:** 2026-04-27 (morning, after audit)
**Author:** Cowork (Claude), documenting parallel Code sessions.
**Status:** Active. The canonical patterns below are the single source of truth for city and listing URLs going forward. v2 addendum adds open questions surfaced by the 2026-04-27 audit.

> **v2 quick read:** Code's late-night session (2026-04-26 → 2026-04-27 early morning) shipped the redirects this doc described — `/cannabis/illinois/[city]` 308s to `/city/[city]` for all 12 CIL cities, the legacy template tree was deleted (70 files, −3,066 lines), and the sitemap was rewritten to emit only canonical URLs. See the v2 addendum at the bottom of this file for what's still open: the `/l/[id]` vs `/dispensary/[slug]` split, content-page internal links (Finding C4 in tonight's audit), and the `/deal/[uuid]` canonical-tag warning from Google Search Console.

---

## TL;DR

| Surface | Canonical pattern | Status |
|---|---|---|
| City page | `/city/[city]` | **Canonical** |
| Listing page | `/dispensary/[slug]` | **Canonical** |
| Legacy city tree | `/cannabis/illinois/[city]` | **Deprecated** as of 2026-04-26 — redirects to `/city/[city]` |
| Content pages (non-city, non-listing) | `/cannabis/illinois/first-time-guide`, `/cannabis/illinois/laws`, `/cannabis/illinois/open-now` | **Stay** at current paths — they are content, not city/listing pages |
| About | `/about` | **Canonical** (added 2026-04-28; no alternates) |
| About — Index methodology | `/about/index` | **Canonical** (existing) |
| Tax explainer article | `/illinois-cannabis-tax` | **Canonical** (added 2026-04-28; not yet implemented — see `docs/content/illinois-cannabis-tax-explainer-draft.md`) |
| Tax calculator | `/illinois-cannabis-tax-calculator` | **Canonical** (added 2026-04-28; not yet implemented — see `docs/content/tax-calculator-spec.md`) |

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

---

# v2 addendum — 2026-04-27 morning (post-audit)

This addendum reaffirms the v1 decisions and adds three open questions surfaced by the 2026-04-27 site audit (`docs/site-audits/2026-04-27-claude-audit.md`). v1 decisions still hold; the open questions below are not changes — they are unresolved scope items that need a Code-side decision in a follow-up session.

## Reaffirmed (no change)

- **`/city/[city]` is the canonical city URL pattern.** Verified in production: all 12 CIL cities resolve at `/city/<slug>` with HTTP 200; all `/cannabis/illinois/<slug>` city URLs 308-redirect to the canonical equivalent.
- **`/cannabis/illinois/<city>` is deprecated** as of 2026-04-26. Code's late-night session deleted the legacy template tree (70 files, −3,066 lines). The redirects are stable; the templates that would compete with the canonical pages no longer exist.
- **Content pages stay where they are.** `/cannabis/illinois/first-time-guide`, `/cannabis/illinois/laws`, and `/cannabis/illinois/open-now` remain at their long-form paths. Code preserved them in place per the v1 exemption.

## Open question 1 — `/l/[id]` vs `/dispensary/[slug]`

**Both exist on production.** They are not duplicates — file headers in the codebase explicitly distinguish them:

| Route | Purpose (per file header comment) |
|---|---|
| `/l/[id]` | "GO HERE confirmation screen for the core flow" — minimal, action-oriented; this is the page the parking-lot user lands on after clicking a deal card. |
| `/dispensary/[slug]` | "Full dispensary profile page — SEO-forward, distinct from /l/[slug]." Bookmark / repeat-visitor / search destination. |

The two were intentionally split. But:

1. **They both render the same dispensary content from the same `master_listings` row.** Search engines see two URLs for the same conceptual thing.
2. **Internal links across the codebase are inconsistent** — some surfaces link to `/l/<slug>`, others to `/dispensary/<slug>`. Whether the link goes to the action-oriented page or the SEO-forward page depends on which component the user happens to be on.
3. **It's not clear whether one should `<link rel="canonical">` to the other**, or whether both should self-canonical with distinct content treatments. Today (best as I can tell) neither does that explicitly, which is the same pre-existing duplication shape that produced the 2026-04-26 audit Finding 1.

**This is a Code decision to make in a follow-up session, not a Cowork doc decision.** Possible directions, listed in roughly increasing order of effort:

- **(a) Both stay; pick one as canonical via `<link rel="canonical">` headers.** No URL change; tells search engines which one to rank. Probably `/dispensary/<slug>` as canonical because of its SEO-forward role; `/l/<slug>` self-references but signals the canonical home.
- **(b) Merge intents.** One template, one URL. The action-oriented "GO HERE confirmation" becomes a query param or anchor on the SEO-forward page. Loses the per-route bundle-size optimization (if any) but eliminates the duplication.
- **(c) Split harder.** Make the two pages actually different content — `/l/<slug>` is post-click confirmation only (no SEO content, noindex), `/dispensary/<slug>` is the full profile. The duplication-by-content goes away because the pages stop rendering the same thing.

Cowork preference: **(a) for the next session**, **(c) as a longer-term polish**. (b) loses the user-flow split that the original authors had a reason for; don't undo it without naming the reason.

**Flag for next Code session:** confirm what each route's intent is today, decide a canonical, and either ship `<link rel="canonical">` headers or document why both are self-canonical.

## Open question 2 — content-page internal links pointing at deprecated URLs

Tonight's audit Finding C4: `/cannabis/illinois/first-time-guide` is a surviving content page (per the v1 exemption above) but contains internal links pointing at `/cannabis/illinois/<city>`. Those URLs now 308-redirect to `/city/<city>`. The page itself works for users (one extra redirect hop); the SEO and AI-citation cost is real because:

- Search engines treat the page as linking to redirected URLs, which dilutes the link equity that v1's redirect strategy was supposed to consolidate.
- AI citation systems often de-prioritize linked-but-redirected URLs in favor of canonical ones; first-time-guide is exactly the page we want AI systems to cite.

**Rule (locked here as of v2):** internal links from `/cannabis/illinois/first-time-guide`, `/cannabis/illinois/laws`, and `/cannabis/illinois/open-now` to any CIL city page MUST use the `/city/<city-slug>` pattern. The redirect is for inbound URLs the world is still pointing at — it is not a substitute for updating internal links inside surviving pages.

**Code's parallel-session fix:** grep `/cannabis/illinois/<city-slug>` patterns inside the three content-page source files and replace with `/city/<city-slug>`. Same pattern that was already applied to nav, sitemap, and the `/dispensaries` directory page.

If the content pages contain non-city `/cannabis/illinois/*` links (e.g., links to other content pages within the same set, or to the deleted Chicago neighborhoods), those are different cases:

- Links between the three preserved content pages stay as-is. They are linking to canonical content URLs.
- Links to deleted city or neighborhood pages must be removed entirely or replaced with the closest canonical equivalent. Don't link to a 404; don't link to a redirect that lands on a 404 either.

## Open question 3 — `/deal/[uuid]` and Google Search Console canonical warnings

`/deal/<uuid>` is the canonical URL for individual deal pages today (one route file: `app/deal/[id]/page.tsx`). GSC has been emitting canonical warnings on this surface — likely because the deal pages don't carry an explicit `<link rel="canonical">` header, and crawl-time signals (parameters, source URL referrer, etc.) are giving GSC enough ambiguity to flag.

**Action (queue for next Code session):**

1. Add `<link rel="canonical" href="https://www.puffprice.com/deal/{uuid}" />` to every deal-page render. This is a one-line metadata addition, not a routing change.
2. Confirm in GSC that the warnings clear after the next crawl (typically 1–7 days post-deploy).
3. If warnings persist, audit whether there are duplicate or near-duplicate URL entries in the sitemap for the same deal — there shouldn't be, but worth confirming.

**Cowork preference:** the deal-page canonical is correctly `/deal/<uuid>`. There is no plausible alternative URL for an individual deal under the current routing, so the canonical declaration is purely a "tell GSC explicitly what we already know" move.

## Pre-launch checklist alignment

The pre-launch checklist in `docs/runbooks/post-deploy-verification.md` now includes a step that catches the v2 addendum's class of bugs: "Verify GSC has zero new canonical warnings on `/city/*` URLs" and "Spot-check 3 random listing pages on production." Both would have caught Open Question 3 and the C2 bleed before this audit.

---

# v3 addendum — 2026-04-28 night (content routes added)

This addendum adds three canonical URL decisions that landed alongside the brand identity package and content drafts.

## /about — stays at `/about`

The about-page draft (`docs/content/about-page-draft.md`) lands at the existing `/about` route. No alternative URL was considered; `/about` is the obvious, short, semantic path. No redirect needed; route already exists in `app/about/page.tsx`.

The Index methodology page at `/about/index` (existing) is unaffected. It remains the canonical URL for the PuffPrice Index.

## /illinois-cannabis-tax — new content route (not yet implemented)

The tax explainer article (`docs/content/illinois-cannabis-tax-explainer-draft.md`) lands at **`/illinois-cannabis-tax`**.

Why this URL pattern (not `/cannabis/illinois/tax` and not `/about/tax`):

1. **Top-level for SEO weight.** This is a high-value content page targeting "Illinois cannabis tax" search intent. Top-level URLs accrue search authority faster than deeply nested ones.
2. **Not under `/cannabis/illinois/*`.** That tree is being deprecated for everything except the three pre-existing content pillars (`first-time-guide`, `laws`, `open-now`). Adding a fourth would muddy the deprecation narrative — better to start the tax content on a clean slug.
3. **Not under `/about/*`.** The about tree is for first-person product copy; the tax explainer is consumer-protection editorial. Different category.
4. **Singular, not plural.** `/illinois-cannabis-tax` not `/illinois-cannabis-taxes`. Singular slugs win at search. (We'll teach the article that there are multiple taxes; the URL stays singular.)

## /illinois-cannabis-tax-calculator — new interactive route (not yet implemented)

The tax calculator (`docs/content/tax-calculator-spec.md`) lands at **`/illinois-cannabis-tax-calculator`**.

Why parallel-with-not-nested-under the explainer:

- Calculator and article are siblings, not parent-child. The article links to the calculator; the calculator links back to the article. Putting the calculator at `/illinois-cannabis-tax/calculator` would imply the article is the canonical and the calculator is supporting — which inverts the value relationship (the calculator is the moat; the article is the explainer).
- Top-level URLs are cleaner for sharing. "puffprice.com/illinois-cannabis-tax-calculator" reads as a destination.

When v2 calculator embedding lands per-deal-card, those embeds do **not** get their own URLs — they reuse the standalone route via deep-linking with query params, which carry no canonical weight. Always keep the standalone calculator URL as the only canonical for tax-calculation surfaces.

## What's not yet decided

- Whether the tax explainer should live at `/illinois-cannabis-tax` (singular concept) or migrate to a plural `/illinois-cannabis-taxes` later if SEO data shows the plural ranks better. v1 ships singular. Revisit after 90 days of GSC data.
- Whether to canonicalize `/about/index` → `/illinois-cannabis-index` to match the top-level pattern of the new content routes. Out of scope for tonight; surface in a future canonical review.
