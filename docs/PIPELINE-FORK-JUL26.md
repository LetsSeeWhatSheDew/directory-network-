# Menu Pipeline — First-Light Fork (July 9, 2026)

**Status:** BLOCKED at the fetch layer. Matthew decides the fork.
**Decision owner:** Matthew. This doc lays out the options; it does not pick one.

> **Probe #2 (July 9, later same day) — non-Jane adapters tested. See the
> [coverage map](#update--july-9-probe-2-non-jane-adapters) at the bottom.
> Headline: the Cloudflare wall covers 8/10 stores (Jane + Dutchie). The
> other 2/10 (Sweed, Joint) are NOT walled but their request contracts have
> drifted since the 2026-06-04 Chrome recon, so 0/10 are script-scrapable
> today. A real-browser capture step is needed either way.**

---

## What we tested

The whole roadmap forked on one question: **does the Jane/Algolia scrape work
from a plain script on this Mac, or does Cloudflare force a real-browser
route?** We ran exactly that test today — one live snapshot, nuEra East Peoria
only (`platform_store_id=1517`, Jane app `VFM4X0N23A`, index
`menu-products-production`), script path, no browser.

**Answer: Cloudflare forces a real-browser route. The script path is dead.**

### Raw evidence

Two requests to the live Jane Algolia batch endpoint
`POST https://search.iheartjane.com/1/indexes/*/queries`:

| Attempt | Headers | Result |
|---|---|---|
| 1. Adapter defaults | Algolia app-id + public key, `Content-Type: application/json` | **HTTP 403**, `server: cloudflare`, `cf-ray: a187ec84…-ORD`, `content-type: text/html`, body: *"Sorry, you have been blocked"* |
| 2. Realistic browser | + real Chrome UA, `sec-ch-ua*`, `Origin`/`Referer: nueracannabis.com/shop/store/1517/featured`, `sec-fetch-*`, `Accept-Language` | **HTTP 403**, identical Cloudflare block page (`cf-ray: a187ed88…-ORD`) |

Challenge type: Cloudflare **security block page** (error-1020 family) —
`cf-error-details` present, "Please enable cookies", **no** `cf-mitigated`
header, **no** `Retry-After`. This is a firewall/bot-management block, not a
passive interstitial that a header tweak clears.

### Why this rules out the cheap fixes

- **Not a stale Algolia key.** A rotated public key returns an Algolia JSON
  error (`{"message":"Invalid Application-ID or API key","status":403}`). We
  got a Cloudflare HTML block page instead. Pulling a fresh key will not help —
  the request never reaches Algolia.
- **Not IP reputation.** This ran from Matthew's Mac on a **residential IP**,
  not a datacenter. Still blocked. So Cloudflare is gating on **browser TLS
  fingerprint + `cf_clearance` cookie**, not on where the request comes from.
- **Not missing headers.** A complete, realistic Chrome header set was rejected
  identically. Plain HTTPS clients (`fetch`, `curl`, `undici`, Node) present a
  non-browser TLS/JA3 fingerprint and carry no `cf_clearance` cookie; that is
  what's being blocked.

**Conclusion:** any path that works must present a *real browser's* TLS
fingerprint and a valid `cf_clearance` cookie earned by passing the challenge.
That is a real browser, either driven live or running the fetch from inside a
page context that already holds the clearance cookie.

---

## Scope of the blast radius (important, and only partly known)

The block is at the **Algolia DSN** (`search.iheartjane.com`), which fronts
**every Jane store we cover** — so all 5 Jane storefronts are blocked by the
same wall via the script path:

- nuEra East Peoria (1517), nuEra Pekin (3050)
- Beyond Hello Peoria (6926), Beyond Hello Bloomington (slug-resolved)
- RISE Canton (1343)

**Untested — do not assume:** the other 5 of our 10 seed stores use the
**Dutchie / Sweed / Joint** adapters against *different* endpoints. We ran one
store only (as instructed). Those platforms may or may not be Cloudflare-gated
the same way. **Before committing to any fork, run the same one-request probe
against one Dutchie, one Sweed, and one Joint store** — the answer could be
"3 of 4 platforms are fine and only Jane needs a browser," which materially
changes the economics below.

---

## The forks (Matthew decides)

Effort estimates are engineering-days for a working, scheduled, monitored
version — not a throwaway spike.

### Option A — Scheduled real-browser fetch via the Chrome lane
Drive a real Chrome (the project's existing Chrome-lane / claude-in-chrome
capability) to load each store's menu page, let Cloudflare issue `cf_clearance`,
then capture the Algolia XHR response (or re-issue the fetch from the page
context, which reuses the clearance cookie).

- **Effort:** ~2–3 days. Adapters, normalize, baseline, persist, schema — all
  already built and tested. Only the *transport* swaps from `fetch` to
  "browser captures the JSON." Wire the captured payload into the existing
  `extractResult()` shape and the rest of the pipeline is untouched.
- **Pros:** reuses 100% of the built pipeline; highest-fidelity (real browser =
  hardest to block); Chrome lane already exists in this project.
- **Cons:** the Chrome lane is designed for interactive verification, not
  unattended cron. Needs a headless/persistent Chrome that survives without a
  human. Fragile if the lane isn't meant to run detached. 10 stores/day is
  slow and serial through a single browser.

### Option B — Playwright-on-Mac as a local cron
A standalone Playwright (or Playwright-with-stealth) script on this Mac,
launched by `launchd`/cron, opens each menu page, harvests the Algolia
response, hands it to the existing adapters.

- **Effort:** ~3–5 days. Add Playwright + a browser-context runFetch variant,
  plus launchd plumbing and a "did it actually run + did Cloudflare change"
  health check. Stealth tuning (fingerprint, timing) is the wildcard that can
  add days.
- **Pros:** purpose-built for unattended runs; full control over timing and
  politeness; the pipeline downstream is unchanged; no Vercel-cron dependency.
- **Cons:** **this Mac must be on and awake at cron time** — a real operational
  liability for a daily data product. Playwright/Chromium is a heavy local dep.
  Cloudflare's bot management is an arms race; stealth breaks silently and you
  find out from empty snapshots, not errors. (Our `persist.ts` already refuses
  to overwrite a good day with an empty one, which softens this.)

### Option C — Alternate data path
Stop fighting the Algolia wall; get the same data a different way.

- **C1 — Per-brand direct sites.** Some dispensary chains expose their own menu
  JSON (nuEra's `nueracannabis.com`, RISE's `risecannabis.com`) that may be
  less aggressively fronted than the shared Jane DSN. **Effort:** ~1 day to
  probe, unknown to productionize (varies per brand). Could partially unblock
  Jane stores without a browser at all.
- **C2 — Official/licensed data.** A paid menu-data feed or a partnership. Kills
  the scraping problem entirely but has cost + procurement + it's off-mission
  ("direct dispensary sites only" per `docs/deal-data-policy.md` — a feed may or
  may not qualify). **Effort:** days-to-weeks, mostly non-engineering.
- **C3 — Reduce dependence on Jane.** If the Dutchie/Sweed/Joint probes (see
  scope section) come back clean, ship the baseline on those 5 stores now and
  treat the 5 Jane stores as a separate, browser-gated track. **Effort:** ~1 day
  to prove, then the pipeline ships for half the market immediately.

---

## Recommendation (input, not a decision)

1. **First, spend ~1 hour** running the one-request probe against one Dutchie,
   one Sweed, and one Joint store. This is cheap and it resizes the whole
   problem. If only Jane is walled, **Option C3** ships value this week and the
   Jane question becomes a smaller, isolated follow-up.
2. **For the Jane stores specifically**, Option A (Chrome lane) is the lowest
   *new* effort because the pipeline is done and the lane exists — *if* it can
   run unattended. If it can't, Option B is the honest fallback, with the
   "Mac must be awake" liability stated plainly up front.
3. **Do not** invest in TLS-fingerprint spoofing / challenge-solving libraries.
   That's an arms race we lose, and it's the path this session was explicitly
   told not to take.

---

## What is NOT done (per instructions — stopped here on purpose)

- Did **not** run the other 9 stores.
- Did **not** touch cron / `vercel.json`.
- Did **not** write any rows (`menu_snapshots` / `menu_items` remain empty —
  0 rows, verified).
- Did **not** escalate to headless-browser scraping or challenge-solving.
- No synthetic/test rows were written. Real-data-only held.

## State for the next session

- Pipeline branch `feat/menu-baseline-pipeline` is **unmerged** to `main`
  (branches off PR #6, `675ea6d`). All adapter/normalize/baseline/persist code
  and the 5 store fixtures live there. Schema migration is **already applied** —
  all 8 pipeline tables exist in Supabase (`hnbjufmtmrhexmdrfubw`) and are empty.
- 10 dispensary seed rows exist and are active. nuEra East Peoria =
  `c09785a2-d797-42fe-87e0-3e65b6d206ff`.
- Entry point: `scripts/run-menu-snapshot.ts --slug=<slug>` (dry-run default;
  `--apply` writes). Reads need the **service key** — `dispensaries` is
  RLS-protected and the anon key returns `[]` (silent empty, not an error).
- Env gotcha: scripts expect `SUPABASE_SERVICE_ROLE_KEY`; `.env.local` has it
  under `SUPABASE_SERVICE_KEY`. Remap at run time.
- `JANE_ALGOLIA_KEY` is not in env; the adapter's hardcoded fallback
  (`edc5435c…`, verified 2026-06-05) is now irrelevant — Cloudflare blocks
  before the key is ever checked.

---

## UPDATE — July 9, Probe #2 (non-Jane adapters)

Yesterday only Jane was tested. Today we ran one dry-run snapshot per
remaining adapter — one Dutchie, one Sweed, one Joint — same discipline
(worktree, main untouched, real data only, single request per endpoint, no
challenge-solving, no escalation). **The wall is NOT universal — but nothing
is script-scrapable today.** Two distinct failure classes:

### Raw outcomes

| Adapter | Store probed | Endpoint | Raw outcome | Class |
|---|---|---|---|---|
| **Dutchie** | trinity-peoria-glen (`5f10…2001`) | `dutchie.com/api-4/graphql` | **403** · `server: cloudflare` · `cf-ray: a187f869…` · `text/html` | 🧱 **Cloudflare wall** |
| **Sweed** | ivy-hall-peoria-heights (`169`) | `web-ui-production.sweedpos.com/_api/proxy/Products/GetProductList` | **400** app-JSON: `{"errors":{"storeId":["field is required"]}}` | ⚠️ **Reachable, contract drifted** |
| **Joint** | cookies-peoria-heights (`5478`) | `peoriaheights.cookies.co` (WP) | page **200** (`server: nginx`); REST namespace 200; assumed `/joint-api/v1/products` route **404 `rest_no_route`** | ⚠️ **Reachable, contract drifted** |

### Coverage map — 10 seed stores

| Bucket | Stores | Count | % | What's needed |
|---|---|---:|---:|---|
| 🧱 Cloudflare-walled (hard; TLS-fingerprint + `cf_clearance`) | Jane ×5, Dutchie ×3 | **8** | **80%** | Real browser (Options A/B) |
| ⚠️ Reachable, no wall, contract drifted since 2026-06-04 | Sweed ×1, Joint ×1 | **2** | **20%** | Fresh Chrome network capture to re-derive request/route, then plain `fetch` works again |
| ✅ Script-working today | — | **0** | **0%** | — |

**Jane (5):** nuera-east-peoria, nuera-pekin, beyond-hello-peoria,
beyond-hello-bloomington, rise-canton.
**Dutchie (3):** trinity-peoria-university, trinity-peoria-glen,
noxx-east-peoria (only trinity-peoria-glen probed; all 3 share the
`dutchie.com/api-4/graphql` Cloudflare-fronted endpoint).

### What "contract drifted" means (and why it's NOT a wall)

Both Sweed and Joint answered at the application layer — no Cloudflare, no
bot page. Their **adapters were reconciled to a Chrome capture on 2026-06-04**
and the live contracts have moved in the ~5 weeks since:

- **Sweed:** the exact documented request
  (`{ StoreId: 169, SaleType, Page, PageSize }` + `__sw-device-id` cookie,
  per the adapter header and the fixture `_meta`) now returns
  `400 storeId required` — the field no longer binds. The API shape changed.
- **Joint:** two sub-findings. (1) The nonce **regex was stale** — cookies.co
  now exposes the REST nonce as JSON `"...joint-api/v1","nonce":"e19b245f40"`
  inside `window.jointEcommerce`, which none of the 4 patterns matched. A
  one-line anchored pattern fixes it (validated in the worktree today — see
  below). (2) But even with the nonce, the adapter's assumed
  `/joint-api/v1/products` route **does not exist** in the current plugin
  version (the namespace is admin/sync routes only: `businesses`,
  `sync-dutchie`, `settings`, …). The catalog is **not** SSR'd in the page
  HTML either (no prices / no products array / no `__NEXT_DATA__` / no
  `wc/store`). Product data now loads via a client-side call whose real
  endpoint needs a Chrome capture to locate.

**Implication for the fork:** a real-browser step is needed *either way* —
to pass Cloudflare for the 80%, **or** to re-capture the drifted contracts
for the 20%. This strengthens Options A/B (a browser in the loop pays off
across all four platforms) and it means "just ship the non-Jane 5 now"
(old Option C3) is **not** a free win — Sweed and Joint each need a
re-derivation pass first. It also shows these adapters will keep drifting;
whatever we build needs a breakage alarm (the snapshot ledger already
records empty/error runs, so the signal exists — it needs a monitor on top).

### Ready-to-apply fix produced today (not committed — Code lane owns lib/)

Joint nonce pattern, validated live against cookies.co. Add as the FIRST
entry of `NONCE_PATTERNS` in `lib/scraper/menu/adapters/joint.ts`:

```js
// Anchored to the joint-api baseUrl so we grab the REST nonce for THIS
// endpoint, never the sibling admin-ajax nonce. Slashes are JSON-escaped.
/joint-api[^"']*["']\s*,\s*["']nonce["']\s*:\s*["']([a-f0-9]{6,32})["']/i,
```

This is necessary-but-not-sufficient for Joint: it recovers the nonce, but
the product-route discovery still needs a Chrome capture (above). Left
uncommitted in the throwaway worktree; hand to the Code lane if Joint is
pursued.

### Discipline held
- One dry-run per adapter; at most one raw characterizing request per blocked
  endpoint; one WP-standard namespace-index read to enumerate Joint routes.
- **Zero rows written** — every run was dry; `menu_snapshots` / `menu_items` /
  `latest_menu_items` all still **0** (verified after). No `--apply` because
  no adapter returned real product data. No synthetic rows.
- No cron, no full-fleet run, no headless-browser escalation, no
  challenge-solving. `main` untouched; worktree removed.
