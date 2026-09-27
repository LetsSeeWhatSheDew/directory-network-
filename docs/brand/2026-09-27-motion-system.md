# Motion system (Sep 27, 2026)

Source: Claude Design, "PuffPrice Motion Study" (approved). Built on top of the live Breathe look (`2026-09-23-breathe-final-spec.md`, `2026-09-24-breathe-everywhere.md`). This extends Breathe; it isn't a second system.

## The one dial: pace
- **TS:** `PP_PACE` in `lib/motion.ts` (default `1`). The root layout writes it to `<html style="--pp-pace: …">`.
- **CSS:** `--pp-pace` (default `1`, MOTION block at the end of `app/globals.css`). Every duration on the site is `calc(<ms> * var(--pp-pace))`. That covers the orb, plume, ring, cards, loading puff, haze drift, fireflies, hover feedback and the live dots.
- **JS timers** read the same property through `pace()` / `dur()` in `lib/motion.ts`.
- **Review override:** add `?pace=1.5` (anything from 0.25 to 4) to any URL to slow everything down or speed it up.

## Build notes at pace 1
| Movement | Value | Where |
|---|---|---|
| Inhale on load | orb scale .86 → 1.05, 2000ms, `cubic-bezier(.4,0,.2,1)`, then three 8s resting breaths, then still | `BreatheHero.tsx` |
| Release (exhale) | 1.05 → .86, 2600ms, `cubic-bezier(.16,.84,.3,1)` | `BreatheHero.tsx` |
| Plume | 3 radial-gradient blobs (170/210/250px), rise 270/300/350px, scale .5 → 1.9–2.5 wide / 1.5–1.7 tall, staggered 0/150/320ms, long soft tail; melts into the haze band | `.pp-plume-b`, `ExhaleLayer.tsx` |
| Puff ring (tap) | 120px ring, scale .35 → 2.4 (~2× the old ring), fading over 1200ms | `.pp-puff-ring` |
| Cards settling | surface + words rise 6px and fade, 700ms each, 120ms stagger, no overshoot | `.pp-dc` |
| Card opening in place | 1400ms: the cards below ease down from under the opened card (FLIP) | `ExhaleCard.tsx` |
| Loading puff | 96px, slow rise and fade, 5.6s loop (3.6s puff + ~2s rest) | `LoadingPuff.tsx`, `.pp-lp` |
| Haze drift | layer A (48s period) drifts right, layer B (61s) drifts left, ease-in-out | `.hz-w1/.hz-w3`, `.hz-w2/.dk-mist` |
| Night | fireflies drift slowly (23–31s) and pulse out of sync (3.7–6.1s). The plume is faint and cool (screen blend). The savings figure is firefly yellow. | globals.css |

## Hard rules
- **Numbers never animate.** Prices, savings figures and counts are on screen at frame 0 and never fade, scale, blur or move. The Save pill, prices and the out-the-door line sit outside `.pp-dc-words`, so the settle-in doesn't touch them. The FX layer blends (multiply by day, screen at night), so a plume passing over a dark pill tints it but never lightens the number. When a card opens, the cards below are carried down as whole cards, as the spec asks; nothing inside them fades or scales. `tests/motion/verify.mjs` checks this in a real browser.
- **Only transform and opacity animate.** Hover colour fades were removed site-wide. No animated blur filters: the orb blobs and haze wisps are radial gradients now.
- **No scroll-jacking, parallax, 3D or video on the site.** The haze thins as you scroll using a CSS scroll-driven animation (`animation-timeline: scroll()`). Where that isn't supported (Safari today), `ExhaleLayer` falls back to one passive scroll listener with a single `requestAnimationFrame` write per frame, following the same curve (opacity 1 → .5 over 90vh). Both follow the scroll and never drive it.
- **`prefers-reduced-motion`** means a fully still page: a global kill switch for animations and transitions. JS skips the FLIP and the plume.
- **No sound anywhere, ever.** The social MP4s have no audio track.

## Behaviours
- **Tap a deal and it stays on the deal** (home, city pages, `/deals/*`, store pages; all use `ExhaleCard`). The page never scrolls: scroll anchoring is switched off during the move, and `scrollY` is checked before and after in Playwright. The opened card sits above the cards easing down, so Get directions is tappable the instant the card opens. Tap analytics are unchanged: `deal_tap` fires on open and `directions_tap` via `data-track`.
- **Out-the-door estimate:** when a card opens and the deal states a real shelf price, the card shows "Estimated out the door: $X" with tax included. It uses the same `otdFor()` logic as `/out-the-door`. Percent-off and dollar-off deals don't state a price, so they get no number. It's static like every other figure.
- **The exhale scales with the deal:** `exhaleSize()` uses dollars saved when we know them (from exact prices, `savings_amount` or a dollar-off deal), otherwise the percent. It's clamped: $5 / 10% or less is the smallest puff (about 60% of the duration, 45% of the rise), and $40 / 45% or more is the full 2.6s exhale.
- **Background motion stops.** Haze drift and fireflies pause after 30s of visible time (`html.pp-still`, reset per page) and whenever the tab is hidden (`html.pp-away`). CSS iteration counts also end them on their own if JS never runs. The orb takes three resting breaths and then holds.
- **Alert arrival:** the deal-watch email already links to `/deal/<id>?utm_source=alert…`. `ArrivalExhale` plays the exhale from the savings figure on arrival. Cards also honour `?exhale=<deal id>`: that card opens and exhales.
- **Empty state:** `EmptyBreath` shows the orb held perfectly still, the line "Nothing worth exhaling about yet.", and one or two next steps. The homepage orb does the same when there are no deals.

## Social loop
`/share/loop` (noindex) shows the orb and wordmark only. `tests/motion/record-loop.mjs` steps every animation frame-exactly through one 4.6s cycle (the 2.6s release, then the 2s inhale back) and encodes `marketing/social/*.mp4` at 1080×1350 and 1080×1920, day and night, with a poster PNG for each.
