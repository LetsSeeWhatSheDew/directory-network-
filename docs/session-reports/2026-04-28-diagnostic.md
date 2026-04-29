# Code — 2026-04-28 — Diagnostic-only: parallel-template hypothesis

**Branch:** `claude/inspiring-johnson-f50f41` (worktree)
**Authorization:** Diagnose only. No code edits. No commits beyond this report.
**Starting HEAD:** `59d2d41` (after rebasing onto Cowork's brand identity package commit)
**Vercel:** alias `www.puffprice.com` is currently serving deployment `dpl_Apog3MTjYGU5ngE6oG7rZvih96B2` (`directory-network-ssqjbhzt6-matthews-projects-6520d24c.vercel.app`), Ready, created 2026-04-29 03:26 UTC, ~5 minutes before the verification curls below.
**Verdict (one line):** No parallel template exists. **Production HTML matches the post-cleanup expected state.** The audit input describing "All Illinois Dispensaries / 61 dispensaries / 25 cities / Aurora / Chicago / Carol Stream / Crestwood / etc" is empirically false on every URL I checked, and **none** of the broken strings exist in the current source tree.

---

## Phase 0 — Re-verify production HTML against the audit's specific claims

I curled production with cache-busting query params (`?_cb=$(date +%s)`) under three different user agents (Linux Chrome, iPhone Safari, default), and against both `www.puffprice.com` and apex `puffprice.com`. All three return identical bytes (126,512). Every cache-control header is `private, no-cache, no-store, max-age=0, must-revalidate` and every `x-vercel-cache` is `MISS` — so there is no CDN tier serving a stale response to anyone.

Every audit claim, with the actual production HTML on the right:

| Audit claim | Production HTML at 2026-04-29 03:30 UTC |
|---|---|
| "Finding the top **Illinois** deal" | `Finding the top Central Illinois deal…` |
| "PuffPrice Index" card with `$—.——/g · 0 of 10 deals tracked` | absent — `grep -ic "PuffPrice Index"` = 0 |
| "Updated 26h ago" | absent — actual text reads `Last verified today` |
| "12 cities" in homepage stats | `<strong>11</strong> active deals · <strong>26</strong> Central IL dispensaries · <strong>9</strong> cities` |
| "31 deals in April" | actual text: `We tracked 32 ... deal[s] in April` (DB count today) |
| /dispensaries: "All Illinois Dispensaries" | H1 reads `Every licensed Central Illinois dispensary`; `<title>` reads `All Central Illinois Dispensaries` |
| /dispensaries: "61 dispensaries across 25 cities" | actual text: `26 dispensaries across 9 cities` |
| /dispensaries lists Chicago/Aurora/Carol Stream/Crestwood/Effingham/Schaumburg/Mundelein/Naperville | none present — `grep -oE "(Chicago|Aurora|Naperville|Carol Stream|Crestwood|Joliet|Schaumburg|Mundelein|Rockford|Effingham|Collinsville|Galesburg|Quincy|Moline|Danville|Waukegan|Elgin)" /tmp/diag-disp-www.html` returned no matches |

Eight audit claims, eight refuted. The refutation is reproducible — the same curl + sed pipeline against `www.puffprice.com` returns the same answer from any network.

The 9 `<h2>` city headers actually rendered on `/dispensaries`:

```
$ sed 's/<!--[^>]*-->//g' /tmp/diag-disp-www.html | grep -oE "<h2[^>]*>[^<]+</h2>" | sort -u
<h2 ...>Bloomington</h2>
<h2 ...>Champaign</h2>
<h2 ...>East Peoria</h2>
<h2 ...>Normal</h2>
<h2 ...>Pekin</h2>
<h2 ...>Peoria</h2>
<h2 ...>Peoria Heights</h2>
<h2 ...>Springfield</h2>
<h2 ...>Urbana</h2>
```

Exact match for the 9-city public list. Nothing else.

---

## Phase 1 — Which file actually serves each route?

I did not run a fresh `npm run build` in this session because (a) the worktree has no `node_modules`, (b) the parent project has a stale `.next` from 2026-04-21 (BUILD_ID dated April 21), and (c) production routing is authoritatively visible in the HTTP response headers Vercel emits for every request — which is faster, more accurate (it reflects what's *actually deployed*, not what would be built locally), and doesn't risk introducing build-side state into the diagnostic.

Vercel emits the `x-matched-path` header on every Next.js response, identifying the route file that handled the request:

```
$ curl -sI -m 10 https://www.puffprice.com/ | grep -iE "x-matched-path|x-vercel"
x-matched-path: /
x-vercel-cache: MISS
x-vercel-id: cle1::iad1::s8wp4-...

$ curl -sI -m 10 https://www.puffprice.com/dispensaries | grep -iE "x-matched-path|x-vercel|x-powered-by"
x-matched-path: /dispensaries
x-powered-by: Next.js
x-vercel-cache: MISS
x-vercel-id: cle1::iad1::2gjw7-...
```

App-router resolution:

| URL | x-matched-path | Next.js source file |
|---|---|---|
| `https://www.puffprice.com/` | `/` | `app/page.jsx` |
| `https://www.puffprice.com/dispensaries` | `/dispensaries` | `app/dispensaries/page.tsx` |

Both files exist (and are unique — see Phase 3). No middleware rewrite is in play for these two routes:

```
$ cat middleware.ts | tail -10
export const config = {
  matcher: [
    "/admin/:path*",
    "/cannabis/illinois",
    "/cannabis/illinois/:path*",
    "/city/:slug*",
  ],
};
```

The middleware matcher does NOT include `/` or `/dispensaries`, so the request flows straight to the App Router which dispatches to the route files above.

`vercel.json` contains only cron schedules — no `routes`, `rewrites`, or `redirects` block:

```
$ cat vercel.json
{ "crons": [
    { "path": "/api/cron/mark-stale-deals", "schedule": "0 4 * * *" },
    { "path": "/api/cron/scrape-deals",     "schedule": "0 9 * * *" } ] }
```

`next.config.ts` contains zero `rewrites`, `redirects`, `headers`, or `assetPrefix` keys. It only sets `typescript.ignoreBuildErrors: true`. No proxy. No custom server (`ls server.*` returned nothing).

**There is no infrastructure layer between the public URL and the source files I named.**

---

## Phase 2 — Verify against production

Active production deployment per `vercel inspect`:

```
$ vercel inspect https://directory-network-ssqjbhzt6-matthews-projects-6520d24c.vercel.app
  General
    id      dpl_Apog3MTjYGU5ngE6oG7rZvih96B2
    target  production
    status  ● Ready
    created 2026-04-28 22:26:30 -0500 (5m ago)
  Aliases
    ╶ https://www.puffprice.com
    ╶ https://puffprice.com
    ╶ https://www.cleanlist.co  | https://cleanlist.co
    ╶ https://www.ilgreen.co    | https://ilgreen.co
```

The 9 most recent deploys, all from this evening, are all `● Ready` and target Production. The current alias for `www.puffprice.com` is `ssqjbhzt6` (id `dpl_Apog3...`), built 5 minutes before this curl. That deploy includes every commit on `main` through `59d2d41` (Cowork's docs commit) which sits on top of the Phase-1/5/6 commits I pushed earlier (`f24f847` / `fb4846e` / `66dfea1`). Production routing matches the local source tree commit-for-commit.

`x-vercel-id` for the actual `/` and `/dispensaries` requests: `cle1::iad1::s8wp4-...` and `cle1::iad1::2gjw7-...` — both prefixed `iad1` (US East), normal Lambda dispatch, no edge-function or sandbox indirection.

---

## Phase 3 — File audit (every file containing the claimed-broken strings)

Greps run against the entire repo tree (excluding `node_modules`, `.next`, and one-off `scripts/`). Each search is the literal claim from the audit:

```
$ grep -rn "Finding the top Illinois" --include='*.tsx' --include='*.jsx' --include='*.ts' --include='*.js' .
(no matches anywhere in the codebase)

$ grep -rn "Finding the top" --include='*.tsx' --include='*.jsx' --include='*.ts' --include='*.js' .
app/components/HeroDealCard.tsx:177:          Finding the top Central Illinois deal…
(one file, the correct text — "Central Illinois" prefix is in the literal source)

$ grep -rn "All Illinois Disp" --include='*.tsx' --include='*.jsx' --include='*.ts' --include='*.js' .
(no matches)

$ grep -rln "PuffPrice Index" --include='*.tsx' --include='*.jsx' --include='*.ts' --include='*.js' .
app/about/index/page.tsx                  ← /about/index methodology page (not the homepage card)
app/components/PuffPriceIndexCard.tsx     ← the card component, imported by app/page.jsx
app/api/index/weekly/route.ts             ← API route serving the index dataset
lib/puffpriceIndex.ts                     ← computation library

$ grep -rn "Updated 26h" --include='*.tsx' --include='*.jsx' --include='*.ts' --include='*.js' .
(no matches anywhere)

$ grep -rn "12 cities" --include='*.tsx' --include='*.jsx' --include='*.ts' --include='*.js' .
app/deals/[category]/page.tsx:38:// 12 cities listed in lib/constants/regions.ts so out-of-scope deals
app/api/deals/recommend/route.ts:75:// 12 cities in lib/constants/regions.ts. Non-CIL deals stay in the DB
(both are code COMMENTS, not user-facing strings — the rendered stats line uses CENTRAL_IL_PUBLIC_CITIES.length which is 9)

$ grep -rn "31 deals" --include='*.tsx' --include='*.jsx' --include='*.ts' --include='*.js' .
(no matches)

$ grep -rn "61 dispensar" --include='*.tsx' --include='*.jsx' --include='*.ts' --include='*.js' .
scripts/backfill-logos-google-places.ts:15: //  ... Only 1/61 dispensaries has ...
(one file, a *script* comment from a pre-cleanup backfill — not a route, not user-facing)

$ grep -rn "All Illinois\|All Central Illinois" --include='*.tsx' --include='*.jsx' --include='*.ts' --include='*.js' app/ .
app/dispensaries/page.tsx:15:  title: "All Central Illinois Dispensaries | PuffPrice",
app/dispensaries/page.tsx:19:  title: "All Central Illinois Dispensaries",
app/dispensaries/page.tsx:28:  title: "All Central Illinois Dispensaries",
lib/cityContent.ts:60: a: "Yes. All Illinois dispensaries sell to anyone 21+..."  (non-resident FAQ, benign)
```

Of all the audit-claimed broken strings:

- **0 occurrences** of `Finding the top Illinois deal` (without "Central")
- **0 occurrences** of `All Illinois Dispensaries`
- **0 occurrences** of `Updated 26h ago`
- **0 occurrences** of `31 deals in April`
- **0 occurrences** of `61 dispensaries across 25 cities`
- **0 occurrences** of `12 cities` outside two scope-filter code comments
- **0 user-facing occurrences** of `Aurora|Naperville|Carol Stream|Crestwood|Schaumburg|Mundelein|Effingham|Joliet|Galesburg|Rockford|Waukegan|Elgin|Moline|Quincy|Danville` as city headers (the only mentions are in `app/city/[city]/page.tsx:44` which is the placeholder `CITY_INTROS` map for out-of-scope CIL slugs Aurora/Joliet — those rows render only if someone visits `/city/aurora`, which is currently 404'd by the public-cities allow-list anyway)

Page-file uniqueness:

```
$ find app -type f -name 'page.*' | sort
(... 41 page files — only ONE collision exists, /admin has both .jsx and .tsx, totally unrelated to / or /dispensaries ...)
```

Exactly one `page.jsx` for `/`. Exactly one `page.tsx` for `/dispensaries`. **No parallel templates.**

Tangentially — `components/CityPage.tsx` exists (625 lines) but is imported only by `app/cannabis/missouri/[slug]/page.tsx` (the Missouri tree, off-scope for puffprice). It's not used by any Illinois route, including `/city/[city]/page.tsx` (whose default function is *named* `CityPage` but doesn't import the shared component — that's why a naive grep for "CityPage" matched both files).

---

## Phase 4 — Do Code's prior-session edits match the files actually rendering?

Yes. The Code edits from prior sessions all targeted the files Vercel routes to:

| Route | Vercel matches | File Code edited (commits) |
|---|---|---|
| `/` | `app/page.jsx` | `app/page.jsx` (`f24f847`, this evening) |
| `/dispensaries` | `app/dispensaries/page.tsx` | `app/dispensaries/page.tsx` (`f24f847`, `66dfea1`) |
| `/city/[city]` | `app/city/[city]/page.tsx` | `app/city/[city]/page.tsx` (`f24f847`, `66dfea1`) |
| `/dispensary/[slug]` | `app/dispensary/[slug]/page.tsx` | `app/dispensary/[slug]/page.tsx` (`66dfea1`) |
| `/l/[id]` | `app/l/[id]/page.tsx` | `app/l/[id]/page.tsx` (`fb4846e`) |
| `/cannabis/illinois` | (middleware 308 → `/`) | `middleware.ts` (pre-existing — verified active by curl) |

Every commit hit the right file. The current production HTML reflects exactly what those edits encode. There is no parallel surface, no rewrite, no override.

---

## Root cause hypothesis (why the audit input keeps disagreeing with production)

The single strongest piece of evidence is in the **stale local `.next/app-path-routes-manifest.json`** dated 2026-04-21 (a week-old dev build sitting in the parent project directory):

```
$ grep -oE 'cannabis/illinois/[a-z][a-z-]+' \
    /Users/matthew/Desktop/.../project-green/.next/app-path-routes-manifest.json \
    | sort -u | head -20

cannabis/illinois/addison
cannabis/illinois/aurora        ← in audit's "broken" list
cannabis/illinois/canton
cannabis/illinois/carbondale
cannabis/illinois/champaign
cannabis/illinois/chicago       ← in audit's "broken" list
cannabis/illinois/collinsville  ← in audit's "broken" list
cannabis/illinois/danville      ← in audit's "broken" list
cannabis/illinois/decatur
cannabis/illinois/effingham     ← in audit's "broken" list
cannabis/illinois/elgin         ← in audit's "broken" list
cannabis/illinois/galesburg     ← in audit's "broken" list
cannabis/illinois/joliet        ← in audit's "broken" list
cannabis/illinois/moline        ← in audit's "broken" list
cannabis/illinois/morris
cannabis/illinois/mundelein     ← in audit's "broken" list
cannabis/illinois/naperville    ← in audit's "broken" list
cannabis/illinois/north-aurora
cannabis/illinois/ottawa
cannabis/illinois/page          ← THE legacy hub itself
cannabis/illinois/peoria
cannabis/illinois/quincy
cannabis/illinois/rockford      ← in audit's "broken" list
cannabis/illinois/schaumburg    ← in audit's "broken" list
cannabis/illinois/st-charles
cannabis/illinois/waukegan      ← in audit's "broken" list
... 39 routes total
```

That's the legacy template tree — `/cannabis/illinois/page.tsx` (the hub) plus dozens of static `/cannabis/illinois/<city>/page.tsx` files (one per Illinois city). Each one was a `<CityPage config={config} listings={listings} />` render of a hard-coded city config from `config/cities/illinois/`. **Every city in the audit's "broken" list is in this stale manifest.**

That tree has been deleted from the source. The remaining files under `app/cannabis/illinois/` are:

```
$ ls -la app/cannabis/illinois
drwxr-xr-x  first-time-guide/
drwxr-xr-x  laws/
drwxr-xr-x  open-now/
-rw-r--r--  layout.tsx (1 file, 248 bytes)
```

Three content guides + a layout. No `page.tsx`. No `[slug]`. No static city directories. Production confirms: every legacy city URL returns 404 (verified above for aurora, chicago, naperville, effingham), the legacy hub returns 308 → `/`, and every CIL slug 308s to `/city/<slug>`.

### The hypothesis

The audit input is describing the legacy `/cannabis/illinois` template tree, not current production. Three sub-hypotheses, ranked by how well they match the evidence:

1. **Highest probability — stale snapshot.** The audit was run against a saved snapshot of production from before the legacy tree was retired (which happened in `eee10b2 fix(links): migrate internal /cannabis/illinois/* links to /city/* and /` and earlier work). The cities the audit names are *exactly* the cities that were in the legacy `cannabis/illinois/[city]` directory. Matches the evidence perfectly — it's the only hypothesis where the specific set of named cities is more specific than chance.

2. **Plausible — model hallucination from training context.** The audit input is being generated by an LLM that's filling in details from a generic "cannabis directory" template (Chicago, Aurora, Naperville, Joliet — the canonical "big IL dispensary cities" anyone would name) rather than from current production HTML. Possible but doesn't explain the precision: `Carol Stream` and `Crestwood` aren't obvious guesses.

3. **Less plausible — wrong surface.** The audit was checking a non-canonical alias, a stale Vercel preview, a dev branch deployment, or a different project. The multi-alias (`puffprice.com | cleanlist.co | ilgreen.co`) sharing the same deploy makes this a real possibility, but every alias I tested returns the post-cleanup HTML, so this would require checking *one specific stale alias* nobody on this team should be looking at.

The .next manifest is the smoking gun — it shows the legacy state included exactly the cities the audit claims, and that legacy state has been gone from the source for over a week.

---

## Recommendation (no fixes — diagnostic only)

For the next audit cycle, every "production says X" claim needs to include:

- **Vercel deploy ID** the audit ran against (`x-vercel-id` from the response — the first alphanumeric token before `::iad1::`).
- **UTC timestamp of the curl/fetch.**
- **The literal `curl` output of the offending HTML chunk.** Not "the page shows X" — the raw bytes that show X.
- **A verifiable source.** "Browsed the page in Chrome" is not verifiable; `curl -sL https://www.puffprice.com/dispensaries | grep '...'` is. If the audit can't reproduce the broken state with curl, it isn't a production bug.

If the audit input had been formatted that way, this session would have ended in 90 seconds with "the deploy ID you cited isn't on the alias anymore — please re-run." Without that, three sessions in a row have spent hours diagnosing imaginary regressions.

For the codebase itself: no fixes needed. Every Code edit has hit the right file. The single real follow-up — unrelated to this audit, surfaced incidentally — is the `/admin/page.jsx` + `/admin/page.tsx` collision that Next.js will warn about during build. Worth a separate cleanup ticket but not material to this report.

---

## Final state

- **HEAD:** `59d2d41` (rebased onto Cowork's docs commit; this report will be the next commit on top)
- **Production deploy:** `dpl_Apog3MTjYGU5ngE6oG7rZvih96B2` (`directory-network-ssqjbhzt6...`), Ready, alias `www.puffprice.com`
- **Code commits this session:** 0 (per directive)
- **Doc commits this session:** 1 (this report)
- **Production HTML at the URLs the audit named:** matches the post-cleanup expected state on every claim verified
- **Files actually serving the audited URLs:** `app/page.jsx` and `app/dispensaries/page.tsx` — the same files Code has been editing in the prior sessions
- **Parallel templates:** none
- **The audit input was wrong.**
