# Lighthouse perf pass (2026-04-22)

## Apex redirect — 307 → 308

**Current prod (verified via curl):**
```
HTTP/2 307
location: https://www.puffprice.com/
server: Vercel
```

Lighthouse dings any 307 on a root redirect — it's a temporary redirect
code, which tells crawlers the permanent URL is still the apex. For a
root-to-www permanent redirect, 308 is correct.

### The fix (Matthew, 2 min)

1. Vercel dashboard → Project (project-green) → **Settings → Domains**.
2. Click `puffprice.com`.
3. Under "Redirect to…" change to `www.puffprice.com` with status **308
   (Permanent)**. Save.
4. Verify: `curl -sI https://puffprice.com/ | head -1` should print
   `HTTP/2 308`.

### Why not fix in code?

Vercel's apex redirect runs at the edge **before** Next.js — neither
`next.config.ts:redirects` nor route handlers can intercept it. A
`vercel.json:redirects` entry using `has: [{ type: "host", value:
"puffprice.com" }]` can override, but the dashboard-native redirect is
the supported path and avoids double-handling. Prefer the dashboard.

---

## Image dimensions — CLS + LCP

Lighthouse flags `<img>` without explicit `width` / `height` attributes
because the browser can't reserve layout space before the image loads,
causing Cumulative Layout Shift (CLS).

### Shipped this session

Added `width`, `height`, `loading="lazy"`, `decoding="async"` to the 4
dispensary-logo `<img>` sites:

- `app/l/[id]/page.tsx:746` — hero logo (80×80)
- `app/l/[id]/page.tsx:948` — related dispensaries (48×48)
- `app/cannabis/illinois/open-now/page.tsx:235` — open-now card (48×48)
- `app/cannabis/illinois/[slug]/page.tsx:289` — city-page card (48×48)

The existing CSS `width: 100%; height: 100%` still takes over at render
time — the attribute pair just gives the browser an aspect ratio to
reserve space with, fixing CLS without changing visual size.

`Logo.tsx` + `directory-page.tsx` already used `next/image` with
explicit `width`/`height` — no change needed.

---

## Not touched (future Lighthouse wins)

- **Unused JS**: did not audit. `npm run build` output shows bundle
  size per route — worth a review once Sentry + AI Gateway stabilize.
- **Font loading**: haven't audited `font-display` on any
  `@font-face`-loaded fonts (system-ui + Georgia throughout → no web
  fonts → likely not an issue).
- **Preload critical images**: hero logo on `/l/[id]` could benefit
  from a `<link rel="preload" as="image">` but only if the image is
  LCP — need a real Lighthouse run on the live page to confirm.

---

## How to run Lighthouse locally

```bash
npx lighthouse https://www.puffprice.com \
  --only-categories=performance \
  --output=json \
  --output=html \
  --output-path=./lighthouse-report \
  --view

# Or against a specific page:
npx lighthouse "https://www.puffprice.com/l/nuera-east-peoria" \
  --only-categories=performance,seo,accessibility \
  --output=html \
  --output-path=./lh-nuera.html \
  --view
```

After the apex fix lands, re-run and compare LCP / CLS / TBT.
