# 2026-11-10 — Trust fixes live, menu reader back, sales kit

Matthew's go-ahead (Nov 10, evening): "MERGE to main, Deploy Production, DO sql runs. DO IT ALL."

## Shipped to production

| PR | What |
| --- | --- |
| [LetsSeeWhatSheDew/directory-network-#15](https://github.com/LetsSeeWhatSheDew/directory-network-/pull/15) | One live row per deal; menu reader fixes (nuEra, Trinity, High Haven, Beyond Hello; Chrome browser ID on Jane pages); drive-thru re-check; honest "how we make money" copy; the market report route; CI pinned to ubuntu-24.04; sales kit |
| [LetsSeeWhatSheDew/directory-network-#16](https://github.com/LetsSeeWhatSheDew/directory-network-/pull/16) | `/for-dispensaries` "What's free, and what isn't" (was "nothing to sell you today") |

Both were verified on production after Vercel showed Ready:
- nuEra East Peoria shows 9 offers (was 42).
- `/drive-thru` reads "checked Nov 10, 2026" and has the Oct 27 Peoria entry.
- `/upgrade` no longer says "funded by Pro subscribers only".
- `/for-dispensaries/aroma-hill-peoria/market-report` renders.
- Home shows 355 deals. That's correct: all 355 are Central IL across 20 stores, each with a distinct title.

## SQL applied (Supabase, project hnbjufmtmrhexmdrfubw)

1. `2026-11-10-dedupe-active-deals.sql`: retired 74 duplicate rows (`status_reason='duplicate_of_newer'`). Active rows = distinct deals = 355.
2. `2026-11-10-master-listings-lockdown.sql`: RLS on, public read policy, anon/authenticated writes revoked. Edge logs for the prior 24h showed zero REST writes to `master_listings`. Undo is in the file.
3. `2026-11-10-bloom-peoria-description.sql`: Bloom Peoria descriptions replaced.
4. `menu_platform` enum: added `treez` (`jane` was already there).
5. `master_listings.website` changes:
   - cloud-9-east-peoria → `https://www.cloud9dispensaries.shop/` (the old /menu URL returned 404)
   - aroma-hill-peoria → `https://shop.aromahillcannabis.com/peoria` (the old /peoria/ URL redirected to the homepage)

## Menu reader

`~/puffprice-scraper` was pulled to main (d3dd273) and a full run was started by hand at 18:07 CST. See the log for results.

## Sales kit

`docs/sales-kit-2026-11-10/`:
- PITCH.md
- TRACTION.md
- ONE-PAGER.pdf
- market-reports for all 26 stores

## UNVERIFIED / still open

- Bloom Peoria phone (309) 232-8134. RISE's page sits behind a Cloudflare check; not bypassed.
- Where `hi@puffprice.com` forwards to. MX records point to the registrar's forwarding.
- Store ownership: which stores are single-location independents.
- The bank / ACH invoicing setup.
- Trinity on Glen/University and The Dispensary Champaign drive-thru status. Trinity is age-gated with terms; The Dispensary has no site.
- Brand look: still undecided (PR LetsSeeWhatSheDew/directory-network-#14, draft, not merged).
