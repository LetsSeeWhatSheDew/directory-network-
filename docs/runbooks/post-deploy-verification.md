# Runbook — Post-Deploy Verification

**Owner:** Code lane runs this after every production deploy that touches a user-facing route. Chrome lane runs the production-fetch portion when available.
**When:** after Vercel reports the deploy as Ready, before the next commit lands.
**Scope:** any deploy that changes a user-facing route — page templates, sitemap, redirects, deal queries, copy on a public surface, anything in `app/`, `components/`, or `lib/` that affects what a visitor sees.

This runbook exists because of a specific failure mode that surfaced 2026-04-26: a commit message claimed "Phase 2 hub rewrite complete," but production at the legacy URL never showed the rewrite. Local testing was green; the developer didn't fetch the legacy URL on production after deploy. The runbook below would have caught it in under a minute.

See `docs/site-audits/2026-04-26-evening-audit-claude.md` for the full audit context.

---

## The checklist

Run after Vercel flips Ready (30–90 seconds post-push). Stop and investigate at the first failure; do not proceed to the next commit until the current deploy is verified.

### 1. Smoke test the same URL on production, not localhost

For every URL the commit touches, fetch it on `https://www.puffprice.com` (production) — not on `localhost:3000`, not on a Vercel preview URL, not in a dev tunnel.

A localhost smoke test only verifies that the new code runs in your dev environment. It does not verify that the new code is what production is serving. The deploy step is the part that has been failing silently.

### 2. Compare expected behavior to claimed behavior in the commit message

Read your own commit message. Whatever it claims happened — "rewrote the hub page," "added redirects for deprecated city URLs," "updated source-note copy" — fetch a URL that should exhibit that change and confirm visually or via grep.

If the commit claims "rewrote the hub page," and the rewrite is supposed to be visible in the page body, then `curl -sL <url> | grep <new-string>` should return a hit. If it doesn't, the rewrite did not ship to that URL.

### 3. If the page exists at multiple URLs, check ALL of them

This is the rule that would have caught Finding 1 of the 2026-04-26 audit.

Whenever a conceptual page is reachable through more than one URL pattern (e.g. `/city/peoria` and `/cannabis/illinois/peoria` both render Peoria), fetch every URL pattern on production after deploy and compare the response bodies. They must match — same hero text, same active-deal count, same dispensary list, same footer copy.

If they don't match, you have a partial deploy and a real bug. Log it, roll back if necessary, and address before the next commit.

A useful diagnostic loop:

```
diff <(curl -sL https://www.puffprice.com/city/peoria) \
     <(curl -sL https://www.puffprice.com/cannabis/illinois/peoria)
```

A clean redirect from one to the other resolves the duplication; identical bodies are also acceptable until the duplication is collapsed. Different bodies = ship-blocker.

### 4. Verify any "I rewrote X" claim by fetching X on production

If the commit message says "rewrote X," fetch X on production. Don't assume. Don't say "the build was green so it shipped." Fetch and look.

The grep pattern: take a string from the new content that wasn't in the old content, fetch the page on production, and search for it. Either it's there or it isn't.

### 5. Verify any redirect by following it

For every redirect added in the commit, fetch the source URL with `-I` (headers only) and confirm:

- Status is 301 (permanent) or 308 (permanent, method-preserving) — not 302 unless intentional.
- `Location` header points to the canonical destination.
- A second fetch following the redirect (`curl -sL`) lands on a 200 at the canonical URL with the expected content.

```
curl -sI https://www.puffprice.com/cannabis/illinois/peoria
# → HTTP/2 301
# → location: https://www.puffprice.com/city/peoria

curl -sL -o /dev/null -w "%{http_code} %{url_effective}\n" \
  https://www.puffprice.com/cannabis/illinois/peoria
# → 200 https://www.puffprice.com/city/peoria
```

### 6. Verify any count or claim that appears on more than one page

The "10 active CIL deals" string should be the same on every surface that displays it. The "26 active dispensaries" string likewise. If a count is rendered on the homepage, on a city page, and in the sitemap, all three must agree.

A drift between counts is usually a query-implementation drift — the same conceptual count is computed in three places with three slightly different filters. The fix is consolidation of the selector, not patching one of the three.

### 7. Verify the sitemap reflects the canonical URL set

After any change that adds, removes, or redirects a URL, fetch `https://www.puffprice.com/sitemap.xml` and confirm:

- New canonical URLs appear.
- Deprecated/redirected URLs no longer appear.
- Out-of-scope URLs (anything outside Central IL per `docs/central-illinois-scope.md`) do not appear.

The sitemap is what the Google crawler trusts. Drift between the sitemap and what's actually canonical is one of the slowest bugs to recover from because indexing latency hides it for weeks.

---

## Who runs this when

| Role | Responsibility |
|---|---|
| Code lane | Runs steps 1–6 immediately after Vercel reports Ready and before opening a new commit. |
| Chrome lane | When available, runs steps 3 and 5 in parallel for a second-pair-of-eyes pass. Reports any mismatch in `docs/handoffs/`. |
| Cowork lane | Owns this runbook and updates it when new failure modes surface. |

If any step fails, **stop the next commit**. The fix to the failing step is the next commit. Do not stack new work on top of an unverified deploy.

---

## Failure modes this runbook prevents

- **"Rewrite shipped but only to one URL"** (Finding 1, 2026-04-26 audit). Step 3 catches this.
- **"Counts on different pages disagree"** (Finding 2). Step 6 catches this.
- **"Stale third-party reference in copy"** (Finding 3). Step 2 catches this when the commit message names the policy change.
- **"Cron registered but never runs because deploy was rejected"** (Finding 4). Step 1 catches this — production fetch returns 404 or the previous version's content if the deploy was rejected.
- **"Sitemap entries out of sync with canonical URLs"** (Finding 7). Step 7 catches this.

---

## What this runbook does NOT cover

- Database migrations. Those have their own review path under `docs/migration-pattern` (see `CLAUDE.md` § Migration pattern).
- API contract changes for downstream consumers (none currently shipping; revisit when the public MCP server lands per Zone 4 strategy).
- Feature-flag or experiment rollouts. Add a section here when those ship.
- Performance regressions. Add a step when Sentry / web-vitals monitoring is wired (currently scaffolded; DSN pending per `CLAUDE.md`).

When any of those become production-relevant, append a section to this runbook rather than spinning up a separate one.

---

## Pre-launch checklist (added 2026-04-27)

This is a **separate, sharper checklist** from the post-deploy steps above. Run it **before sharing any production URL** — to a customer, a press contact, social media, an email blast, or anywhere a human or crawler will see it for the first time. The post-deploy checklist verifies the deploy itself; this one verifies the deploy is fit to be seen.

Triggered by the 2026-04-27 audit (`docs/site-audits/2026-04-27-claude-audit.md`). All four findings — metro bleed, project-tag bleed, cron auth, stale internal links — would have been caught by one of the seven steps below before Matthew had to find them by spot-check.

**Total time:** under 10 minutes. If any step fails, do not share the URL until the failure is fixed and the step re-runs green.

### 1. Spot-check 3 random listing pages — verify only cannabis dispensaries appear in any "related" or "nearby" sections

Pick three listings at random (one from a high-density city like Peoria, one mid-density like Springfield, one low-density like Pekin or Urbana). For each:

- Open the production URL: `https://www.puffprice.com/l/<slug>` and `https://www.puffprice.com/dispensary/<slug>`.
- Inspect every "Other dispensaries in {city}" / "Nearby dispensaries" / map / sidebar that lists multiple listings.
- Confirm every card represents an actual cannabis dispensary, not an apartment listing, a contractor bid, a wellness practitioner, or any other `project_tag` ≠ `'green'` row.

This is the C2 (project-tag bleed) check. Fast and decisive: if any non-cannabis row is visible, stop the launch and fix the query before sharing. See `docs/architecture/db-scope-discipline.md`.

### 2. Spot-check 3 random city pages — verify listing count matches DB exact-city query

Pick three CIL cities. For each:

- Run a DB query: `SELECT COUNT(*) FROM master_listings WHERE city='<city>' AND state='IL' AND project_tag='green' AND is_active=true AND type='dispensary';`
- Open `https://www.puffprice.com/city/<slug>`.
- Confirm the visible dispensary count matches the DB count exactly.

If the page count exceeds DB exact-city count, you have either metro bleed (C1), project-tag bleed (C2), or both. Both are launch-blockers. Do not interpret a too-high number as "we have more dispensaries than I thought."

### 3. Spot-check 1 empty-state city — verify proper empty-state copy renders

Pick one of the empty-state cities (Bartonville, Morton, or Washington — any city where the exact-city DB count is zero):

- Open `https://www.puffprice.com/city/<slug>`.
- Confirm the page renders the canonical empty-state strings from `docs/empty-state-copy-20260426.md` section 2:
  - Headline: "No licensed dispensaries in {City} yet."
  - Body explaining the nearest CIL city as an alternative.
  - CTA to the nearest city.
- Confirm the page does NOT render any dispensary cards, deal cards, or counts greater than zero.

This is the Bartonville-class failure-mode check. Most damaging variant of C1; it's where the empty-state-copy doc lives in production.

### 4. Click a deal card — verify freshness badge matches between browse and listing-detail views

Pick any deal card on the homepage or `/deals/all`:

- Note the freshness label on the browse-view card (e.g., "Last verified Apr 24" or "Verified yesterday").
- Click into the deal's listing-detail page (`/l/<slug>`).
- Confirm the freshness label on the listing-detail card matches the browse-view label.

If the two disagree, you have a re-introduction of the late-night session's freshness-badge bug (one query was missing `verified_at` from its `select`). The bug is fixed in the canonical `select` strings on both views; this step is regression detection.

### 5. Test cron endpoint with curl + bearer token — confirm 200 response

```
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  https://www.puffprice.com/api/cron/scrape-deals
```

- Expected: HTTP 200 (with whatever response body the route returns — usually a small JSON receipt).
- Common failure: HTTP 401. If 401 with the correct token, the auth-parsing code is broken (see audit C3). The cron is firing daily but doing nothing.
- Common failure 2: HTTP 200 but the response body says "0 deals scraped" indefinitely. That's a separate scraper problem; this checklist confirms the auth path only.

`CRON_SECRET` lives in Vercel env (Production, Sensitive). Get the value from Vercel project settings.

### 6. Verify GSC has zero new canonical warnings on `/city/*` URLs

Open Google Search Console for the project. Check the Coverage / Page indexing report for:

- Any `/city/<slug>` URL flagged as "Duplicate without user-selected canonical."
- Any `/dispensary/<slug>` URL flagged similarly.
- Any `/deal/<uuid>` URL flagged similarly (this one is on the v2 canonical-decisions doc as a known open question; if it persists past the next deploy, escalate).

GSC indexing reports lag actual deploys by 1–7 days. For a "before sharing the URL" check, it's enough that no warnings have appeared since the most recent deploy. If new warnings are stacking, the canonical strategy from `docs/url-canonical-decisions-20260426.md` isn't being honored somewhere — investigate before promoting.

### 7. Pull current Supabase counts — verify they match what's displayed in the homepage stat block

Run the canonical reconciliation queries:

```
SELECT COUNT(*) FROM master_listings
WHERE state='IL' AND is_active=true AND type='dispensary' AND project_tag='green'
  AND city IN ('Bartonville','Bloomington','Champaign','East Peoria','Morton',
               'Normal','Pekin','Peoria','Peoria Heights','Springfield',
               'Urbana','Washington');

SELECT COUNT(*) FROM deals d
JOIN master_listings m ON m.slug = d.listing_slug
WHERE d.is_active = true AND m.project_tag = 'green' AND m.state='IL'
  AND m.city IN (... same list ...);
```

Compare the two numbers to whatever the homepage stat block currently displays ("X dispensaries · Y active deals" or whatever the live copy is). They must match exactly.

If they don't, either (a) the stat-block query is missing the `project_tag` filter (C2 class), (b) the stat-block query is using a different city list than `CENTRAL_IL_CITIES` (scope drift), or (c) the page is cached against an old DB state (rebuild the page).

### Stopping rule

If any of steps 1–7 fails, **stop the launch** and fix the failure before sharing the URL. There is no "I'll fix it after." A URL shared with a broken empty state, or a project-tag bleed, or a 401 cron, is a credibility cost that doesn't refund.

The runbook's seven steps are designed to compose: each one takes 1–2 minutes, the whole thing runs end-to-end in under 10. The cost of running it is small enough that the only reason not to is haste, and haste is what produced the four findings the runbook now exists to catch.
