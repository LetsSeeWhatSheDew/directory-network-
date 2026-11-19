# PuffPrice traction plan, Nov 19, 2026

Matthew (Nov 19): the look is better, the Mac hasn't been on, the project sat on the back burner. "We need traction… maybe GasBuddy as a reference." This is the plan. It builds on the Nov 10 30-day plan (`docs/brand-reset-2026-11-10/FOCUS-recommendation.md`), which is still right on money and wasn't carried out past week 2.

## What GasBuddy actually did

Sources are at the bottom. No GasBuddy financials are public, so how big each revenue line is stays UNVERIFIED.

1. **Free for drivers, always.** Revenue comes from:
   - businesses: display ads and Sponsored Search, which fuel brands buy per click;
   - payments: the Pay with GasBuddy card (launched 2017 with WEX) earns fees on every fill-up;
   - data: aggregated, anonymized price and audience data sold to the industry;
   - a later paid tier (Plus/Premium) layered on top.
2. **Users built the data.** It started in 2000 as a community site where drivers posted prices. A weekly $100 gas-card drawing rewarded reporting. The data was the moat, and the community kept it fresh.
3. **It became the source reporters call.** GasBuddy puts out press releases on holiday gas prices, and its head of petroleum analysis is quoted every Thanksgiving and Memorial Day. Free press every week built trust and installs.
4. **Then it sold tools to the stations themselves** (OpenStore in 2009, ads for fuel brands).

The order matters: **trusted data → habit for shoppers → the press calls you → businesses pay to reach your audience and use your data.** Nobody paid GasBuddy until the drivers were there.

## Where PuffPrice is

- **The data is good when the readers run:** 337 deals at 20 of 26 stores (Nov 11). But the browser reader ran on the Mac, so this week it stopped, and the 72h/7-day rules took those deals down. A deal site with stale deals has no worth. **This is fixed on the branch:** the reader now runs on GitHub's machines twice a day, with no Mac (`.github/workflows/rendered-scrape.yml`).
- **There's almost no audience proof.** The Nov 10 audit counted 14 deal clicks all-time in the database. GA4 and Search Console haven't been read (they need Matthew's Google login). Traction is the whole problem. Features aren't.
- **The product is already ahead of the audience.** There are 26 guide pages, the tax calculator, Green Wednesday, a map, alerts, an MCP server and llms.txt. Don't add pages; get people to the ones that exist.

## The PuffPrice version of the GasBuddy loop

| GasBuddy | PuffPrice |
|---|---|
| Driver-reported prices | Each store's own site, read twice daily, plus (later) shoppers reporting deals the reader misses |
| $100 gas card drawing | A monthly non-cannabis gift card drawing for confirmed deal reports. Check Illinois sweepstakes rules first, and never give away cannabis. |
| Holiday gas price forecasts quoted by local TV | **Central Illinois Cannabis Price Check**: monthly numbers ("an eighth averaged $X in Peoria this month, $Y in Springfield") pitched to the Journal Star, WEEK 25, WMBD, SJ-R, WCIA, The Pantagraph and WGLT |
| Ads and Sponsored Search for fuel brands | **Market Report for stores** ($99/mo founding price, invoiced). Ranking is never for sale. A clearly labeled "Store news" slot is a later, separate decision. |
| Pay with GasBuddy | Not for us. Cannabis is cash/debit and federally illegal; we stay out of payments to shoppers. |
| Data sold to the industry | The menu-price history (eighth, 1g cart, 100mg gummies, every store, every day) is the asset. It also feeds Zone 4: being the source AI answers cite. |

## The next 30 days

**Week 1 (now → Green Wednesday, Nov 25).**

| What | Who | Done when |
|---|---|---|
| Merge the cloud reader to main | Matthew says yes; Code merges | `/status` shows two reader runs a day for 3 days running |
| Tap through one free alert signup on your phone | Matthew, 2 min | The confirm email arrives and the link works (Code can't receive email from here) |
| Green Wednesday: `/green-wednesday` already exists and becomes the full list on the 25th | Code checks it the morning of | The page lists that day's real deals |
| One Green Wednesday press pitch to 6 local outlets | Code drafts; Matthew sends from his own email | Sent Mon Nov 23 |
| One post in r/ILTrees plus local subs, following each sub's self-promo rules | Matthew posts (his account) | Posted Tue Nov 24 |
| Flyers up (the PDFs are in `docs/brand-reset-2026-11-10/flyers/`), only where the owner says yes | Matthew | 20 placed, each with its own QR tag |

**Week 2.** Read GA4 and Search Console with Matthew's login. Set a baseline: visits, deal clicks and alert signups per week. Every later choice gets judged against it.

**Week 3.** Free sample Market Reports for three stores:
- **SHARE Springfield:** the one true single-location independent.
- **Trinity Peoria:** local, 2 Peoria stores.
- **nuEra:** Illinois family-owned, 4 of our stores, posts deals daily.

Each report is built from our own deal and menu logs, and every number traces to a row.

**Week 4.** Three meetings and one bank:
- **Meetings:** offer $99/mo, first month free, paid by invoice and ACH. Write down every yes, no or not-yet, with the reason.
- **Bank:** open an account with an Illinois credit union or community bank that has a cannabis or "ancillary" program. Credit Union 1 runs one with Shield Compliance. Describe PuffPrice honestly: media and data for dispensaries, never touches product.

## Decisions for Matthew

1. **Drop Pro at $0.99.** Card fees eat it, and every mainstream processor (Stripe, Square, PayPal) refuses cannabis-related businesses. Keep alerts free; money comes from stores. Revisit a shopper tier (e.g. $19/yr) only after 500 subscribers and a written yes from a processor.
2. **Are you the face of the price check?** GasBuddy's growth came partly from one named analyst who reporters could call. "Matthew [last name], PuffPrice" quoted in the Journal Star is worth more than any page we build.
3. **Shopper deal reports and a drawing** (week 5+): yes or no?
4. **A labeled "Store news" slot for paying stores, separate from the ranking.** It's the GasBuddy ad model, but it's the decision most likely to cost trust. My recommendation: not before the Market Report has 3 paying stores.

## Sources

- https://productmint.com/gasbuddy-business-model-how-does-gasbuddy-make-money/
- https://test.gasbuddy.com/newsroom/pressrelease/2019/11/05/849 (Sponsored Search, cost per click)
- https://d3.harvard.edu/platform-digit/?p=7254 and https://d3.harvard.edu/platform-digit/?p=1854 (crowdsourcing, ads and payments)
- https://en.wikipedia.org/wiki/GasBuddy (founded 2000; app in 2010; parent PDI Technologies; weekly $100 gas card drawing)
- https://test.gasbuddy.com/newsroom/pressrelease/2018/11/19/725 (Thanksgiving gas price release)
- https://help.gasbuddy.com/hc/en-us/articles/27605869107095-Ads
- Payments and banks: https://support.stripe.com/questions/prohibited-and-restricted-businesses-list-faqs, https://square.com/help/us/en/article/6386-why-can-t-square-support-all-businesses, https://www.paypal.com/legalhub/braintree/acceptable-use-policy, https://www.businesswire.com/news/home/20201014005183/en/Shield-Compliance-Partners-with-Credit-Union-1-to-Serve-the-Legal-Cannabis-Industry-in-Illinois-and-Nevada
- Green Wednesday 2026 is Nov 25: https://weedmaps.com/learn/cannabis-and-its-evolution/green-wednesday
