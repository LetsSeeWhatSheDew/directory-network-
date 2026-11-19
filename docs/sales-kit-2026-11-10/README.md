# Sales kit — Nov 10, 2026

Everything you need to walk into a dispensary and sell the Market Report.

| File | What it is |
| --- | --- |
| [PITCH.md](PITCH.md) | The 30-second pitch, the phone demo, objections, who to visit first |
| [TRACTION.md](TRACTION.md) | The only numbers to say out loud, with sources |
| `ONE-PAGER.pdf` | Leave-behind, US Letter. The QR opens /for-dispensaries (tagged `leave_behind`) |
| `market-reports/market-report-<store>.pdf` | A free sample report for each of the 26 stores, built Nov 10 |
| `../brand-reset-2026-11-10/flyers/` | Shopper flyers: Gold Leaf, Big Leaf, Leaf Code |

## Before each visit

The reports are live pages. Print a fresh one the morning of the meeting, so the deals and prices are that day's:

- Open `https://www.puffprice.com/for-dispensaries/<store-slug>/market-report`, then Print → Save as PDF. Set Letter, "Actual size", background graphics on.
- Or regenerate all 26 with a local dev server on port 3100. The renderer script is in `make-market-reports.mjs`: `node docs/sales-kit-2026-11-10/make-market-reports.mjs docs/sales-kit-2026-11-10/market-reports <slug> <slug> …`

## Still open (updated Nov 19, 2026)

- **Who to visit first.** Answered; ownership is from web sources, see `docs/strategy/2026-11-19-store-ownership-and-open-items.md`.
  - **SHARE Springfield** (`share-springfield`): the region's only single-location independent.
  - **Trinity** (`trinity-on-glen`, `trinity-on-university`): Peoria-local, 2 stores.
  - **Maribis** (`maribis-springfield`): independent, 3 Illinois stores.
  - **nuEra** (`nuera-east-peoria`, `nuera-pekin`, `nuera-champaign`, `nuera-urbana`): Illinois family-owned, 4 of our stores.
  - Leave the multi-state chains (Ascend, Cresco/Sunnyside, High Profile, NOXX, Shangri-La) for later.
- **The PDFs in `market-reports/` are from Nov 10, before Gold Leaf.** For fresh ones, go to GitHub → Actions → **Market report PDFs** → Run workflow. The default list is the first-visit stores; it takes about 90 seconds, and the PDFs download from the run's `market-reports` artifact. A Nov 19 set is on run 44587610189: 8 reports, 314–335 KB each.
- **Email.** `hi@puffprice.com` forwards through Namecheap, and PuffPrice can't send any email until the Resend domain verifies (`docs/ops/2026-11-19-email-fix.md`). Until that's fixed, give stores your own email, not hi@.
- **Invoicing and ACH.** Open an account with an Illinois credit union or community bank that serves cannabis-ancillary businesses (Credit Union 1 has a program). Stripe, Square, PayPal, Bluevine and Relay refuse.
