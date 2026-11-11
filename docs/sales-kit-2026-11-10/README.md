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

## Still open

- Send a test email to `hi@puffprice.com`. Mail for puffprice.com routes through the registrar's forwarding (MX records checked Nov 10). Where it lands is UNVERIFIED.
- Before booking, confirm which stores are single-location independents. Ownership is UNVERIFIED.
- Find out how you'll invoice and take ACH. Ask your bank first.
