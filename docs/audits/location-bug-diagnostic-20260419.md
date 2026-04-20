# Location Persistence Bug Diagnostic — 2026-04-19

**TL;DR:** Location is detected client-side (GPS or IP), stored in `sessionStorage`, and propagated through internal navigation via `?city=` query params. The pattern works for components that wire `?city=` into their hrefs, but breaks for any internal link that doesn't (the desktop category buttons in the hero, the mobile category cards, and the top-nav links). Server components like `/deals/[category]` cannot read sessionStorage, so they fall back to statewide ranking and the Peoria user sees an Elgin deal.

**Recommendation: Option A — cookie-based.** It's the smallest fix that actually solves the problem, fits Next 16 App Router idioms, and doesn't require a context provider refactor or rewriting every internal link.

---

## How location flows today

### Detection — `app/components/LocationAware.tsx`

Client component. Mounted at `app/page.jsx:900`. Detection order:

1. Read `sessionStorage.cl_city` — return cached if present
2. Try `navigator.geolocation.getCurrentPosition` (8s timeout)
3. Reverse-geocode lat/lng via Nominatim (OpenStreetMap)
4. If GPS denied or no city resolved → fall back to `/api/location` (IP geolocation via ipapi.co)
5. Save to `sessionStorage` (`cl_city`, `cl_city_src`, `cl_lat`, `cl_lng`)
6. Dispatch a `cl:location-resolved` window event so other client components can react

Stored keys (`sessionStorage`):
- `cl_city` — string
- `cl_city_src` — `"gps" | "manual" | "ip"`
- `cl_lat` / `cl_lng` — strings
- `cl_gps_declined` — `"1"` if user blocked the prompt this session

### Reads on the homepage — server pre-render → client refetch

`app/page.jsx` (server component) fetches `getTopDeals()` etc. with **no location awareness** — top-by-discount-statewide. The result is passed to client components as `initial` props.

`app/components/HeroDealCard.tsx` (client) deliberately ignores its `initial` seed:

```ts
// We deliberately DO NOT seed state with `initial`. `initial` is the
// server-rendered statewide top deal, which is almost always a Chicago
// dispensary — showing that to a Peoria user while GPS is resolving is
// the "wrong-city flash" we're fixing here.
```

It then waits for the `cl:location-resolved` event, calls `/api/deals/recommend?city=…`, and re-renders. Same pattern in `HomeDealCards`. **This works on the homepage.** The hero card eventually shows a Peoria-relevant deal.

### Reads on category pages — server-only, no fallback

`app/deals/[category]/page.tsx` is a server component (`export const dynamic = "force-dynamic"`). It reads `searchParams.city`:

```ts
const rawCity = Array.isArray(sp?.city) ? sp.city[0] : sp?.city;
const city = rawCity ? toCityCase(rawCity) : null;
const { deals, source } = await getDeals(category, city);
```

If `?city=` isn't in the URL, `city` is `null` and `getDeals()` returns the statewide top-by-discount slice. **There is no client-side rehydration on the category page.** The "Our Recommendation" hero on `/deals/flower` is server-rendered once, server-side, with whatever city was in the URL.

### Internal links that DO carry `?city=`

(grep evidence)

- `HeroDealCard.tsx:175` — GO HERE link forwards city
- `HomeDealCards.tsx:263` — same
- `EndingSoonRow.tsx:81` — same
- `deals/[category]/page.tsx:579, 683, 741` — links between categories and to detail pages
- `dispensary/[slug]/page.tsx:462` — same
- `deal/[id]/page.tsx:332` — same
- `l/[id]/page.tsx:397` — back link
- `city/[city]/page.tsx:297` — same

### Internal links that DO NOT carry `?city=` — the leaks

These are the doors out of the location-aware bubble. Each one drops the user back to "no city detected":

1. `app/page.jsx:917–926` — desktop hero right-column category buttons (`<TrackedLink href={'/deals/${cat.slug}'}>`). No city.
2. `app/page.jsx:939–949` — mobile below-fold category grid. No city.
3. `app/page.jsx:880` — top-nav "Open now" link to `/cannabis/illinois/open-now`. No city.
4. `app/page.jsx:881` — "My savings" nav link.
5. `app/page.jsx:883` — "Browse Illinois" nav link.
6. `app/page.jsx:1052–1062` — city-shortcut footer links (`/city/chicago` etc.) — these *intentionally* don't carry the user's city because they're picking a different city, but if a user's city is detected and they click "Peoria" they'd want their saved-city behavior reset, which is fine.
7. `MobileNavMenu` — likely same as desktop nav (not read but follows same pattern).

The fix has to make these work without rewriting all of them.

---

## Why a cookie

| Option | Pros | Cons |
|---|---|---|
| **A. Cookie** | Server can read with `cookies()` from `next/headers` in any RSC. Survives refresh, tab close, and route navigation. No link-level changes needed. Minimal diff. | Sent with every request (small overhead, ~30 bytes). Need to write from a Route Handler since client `document.cookie` is fine but explicit is cleaner. |
| **B. Context provider** | React-idiomatic. Easy for client components. | Doesn't solve the server-component reading problem. RSCs still can't read it. Requires wrapping `app/layout.tsx` in `"use client"` shell or doing server-then-hydrate. |
| **C. URL param threading** | Already partially in place. Most internal links already do this. | Misses every link that doesn't. Ugly URLs. Doesn't survive a fresh tab to `/deals/flower`. We've already shipped this for 2+ months and it's still leaky. |

**Recommendation: A (cookie).** Specifically:
- Cookie name: `pp_loc` (concise, matches the `pp_*` namespace already used in `app/api/leads/route.ts:133` etc.)
- Value: `JSON.stringify({ city, slug, lat, lng, source })`, URL-encoded
- Path: `/`, max-age 30 days, SameSite=Lax, not HttpOnly (client needs to write it)
- Written by `LocationAware.tsx` whenever `commit()` runs (alongside the existing `sessionStorage.setItem` calls — keep those for backward compat with existing event listeners)
- Read server-side via a new helper:

```ts
// lib/location.ts
import { cookies } from "next/headers";

export type ServerLocation = { city: string; slug: string|null; lat: number|null; lng: number|null; source: "gps"|"manual"|"ip" };

export async function getServerLocation(): Promise<ServerLocation | null> {
  try {
    const c = (await cookies()).get("pp_loc")?.value;
    if (!c) return null;
    const parsed = JSON.parse(decodeURIComponent(c));
    if (typeof parsed?.city !== "string" || !parsed.city) return null;
    return parsed as ServerLocation;
  } catch { return null; }
}
```

Then in `app/deals/[category]/page.tsx`:

```ts
const cookieLoc = await getServerLocation();
const cityFromUrl = rawCity ? toCityCase(rawCity) : null;
const city = cityFromUrl || cookieLoc?.city || null;
```

Same change in `app/page.jsx` (use cookie city to seed `getTopDeals` etc. with location), `app/cannabis/illinois/page.tsx`, `app/cannabis/illinois/open-now/page.tsx`, `app/cannabis/illinois/[slug]/page.tsx`, anywhere else server-side that ranks or filters.

### Bonus: distance-aware ranking

`lib/cityNormalize.ts:91` already has `isInMetro()` for metro-level filtering (Peoria includes East Peoria, Bartonville). That works city-name only, but lat/lng are already detected and now (post-cookie) available server-side. Consider adding a simple haversine-penalty in `getDeals()`:

```ts
function rankByDistance(deals: Deal[], userLat: number, userLng: number) {
  return deals.sort((a, b) => {
    const distA = haversine(userLat, userLng, a.lat, a.lng);
    const distB = haversine(userLat, userLng, b.lat, b.lng);
    // $2 penalty per mile — drowns out a $5 Elgin discount for a Peoria user
    const scoreA = (a.discount_value ?? 0) - distA * 2;
    const scoreB = (b.discount_value ?? 0) - distB * 2;
    return scoreB - scoreA;
  });
}
```

Defer if Code is short on time — the metro filter alone fixes 80% of the problem.

---

## What "fixed" looks like, end-to-end

1. User arrives at homepage in Peoria
2. GPS resolves → `LocationAware` writes both `sessionStorage` (existing) AND `pp_loc` cookie (new)
3. User clicks the "Flower" category card — link is still `/deals/flower` (no rewrite needed)
4. Server component reads `pp_loc` cookie, sees `city: "Peoria"`, queries `getDeals("flower", "Peoria")` which already supports city filter
5. Page renders with Peoria-area deals as the "Our Recommendation"
6. User clicks "GO HERE" — already works (city is in URL)

No change to the in-flight refactor of internal links. No context provider. ~50 lines in `lib/location.ts` + cookie-write in `LocationAware.tsx` + `await getServerLocation()` calls in 5–6 server components.

---

## Files Code needs to touch

1. `lib/location.ts` — new file with `getServerLocation()` helper.
2. `app/components/LocationAware.tsx` — extend `save()` (line 27) to also write `pp_loc` cookie via `document.cookie = …` (cheap and direct, no API roundtrip).
3. `app/page.jsx` — read `getServerLocation()` and pass through to `getTopDeals(city)` etc.
4. `app/deals/[category]/page.tsx` — `const city = cityFromUrl || cookieLoc?.city || null;` (~3 lines).
5. `app/cannabis/illinois/open-now/page.tsx` — same pattern, prefer Peoria/Springfield/Rockford grouping for that user.
6. (Optional) `app/cannabis/illinois/page.tsx` — same.

Cookie is read-only on the server, write-only from the client. Don't try to set it from a Route Handler unless we want to add Set-Cookie headers everywhere.
