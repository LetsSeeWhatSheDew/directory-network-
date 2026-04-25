# Site Audit — 2026-04-26 Evening (Claude)

**Auditor:** Claude (Cowork lane)
**Date:** 2026-04-26 evening
**Trigger:** Matthew asked for a sanity check on what was actually shipping vs. what commit messages claimed had shipped.
**Outcome:** Seven critical issues surfaced, five Code commits landed in the parallel session to fix or partially fix them, two remain open at the time of writing.

This document is a **process artifact**. The intent is not to dwell on the specific bugs — they're being fixed — but to capture the pattern so the next "we shipped, audit found problems" cycle is faster, and so the structural class-of-problem (two parallel template trees) is named explicitly so it gets designed against, not just patched around.

---

## How to read this doc

For each finding:

- **Finding:** what was broken on production.
- **Root cause:** why it slipped through the existing process.
- **Resolution:** which Code commit fixed it, or status if pending.
- **Lesson:** what to check first the next time a similar audit runs.

The document closes with a section on the **structural class-of-problem** — the underlying shape that produced multiple of these findings — so future planning can avoid recreating it.

---

## Finding 1 — Phase 2 hub rewrite was not actually live at the legacy URL

**Finding:** Yesterday's commit message claimed "Phase 2 hub rewrite complete." Production at `/cannabis/illinois/peoria` showed the pre-rewrite content. Production at `/city/peoria` showed the new content. From the user's perspective, the rewrite had not shipped to half the URLs that pointed at the same conceptual page.

**Root cause:** Two parallel template trees rendered the same content at different URLs. The rewrite landed on the new tree (`/city/[city]`); the old tree (`/cannabis/illinois/[city]`) was never touched. No verification step fetched the old URL on production after the deploy.

**Resolution:** In progress in the parallel Code session — `/cannabis/illinois/[city]` is being 301-redirected to `/city/[city]`, eliminating the old tree for city pages. See `docs/url-canonical-decisions-20260426.md`.

**Lesson:** When a page exists at multiple URLs, "I rewrote the page" must be verified at every URL that renders it, not just the one the developer was looking at. Better: collapse the multiple URLs into one before rewriting, so this isn't possible.

---

## Finding 2 — Active-deal count on production was inconsistent across pages

**Finding:** The homepage showed one count of active deals, deal-category pages showed another, and the underlying DB had a third. None of the three matched cleanly because the NOXX "50% off vape" false-positive deal was being included in some queries and excluded from others depending on whether the query joined through the listing's CIL scope filter.

**Root cause:** The deal-count display was implemented in three places with three slightly different filters. No shared selector forced consistency.

**Resolution:** NOXX deal deactivated this evening (`bcde3062-613a-4040-aef8-ba5a104d176b`, `is_active=false`, `status_reason='pattern_match_false_positive_bogo'`). Counts now agree on **10 active CIL deals** across all surfaces. Scraper rule tightened so the BOGO false positive can't return on the next scrape. See `docs/session-reports/2026-04-26-code-ci-fix.md` Phase 5.

**Lesson:** Any user-visible count that appears on more than one page must come from a single shared selector. Drift between query implementations is a leading indicator of trust loss.

---

## Finding 3 — Footer source-note still credited Leafly and Weedmaps

**Finding:** The deal-category page footer (`app/deals/[category]/page.tsx`) read "Data from Leafly, Weedmaps + dispensary sites" on production after the April 26 morning policy switch to direct-source-only.

**Root cause:** The deal data policy (`docs/deal-data-policy.md`) was written as the source of truth, but the user-facing copy that referenced source providers wasn't searched and updated as part of the policy change. The legacy string lived in a deal-category template, not the homepage where the policy author was looking.

**Resolution:** Replaced with "Data from direct dispensary sources" in commit `2770851`. Verified live via `curl`.

**Lesson:** When a policy changes, grep the entire codebase for any strings that name the old policy's third parties. "Leafly" and "Weedmaps" (and any aggregator name) should never appear in public copy under the current policy.

---

## Finding 4 — Cron schedule mismatched the Vercel plan

**Finding:** The scrape-deals cron was specced at every 6 hours (`0 */6 * * *`) in `vercel.json`. Vercel rejected the deploy because the Hobby plan caps cron at once per day. As a result, three commits sat on GitHub without reaching production, and Vercel's status page reported "deploy failed" rather than the actual cron-pricing reason.

**Root cause:** Plan-level constraints on the deploy target (Vercel Hobby) were not encoded anywhere in the codebase or docs. The cron schedule was chosen from the deal data policy ("re-verified every 6 hours") without checking whether the deploy target supported it.

**Resolution:** Schedule changed to daily (`0 9 * * *`) in commit `439ccfa`. The deal data policy retains "every 6 hours" as the long-term target; the cron file documents the Hobby-plan reason for the daily fallback. Path to faster cadence is either (a) upgrade Vercel to Pro, or (b) external scheduler hitting the route with `CRON_SECRET`. See `docs/session-reports/2026-04-26-code-ci-fix.md` Phase 2.

**Lesson:** Deploy-platform plan limits should be either codified (a constants file) or referenced explicitly in any config that depends on them. The original cron commit had no comment naming the Hobby cap; the next person to edit it would have made the same mistake.

---

## Finding 5 — Coverage doc count drifted from live DB

**Finding:** `docs/scrape-coverage-20260426.md` (morning version) listed 31 active CIL listings. Live DB returned 26. The 5-row gap was 3 Springfield, MO miscategorizations + 2 deactivations that hadn't been applied at the time of writing.

**Root cause:** The morning Cowork query filtered by `city='Springfield'` without combining with `state='IL'`, sweeping Springfield, MO rows into a Central Illinois coverage table. The deactivations were planned but had not yet been applied when the doc was written, and the doc was written as if they were already done.

**Resolution:** Added a `CORRECTION` callout block in the evening Code commit (`3d66994`); rewrote the entire doc in this Cowork session (commit pending), with the verified 26 rows and a "Removed from coverage" audit-trail section documenting the 3 MO false positives.

**Lesson:** Any DB-derived count in a doc should be reproducible — quote the SQL that generated it, or at least the filter terms. Two-axis filters (`city + state`) are the most common place where this slips.

---

## Finding 6 — `CLAUDE.md` was the most-stale doc in the repo

**Finding:** The project-memory file that Claude Code reads at session start said "11 cities" (April 25), then was updated to "31 active listings" (April 26 morning), then was contradicted by the actual evening DB state (26 listings). Each session inherited stale numbers from the prior session's `CLAUDE.md` rather than re-deriving from DB.

**Root cause:** `CLAUDE.md` was treated as a low-friction note pad — counts were updated by whoever happened to look at the DB, not from a verified live query. There was no convention that the file's numbers needed to match a SQL receipt.

**Resolution:** `CLAUDE.md`'s Current State block was rewritten this session from a fresh DB query, with an explicit "verified against live tables" note above the per-city distribution table. Going forward, every count in `CLAUDE.md` should be either reproducible from a live query or explicitly tagged as a target / aspirational.

**Lesson:** `CLAUDE.md` is read by the next session before any work happens. Stale numbers there propagate into every downstream task. Treat it as load-bearing, not as a scratchpad.

---

## Finding 7 — Sitemap and content pages didn't share a canonical-URL convention

**Finding:** Sitemap entries for the 12 CIL cities used `/city/[city]`. Internal links from the homepage and from some content pages used `/cannabis/illinois/[city]`. Search engines saw two URLs for the same page, with internal link equity split between them.

**Root cause:** The `/cannabis/illinois/*` tree was the original URL pattern; the `/city/*` tree was added later as an SEO improvement. Neither was deprecated when the other was added, and no canonical-URL doc existed to disambiguate.

**Resolution:** `docs/url-canonical-decisions-20260426.md` created this session, naming `/city/[city]` and `/dispensary/[slug]` as canonical and deprecating `/cannabis/illinois/[city]`. Three content pages (`first-time-guide`, `laws`, `open-now`) explicitly stay at `/cannabis/illinois/*` because they are content, not city/listing pages. Code lane is landing redirects tonight.

**Lesson:** When a new URL pattern is added alongside an existing one, the canonical decision must be made and documented at the same time the new pattern ships. Otherwise the two trees coexist by default and the next rewrite has to deal with both.

---

## Class-of-problem: two parallel template trees

Findings 1, 2, and 7 are all instances of the same underlying structural shape: **the same conceptual page exists at multiple URLs or in multiple template files, and changes to one don't propagate to the other.**

In Finding 1 the duplication was URL-level (`/city/peoria` vs. `/cannabis/illinois/peoria`).
In Finding 2 the duplication was query-level (deal-count selectors implemented three times).
In Finding 7 the duplication was navigation-level (internal links pointing at two patterns).

The pattern matters because **none of these are caught by code review of a single commit**. Each commit looks correct in isolation. The problem only surfaces when you compare what shipped against what shipped on the OTHER URL or in the OTHER selector. The commit-level review never spans both sides of the duplication.

The two structural moves that prevent this class:

1. **Don't let duplication exist.** When two templates render the same conceptual page, redirect one to the other before doing anything else. When two queries return the same conceptual count, consolidate into one shared selector.
2. **When duplication exists transiently, name it.** Document explicitly in the relevant skill or doc that the duplication is a known temporary state, with an owner and a removal date. Anything else degrades into permanent drift.

The post-deploy verification runbook (`docs/runbooks/post-deploy-verification.md`) addresses the verification gap. This document addresses the structural cause: design against parallel template trees in the first place.

---

## Status snapshot at end of audit

| Finding | Status |
|---|---|
| 1. Phase 2 hub rewrite not at legacy URL | In progress (Code redirects landing tonight) |
| 2. Inconsistent active-deal counts | Fixed (commit `3d66994` + DB patch) |
| 3. Footer credited Leafly/Weedmaps | Fixed (commit `2770851`) |
| 4. Cron schedule mismatch with Vercel plan | Fixed (commit `439ccfa`) |
| 5. Coverage doc count drift | Fixed in two stages (callout in `3d66994`, full rewrite in tonight's docs commit) |
| 6. CLAUDE.md staleness | Fixed (this docs commit) |
| 7. Sitemap/canonical drift | In progress (canonical doc shipped this session; redirects tonight) |

Two findings (1 and 7) share the same Code work-in-progress to fully resolve. Once those redirects land and Chrome verifies, all seven are closed.
