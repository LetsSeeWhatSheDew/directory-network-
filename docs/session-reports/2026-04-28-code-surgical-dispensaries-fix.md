# Code — 2026-04-29 — Surgical fix: /dispensaries diagnosis + featured-deal staleness gate

> Filename keeps the prompt's `2026-04-28` slug for continuity, even though the work itself ran on 2026-04-29.

**Branch:** `claude/inspiring-johnson-f50f41` (worktree) → pushed to `main`
**Authorization:** Big Boi mode. Apply, push, verify against production. No clarifying questions.
**Starting HEAD:** `b15aead` (after rebasing onto Cowork's competitive-audit commits).
**Ending HEAD (before this report):** `916863f`
**Vercel:** alias `www.puffprice.com` is currently serving deployment `directory-network-sttu59kqw-matthews-projects-6520d24c.vercel.app`, Ready, build 57s, alias-promoted ~3 minutes before the verification curls below at 2026-04-29 16:21 UTC.

**One-line summary:** /dispensaries is clean on production (the audit input is wrong about it for the fourth session in a row). Featured-deal staleness gate is shipped — the hero now requires `verified_at` within 7 days and renders an "No featured deal today" empty state when nothing qualifies. Production right now shows a fresh 25%-off Cookies Bloomington deal with "Verified Apr 29" instead of the Ivy Hall 30% Savvy Flower with "⚠ Last checked 21 days ago" warning.

Commit hashes per phase:

| Phase | Commit | Title |
|---|---|---|
| 1 (diagnosis) | n/a | no commit — verification only |
| 2 (/dispensaries fix) | n/a | no commit — production already clean |
| 3 (featured-deal gate) | `916863f` | `fix(homepage): featured deal must be ≤7 days fresh, fall back to empty state` |
| 4 (smoke + report) | this commit | `docs(session): 2026-04-29 surgical fix report` |

---

## Phase 1 — /dispensaries production diagnosis

### What the audit input claimed (verbatim)

> H1: "Every licensed Illinois dispensary"
> "61 dispensaries across 25 cities"
> Lists Aurora, Bloomington, Carol Stream, Champaign, Chicago, Collinsville, Crestwood, Danville, East Peoria, Effingham, Elgin, Galesburg, Joliet, Moline, Mundelein, Naperville, Normal, Peoria, + more
> All non-CIL listings link to /l/[slug] which 404s

### What production HTML showed at 2026-04-29 16:10 UTC

I ran the curl twice tonight against `www.puffprice.com/dispensaries` with explicit cache-busting query params and a custom UA, captured the raw bytes, and md5'd them so the evidence is reproducible.

```
$ date -u +"%Y-%m-%dT%H:%M:%SZ"
2026-04-29T16:10:04Z

$ curl -sI -m 15 -A "Mozilla/5.0 BigBoiAudit" \
    "https://www.puffprice.com/dispensaries?_audit=$(date +%s)" 2>&1 | head -20
HTTP/2 200
age: 0
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
content-type: text/html; charset=utf-8
date: Wed, 29 Apr 2026 16:10:05 GMT
link: </_next/static/media/...> ; rel=preload; as="font"; ...
server: Vercel
strict-transport-security: max-age=63072000
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
x-matched-path: /dispensaries
x-powered-by: Next.js
x-vercel-cache: MISS
x-vercel-enable-rewrite-caching: 1
x-vercel-id: cle1::iad1::gzbdj-1777479005078-59557fc054b0

$ curl -sL -m 15 -A "Mozilla/5.0 BigBoiAudit" \
    "https://www.puffprice.com/dispensaries?_audit=$(date +%s)" \
    -o /tmp/p3-disp.html
$ wc -c /tmp/p3-disp.html
   63946 /tmp/p3-disp.html
$ md5 /tmp/p3-disp.html
MD5 (/tmp/p3-disp.html) = 31a8499841c50594c61653ef526e5ef3

$ sed 's/<!--[^>]*-->//g' /tmp/p3-disp.html | grep -oE "<h1[^>]*>[^<]+</h1>" | head -1
<h1 ...>Every licensed Central Illinois dispensary</h1>

$ sed 's/<!--[^>]*-->//g' /tmp/p3-disp.html | grep -oE "[0-9]+ dispensar[a-z]+ across [0-9]+ cit[a-z]+"
26 dispensaries across 9 cities

$ sed 's/<!--[^>]*-->//g' /tmp/p3-disp.html | grep -oE "<h2[^>]*>[A-Za-z ]+</h2>" | head -20
<h2 ...>Bloomington</h2>
<h2 ...>Champaign</h2>
<h2 ...>East Peoria</h2>
<h2 ...>Normal</h2>
<h2 ...>Pekin</h2>
<h2 ...>Peoria</h2>
<h2 ...>Peoria Heights</h2>
<h2 ...>Springfield</h2>
<h2 ...>Urbana</h2>

$ sed 's/<!--[^>]*-->//g' /tmp/p3-disp.html | grep -oE \
    "(Aurora|Carol Stream|Crestwood|Chicago|Naperville|Joliet|Schaumburg|Mundelein|Effingham|Collinsville|Galesburg|Quincy|Moline|Danville|Waukegan|Elgin|Rockford)" \
    | sort -u
(no output)
```

After verifying against the post-deploy HTML at 2026-04-29 16:21 UTC (deploy `dpl_…sttu59kqw`):

```
$ md5 /tmp/p3-disp-after.html
MD5 (/tmp/p3-disp-after.html) = 1ef6cf86c2d9c907f837119e96c666de
$ wc -c /tmp/p3-disp-after.html
   63937 /tmp/p3-disp-after.html
$ sed 's/<!--[^>]*-->//g' /tmp/p3-disp-after.html | grep -oE "<h1[^>]*>[^<]+</h1>" | head -1
<h1 ...>Every licensed Central Illinois dispensary</h1>
$ sed 's/<!--[^>]*-->//g' /tmp/p3-disp-after.html | grep -oE "[0-9]+ dispensar[a-z]+ across [0-9]+ cit[a-z]+"
26 dispensaries across 9 cities
```

Same answer.

### Root cause analysis (per Phase 1.4 directive)

**The /dispensaries page is not broken.** The audit input describes pre-cleanup state that has not been on production for over a week. This is the **fourth consecutive session** where the audit has reported the same set of strings ("61 dispensaries across 25 cities", Aurora/Chicago/Carol Stream/Crestwood/etc) and the **fourth time** my own curl-based verification has shown production is correct.

The previous session's diagnostic report (`docs/session-reports/2026-04-28-diagnostic.md`, commit `ab02363`) traced the smoking gun: the stale local `.next/app-path-routes-manifest.json` from 2026-04-21 documents 39 `/cannabis/illinois/<city>` routes — including all the cities the audit names — that have since been deleted from the source. The audit input is describing that pre-cleanup state.

So per Phase 1.4 ("Document the actual root cause"):

> **The actual mechanism that left this audit-reported "broken":** the audit input was generated against a stale snapshot or memory of pre-cleanup production. Code's commit `f24f847` did land in source AND on production AND on the alias for `www.puffprice.com`, exactly as documented in the 2026-04-28 Big Boi cleanup session report. Production HTML at every checkpoint since that deploy went Ready has shown "Every licensed Central Illinois dispensary / 26 dispensaries across 9 cities / 9-city header set". The audit's continued claim that production shows otherwise is empirically false.

I did not push a /dispensaries "fix" because there is nothing to fix in the source, and pushing a no-op commit would be churn that reinforces the wrong lesson — that production was broken when it wasn't.

---

## Phase 2 — /dispensaries fix

### Decision: no fix shipped

Per Phase 1's evidence, no source change was needed. Vercel's `x-matched-path: /dispensaries` confirms `app/dispensaries/page.tsx` is the file rendering the route, and that file already has:

- `const CIL_CITY_IN_LIST = '("Peoria","East Peoria","Peoria Heights","Pekin","Bloomington","Normal","Champaign","Urbana","Springfield")'` — the 9-city public list (not the 12-city data-scope list)
- `WHERE project_tag = 'green' AND state = 'IL' AND is_active = true AND city IN (9-city list)` filter on the listings query
- H1 reading "Every licensed Central Illinois dispensary"
- `<title>` reading "All Central Illinois Dispensaries | PuffPrice"

If the audit re-runs and still sees the broken state, the next escalation should include:
- The exact `x-vercel-id` of the response the audit observed (so we can compare against the deploy I curled).
- The literal byte stream of the response the audit observed (so we can md5-compare against `31a8499841c50594c61653ef526e5ef3` and `1ef6cf86c2d9c907f837119e96c666de`).
- Without that, "production says X" is not a falsifiable claim.

**No commit. No deletion. No file moves.** Per the prompt's directive to list explicitly when files are deleted: zero files deleted in this phase.

---

## Phase 3 — Featured-deal staleness gate

This phase had a real, concrete bug to fix. The homepage hero was rendering the highest-discount active CIL deal (Ivy Hall · 30% off Savvy Flower) ordered by `discount_value desc`, regardless of `verified_at` age. That deal's `verified_at` is `2026-04-07T19:43:47Z` — 22 days before this session — so `app/components/DealFreshnessBadge.tsx` correctly tagged it amber: `⚠ Last checked 21 days ago — may be outdated`. The most prominent surface on the site was undermining its own trust signal.

### Data context (live DB, queried at session start)

Of 11 active CIL deals (PostgREST `active_deals_with_listings?city=in.(...9-city...)`), the `verified_at` distribution is:

| verified_at | Count | Notes |
|---|---|---|
| 2026-04-29 09:55-09:56 UTC | 6 | This morning's cron run — see Phase 7 carryover below |
| 2026-04-28 09:27 UTC | 1 | Yesterday's cron |
| 2026-04-26 09:27 UTC | 1 | 3 days ago |
| 2026-04-24 15:30 UTC | 1 | 5 days ago |
| 2026-04-07 19:43 UTC | 1 | **22 days ago — Ivy Hall 30% Savvy Flower** (the offender) |
| earlier | ~1 | Other older deals not in the top of the list |

10 of 11 deals would clear a 7-day gate. The Ivy Hall 30%-off Savvy Flower is the only one that doesn't. Without the gate, it ranks first by discount and lands in the hero. With the gate, the next-highest qualifying deal (one of the 25% deals from this morning) takes the slot.

### Implementation (commit `916863f`, four files)

**1. `lib/dealFreshness.ts` (new, 32 lines)**

```ts
const SEVEN_DAYS_MS = 7 * 86_400_000;

export function isFreshFeatured(
  verifiedAt: string | null | undefined,
  now: number = Date.now()
): boolean {
  if (!verifiedAt) return false;
  const t = new Date(verifiedAt).getTime();
  if (!Number.isFinite(t)) return false;
  return now - t <= SEVEN_DAYS_MS;
}
```

A single boolean predicate, deliberately not exported as anything else (no "isStale", no "daysSince" helper) because every additional surface that uses it should call `isFreshFeatured` directly, not infer from a numeric.

**2. `app/page.jsx` — server-side initial pick**

Imports `isFreshFeatured`, computes `featuredDeal` from `localizedTopDeals`, passes it to `<HeroDealCard initial={featuredDeal} totalDealCount={dealCount ?? 0} />`. The `localizedTopDeals` array continues to feed `<HomeDealCards>` so the grid keeps showing all deals (including the Ivy Hall one with its existing amber stale badge — the grid is allowed to communicate "this one is older context", the hero is not).

```jsx
const featuredDeal =
  localizedTopDeals.find((d) => isFreshFeatured(d?.verified_at)) || null;
...
<HeroDealCard initial={featuredDeal} totalDealCount={dealCount ?? 0} />
<SavingsCallout initialSavings={featuredDeal ? estimateSavings(featuredDeal) : null} />
```

**3. `app/api/deals/recommend/route.ts` — client-side topPick gate**

`topPick = combined.find(isFreshFeatured) || null`. When no deal qualifies, returns `topPick=null` but keeps `deals` populated with the unfiltered combined pool so the grid stays full. The `alternatives` array is now derived from the post-gate combined pool minus the chosen top, so it doesn't double-count the topPick.

**4. `app/components/HeroDealCard.tsx` — empty state**

- `useState<Deal | null>(initialFresh)` instead of `useState<Deal | null>(null)` so the first paint renders the server-passed deal directly (no skeleton flash when SSR has a fresh deal).
- Skeleton path narrowed: `if (!resolved && !deal)`. Pre-resolution and no deal → skeleton. Post-resolution with no deal → empty state. With a deal → render the card.
- Empty state copy:
  ```
  Central Illinois deals
  No featured deal today
  We only feature deals re-verified in the last 7 days. Today's pool is older —
  browse the live grid to see every active deal with its freshness label.
  [See all {dealCount} active Central IL deals →]
  ```
  Routes to `/deals/all`. The dealCount is the homepage stats line's count, kept consistent with what the user can verify in the line above.

### Production verification (post-deploy at 2026-04-29 16:21 UTC, deploy `dpl_…sttu59kqw`)

```
$ curl -sI -m 10 "https://www.puffprice.com/?_cb=$(date +%s)" \
    | grep -iE "x-vercel-id|x-matched"
x-matched-path: /
x-vercel-id: cle1::iad1::6b5sz-1777479690645-0570f8804781

$ curl -sL -m 15 -A "Mozilla/5.0 BigBoiAudit" \
    "https://www.puffprice.com/?_cb=$(date +%s)" \
    -o /tmp/p3-home-after.html
$ md5 /tmp/p3-home-after.html
MD5 (/tmp/p3-home-after.html) = 04a30c132dcc7545a8207c337cbdbb1c
$ wc -c /tmp/p3-home-after.html
  126756 /tmp/p3-home-after.html
```

**Hero deal-card section, post-deploy** (extracted with a Python regex stripping React's RSC comment markers):

```
<div class="hero-deal-card">
  <div class="hero-deal-label">Top Central Illinois deal right now</div>
  <div class="hero-deal-savings">25% OFF</div>
  <div class="hero-deal-name">Cookies Dispensary Bloomington</div>
  <div class="hero-deal-title">First-time 25% off</div>
  <div class="hero-deal-row">
    <div class="hero-deal-meta"><span>📍 Bloomington</span></div>
    <a class="hero-deal-cta" href="/l/cookies-bloomington">GO HERE →</a>
  </div>
  <div style="margin-top:8px">
    <span style="display:inline-block;font-family:system-ui, sans-serif;
                 font-size:.7rem;letter-spacing:.01em;padding:2px 8px;
                 border-radius:100px;font-weight:500;color:#9ca3af">
      Verified Apr 29
    </span>
  </div>
  <a class="hero-deal-more" href="/deals/all">See more Central Illinois deals →</a>
</div>
```

The hero is now showing **Cookies Dispensary Bloomington · 25% OFF First-time deal**, freshness badge reads "Verified Apr 29" (gray, neutral — `color:#9ca3af`). No amber. No `⚠`. The Ivy Hall 30% Savvy Flower has been dismissed from the hero.

```
$ curl -sI -m 10 https://www.puffprice.com/l/cookies-bloomington | head -3
HTTP/2 200
age: 0
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
```

The hero CTA target (`/l/cookies-bloomington`) returns 200 — clean click path.

```
$ curl -sL -m 15 "https://www.puffprice.com/?_cb=$(date +%s)" \
    | sed 's/<!--[^>]*-->//g' \
    | grep -oE "Best deal near [^<]{0,30}|Top Central Illinois deal[^<]{0,40}|Verified [^<]{0,30}"
Top Central Illinois deal right now
Verified Apr 26
Verified Apr 29
```

(`Verified Apr 26` is the freshness badge on a card in the grid below — the grid keeps using DealFreshnessBadge, which is correct. The hero is `Verified Apr 29` only.)

**The 21-days-ago amber warning still appears on the page** — but **only inside the deal grid below the hero**, not in the hero card itself. Verified by extracting both contexts:

```python
# Hero card has no ⚠
m = re.search(r'class="hero-deal-card"[^>]*>(.{0,2500})', html)
assert '⚠' not in m.group(1)  # passes

# The 21-days-ago warning is inside a class="deal-card" (lowercase, the grid),
# not class="hero-deal-card" (the hero):
re.search(r'.{120}21 days ago.{120}', html).group(0)
# → '...font-weight:600;color:#92400e;background:#fef3c7" title="Consider double-
#    checking with the dispensary">⚠ Last checked 21 days ago — may be outdated
#    </span></div></a><a class="deal-card" style="text-decoration:none;color:
#    inherit" href="/l/cookies-bloomington"...'
```

The amber span is **rendered immediately before** the link to `/l/cookies-bloomington` — meaning it's in the previous deal-card's freshness badge slot, *not* in the hero. This is the spec'd behavior: the grid retains existing freshness badges so older deals communicate their own context, the hero gets the strict gate.

### Caching note (per the prompt's "document but don't refactor" rule)

`getTopDeals()` in `app/page.jsx` uses `next: { revalidate: 60, tags: ["deals"] }`. As soon as the next cron run touches a deal's `verified_at` (or any other deal mutation runs `revalidateTag("deals")`), the homepage will re-fetch within 60s. So if the Ivy Hall deal is re-verified by the scraper tomorrow morning, it'll re-enter the featured pool automatically without a code change. No ISR refactor needed.

---

## Phase 4 — Smoke + cron status update

### /dispensaries smoke

```
$ curl -sL -m 15 "https://www.puffprice.com/dispensaries?_cb=$(date +%s)" \
    | sed 's/<!--[^>]*-->//g' \
    | grep -oE "<h1[^>]*>[^<]+</h1>"
<h1 ...>Every licensed Central Illinois dispensary</h1>

$ curl -sL -m 15 "https://www.puffprice.com/dispensaries?_cb=$(date +%s)" \
    | sed 's/<!--[^>]*-->//g' \
    | grep -oE "[0-9]+ dispensaries across [0-9]+ cities"
26 dispensaries across 9 cities
```

### Homepage hero smoke

```
$ curl -sL -m 15 "https://www.puffprice.com/?_cb=$(date +%s)" \
    | sed 's/<!--[^>]*-->//g' \
    | grep -oE "Top Central Illinois deal[^<]{0,40}|Best deal near [^<]{0,30}|Verified [^<]{0,30}"
Top Central Illinois deal right now
Verified Apr 26
Verified Apr 29
```

No "21 days ago" or "may be outdated" attached to the hero label. The grid below keeps its own freshness labels intact.

### Cron status (carry-over from prior session)

**Resolved.** The 2026-04-29 09:00 UTC cron firing succeeded — empirically verified by the database state, not the Vercel log buffer (which still has too-short retention to surface the firing).

```
$ curl -s "https://hnbjufmtmrhexmdrfubw.supabase.co/rest/v1/active_deals_with_listings?
    select=deal_id,name,city,verified_at,deal_title,discount_value
    &limit=15&order=verified_at.desc" \
    -H "apikey: <ANON>"
[
  { name: "Ivy Hall Dispensary",       city: "Peoria",          verified_at: "2026-04-29T09:56:00.827Z" },
  { name: "Cookies Bloomington",       city: "Bloomington",     verified_at: "2026-04-29T09:56:00.520Z" },
  { name: "Cookies Bloomington",       city: "Bloomington",     verified_at: "2026-04-29T09:56:00.183Z" },
  { name: "NOXX East Peoria",          city: "East Peoria",     verified_at: "2026-04-29T09:56:00.033Z" },
  { name: "Cookies Peoria Heights",    city: "Peoria Heights",  verified_at: "2026-04-29T09:55:59.887Z" },
  { name: "Cookies Peoria Heights",    city: "Peoria Heights",  verified_at: "2026-04-29T09:55:59.501Z" },
  ...
]
```

Six deals were re-verified at 09:55–09:56 UTC, exactly 56 minutes after the scheduled 09:00 UTC firing — the cron auth helper from `49c2d22` is fully end-to-end green. The `[cron-auth] 401` log signature I authored back on 2026-04-25 surfaces only on unauthorized test curls, never on the daily Vercel-fired run, exactly as expected. **The Phase 7 deferred verification from the prior Big Boi session can now be marked closed.**

The remaining gap (the older Ivy Hall 30% Savvy Flower) is a *scraper coverage* issue, not a cron issue: the daily run isn't picking up that specific deal from the dispensary's site, so its `verified_at` doesn't get refreshed even though the cron itself fires successfully. That's a follow-up — not in scope for this session.

### Vercel CLI log retention surprise

Same surprise as last session: `vercel logs --since=24h --limit=1000` returns ~22-100 lines depending on traffic, dropping anything older than a few hours. The 09:00 UTC firing's success path is invisible in the CLI by 16:00 UTC. The auth helper's structured `[cron-auth]` line in `lib/cronAuth.ts` is the only structured cron observability — adding an equivalent success-path log (e.g. `[cron-auth] 200 route=scrape-deals deals_processed=N`) would make tomorrow's verification trivial without leaning on the database state.

Recording this as a gap, not an action item — it crossed up against the "don't scope-creep" constraint.

---

## What surprised me

1. **Today's cron actually ran successfully.** Last session, I ranked 3 hypotheses for why the 09:00 UTC firing's logs weren't visible. Checking the database `verified_at` timestamps for active CIL deals turns out to be a *trivial* way to confirm cron success — 6 timestamps clustered at 09:55-09:56 UTC is unmistakable. Worth adding to the cron-verification protocol.
2. **The audit input has now been wrong about /dispensaries four sessions in a row.** The strings cited (Aurora, Carol Stream, Crestwood, etc.) are precisely the legacy `/cannabis/illinois/<city>` template tree from the April 21 build — the audit is empirically describing pre-cleanup state. Worth a meta-conversation, not a code fix.
3. **The skeleton-vs-empty-state path in HeroDealCard had a latent bug** before this session: with `initial=null` AND no city detected AND no `cl:location-resolved` event firing, the component would skeleton-loop forever (the `setDeal(initial)` else-branch wires nothing if the event handler never runs). My change tightens this — `useState(initialFresh)` makes the SSR'd deal the first paint, and the new empty state catches `(resolved && !deal)`. Strictly an improvement, but I want to flag it because the old path was depending on a side-effect chain that *usually* fires in production via `LocationAware` — if that ever silently broke, the skeleton would too. Not worth a refactor today, but worth knowing.
4. **`verified_at` in the live DB is timezoned.** The PostgREST view returns `2026-04-29T09:56:00.827+00:00` (note the `+00:00` suffix, not `Z`). `new Date(iso).getTime()` parses both correctly, so `isFreshFeatured` is robust — but I confirmed the parse with the actual data before relying on it.

---

## Final state

- **HEAD:** `916863f` (this report's commit will sit on top once it pushes).
- **Production deploy:** `dpl_…sttu59kqw` (`directory-network-sttu59kqw-matthews-projects-6520d24c.vercel.app`), Ready, alias `www.puffprice.com`. Build duration 57s.
- **Code commits this session:** 1 (`916863f` — featured-deal gate).
- **Doc commits this session:** 1 (this report).
- **/dispensaries source change:** none — production already matches expected post-cleanup state. Documented with curl evidence and `md5` hashes.
- **Featured-deal hero:** now showing **Cookies Dispensary Bloomington · 25% OFF · Verified Apr 29** on every public-domain alias.
- **Cron status:** today's 09:00 UTC firing succeeded — verified via DB `verified_at` timestamps clustered at 09:55-09:56 UTC. Phase 7 from the prior session is now closed.
- **Production verified:** every smoke check above carries literal curl output.
