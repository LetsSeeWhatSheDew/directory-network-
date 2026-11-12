# 2026-11-11 — Gold Leaf: one look for the whole site, plus the bugs a phone audit found

Matthew (Nov 11 evening): assess the whole project, make a plan, then "fix what I need fixed, build what I need built … make it look good." He rejected Vault, Gallery and Instrument ("not generic, not cookie-cutter, not AI-looking, not a data dump … visual for a stoned audience, but not overwhelming"), then: "All edits are permitted, do not ask."

## The look: Gold Leaf

Built from the only design he had put to use: the three Nov 10 flyers (Gold Leaf, Big Leaf, Leaf Code). He said "that's fine" to the home screenshots before the rollout.

- **Palette:** deep forest, cream and gold. The drawn leaf (`lib/leaf.ts`, `public/gold-leaf.svg`) is the signature graphic.
- **Type:** Fraunces in a soft display cut (self-hosted, 12 KB). Instrument Sans for everything else. No monospace.
- **The best deal is a cream coupon:** notched, perforated, a big number, the category picture, and one "Take me there →" button. Under it: "Seen on {store}'s own site today at 6:15 AM. Nobody pays to rank."
- **Category pictures** for flower, vapes, edibles, "Dabs & wax" and all, hand-drawn in code (`app/components/gold/Art.tsx`).
- **One header and footer**, rendered once in `app/layout.tsx`. The old `Nav`/`Footer` now render nothing.
- **Shared kit** in `app/components/gold/Kit.tsx`: Band, HeroTicket, MiniTicket, DealLine, StoreDeals, StoreCard, Faq.
- **Rebuilt pages:** home, `/city/*`, `/dispensary/*`, `/deals/*` (every deal listed, grouped by store, the rest folded away), `/deal/*`, `/alerts`, `/about`, and the `/og/*` share images.
- **Everything else** follows through the `--pp-*` token remap (end of `app/globals.css`):
  - Breathe's night mode, haze and orb are retired.
  - Legacy haze bands became forest bands.
  - Monospace was replaced by the body face.
- **Voice:** "Best Bud For Your Buck$" replaces the exhale lines.
- **Design system artifact updated:** https://claude.ai/artifact/C2wPEV9q47JsdxUhWpe7uy (tokens, brand book, fonts, coupon, pill, buttons, leaf mark, cover; the Orb removed). The `puffprice-design` skill text is synced from claude.ai and still describes Breathe. UNVERIFIED whether it refreshes from the artifact on its own; if not, it needs a manual update.

## Fixes

- **Location:** a GPS user in Peoria was told "outside Central Illinois". In-region is now decided from our own coordinates (`lib/regionGeo.ts`, with tests).
- **`/deals/all`:** showed 4 of 337 deals. It now lists every deal.
- **Dates:** "Verified Nov 12" appeared on the evening of Nov 11. All user-facing dates now format in America/Chicago (11 call sites).
- **Copy:**
  - The home FAQ now matches the deal policy (72 hours pending, then auto-off at 7 days).
  - `/alerts` said "updated weekly"; it now says stores are checked every morning.
  - Store descriptions drop sentences that claim live deal counts. nuEra East Peoria said "five active deals" while listing one.
- **Home alerts card:**
  - The form dropped the typed email.
  - It promised "every morning", but the free tier is a Monday email.
  - It now subscribes through `/api/alerts/signup`, and the copy says "every Monday".
- **Market report:** the letter page was cut off on phones. It now shrinks to fit.
- **Crash:** a page whose best deal was a bundle returned a 500 (`null.kind` in the coupon).
- **Removed:**
  - The Missouri pages, now a 301 to `/`.
  - The orphan `app/directory-page.tsx`, which fell back to the service key.
  - Page files for `/grow`, `/early-access` and `/cannabis`. Their redirects are kept.
  - The old home's Breathe components.
- **Accessibility:**
  - Links inside running text are underlined.
  - The coupon notches and grain changed so contrast checks can see the coupon.
  - Two known-issue entries were removed because they're fixed.

## Checks

- typecheck: pass.
- `lint:ci`: no new errors.
- `test:unit`: 183 pass.
- Playwright smoke and accessibility suite (`build:fixtures`, 390px and 1440px): 436 pass.
- Lighthouse budget on the fixtures build:

  | Page | Score | LCP | Weight |
  |---|---|---|---|
  | Home | 93 | 3.2 s | 353 KB (was 648 KB) |
  | City | 93 | 3.2 s | 356 KB |

  The variable Fraunces file (120 KB) had put the home page over its 4 s LCP budget. The self-hosted cut fixed it.
- Local runs need `NODE_USE_ENV_PROXY=1` for Node fetch in this sandbox. The repo pins a Playwright version whose browser isn't installed here, so I pointed a local config and a symlink at the installed one. Neither is committed.

## Data notes

- **The Nov 11 3:39 a.m. cron took 23 deals down.** Code and data say this was legitimate: all four nuEra stores replaced their brand-by-brand deals with "25% off entire store". The cron only retires its own static-read deals at stores it read cleanly (`planRetirements`). UNVERIFIED against nuEra's site, because this sandbox can't reach it.
- **The 337 vs 339 split** between pages was ISR cache age, not two different filters. Every page reads the same view.

## Still open

- **Free alerts are untested end to end.** I didn't submit a real signup.
- **The scraper agent stopped without reporting.** The per-store freshness table is not done.
- **Concentrated sources:** NOXX (~129) and SHARE (~80) supply most deals. The count is honest, but it tilts town totals.
- **From Nov 10, still open:**
  - Bloom Peoria's phone.
  - Where `hi@puffprice.com` forwards to.
  - Which stores are independents.
  - The bank/ACH setup.
  - Brand-reset PR LetsSeeWhatSheDew/directory-network-#14 (superseded by Gold Leaf; can be closed).
