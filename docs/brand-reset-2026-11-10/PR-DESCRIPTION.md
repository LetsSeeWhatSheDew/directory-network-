# Brand reset: assessment + options (DO NOT MERGE)

Phase 1 of the Nov 10 brand-reset run. Docs and preview pages only. No production page changes, no SQL, nothing sent.

## Summary

- **Fix trust before any meeting.** The site shows 110 deals; there are 37. nuEra East Peoria shows "42 offers" for 9 deals. The likely cause is in the scraper: it loads existing deals with a 500-row cap, so it misses live ones and re-inserts them daily.
  - Also found: Bloom Wellness carries Beyond Hello's description.
  - Also found: `master_listings` has RLS off, and the public anon key can insert, update and delete rows in it.
  - Also found: the menu-price reader has been stopped since Oct 17.
- **Brand: Best Bud.** "Best Bud For Your Buck$" as the voice, one plain sentence per deal, and a check mark saying where and when we saw it. The Scout is the runner-up and the strongest look for store meetings.
- **Shoppers: free now, with free alerts.** Pro comes later at $2.99/mo or $19/yr, once a processor says yes. Stripe prohibits "cannabis dispensaries and related businesses."
- **Dispensaries: one paid package.** Listed stays free. The Market Report is $99/mo at a founding price, the first report is free, and stores pay by invoice. Higher tiers wait for the menu reader. Nobody can buy rank.

## Docs (`docs/brand-reset-2026-11-10/`)

- [ASSESS-site.md](docs/brand-reset-2026-11-10/ASSESS-site.md): scorecard and evidence, with phone screenshots in `shots/live/`
- [STRATEGY-options.md](docs/brand-reset-2026-11-10/STRATEGY-options.md): groups A–D scored with weights
- [FOCUS-recommendation.md](docs/brand-reset-2026-11-10/FOCUS-recommendation.md): the 30-day plan
- [DECISIONS.xlsx](docs/brand-reset-2026-11-10/DECISIONS.xlsx): 15 decisions, with your answer column blank
- [HANDOFF.md](docs/brand-reset-2026-11-10/HANDOFF.md): the brief

## Previews

- Index: `<preview-url>/preview/brand-reset`
- Best Bud: `/preview/brand-reset/best-bud` with `/deal`, `/pro` and `/stores`
- The Scout: `/preview/brand-reset/scout` with `/deal`, `/pro` and `/stores`
- Add `?daypart=night` to any screen for the night look.
- Phone screenshots (390px, day and night, plus the tapped state) are in `shots/preview/`.

## Round 2: after Matthew's decision sheet

Matthew rejected the Best Bud and Scout looks as cheap, and the live Breathe look too. I built three new concepts on live data, each with a home screen, a deal that opens in place, and a flyer:

- The Vault: `/preview/brand-reset/vault`
- The Gallery: `/preview/brand-reset/gallery`
- The Instrument: `/preview/brand-reset/instrument`

His answer to each decision is in [ROUND2-notes.md](docs/brand-reset-2026-11-10/ROUND2-notes.md). The trust fixes (scraper dedupe, 3 SQL files, menu-reader runner) are on their own branch, `claude/trust-fixes-2026-11-10`.

## Round 3: flyers

- Each flyer is built around one cannabis leaf, drawn in code in `app/preview/brand-reset/leaf.ts`: Gold Leaf, Big Leaf and Leaf Code. All three are in use.
- Each design has its own QR tag (`utm_campaign=nov26-gold-leaf`, `nov26-big-leaf`, `nov26-leaf-code`).
- There are PDFs for letter paper (one per sheet, or two 4×6 per sheet) and for 4×6 cards, in `docs/brand-reset-2026-11-10/flyers/`. Every QR code decodes.
- To print the PDFs again: `node docs/brand-reset-2026-11-10/flyers/make-pdfs.mjs` with a dev server running on port 3100.

How the preview pages are fenced off:

- They use live data from Supabase, with duplicates removed.
- Every one is `noindex`.
- They are not in the sitemap or `llms.txt`.
- They return 404 on the production deployment unless `BRAND_RESET_PREVIEW=1`.
- Their styles are scoped to `app/preview/brand-reset/`. `app/globals.css` is untouched.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
