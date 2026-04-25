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
