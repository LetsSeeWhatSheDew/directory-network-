# Lighthouse afternoon — 2026-04-21

Follow-up to `lighthouse-20260421.md` (early-AM) focused on the homepage perf 65.
Root cause for "Avoid multiple page redirects (≈965ms)" isolated below.

## Redirect matrix (curl -sI)

| Request URL | Status | Location |
|---|---:|---|
| `https://puffprice.com/` | **307** | `https://www.puffprice.com/` |
| `https://puffprice.com/deals/flower` | **307** | `https://www.puffprice.com/deals/flower` |
| `https://www.puffprice.com/` | 200 | — |
| `https://www.puffprice.com/deals/flower` | 200 | — |
| `https://www.puffprice.com/deals/flower/` | **308** | `/deals/flower` |

## Findings

1. **Apex → www is 307 (Temporary).** Browsers do NOT cache 307 responses, so every
   repeat visit from the apex pays the ~300–400ms round-trip again. Lighthouse
   crawls `https://puffprice.com/` by default (that's the public URL people
   share) and counts the 307 hop in its "Avoid multiple page redirects" metric.

2. **Trailing-slash at www is 308 (Permanent).** Good — 308 is cacheable.
   Not a meaningful perf issue.

3. **Worst case = 2-hop chain.** `https://puffprice.com/deals/flower/` goes:
   - 307 → `https://www.puffprice.com/deals/flower/`
   - 308 → `/deals/flower`
   - 200 OK

   Any inbound link sharing an apex+slash URL triggers both hops. This is
   what Lighthouse's ~965ms figure reflects on the homepage (the most
   commonly-shared URL is the bare apex).

4. **Not a code problem — a Vercel dashboard config.** Vercel's edge layer
   handles the apex→www redirect before Next.js sees the request. `next.config.ts`
   redirects run AFTER, so we can't override the status code from code.

## Fix (Matthew action required — Vercel dashboard)

**Vercel Project → Settings → Domains → `puffprice.com`** (the apex entry):

Change the "Redirect to" behavior from the default **307 Temporary** to
**301 Permanent** (or 308). Browsers then cache the redirect, so only the
first cold visit pays the round trip; every repeat visit hits www directly.

Expected win:
- Lighthouse homepage perf: 65 → mid-80s (the 965ms redirect penalty disappears
  on the repeat-visit pass Lighthouse runs).
- Real-user TTFB: ~350ms faster on return visits from apex-shared links.

## Code-side audit (done this session, no changes needed)

- `lib/brand.ts` → `brand.url = "https://www.puffprice.com"` ✓ (canonical internal links use www)
- `app/layout.tsx` → `metadataBase: new URL(brand.url)` ✓
- `app/sitemap.ts` → all URLs use `brand.url` (www) ✓
- `app/robots.ts` → not read this session, but spot-check in browser: `https://www.puffprice.com/robots.txt` returns sitemap pointing at www ✓
- `middleware.ts` → no additional redirects (admin-auth gate + intent rewrite only) ✓
- `next.config.ts` → no `redirects()` function; no www redirect in config ✓

There is nothing in the code to change. The bottleneck is purely at the
Vercel edge. Flipping the dashboard redirect to 301 takes <30 seconds and
costs nothing.

## Re-measure checklist (post-flip)

```bash
# 1. Confirm the apex now returns 301 instead of 307
curl -sI https://puffprice.com/ | head -3
# expect: HTTP/2 301, location: https://www.puffprice.com/

# 2. Lighthouse homepage
npx lighthouse https://www.puffprice.com/ --output=html --output-path=/tmp/lh-www.html
# expect: Perf ≥ 85

# 3. Lighthouse apex (what Lighthouse previously measured)
npx lighthouse https://puffprice.com/ --output=html --output-path=/tmp/lh-apex.html
# expect: Perf jumps 20+ points on repeat-run (once 301 is cached by the headless browser)
```

## Secondary P1 — still open

- **Unused JavaScript (~520ms on `/`).** HomeDealCards client bundle ships
  logic for near/all mode + all 9 badge variants, much of which never
  renders on first paint. Separate follow-up after redirect fix lands.

## What was NOT changed in code this session

- No middleware.ts changes (already clean).
- No next.config.ts changes (adding a redirects() would not override the
  Vercel edge behavior).
- No brand.ts changes (already correct).

This note exists to make the handoff explicit: Matthew flips the dashboard
toggle, re-runs Lighthouse, and the homepage perf should recover without
any code deploy.
