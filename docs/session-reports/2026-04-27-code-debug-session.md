# Code — 2026-04-27 — debug session: GAP audit was looking at stale state

**Branch:** `claude/competent-kapitsa-d57746` (worktree) → pushed to `main`
**Authorization:** Matthew granted full push-through authority on the 8-phase plan, told me to verify after.
**Starting HEAD:** `0dd1d02`
**Ending HEAD:** unchanged from start (no code changes needed; this report is the only commit)
**Vercel:** Ready, on deployment `dpl_Ddwxy8cLAiYZdqrK3nkBS1CuaJ7p`, alias of `www.puffprice.com`
**Verdict:** **Production already matches every "fixed" claim in the prior session.** The orchestrator's audit reported 6 gaps; my own production-HTML re-audit at session start finds 0 of them present on live `puffprice.com`. The right action this session was *not* to push fixes for already-fixed bugs — it was to diagnose why the orchestrator and the production HTML disagreed, and then to recommend a verification protocol so the confusion doesn't recur.

---

## Phase 0 — Diagnose the verification gap (the most important phase, per the prompt)

The prompt asserted six gaps still present on production, identified by an audit run "AFTER" my session but "BEFORE" this one. Per the prompt's hard constraint: "Production is the source of truth. Localhost smoke tests do not satisfy verification — every fix must be verified by fetching the production URL after deploy."

I followed exactly that rule. Every assertion below is backed by `curl https://www.puffprice.com/...` output, captured in this session at `Sat Apr 25 19:24–19:27 UTC 2026`. The HEAD `0dd1d02` deploy went live at `2026-04-25 14:02:32 -0500 = 19:02 UTC` per `git log` — so the curl tests below were against the deploy that includes commits `941a85f` (project_tag) + `5bd321d` (metro-bleed) + `49c2d22` (cron) + `eee10b2` (links) + `b53e22c` (polish), with ~20 minutes of safety margin past Ready.

Cache headers on `/city/peoria` say `cache-control: private, no-cache, no-store, max-age=0, must-revalidate` and `x-vercel-cache: MISS` — every fetch hits origin. There is no CDN layer that could be serving stale HTML to either the orchestrator or me.

### GAP-1 — "Metro bleed STILL present on /city/peoria"

**Claimed:** "8 dispensary cards rendered, including Cloud 9 East Peoria, nuEra East Peoria, NOXX East Peoria"

**Production at session start:**

```
$ curl -sL https://www.puffprice.com/city/peoria | sed 's/<!--[^>]*-->//g' \
  | grep -oE 'section-h">[0-9]+ dispensar[a-z]+ in [^<]+'
section-h">5 dispensaries in Peoria, IL

$ curl -sL https://www.puffprice.com/city/peoria \
  | grep -oE '/dispensary/[a-z][a-z-]+' | sort -u
/dispensary/aroma-hill-peoria
/dispensary/beyond-hello-peoria
/dispensary/ivy-hall-dispensary
/dispensary/trinity-on-glen
/dispensary/trinity-on-university

$ curl -sL https://www.puffprice.com/city/peoria \
  | grep -oE "(cloud-9|noxx|east-peoria)[a-z-]*" | sort -u
(no matches)
```

5 cards. All 5 are Peoria-proper dispensaries. Zero East Peoria leakage. **No gap.**

For completeness, all 12 CIL cities checked the same way:

```
/city/peoria           cards=5  header="5 dispensaries in Peoria, IL"
/city/east-peoria      cards=3  header="3 dispensaries in East Peoria, IL"
/city/peoria-heights   cards=1  header="1 dispensary in Peoria Heights, IL"
/city/bartonville      cards=0  empty="No licensed dispensaries in Bartonville, IL yet — nearest is about 5 mi NE in Peoria."
/city/morton           cards=0  empty="No licensed dispensaries in Morton, IL yet — nearest is about 8 mi W in East Peoria."
/city/washington       cards=0  empty="No licensed dispensaries in Washington, IL yet — nearest is about 9 mi SW in East Peoria."
/city/urbana           cards=1  header="1 dispensary in Urbana, IL"
/city/champaign        cards=3  header="3 dispensaries in Champaign, IL"
/city/springfield      cards=6  header="6 dispensaries in Springfield, IL"
/city/bloomington      cards=2  header="2 dispensaries in Bloomington, IL"
/city/normal           cards=4  header="4 dispensaries in Normal, IL"
/city/pekin            cards=1  header="1 dispensary in Pekin, IL"
```

5+3+1+0+0+0+1+3+6+2+4+1 = **26 active CIL listings**, matches DB. Apex domain (`https://puffprice.com/...`) returns the same. Mobile UA returns the same.

### GAP-2 — "URL encoding %20 STILL present"

**Claimed:** `href="/city/east%20peoria"` in the "Also near you" row.

**Production at session start:**

```
$ curl -sL https://www.puffprice.com/city/peoria \
  | grep -oE "/city/[a-z%][a-zA-Z0-9%-]+" | sort -u
/city/bartonville
/city/east-peoria
/city/morton
/city/peoria-heights
/city/pekin
/city/washington
```

Zero `%20`, all hyphens. **No gap.**

### GAP-3 — "PuffPrice Index NOT hidden"

**Claimed:** "Live HTML on homepage shows the full Index card rendered… '$—.——/g' … '0 of 10 deals tracked so far'"

**Production at session start:**

```
$ curl -sL https://www.puffprice.com/ | grep -ic "PuffPrice Index"
0
$ curl -sL https://www.puffprice.com/ | grep -ic "ppi-card"
0
$ curl -sL https://www.puffprice.com/ | grep -c "Illinois flower average"
0
$ curl -sL https://www.puffprice.com/ | grep -c "0 of 10 deals"
0
```

Four independent strings the card would emit. All four absent. **No gap.**

### GAP-4 — "Hero 'Illinois' not 'Central Illinois'"

**Claimed:** "Finding the top Illinois deal…" and "Showing the best active deal in Illinois right now."

**Production at session start:**

```
$ curl -sL https://www.puffprice.com/ | sed 's/<!--[^>]*-->//g' \
  | grep -oE "Finding the top [^<]{0,40}"
Finding the top Central Illinois deal…

$ curl -sL https://www.puffprice.com/ | sed 's/<!--[^>]*-->//g' \
  | grep -oE "Showing the best active deal in [^<]{0,40}"
Showing the best active deal in Central Illinois right now.
```

Both strings include "Central Illinois". **No gap.**

### GAP-5 — "Updated 26h ago still on homepage"

**Claimed:** "Updated 26h ago · 10 active deals."

**Production at session start:**

```
$ curl -sL https://www.puffprice.com/ \
  | grep -oE "Updated [0-9]+h ago|Last verified [^<]{0,30}|Updated today" | sort -u
Last verified Apr 24
```

Live text reads "Last verified Apr 24". Zero matches for "Updated [0-9]+h ago". **No gap.**

### GAP-6 — "Footer 'Central IL dispensaries ran 31 deals in April'"

**Claimed:** "Live still shows '31'. Code didn't address it."

**Production at session start:**

```
$ curl -sL https://www.puffprice.com/ \
  | grep -oE "ran [0-9]+ deal|tracked [0-9]+|We tracked [^<]+" | sort -u | head -3
We tracked
We tracked \",[\"$\",\"strong\",null,{\"style\":{...},\"children\":31}],...
```

The `31` is rendered. The verb is now **"tracked"** ("We tracked 31 Central IL deals in April"), not **"ran"**. This was the deliberate Phase 4.4 honest-framing change in the **2026-04-26 late-night** session report (commit `4f41715`), reaffirmed in the **2026-04-27 audit fixes** report. The query (`getDealsRunThisMonth` in `lib/stats.ts`) counts deals created-in-month regardless of current `is_active`, which is technically defensible IFF the verb is "tracked" not "ran" — exactly what the code now does. **No gap.**

### Definitive sweep — 19 stale-string patterns checked at once

```
patterns="270\+|34 [Cc]ities|35[+ ]?[Cc]ities|approximately 10 dispensaries|We're building|FEATURED SPOT|Verification pending|Imported Apr|—.——|0 of 10 deals|ppi-card|ppi-eyebrow|PuffPrice Index|Illinois flower average|Finding the top Illinois|Top Illinois deal|See more Illinois deals|Showing the best active deal in Illinois|Updated [0-9]+h ago|ran [0-9]+ deal|Illinois Cannabis Directory"

$ echo "$HOME" | sed 's/<!--[^>]*-->//g' | grep -oE "$patterns"
(no stale strings found on homepage)

$ echo "$PEORIA" | sed 's/<!--[^>]*-->//g' \
  | grep -oE "(cloud-9|noxx|east-peoria|nuera-east|%20|[68] dispensaries in Peoria)"
(no metro-bleed indicators on /city/peoria)
```

19 different stale-string patterns. Zero hits on either page.

### Phase 0 conclusion: the verification chain didn't break — the audit input did

Production HTML at session start (HEAD `0dd1d02`) already matched every claim in the prior session report. There were no fixes to ship. The orchestrator's audit either:

1. **Was looking at a stale snapshot** — possibly captured before yesterday's deploy went Ready, and not re-fetched. Vercel Ready for `dpl_Ddwxy8cLAiYZdqrK3nkBS1CuaJ7p` happened at 19:02 UTC; if the audit ran 19:00–19:01 UTC, it would have hit the previous deploy.
2. **Was looking at a different surface** than `https://www.puffprice.com/` — but I tested apex (`puffprice.com`), www, and mobile UA, all consistent.
3. **Hallucinated** the gap content. The specific dispensary names cited ("Cloud 9 East Peoria, nuEra East Peoria, NOXX East Peoria") do not appear anywhere in the current `/city/peoria` HTML, encoded or not.

I cannot reproduce any of the 6 reported gaps from production. Pushing 6 "fixes" for non-existent bugs would be sycophantic at best and would risk regressions. Per the prompt's own rule ("Production is the source of truth") I do not push fixes for problems I cannot reproduce on production.

---

## Phase 7 — Cron live status (the ONE genuinely-pending item)

The prompt's "ALSO PENDING — Cron live-token test" is real. My new auth helper (`lib/cronAuth.ts`, commit `49c2d22`) shipped to production today, and **I verified it is the live code** by fetching Vercel function logs.

```
$ vercel logs --no-follow --no-branch --environment=production --limit=200 \
    --since=24h --query='url:"/api/cron/scrape-deals"' --expand

14:27:03.07  www.puffprice.com  warning  λ HEAD /api/cron/scrape-deals       401
[cron-auth] 401 route=scrape-deals env_present=true env_len=43 header_present=true header_bearer=true header_token_len=5 match=false

14:27:01.92  www.puffprice.com  warning  λ HEAD /api/cron/scrape-deals       401
[cron-auth] 401 route=scrape-deals env_present=true env_len=43 header_present=false header_bearer=false header_token_len=0 match=false
```

The structured log line format (`[cron-auth] 401 route=… env_present=… env_len=… header_present=… header_bearer=… header_token_len=… match=…`) is the exact shape I authored in `lib/cronAuth.ts:48`. The previous code returned a plain `"unauthorized"` string body with no log. So:

- **The new auth helper IS deployed and is the active code path.** ✓
- **`env_present=true env_len=43`** confirms `CRON_SECRET` is set in Vercel env. The expected secret value (`S0zVClH9eC9oHKJuHCxJFRUQk_8uYVA5YFDOmrug0UA`) is exactly 43 chars — env var matches expected length. ✓
- **`header_token_len=5 match=false`** is from my own curl test (`Authorization: Bearer wrong` → token "wrong" = 5 chars). Correct rejection. ✓
- **`header_token_len=0 match=false`** is from the no-auth-header curl test. Correct rejection. ✓

What I **could not** verify in this session: the success path for the real Vercel-fired cron, because:

1. **No real cron firing has happened on the new code yet.** The cron schedule is daily 09:00 UTC. Today's 09:00 UTC firing happened ~10h before my deploy went Ready (deploy at 19:02 UTC; firing at 09:00 UTC). The new code's first scheduled exposure is **tomorrow 09:00 UTC**.
2. **I do not have the live `CRON_SECRET`.** Per the hard constraints: "NOT AUTHORIZED: Modify CRON_SECRET value (Matthew has the live one in Vercel env)." I cannot curl with the real bearer.
3. **Vercel Hobby plan limits cron triggering.** The "Run cron now" button in the dashboard is a Pro feature. There is no CLI equivalent on Hobby.

**Recommendation:** check Vercel function logs the morning of 2026-04-28, after the 09:00 UTC firing. If the firing returns `200`, the auth helper is fully functional end-to-end. If it returns `401`, the structured log will diagnose the cause in one line — most likely a remaining length mismatch (`env_len=44 header_token_len=43`) signaling a paste-with-trailing-newline still in env, in which case Matthew can re-paste the secret.

---

## Why I am NOT doing the rest of the prompt's phases

Phases 1–6 of the prompt instruct me to fix specific bugs on specific files. Per Phase 0, those bugs do not exist on production. Per the prompt itself: "Production is the source of truth. Localhost smoke tests do not satisfy verification — every fix must be verified by fetching the production URL after deploy."

Pushing 6 commits today to "fix" already-fixed code would:

- Risk regressions in working code.
- Inflate the audit trail with no-op churn.
- Reinforce the wrong lesson: that smoke-test PASS doesn't mean fixed. It does mean fixed when the smoke test is on production HTML — exactly the protocol the prompt insists on.

The prompt's hard constraint also says: "If the gap diagnosis (Phase 0) reveals a bigger issue (e.g., two template trees, or a build cache problem affecting many pages), STOP and surface it. Don't paper over it." The bigger issue here is that **the audit input was wrong**, not that the code was wrong. I am surfacing it instead of papering over it.

If Matthew (or the orchestrator) re-fetches `https://www.puffprice.com/city/peoria` and `https://www.puffprice.com/` in a fresh terminal right now and finds different content than what I documented above, that is the moment to escalate to a real debug session. I want to see the specific URL, the HTTP response headers (especially `x-vercel-cache`, `x-vercel-id`, `age`), and a sample line of the conflicting HTML — that triplet would tell me whether it is a regional CDN issue, a stale snapshot, or something else.

---

## Recommendation — verification protocol so this confusion doesn't recur

The prompt asks (Phase 8.8): "concrete recommendation: smoke tests inside session must always fetch production not localhost going forward, here's how."

The verification rule is already correct: production HTML is the source of truth. The two failure modes I want to design against are (a) **timing** — fetching before the deploy is Ready — and (b) **identity** — fetching from a stale process or an audit tool that holds onto a cached HTML snapshot. The protocol below addresses both:

### After every deploy that touches a user-facing route

1. **Confirm Vercel Ready before fetching.** Get the deployment URL from `vercel ls --environment=production --limit=1` and confirm `Status: ● Ready` *and* `Aliases:` includes `www.puffprice.com`. Only then fetch.

2. **Always include diagnostic headers in the smoke command:**

   ```
   curl -sI -m 8 https://www.puffprice.com/city/peoria \
     | grep -iE "(cache|age|x-vercel|date)"
   ```

   If `x-vercel-cache: HIT` and `age > 60`, you may be looking at a CDN-cached response. Add `?_t=$(date +%s)` to bust the cache for the verification fetch.

3. **Document the deployment ID alongside the smoke result.** The session report should say:

   > "Smoke verified at `Sat Apr 25 19:24 UTC 2026` against deployment `dpl_Ddwxy8cLAiYZdqrK3nkBS1CuaJ7p` (Ready since 19:02 UTC)."

   This makes a future audit trivially comparable: "did your smoke and my audit hit the same deploy?"

4. **For "did the smoke test see what I claimed?" ambiguity, paste the curl OUTPUT into the report,** not just "PASS". Doing so cost me ~50 lines in this report but makes the evidence portable to any subsequent reviewer (orchestrator, Matthew, future Claude).

5. **The orchestrator's audit should include Vercel deploy ID + timestamp** in any "production says X" claim. Without that, "production says X" is unfalsifiable when Code claims "production says Y" — they could be talking about different deploys 20 minutes apart.

### Concrete change to recommend

Add a `tests/smoke-prod.sh` that:

- Reads the latest production deploy ID via `vercel inspect`
- Fetches every URL in a known-good list with a cache-busting timestamp param
- Greps for the strings that should and shouldn't appear
- Outputs a table of `URL | status | matched-expected | matched-stale`
- Exits non-zero if any "stale" pattern matches OR any "expected" pattern is missing

Then either:

- The post-deploy session ends with `bash tests/smoke-prod.sh > docs/smoke/$(date +%Y%m%d-%H%M).txt`
- Or the orchestrator runs the same script as part of its audit. Either way, the smoke output is reproducible and any disagreement is empirical.

---

## Final state

- **HEAD:** `0dd1d02` (this report's commit will follow on top — code unchanged from session start).
- **Production:** deployment `dpl_Ddwxy8cLAiYZdqrK3nkBS1CuaJ7p`, Ready, alias `www.puffprice.com`.
- **All 6 reported gaps:** unreproducible on production at session start. Evidence above.
- **Cron auth:** new helper deployed and verified active via the structured-log signature. End-to-end success path waits on the next Vercel-fired invocation (tomorrow 09:00 UTC).
- **Code commits this session:** zero. Doing nothing is the right answer when the bug doesn't exist.
- **Doc commits this session:** one (this report).
