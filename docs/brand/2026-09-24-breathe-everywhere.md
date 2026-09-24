# Breathe everywhere — system additions (Sep 23–24, 2026)

Builds on `2026-09-23-breathe-final-spec.md`. Everything below is live in code; this is the reference for anyone adding a page.

## New tokens (app/globals.css, "BREATHE — everywhere")
| Token | Day | Night | Use |
|---|---|---|---|
| `--pp-haze` | 135° #FBE9DC → #F9EFE4 → #E9EFE1 | mint glow + firefly glow on #12211A | Calm panels that replace the old solid green CTA slabs |
| `--pp-haze-border` | #ECDFD0 | mint 14% | Border for haze panels |
| `--pp-note-bg / -fg / -edge` | #FBEEDF / #7A4520 / #D4845A | peach 8% / #F3C3A0 / #D4845A | "Heads up" states (expiring, not active today, Top 5%) |
| `--pp-stop-bg / -fg / -edge` | #F8E4DC / #8A2E1B / #C24A1E | coral 10% / #F5B097 / #F08A64 | "Closed", errors, expires today |
| `--pp-signal-fill` (night) | — | #1D3B2C + inset mint 35% | Night buttons: mint glass, not a bright green block |

Rule: no new hex colors in pages. Use a token; if none fits, add one here.

## Components
- **HazeBand** (`app/components/HazeBand.tsx`): the designed stand-in for photography. Morning haze by day, dusk + fireflies at night. Use it anywhere a photo used to go. No photos, no photo credits.
- **ExhaleLayer** (`app/components/ExhaleLayer.tsx`, mounted in the root layout): every `.pp-save` pill releases one ring when it scrolls into view; tapping a deal card (a link/button containing a Save pill, or anything with `data-exhale`) washes the screen in warm light that carries across the page change. Nothing to wire up per page: render a `.pp-save` pill and you get it.
- **OtdLine** (`app/components/OtdLine.tsx`): "About $151.80 out the door · $75.90 each" under any deal that states a real price. Renders nothing otherwise.
- **Footer**: paper band with a haze edge (deep green at night), breathing dot on "Independent. Nobody pays us to rank. 21+." No tagline puns.
- Section titles (`h2`) are Instrument Serif site-wide; card titles stay sans.

## Data rules (lib/exhale.ts, lib/otd.ts)
- Longest exhale never leads with a conditional deal (first-time, veteran, senior…) or a buy-several deal ("4+", "buy 2", "2 for", "mix & match"). Buy-several deals sit below everyday savings in lists.
- Out-the-door: only from the deal's own stated price; excise tier from the product type in the title/category (flower & pre-rolls 10%, edibles 20%, vapes & concentrates 25%); then IL DOR stacking via `lib/taxRates.ts`. Unknown type or percent-only deal → no number.

## Share images (app/og, fonts in app/og/fonts)
- `/og/today?size=post|story|og&theme=day|night` — today's longest exhale + next best deals.
- `/og/city/[city]` — each city page's link preview.
- `/og/drive-thru?kind=pfp|post&theme=day|night` — picture-day campaign (civic; update `OPEN_NEAR_PEORIA` if a drive-thru opens).
- `/share` — noindex kit with all of them.
- Satori gotchas: `radial-gradient(circle, …)` only (no `closest-side`); any `div` with more than one child needs `display:flex`; no `background-image: none`.

## Motion
Unchanged: the breath is the signature, numbers never move, reduce-motion turns all of it off (ExhaleLayer rings and wash included).
