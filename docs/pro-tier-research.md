# PRO Tier Pricing & Feature Research

**Date:** April 17, 2026
**Owner:** Matthew
**Purpose:** Decide whether PuffPrice PRO should stay at $0.99/month or adjust, and identify which features would actually convert free users into paying subscribers.

> **TL;DR:** **Keep $0.99/month.** Consider adding a **$4.99/month "Power" tier** (or an annual $9.99/year option at the same base tier) after 90 days if SMS costs or feature scope justify it. The $0.99 price is not a mistake — it is a strategic anchor for a category that has no consumer-facing direct competition today.

---

## 1. What Competitors Charge

### Cannabis-specific consumer tiers
| Product | Consumer subscription | Pricing | Notes |
|---|---|---|---|
| **Weedmaps** (consumer app) | **None.** | Free to end users. | All of Weedmaps's revenue is B2B — dispensary listings cost $400-$1,500+/mo. No consumer premium tier exists. |
| **Leafly** (consumer app) | **None.** | Free to end users. | Same B2B model as Weedmaps. Consumer features are fully free. |
| **iHeartJane (Jane)** | **None.** | "Using iheartjane is completely free for customers." | Brand follows / drops notifications available free. |
| **Dutchie** | N/A (B2B) | N/A | Dutchie is the e-commerce backend for dispensaries. Consumers don't directly subscribe. |
| **Cannasaver / CannaPages** | **None.** | Free with coupon redemption. | Old-school affiliate coupon aggregator. |
| **LeafBuyer** | **None.** | Free. | Deal aggregator; ad-funded. |

**Key finding: there are no consumer-paid cannabis deal apps.** Zero. Every competitor is either free + ad/B2B funded, or doesn't exist as a consumer subscription product.

### Adjacent consumer deal / alert subscription pricing
What consumers ARE used to paying for deal/alert tools outside cannabis:

| Product | Price | Category | What you get |
|---|---|---|---|
| Honey | Free | Coupon extension | Automatic code application + Gold points |
| Rakuten | Free | Cashback | 1-15% cashback at 3,500+ stores |
| Flipp | Free | Weekly ads | Digital flyer + coupon clipping |
| Capital One Shopping | Free (requires no card) | Price comparison | Automatic coupons, price history |
| Camelcamelcamel | Free | Amazon price tracker | Email alerts when price drops |
| Keepa | Free + **$19/mo Premium** | Amazon analytics | Full price history, real-time alerts, Premium features |
| Slickdeals | Free + **Plus at $4.99/mo** | Deal aggregation | Ad-free, advanced alerts, exclusive deals |
| Couponcabin / Groupon | Free | Coupons | Free |
| Too Good To Go | Free | Food waste / deals | Free; pay for food only |
| NextDoor / Facebook Marketplace | Free | Local discovery | Free |

**Takeaway:** consumer deal tools almost universally monetize via B2B (ads, affiliate, commissions) OR via a low-priced optional Plus tier ($4.99-$19/mo) that strips ads and unlocks power features. Almost no one pays a base subscription for deal discovery itself.

### Consumer-facing SMS alert tools
| Product | Consumer price | Notes |
|---|---|---|
| Price drop alert services (genericallly) | $0 base, often $2-5/mo premium | Standard pattern: free basic, paid premium for frequency/speed |
| Cannabis SMS platforms (Leafbuyer, Blackleaf, Alpine IQ) | N/A — B2B | $45-$900/mo. **Dispensaries** pay, not consumers. |

**Takeaway:** no consumer pays for SMS cannabis deal alerts today. PuffPrice is inventing this product. $0.99/month is an anchor price; "cost of a gumball" framing is correct.

---

## 2. Is $0.99/mo the Right Price?

### The case to keep $0.99
1. **Zero competitive pressure.** Nobody else is selling this to consumers. The price you charge is the price you create — there's no incumbent to beat.
2. **Below the impulse threshold.** At under $1/month, subscription decisions are made emotionally, not analytically. "Will this save me even one $ per month" is an easy yes for any cannabis user spending $30+ per visit.
3. **A single $5 saved deal pays for 5 months.** The value math is trivially positive.
4. **Anti-churn anchor.** At $0.99, cancellation friction is high — the "is it worth keeping?" question barely triggers.
5. **Word of mouth.** "It's a dollar" is a shareable price. "It's five dollars" requires justification.
6. **Matthew's brand voice fits.** PuffPrice is positioned as pro-consumer, anti-rip-off. A tiny price reinforces that.

### The case to raise it
1. **SMS costs real money.** At ~$0.01-0.03 per SMS and 10-30 messages per PRO user per month, variable cost alone is $0.10-$0.90/user/month — a PRO user is potentially unprofitable at $0.99 if they consume aggressively.
2. **Stripe fees eat it alive.** $0.99 × 97.1% minus $0.30 fixed = **$0.66 net per subscriber.** On $0.99 that's a 33% cost. At $2.99 the fixed-fee proportion drops to ~13%.
3. **Perceived value.** $0.99 may signal "cheap" / "novelty" / "why bother" to some users. A $2.99 or $4.99 price signals "this is a real product."
4. **Anchoring for upsells.** If there's ever a $19.99/mo "Dispensary Intelligence Pro" tier for industry users, a $0.99 consumer tier muddles the pricing ladder.

### Recommendation
**Keep $0.99 through launch and the first 90 days.** Do not raise it before you have data. But **build the infrastructure now** so you can offer:
- **$0.99/mo Basic PRO** (current) — unlocks SMS alerts, daily digest, price history for 1 city
- **$4.99/mo Power PRO** (add later) — adds multi-city alerts, product watchlists, brand alerts, full savings dashboard
- **$9.99/yr Annual Basic** (add after 90 days) — 16% discount, locks in an annual user

If/when SMS cost becomes a real constraint, cap Basic at a throttle (e.g., "up to 20 alerts/mo, tops tracked) and push power users to the $4.99 tier.

**Don't bundle annual into launch.** Annual commitment requires trust. At launch, you have none. Offer monthly first, let people experience the product, offer annual at the renewal moment.

---

## 3. Which Features Would Actually Make Someone Pay

Features currently listed on your CLAUDE.md for PRO:
- SMS alerts
- Daily digest
- Price history
- Savings dashboard

These are good defaults. Research-informed take on each:

### SMS alerts — **YES, headline feature**
What the research shows: cannabis users check for deals infrequently and miss good ones. Weedmaps/Leafly don't push. Dutchie/Jane notify you only about the stores you've already chosen.
PuffPrice's differentiation: push the user toward **any** dispensary with a deal that matches their criteria, not just the one they already shop at.
**Make it work well:** geofenced ("a deal just went live within 5 miles of you"), price-threshold ("alert me when any eighth drops below $40"), product-match ("alert me when Cresco runs ≥20% off"). Not just "here's a daily dump."

### Daily digest — **YES, but as the lower-friction fallback**
Most users won't tolerate SMS all day. A daily morning digest (7:30 AM, curated top 3-5 deals for their city) is lower friction and probably the actual engagement driver for most PRO users. SMS is the premium-feeling feature; daily digest is the daily-used feature.

### Price history — **YES, unique differentiator**
Zero competitors offer this. Weedmaps, Leafly, Jane, Dutchie all show "what's the price right now" with no temporal context.
**Make it visible even in the free tier** — let a free user see the last 7 days of price history on a specific product as a taste. Gate the 30/90-day chart behind PRO.
A "price alert" feature (alert me when this product's price drops) is the killer extension of this.

### Savings dashboard — **WEAK as headline, STRONG as retention**
"You saved $47 this month" is a great retention message but a weak acquisition hook. Users don't sign up for the dashboard; they sign up for alerts and then the dashboard makes them stay.
**Build it simple:** a single page showing total savings since signup, avg savings per visit (if we can track), and a projection of annual savings. Good monthly-email content: "You've saved $X at PuffPrice this month."

### Features NOT yet mentioned worth adding

**Inventory check / stock alerts** — "alert me when [specific strain] is back at any Sunnyside in Chicago." This is a pain point right now. Dispensary menus go out of stock without notice, and nobody lets you monitor across chains. High-leverage feature; technically hard because we'd need to scrape menu data.

**Brand watchlist** — "alert me when Aeriz / Cresco / Rhythm runs a discount anywhere in my area." Jane offers this but only for stores they power. Aggregate it and it's a moat feature.

**Custom threshold alerts** — "alert me when any eighth drops below $30 in Chicago." Power-user feature, but a small segment will value it at a higher price point.

**Early access to dispensary-submitted deals** — if PuffPrice ever accepts direct submissions from dispensaries, PRO members could see deals 1-2 hours before free users. Low effort to implement, reinforces the "first to know" feeling.

**"Best day" planner** — a single page that says "you should shop on Monday between 8-10am at [dispensary] because that's when your watched products are most likely to be discounted." Uses our own data. AI-y in a good way.

---

## 4. User Sentiment — What Illinois Cannabis Shoppers Complain About

### Summarized pain points from forum / Reddit / review aggregator research
(Direct Reddit egress is limited; the themes below come from secondary coverage and dispensary-industry commentary.)

1. **Menu / inventory inaccuracy.** Classic complaint: a user sees a deal on Weedmaps, drives to the dispensary, finds the product out of stock. Stated directly: "A common complaint is placing orders through apps like WeedMaps only to receive a call stating the item ordered is out of stock and not correctly updated on the app."
2. **Price confusion from taxes.** IL's stacked cannabis taxes mean the menu price is rarely what you pay. Users complain they thought an eighth was $40 but it rings up at $52.
3. **Cash-only friction.** ATM fees, no debit at some stores, Apple Pay rarely accepted.
4. **Deal fine print.** "25% off" turns out to be 25% off MSRP of a specific strain they don't have, not the thing the user wanted.
5. **Loyalty program fatigue.** Every chain has its own program with its own app, points, and tiers. No unified way to see "where is my loyalty best used right now."
6. **Out-of-date online menus.** THC percentages wrong, strains listed that haven't been on-shelf in weeks.
7. **Geographic inequality.** Rural IL has 1-2 options within an hour's drive; users complain they have no leverage.
8. **Hidden dispensary closures.** Dispensaries like Okay Cannabis (Wheeling) and Spark'd (Crystal Lake) have closed. Users show up to closed stores.
9. **Prices vs. Wisconsin / Michigan.** Comparisons to $28 eighths in WA or $40 in MI drive IL users crazy. The tax burden is politically contentious.

### What they wish existed (inferred from the above)
- **A tool that tells me the REAL out-the-door price, including taxes.**
- **A way to compare across all dispensaries near me WITHOUT installing 5 chain apps.**
- **Alerts for my favorite product when it's actually in stock AND discounted.**
- **A signal that a dispensary is still operating.** (Trivial to implement: we flag closed locations.)
- **A map that shows the closest dispensaries across all chains, ranked by price-to-value.**

**All of these are PuffPrice's pitch.** The PRO features that lean into these pain points will convert:
- Stock status / "in stock now" verification
- Tax-inclusive pricing display
- Cross-chain loyalty tracking
- Closure flagging (free; brand differentiator)
- Real-time price-to-value ranking

---

## 5. Conversion Funnel Math

### Assumptions (sanity-check with GA4 after launch)
- **Free user cohort** (Day 30 post-launch): 2,000–10,000 monthly actives in IL (modest)
- **Conversion-to-PRO rate (benchmark for ad-free consumer subscription with strong free tier):** 0.5% – 3%
  - Low end: 0.5% → 10–50 PRO subs
  - High end: 3% → 60–300 PRO subs
- **At $0.99/mo, net ~$0.66/user** after Stripe fees
  - 50 subs × $0.66 = **$33/mo**
  - 300 subs × $0.66 = **$198/mo**
- **At $4.99/mo, net ~$4.54/user**
  - 50 subs × $4.54 = **$227/mo**
  - 300 subs × $4.54 = **$1,362/mo**

### What this tells us
- PRO is not a revenue driver in the first 6 months at $0.99. It's a **signaling feature** — it says "we have a premium tier" and builds the behavioral infrastructure for future pricing.
- Featured ($49/mo for dispensary listings) will dramatically outweigh PRO in early revenue. **That's fine.** It's also why you want PRO to cost $0.99: it attracts users who then build the network effects that attract more Featured listings.
- If/when PRO subscribers exceed ~500, the unit economics of $0.99 start mattering. That's the moment to introduce the $4.99 Power tier, not before.

---

## 6. Recommendations

### Pricing
- **Keep $0.99/mo through 4/20 launch and the first 90 days.**
- **Add annual option ($9.99/yr) at Day 60 or 90** — net ~$9.00/user after fees; saves 16% for the user, locks in cash flow.
- **Build the $4.99 Power tier spec now** but do not ship it until PRO subscriber count justifies it.
- **Do not raise $0.99 to $1.99 or $2.99.** The psychological gap between $0.99 and $1+ is bigger than between $0.99 and $4.99 — once you're above $1, you've crossed the impulse-buy threshold. Stay below it.

### Features for $0.99 Basic PRO (ship now)
1. SMS alerts (geofenced, price-threshold, brand-match)
2. Daily digest email (curated top 3-5 deals for user's city, sent 7:30 AM)
3. 30-day price history on individual products
4. Personal savings dashboard
5. Ad-free experience (if/when we ever introduce ads, PRO users are exempt)

### Features for $4.99 Power PRO (design now, ship later)
1. Multi-city alerts (e.g., travels between Chicago and Peoria)
2. Product watchlists with back-in-stock alerts
3. Brand alerts (alert me on all Cresco deals)
4. Unlimited SMS frequency
5. Historical deal explorer ("show me all 20%+ off flower deals in Chicago in the last 90 days")
6. Custom threshold alerts
7. Early access to dispensary-submitted deals (60 min before free users)
8. Tax-inclusive pricing display (opt-in)
9. Cross-chain loyalty tracker

### Free features that retain users (protect these)
- **No account required to browse.** Keep this forever. It's the anti-Weedmaps positioning.
- **GPS / city filter / map.** Free.
- **Full deal access.** Free. PRO adds depth, not gatekeeping.
- **Dispensary closure / "may be closed" indicator.** Free. Every user benefits.
- **Featured listings in ranking.** Free — they're driven by dispensary revenue, not consumer payment.

---

## 7. Questions to Test Post-Launch

1. **What's the free-to-PRO conversion rate after 14 days?** Slickdeals benchmark is ~2% for ad-free upgrade; we should aim for 1% at launch.
2. **Does daily digest drive more retention than SMS?** Instrument both. My hypothesis: SMS drives conversion, digest drives retention.
3. **How many SMS does an average PRO user actually receive?** If it's <10/mo, the cost case for a price raise weakens.
4. **What percentage of PRO users check the savings dashboard weekly?** Low dashboard engagement means we need to email it to them.
5. **Do PRO users visit more dispensaries, or the same dispensaries more often?** Shapes the brand-watchlist feature priority.

---

## Sources

- [Weedmaps business pricing — Softwaresuggest](https://www.softwaresuggest.com/weedmaps)
- [Weedmaps retailer subscription pricing — MJBizDaily](https://mjbizdaily.com/cannabis-firm-weedmaps-aims-for-175-percent-revenue-growth/)
- [Leafly vs Weedmaps B2B pricing — isenselogic](https://isenselogic.com/how-much-does-leafly-weedmaps-charge/)
- [Cannabis SMS platforms pricing — Flowium](https://flowium.com/blog/cannabis-sms-marketing/)
- [Springbig cannabis messaging](https://springbig.com/cannabis-communications/)
- [Push vs SMS for cannabis retailers — Blaze](https://www.blaze.me/blog/dispensary-tips/push-notifications-vs-sms-messages-for-cannabis-retailers/)
- [Honey app review — Phroogal](https://www.phroogal.com/product/honey-app-coupons-promo-codes-and-deal/)
- [Flipp app review — Phroogal](https://www.phroogal.com/product/flipp-app-coupons-weekly-ads-deals/)
- [Rakuten vs Honey vs Capital One — JoinKudos](https://www.joinkudos.com/blog/rakuten-vs-honey-vs-capital-one-shopping---comparing-the-top-shopping-rewards-extensions)
- [Why Cannabis Menus Need Daily Updates — stupidDOPE](https://stupiddope.com/2025/07/why-cannabis-dispensary-menus-need-daily-updates-to-stay-competitive/)
- [Reddit discussion of best dispensaries — Green Gables](https://greengablespa.com/the-best-dispensaries-reddit-user-reviews/)
- [Chicago Weed Prices Guide — Maribis](https://maribisllc.com/chicago-weed-prices/)
- [Save Money at Illinois Dispensaries — Elevate Holistics](https://elevate-holistics.com/blog/save-money-at-these-dispensaries-in-illinois/)
- [Illinois Cannabis Market Analysis — Dank Reports](https://www.dankreports.com/illinois-cannabis-market-analysis/)
- [Illinois Dispensary Deals & Discounts — Verilife](https://www.verilife.com/il/offers)
- [r/ILTrees intro — Rollitup](https://www.rollitup.org/t/finally-a-subreddit-for-weed-in-illinois-r-iltrees.1006097/)
