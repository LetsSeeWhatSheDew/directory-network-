# Site Audit — 2026-04-27 (Claude)

**Auditor:** Claude (Cowork lane)
**Date:** 2026-04-27 morning
**Trigger:** Claude post-deploy spot-check after the late-night template-kill session (`docs/session-reports/2026-04-26-code-late-night-template-kill.md`). Production was Ready and the redirect matrix was clean, but a sample run of the new pre-launch checklist (`docs/runbooks/post-deploy-verification.md`) surfaced four critical issues that the redirect smoke test couldn't see.
**Outcome:** Four findings (C1–C4). Code is running a parallel session to fix all four. This document captures the structural lessons before the fixes obscure the symptoms.

This is a process artifact, same shape as `docs/site-audits/2026-04-26-evening-audit-claude.md`. For each finding: symptom on production, root cause in the codebase, Code's fix (where known), and the lesson for next time.

---

## C1 — Metro bleed on city pages

**Symptom (production, 2026-04-27 morning):**

| URL | Listing-section header | DB-exact-city count |
|---|---|---:|
| `/city/peoria` | "8 dispensaries in the Peoria metro" | 5 |
| `/city/east-peoria` | (renders Peoria + Bartonville context dispensaries alongside East Peoria's own 3) | 3 |
| `/city/peoria-heights` | (renders adjacent-city dispensaries) | 1 |
| `/city/bartonville` | "3 dispensaries in the Bartonville metro" — but Bartonville has **zero** licensed dispensaries | 0 (should empty-state) |
| `/city/urbana` | metro-aware count higher than 1 | 1 |
| `/city/champaign` | metro-aware count higher than 3 | 3 |

The most user-visible failure is Bartonville: the city has zero licensed dispensaries in the DB, but `/city/bartonville` rendered three dispensary cards (the East Peoria dispensaries pulled in via `metroCities("Bartonville")`). The empty-state copy never had a chance to render because the metro query returned a non-zero result set.

**Root cause:**

`app/city/[city]/page.tsx` queries listings via `metroCities(city)` — a helper that returns the city plus its metro neighbors. For Peoria this is `["Peoria", "East Peoria", "Bartonville"]`; for Bartonville it appears to be `["Bartonville", "East Peoria"]` or similar. The metro-aware count was a deliberate Phase 6.1 polish in the late-night session — Code chose option (a), labeling the union as the metro instead of unwinding the query. That choice was correct for "Peoria metro" framing on Peoria's page; it was wrong for Bartonville's page, where the user lands expecting dispensaries in Bartonville and gets dispensaries in East Peoria with no warning.

The deeper issue is that `/city/[slug]` mixes two concepts at the SQL layer: "show me dispensaries in {city}" (exact-city) and "show me dispensaries near {city}" (metro radius). One template can't serve both cleanly without either (a) labeling the difference, which was attempted, or (b) running two queries — primary and adjacent — and rendering them separately. The current implementation does (a) for the count but doesn't do it for the empty-state branch, and the cards themselves don't carry "in {actual city}" provenance.

Affected pages observed on production: peoria, east-peoria, peoria-heights, bartonville, urbana, champaign. Likely also: morton, washington (zero exact-city dispensaries each — same Bartonville-class failure mode).

**Code's fix (in flight in the parallel session):**

Switch `/city/[slug]` to exact-city match for the primary listing list. Render an "Also nearby" section as a separate, clearly-labeled query. Keep the empty-state branch firing whenever the exact-city set is empty, regardless of what the metro returns. Specific commit hash to be added when Code lands.

**Lesson:**

When a single template serves two adjacent intents ("in this city" vs. "near this city"), they need to be two queries with two render slots, not one query with a label patch. The label can lie; the query can't. Bartonville was the best possible test case — zero exact-city dispensaries means any non-empty result on the page is a rendering bug. Future scope-driven empty cities (Morton, Washington, any future expansion-frontier city) should pass this same test before the page goes live.

The pre-launch checklist now includes "spot-check 1 empty-state city" specifically to catch this. See `docs/runbooks/post-deploy-verification.md`.

---

## C2 — Project-tag bleed (apartment rentals + public-works bid rendered as dispensaries)

**Symptom (production):**

`/l/ivy-hall-dispensary` ("Other dispensaries in Peoria" related-listings widget) rendered:

- Aroma Hill Peoria ✓
- Beyond Hello Peoria ✓
- Trinity on Glen ✓
- Trinity on University ✓
- **Maple Grove Flats — By Owner** ✗ (apartment rental, `project_tag='rent'`)
- **Juniper Ridge Lofts — By Owner** ✗ (apartment rental, `project_tag='rent'`)
- **Northline Public Works** ✗ (public works contractor bid, `project_tag='bid'`)

Three rows that are not dispensaries in any sense rendered as dispensaries inside a "dispensaries in Peoria" widget. The visual treatment was identical to the legitimate cards.

This was the most damaging finding of the four. A first-time visitor clicking through Ivy Hall's page saw "Maple Grove Flats" listed as a recommended dispensary. The credibility cost is asymmetric — one apartment-rental listing on a dispensary page is harder to recover from than ten missing deals.

**Root cause:**

`master_listings` is multi-tenant. Live DB values for `project_tag` include at minimum:

| project_tag | rows | example types |
|---|---:|---|
| `green` | 94 | dispensary (PuffPrice) |
| `bid` | 5 | contractor (a public-works bidding project) |
| `rent` | 4 | rental (an apartment-rentals project) |
| `heal` | 5 | breathwork_coach, healer |
| `her` | 4 | clinic |
| `machine` | 5 | ai_logo_tool, ai_tool |

PuffPrice queries are supposed to filter on `project_tag='green'`. The "Other dispensaries in {city}" widget on `/l/[slug]` did not include this filter — it queried by `city` and `is_active` only. In Peoria the city has 9 active rows total: 5 active dispensaries, 1 inactive dispensary (`north-star-remedies-peoria-il`), 2 rentals, and 1 contractor. Without a `project_tag` filter, the widget pulled 8 active rows and rendered them as dispensaries. Three of those eight were `rent`/`bid` rows that have nothing to do with cannabis.

This is the same class of bug as the 2026-04-26 morning Springfield-MO miscategorization in the scrape coverage doc — a query missing one axis of its filter — but expressed at runtime in a user-facing widget instead of in a doc table.

**Affected component(s) confirmed:**

- "Other dispensaries in {city}" related-listings widget on `/l/[slug]` (listing detail).

**Affected component(s) likely (Code to confirm during fix):**

- City-page primary listings query — currently uses `metroCities` (see C1). May also be missing project_tag filter; both bugs can be present simultaneously and produce overlapping symptoms.
- "Nearby cities" widget if it queries master_listings.
- Any map-marker query that pulls from master_listings.
- `/dispensaries` directory page.
- Search/filter results.
- All API routes under `/api/` that read master_listings.
- Sitemap generator (less likely; uses `CENTRAL_IL_CITIES` constant rather than DB rows for the city URL set, but the per-listing entries still touch master_listings).

**Code's fix (in flight):**

Add `.eq('project_tag', 'green')` to every public-facing master_listings query. Audit pass to find every call site. Consider adding a typed helper (`getCannabisListingsByCity(city)`) that bakes the filter in so future query authors can't forget. Specific commits to be added when Code lands.

**Lesson:**

This is the headline finding of the audit. The lesson is not "we forgot a filter" — that's true but tactical. The lesson is that **`master_listings` is multi-tenant, and every public query that touches it is a load-bearing scope filter**. A new doc, `docs/architecture/db-scope-discipline.md`, codifies this as policy: every master_listings query MUST include `project_tag='green'` before it ships to a public surface, with no exceptions. Code-review checklist gets a line item. The DB itself does not enforce this (no RLS on `master_listings` today), so the discipline lives in the app layer until that changes.

A typed helper that bakes the filter in is the long-term fix; the per-call-site audit is the short-term fix.

---

## C3 — Cron 401 with `CRON_SECRET` set

**Symptom (production):**

After Matthew added `CRON_SECRET` to Vercel env (Production, Sensitive), the cron route still returned 401. Hitting it manually with `curl -H "Authorization: Bearer $CRON_SECRET" https://www.puffprice.com/api/cron/scrape-deals` also returned 401.

The previous session's verification step (`docs/session-reports/2026-04-26-code-ci-fix.md` Phase 3) confirmed the route returned 401 with no token, which was the desired pre-secret state. Matthew added the secret. The route still returns 401, which means the auth check in the route handler isn't matching the header format Vercel actually sends — or isn't matching what `curl -H "Authorization: Bearer ..."` sends, which should be the same thing per Vercel's cron docs.

The Hobby plan daily cron has therefore been firing without producing any scrapes since the secret landed.

**Root cause (suspected, pending Code's confirmation):**

The handler in `app/api/cron/scrape-deals/route.ts` reads `request.headers.get('authorization')` and compares to `\`Bearer ${process.env.CRON_SECRET}\``. The likely failure modes, in rough order of probability:

1. Header-name casing — `Authorization` vs `authorization`. `request.headers.get` is case-insensitive in modern Node/Next, but if the comparison was switched to direct attribute access at some point, casing could break it.
2. Missing or empty `CRON_SECRET` env var at runtime even though it's set in Vercel — frequent if the env wasn't promoted to Production scope, or if the function pulls from a different env scope than the one Matthew added it to.
3. `Bearer ` prefix mismatch — vercel sends `Authorization: Bearer <secret>`; if the comparison expects bare `<secret>` or a different prefix, every request 401s.
4. Trailing whitespace or quote in the secret value as pasted into Vercel.

**Code's fix (in flight):**

Code is auditing the parsing logic against Vercel's `CRON_SECRET` documentation and a fresh `curl` against the deployed function with verbose headers logged. Once the parsing matches the actual header, the response should flip to 200 (or to a result body confirming the scrape ran). Specific commit hash to be added when Code lands.

**Lesson:**

Two things should have caught this earlier:

1. **The pre-launch checklist needs a step that hits the cron with the real bearer token, not just the no-token 401 path.** The previous session correctly gated on "401 with no token" but didn't follow up with "200 with token after Matthew adds it." That's the obvious gap in the verification flow.
2. **Auth-bearing routes should log enough of the request to debug a 401 without re-deploying.** A `console.log(\`auth header present: ${!!request.headers.get('authorization')}\`)` is cheap and survives Vercel's log retention long enough to debug the next time this happens.

The pre-launch checklist now includes "test cron endpoint with curl + bearer token, confirm 200 response."

---

## C4 — first-time-guide has stale `/cannabis/illinois/[city]` internal links

**Symptom (production):**

`/cannabis/illinois/first-time-guide` is a content page that survived the late-night template kill (it's one of the three exempted content pages per `docs/url-canonical-decisions-20260426.md`). Internal links inside the page body still point at `/cannabis/illinois/peoria`, `/cannabis/illinois/springfield`, etc.

Those URLs now 308-redirect to `/city/peoria` etc., so the user-facing experience works (one extra hop). But:

- Search engines crawling `first-time-guide` follow links to redirected URLs, which dilutes the link equity that the canonical decisions doc was supposed to consolidate.
- AI citation systems often de-prioritize redirected URLs in favor of canonical ones; first-time-guide is exactly the page we want AIs to cite, and it's pointing them at non-canonical URLs.
- The redirect chain is fragile: any future tweak to the middleware redirect (a partial 404, a path normalization) breaks links inside a page we said was canonical.

**Root cause:**

The late-night session shipped redirects and updated *external* references (sitemap, mobile nav, dispensaries page, etc.) but did not grep the surviving content pages for hardcoded `/cannabis/illinois/[city]` links. `first-time-guide`, `laws`, and `open-now` were preserved in place — they didn't get a forced rewrite — and any internal CIL-city links inside them are now stale.

`first-time-guide` is the only one I've confirmed has the bug, but `laws` and `open-now` should be audited the same way.

**Code's fix (in flight):**

Grep `/cannabis/illinois/[city-slug]` patterns inside the three content-page files and replace with `/city/[city-slug]`. Same pattern that was already applied to nav and sitemap. Should be a single small commit. Specific hash to be added when Code lands.

**Lesson:**

**A redirect is not a substitute for updating internal links.** The canonical-decisions doc explicitly named "internal city/listing links inside [content pages] should be updated to canonical." That guidance was correct; it just wasn't enforced as part of the late-night session's checklist.

Going forward, any URL-pattern deprecation that ships redirects must include a grep pass for all hardcoded references inside the survivor pages — not only at the routing layer (sitemap, nav) but inside content bodies as well.

---

## Cross-finding pattern

Three of the four findings (C1, C2, C4) share a shape: **a query or link pattern that was correct under one set of assumptions broke when the underlying data or routing changed**, and was not re-verified at the call site.

- C1: metro query was correct when "Peoria metro" was the framing; broke when Bartonville's empty-state need exposed it.
- C2: city query was correct when `master_listings` was single-tenant; broke when other projects started sharing the table.
- C4: hardcoded URL was correct when `/cannabis/illinois/peoria` was canonical; broke when canonical moved to `/city/peoria`.

The fix in each case is the same: **the query or link should encode the assumption it depends on**. C1's primary query should encode "exact city only." C2's master_listings query should encode "PuffPrice scope only" (`project_tag='green'`). C4's content-page links should reference a centralized URL helper rather than a hardcoded path.

Encoding the assumption inline forces the next change-author to confront it, instead of discovering it at audit time.

C3 is a different shape — a parsing bug rather than an assumption-rot bug — and has its own lesson about logging on auth routes.

---

## Status snapshot at end of audit

| Finding | Status | Code commit |
|---|---|---|
| C1 — Metro bleed on city pages | Fixed | `5bd321d` — fix(city-pages): exact city match, kill metro-bleed, fix empty-state copy |
| C2 — Project-tag bleed | Fixed | `941a85f` — fix(scope): enforce project_tag='green' on every public master_listings + deals query |
| C3 — Cron 401 with secret set | Fixed | `49c2d22` — fix(cron): trim CRON_SECRET, add structured 401 logging, share auth helper |
| C4 — first-time-guide stale internal links | Fixed | `eee10b2` — fix(links): migrate internal /cannabis/illinois/* links to /city/* and / |

All four findings landed in Code's parallel session before this docs commit was written. Production HEAD at the time of this audit doc's commit: `eee10b2`. C3's commit also added a shared cron-auth helper (`lib/cronAuth.ts`) so future cron routes can't recreate the parsing bug, and improved the 401 path with structured logging. C2's commit's scope was wider than the audit itself flagged — it also covered `app/deal/[id]/page.tsx`, `app/claim/[slug]/page.tsx`, and `/api/deals/recommend` route, all of which were touching `master_listings` or `deals` without the filter. That's exactly the breadth `docs/architecture/db-scope-discipline.md` predicts; the audit only named the most-visible call site.

---

## Related documents created or updated this session

- `docs/architecture/db-scope-discipline.md` (new) — codifies the project_tag policy that addresses C2's class-of-problem.
- `docs/empty-state-copy-20260426.md` (updated) — locks in the canonical empty-state copy that the C1 fix needs to land alongside the query change.
- `docs/url-canonical-decisions-20260426.md` (updated) — adds a v2 section flagging open canonical questions surfaced during this audit.
- `docs/runbooks/post-deploy-verification.md` (updated) — adds the pre-launch checklist that would have caught C1, C3, and C4 before Matthew did.
