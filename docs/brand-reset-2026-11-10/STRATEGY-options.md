# Strategy options, scored (Nov 10, 2026)

**How to read this.** Each option gets a 1–10 score on six criteria. The weighted total is out of 100, and the highest total is first. Change the weights in the box below and recompute: total = Σ(score × weight).

| Criterion | Weight | What 10 means |
| --- | ---: | --- |
| Shopper demand (do real people want it) | ×3 | Shoppers clearly want it |
| Revenue potential | ×2 | Clear path to meaningful money |
| Fit with "Nobody pays us to rank" and the locked rules | ×2 | No conflict at all |
| Effort | ×1 | Easiest |
| Time to first dollar or first proof | ×1 | Fastest |
| Risk | ×1 | Safest |

**Honesty note on the scores.** Nobody has tested shoppers or dispensaries yet, so every **demand** and **revenue** score is my judgment, built from the evidence listed under each table. Treat them as UNVERIFIED until a real test runs. Facts that *were* checked carry their source.

**Four facts from this run that move every table:**

1. **Usage is near zero in the database.** Supabase, Nov 10: `deal_alerts` 0 rows, `listing_claims` 0, `deal_clicks` 14 all-time, `leads` (green) 5. GA4 was not checked: UNVERIFIED. So nobody can sell "shopper numbers" to a store yet.
2. **Stripe won't take this business.** Stripe's Prohibited list (updated 2026-09-22) names "Cannabis dispensaries and related businesses." Stripe's FAQ says services aimed at marijuana sellers (more than 25% of the business) are allowed only in Australia, Canada, the EU, New Zealand and the UK. PuffPrice is US and 100% cannabis-focused. Lemon Squeezy (owned by Stripe) bars "drugs and paraphernalia." Square bars sellers "connected to" cannabis. Sources are in the appendix.
3. **The menu-price data stopped on Oct 17** (`menu_snapshots`). Every option that sells price comparisons waits on fixing that.
4. **The public site promises** "PuffPrice is funded by Pro subscribers only" (`/upgrade` FAQ). Any dispensary revenue means rewriting that line honestly first.

---

## A. Brand direction

| # | Direction | Demand ×3 | Revenue ×2 | Fit ×2 | Effort | Time | Risk | **Total** |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A8 | **Best Bud** (new): "Best Bud For Your Buck$" as the voice, with Scout-style "checked" proof marks | 8 | 8 | 9 | 6 | 7 | 7 | **78** |
| A4 | Your Bud, pure: message-bubble cards, plain talk | 8 | 6 | 8 | 7 | 8 | 6 | **73** |
| A6 | The Scout: field notebook, check marks, verified stamps | 6 | 8 | 9 | 6 | 7 | 7 | **72** |
| A0 | Breathe, cleaned up | 5 | 5 | 8 | 9 | 9 | 6 | **65** |
| A5 | Heartland: river and prairie palette, local pride | 5 | 6 | 8 | 7 | 7 | 7 | **64** |
| A1 | Deal Forecast: weather-report format | 7 | 6 | 6 | 6 | 6 | 5 | **62** |
| A3 | The Morning Edition: small-town paper | 5 | 6 | 8 | 6 | 7 | 4 | **60** |
| A2 | Clip It: coupon clipping | 6 | 5 | 7 | 6 | 7 | 4 | **59** |

**Evidence and reasoning, by row:**

- **A8 Best Bud (new, my pick).**
  - Matthew's own words: he "liked the earlier catchiness of Best Bud For Your Buck$." `DESIGN.md` layout rule 5 already says that headline "stays."
  - Plain talk lowers word count by itself. "Ogeez is 40% off at nuEra East Peoria. Open till 8." is one sentence, with no metaphor to decode. The assessment found the metaphor stack (exhale, breathe out) to be the main "AI" tell.
  - Adding the Scout's proof mark ("✓ Checked on nuEra's site, 9:41 AM") carries the strongest trust asset the site already has (the "How we know" receipts) into the brand. That proof is what a store owner needs to see.
  - Revenue 8: the same look works in a meeting.
  - Risk 7: "Bud" stays in the line only, never in puns elsewhere.
- **A4 Your Bud, pure.** Same demand as A8. Message bubbles are now the look of every AI chatbot, which is the exact thing Matthew wants to avoid. So I kept the voice and dropped the bubbles.
- **A6 The Scout.**
  - Best fit with "nobody pays to rank," because the whole brand *is* the checking. Strongest for meetings: revenue 8.
  - Shoppers care about the deal more than the method: demand 6.
  - Notebook and stamp art can tip into kitsch if overdone: effort 6.
- **A0 Breathe cleaned.**
  - Cheapest, since it already exists.
  - Matthew says he's "not sold."
  - The assessment found the breath metaphor and the orb are what read as AI.
- **A5 Heartland.** It's a palette and a feeling, not a concept. Better as an ingredient: the A8 and A6 mockups both use river and prairie colors.
- **A1 Deal Forecast.**
  - A good daily habit format.
  - Two problems:
    - "Forecast" means a prediction. PuffPrice reports what was checked this morning, not what will happen. With a "no fake data" rule, the core word is off.
    - Weather-app layouts (big number, highs and lows) are one of the most templated UIs there is.
  - The good part, a shareable daily card, can live inside any brand as "Today's best, checked 9 AM."
- **A3 Morning Edition.** Already shown on Sep 23, and Matthew picked Breathe over it. No new reason to bring it back.
- **A2 Clip It.** How it differs from the rejected Receipt: Receipt was a printed price list; Clip It is a single coupon with dashed cut lines. In practice, dashed borders on a price card read as Receipt's cousin, so risk is 4. Coupons also suggest the store paid for placement, which works against "nobody pays to rank."

**Rejected Sep 23 and not brought back:** Price Sign, Scoreboard, Highway, Receipt, literal smoke, the two-ring mark, the wave mark, sound.

**Mockups built:** A8 Best Bud and A6 The Scout, under `/preview/brand-reset`.

---

## B. Consumer model (free vs. Pro)

| # | Option | Demand ×3 | Revenue ×2 | Fit ×2 | Effort | Time | Risk | **Total** |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| B1 | **Answer free for everyone. Free alerts now to build the list. Pro later at $2.99/mo or $19/yr, once a processor says yes** | 8 | 5 | 10 | 8 | 7 | 8 | **80** |
| B4 | Everything free forever, no Pro | 9 | 1 | 7 | 10 | 10 | 8 | **74** |
| B2 | Pro now at $2.99/mo or $19/yr (alerts, out-the-door on everything, price history, track record, best deal on your route, savings tally) | 5 | 5 | 9 | 5 | 3 | 3 | **63** |
| B5 | Pro at $0.99/mo as planned | 5 | 2 | 9 | 5 | 3 | 3 | **57** |
| B3 | Free = basic info, ~$1/mo = full detail (Matthew's idea as stated) | 4 | 4 | 4 | 6 | 4 | 3 | **47** |

**Evidence:**

- **Fees.** Stripe lists 2.9% + 30¢ per card charge (stripe.com/pricing). On $0.99 that's about 33¢, a third of the money. At $2.99 it's 39¢ (13%). At $19/yr it's 85¢ (4.5%). That is why B5 scores revenue 2.
- **Processor (the real blocker).** Stripe prohibits "Cannabis dispensaries and related businesses." That makes any Stripe charge risky, even for a consumer subscription on a cannabis site: risk 3 on B2 and B5.
  - Alternatives with published policies are no better: Lemon Squeezy bars drugs and CBD, Square bars sellers "connected" to cannabis, and Paddle's policy doesn't mention cannabis (UNVERIFIED either way).
  - Cannabis-specific processors (Aeropay and others) are ACH or bank-to-bank and aimed at retail and B2B. None showed a consumer card subscription (UNVERIFIED).
- **AI visibility.** AI assistants and Google can't cite what's behind a paywall, and AI visibility is Matthew's top channel. So the *answer* (best deal, store, price, hours) stays free in every option. That puts B3 (paywall the detail) at fit 4 and demand 4.
- **Demand proof is zero.** 0 alert signups in `deal_alerts`. Free alerts are the cheapest test of whether anyone wants more than the answer. If people won't take free alerts, they won't pay $2.99 for them.
- **B1 is not "never charge."** It's "charge once you have (a) a processor that says yes in writing and (b) a list of people already using the free version."
  - What stays free: the best deal near you, every deal, store facts, out-the-door on the top deal, one alert.
  - What Pro gets later: unlimited alerts, out-the-door on everything, price history and track record per store, best deal on your route, savings tally.

---

## C. Dispensary offer

**Shared rule for every option:** dispensaries pay for tools and data, never for position. The listing and the ranking stay free and identical for everyone.

| # | Option | Demand ×3 | Revenue ×2 | Fit ×2 | Effort | Time | Risk | **Total** |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C2 | **One paid package, with a free first report:** "Free store report" (exists) → "Market Report" monthly at a founding price (~$99/mo; buyers want ~$149 later) | 6 | 6 | 9 | 7 | 7 | 7 | **71** |
| C3 | One-time "Market Snapshot" report, ~$199, no subscription | 5 | 4 | 9 | 7 | 8 | 8 | **65** |
| C1 | Free Listed + three paid tiers: Insight $99 · Market Watch $249 · Pricing Partner $499 | 5 | 8 | 8 | 3 | 3 | 5 | **63** |
| C6 | Brand-side report (for brands like Cresco or GTI: where their promos run and at what discount) | 4 | 6 | 8 | 6 | 5 | 6 | **58** |
| C5 | Labeled sponsored content (a "Sponsored" story, never in the deal list) | 3 | 5 | 3 | 7 | 7 | 4 | **45** |
| C4 | Featured placement | 2 | 7 | 1 | 8 | 8 | 2 | **37** |

**Evidence:**

- **Why one package beats three tiers right now.**
  - Insight sells "real shopper numbers," and there are none yet: 14 clicks all-time in `deal_clicks`.
  - Market Watch and Pricing Partner sell price comparisons, and the menu reader stopped on Oct 17.
  - A three-tier menu would be selling two tiers we can't deliver. That's effort 3, time 3.
  - The three-tier ladder is still the right *destination*. It unlocks as each "must be true" item is proven.
- **What the one package contains today, with no new pipeline:**
  - deal and promo tracking for every store within 15 miles (works now, once deduped)
  - their own listing kept accurate, with same-day corrections
  - a monthly 1-page PDF and email: "what the 5 stores near you ran this month, how deep, how often, and where you sat"
  - price comparisons added when the menu reader is back
  - It's built from data PuffPrice already collects daily (`deal_observations`: 46 rows in the last day).
- **Price anchors (all third-party, UNVERIFIED as current):**
  - Weedmaps premium placement $500–$2,000/mo (Radiant Elephant). The brief's Winston Digital source says $400–$1,500/mo.
  - AIQ per-store license $399 (its own help page, for agreements signed before March 2023).
  - Springbig $400–$3,000/mo (Cannabis Business Executive, 2022).
  - Headset Retailer is **free** to retailers (headset.io). That last one matters most: a market-data dashboard alone is a free product in this industry, so PuffPrice's paid offer has to be *local, human and specific* (the 5 stores near you, explained), not a dashboard.
- **How to get paid (UNVERIFIED path).** Invoice the store directly and take ACH or check: no card processor in the middle. Whether Matthew's bank allows a cannabis-adjacent B2B account is UNVERIFIED. Ask the bank before the first invoice.
- **C4 Featured** breaks the locked rule. It scores 37 so the table shows why it's closed.
- **C5 Sponsored** is legal if labeled, but it puts a paid object one scroll away from the ranking and muddies the footer promise.

---

## D. Growth channel

| # | Channel | Demand ×3 | Revenue ×2 | Fit ×2 | Effort | Time | Risk | **Total** |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| D1 | **Fix accuracy, then keep the AI visibility layer** (llms.txt, `/mcp`, answer pages) | 8 | 6 | 10 | 8 | 6 | 8 | **80** |
| D2 | **Store-shared link:** each store gets an accurate free page and a "see how you compare" link to share with staff and their own customers | 6 | 8 | 9 | 7 | 7 | 8 | **75** |
| D3 | SEO city and store pages (already built, after cutting density) | 7 | 6 | 10 | 7 | 4 | 8 | **74** |
| D4 | Reddit: honest posts by Matthew as the builder in r/Peoria, r/ILTrees, r/bloomingtonnormal, r/UIUC | 7 | 4 | 9 | 7 | 8 | 5 | **72** |
| D5 | Local press: Journal Star, WCBU, Peoria Magazine, with the tax-math angle ("Peoria flower tax is 26.5%; here's out-the-door") | 6 | 5 | 10 | 6 | 6 | 7 | **70** |
| D6 | Email alerts (free) as the list-builder | 6 | 6 | 10 | 6 | 5 | 8 | **70** |
| D7 | QR cards at stores (only stores that say yes) | 5 | 5 | 8 | 6 | 6 | 6 | **62** |
| D8 | Instagram/Facebook daily card | 5 | 3 | 7 | 6 | 6 | 3 | **53** |

**Evidence:**

- **D1.** AI visibility is Matthew's stated top priority, and the plumbing is already live: llms.txt returns 200, 16 AI crawlers are welcomed in robots.txt, and `/mcp` exists. But it currently spreads the inflated "110 deals" count, so the accuracy fix *is* the growth fix.
- **D4.** Reddit welcomes builders who disclose and answer questions, and bans drive-by promotion. Risk 5 because one bad post can stick. Subreddit rules: UNVERIFIED (not read this run).
- **D8.** Meta restricts cannabis promotion. Risk 3. Keep content Meta-safe (no product photos, no consumption) if used at all.
- **D2.** Ties growth to the dispensary sale. Stores share a page that makes them look good and accurate, and every share sends shoppers.

---

## Appendix: sources checked this run

**Stripe and payment processors:**

- Stripe Prohibited & Restricted Businesses, updated 2026-09-22: https://stripe.com/legal/restricted-businesses
- Stripe FAQ on businesses that serve marijuana sellers: https://support.stripe.com/questions/prohibited-and-restricted-businesses-list-faqs
- Stripe pricing: https://stripe.com/pricing
- Lemon Squeezy prohibited products: https://docs.lemonsqueezy.com/help/getting-started/prohibited-products
- Square prohibited goods: https://squareup.com/help/us/en/article/5089-prohibited-goods-and-services-with-square-point-of-sale
- Paddle prohibited list (no cannabis line found), updated 13 Apr 2026: https://www.paddle.com/help/start/account-verification/what-am-i-not-allowed-to-sell-on-paddle

**Competitor pricing:**

- AIQ legacy pricing: https://help.aiq.com/en/articles/13979609-charge-policy-prior-to-march-2023
- Headset Retailer (free): https://headset.io/retailer/overview
- Weedmaps cost (third party): https://www.radiantelephant.com/why-massachusetts-cannabis-dispensaries-are-losing-revenue-to-weedmaps/
- Springbig (third party, 2022): https://www.cannabisbusinessexecutive.com/2022/11/springbig-from-yogurt-and-pizza-digital-punch-to-cannabis-crm-platform/

**Database:** read-only queries in Supabase `hnbjufmtmrhexmdrfubw`, Nov 10. See `ASSESS-site.md`.

**Not checked:** GA4, Search Console, Matthew's bank, PayPal's current policy (page blocked), high-risk merchant accounts.
