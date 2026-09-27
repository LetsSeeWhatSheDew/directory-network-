# 2026-09-27 — Code: motion system, in-place deal cards, off-system sweep

Branch `claude/relaxed-faraday-xu17bp`. Spec: "PuffPrice Motion Study" (approved in Claude Design). Reference: `docs/brand/2026-09-27-motion-system.md`.

## Shipped (in one PR, not merged)
- **Motion system.** There is one pace dial: `PP_PACE` in `lib/motion.ts`, which sets `--pp-pace` on `<html>`, and `?pace=` overrides it. Every CSS duration on the site is paced. The build-note timings are implemented as specified: inhale, release, three-blob plume, the 2× puff ring, card settle, card open, loading puff, 48s/61s haze drift, and night fireflies.
- **Tap a deal and it stays on the deal.** `ExhaleCard` is used on home, city pages, `/deals/*` and store pages. The card opens in place and the page never scrolls.
- **Round two:**
  - The exhale is sized by the saving.
  - Background motion settles after 30s and pauses in a hidden tab.
  - Watch-alert email arrivals play the exhale (via the existing `utm_source=alert`; no email code changed).
  - The empty state is a held-breath orb.
  - The haze thins on scroll (CSS scroll-driven).
- **Off-system sweep:**
  - /deals/all: the "serif" was a sentence set in IBM Plex Mono, which has slab serifs. It's now Instrument Sans.
  - /alerts hero.
  - The dark Pro-flow card.
  - Every other route restyled onto Breathe tokens, Missouri and admin included.
- **Social:** `marketing/social/` has 4 seamless 4.6s MP4s (day/night × 4:5/9:16) and posters.
- **Checks:**
  - `tsc` is clean, including the two scripts that collided in global scope.
  - `eslint` has 0 errors (was 95).
  - `next build` passes.
  - `tests/motion/verify.mjs` passes on the production build.

## Local testing note
This sandbox can't reach Supabase. `tests/motion/mock-supabase.mjs` serves fixture rows (clearly "Sample" stores and deals) for local builds and screenshots. The screenshots in `docs/screenshots/motion/` use that fixture data, not live prices.

## Follow-up round (same PR)
- Safari fallback for the scroll-thinning haze.
- `/get-listed` now has one h1.
- Removed the dead `app/admin/page.jsx`; the built output shows `page.tsx` is the one served.
- Canonical tags on /about, /about/index, /alerts, /get-listed, /map and /savings.
- noindex on /alerts/confirmed, /upgrade/success, /savings/dashboard and /dispensary/submit-deal (via layouts, since the latter two are client pages).
- The out-the-door estimate shows in opened deal cards.
- Missouri pages and the /upgrade headline left as they are, per the owner.

## Follow-ups
- Verify on a Vercel preview against live data (Chrome lane): the tap on a real device, and scroll-driven haze in Safari (it's a no-op there today).
- The CityPage links on the Missouri pages point to `/cannabis/illinois/*` (they stay live and noindexed, per the owner's standing rule).
