# Illinois Dispensary Landscape Research

**Date:** April 17, 2026
**Owner:** Matthew
**Purpose:** Ground PuffPrice's content, copy, and feature decisions in defensible Illinois-market facts. Every "X dispensaries," "typical $Y price," or "most deals run on Z day" claim on the site should trace back to something here.

> **Source note:** Numbers below are synthesized from IDFPR filings, Illinois Cannabis Regulation Oversight Office (CROO) sales data, Headset market data, and industry press. Where sources disagree (e.g. dispensary counts of 218 vs 244 vs 271+), the authoritative answer is IDFPR's active-license PDF, which currently shows **244 active adult-use dispensaries** as of the most recent filing referenced in early 2026. Verify before citing on-site.

---

## 1. Licensed Dispensary Count

### Headline numbers
- **244 active adult-use dispensaries** in Illinois (IDFPR active-license list)
- **500-license cap** statewide under the Cannabis Regulation and Tax Act; **~137 still to be awarded**
- **218 adult-use licenses** issued under CRTA (includes some not yet operational)
- **~55 medical-only dispensaries** (many dual-license)
- **FY2025:** IDFPR issued 93 operational dispensary licenses — the most in a single year
- **~120 additional conditional licensees** working toward operational status

### What to say on the site
When PuffPrice needs a single number: **"240+ licensed dispensaries across Illinois"** is defensible and conservative. If we need precision: "244 active adult-use dispensaries (IDFPR, April 2026)."

Our existing project notes use "271+." That number appears to combine active + pending + medical-only, and it's higher than IDFPR's active-license count. Tighten it: **240–270 depending on how you count.** The page that cites this should include a sentence on what's included.

### Why this matters
Being the single-source-of-truth answer to "how many dispensaries are in Illinois" is a Zone 4 play — it's the kind of question AI systems answer and the kind of page that earns citations. See `docs/zone4-content-briefs.md`.

---

## 2. Distribution by City

### Top cities by dispensary count
| City | Dispensaries (approx) | Notes |
|---|---|---|
| Chicago | ~56 locations (Weedmaps count) | Most dispensaries by far; neighborhoods are worth their own pages |
| Naperville | ~5–9 | Affluent suburban market |
| Aurora / North Aurora | ~3–5 (Leafly shows ~3 in Aurora proper) | 2nd largest IL city; underserved by retail count |
| Joliet | ~9 | Will County seat, I-80 corridor |
| Rockford | ~3–7 | WI border draw |
| Peoria | ~3–10 (our existing doc says ~10 region) | Central IL hub; Ivy Hall on War Memorial is the reference location |
| Springfield | ~5–15 | State capital; HCI Alternatives, Ascend, High Profile |
| Champaign-Urbana | ~8 | U of I market; seasonal |
| Bloomington-Normal | ~10 | ISU + I-55/I-74 crossroads |
| Collinsville / Metro East | ~5–8 | St. Louis border draw |

Source variance is real: Weedmaps, Leafly, and IDFPR don't always agree because some are counted by physical retail location vs. license holder vs. operating status. **Pull from IDFPR's active-license PDF when the site needs to cite a specific city count.**

### Rural / underserved areas
- Large stretches of southern and western Illinois have 1 dispensary per county or fewer. This creates "dispensary near me" searches with very thin competition — good SEO capture.
- Examples: Quincy, Effingham, Danville, Marion/Carbondale. See the existing `top-10-illinois-cities-content-plan.md` for which of these are worth a page.

---

## 3. Dominant Chains (Multi-State Operators in IL)

Six MSOs effectively control the Illinois market — and especially cultivation. Knowing who owns which retail brand matters for deal attribution and for understanding how deals are set centrally (same chain = same deal across all IL locations).

| MSO / Parent | Retail Brand in IL | Approximate IL Footprint | Notes |
|---|---|---|---|
| **Green Thumb Industries (GTI)** | **RISE** | 10+ IL locations | Chicago-HQ'd; largest by license count nationally |
| **Cresco Labs** | **Sunnyside** | 10+ IL locations | River North, Elmwood Park, many suburban |
| **PharmaCann** | **Verilife** | 5+ IL locations | North Aurora, Chicago River North, others |
| **Verano Holdings** | **Zen Leaf** + Verano brand | Multiple | Also runs Windy City Cannabis in select spots |
| **Ascend Wellness Holdings** | **Ascend** | Multiple | Absorbed legacy HCI Alternatives in Springfield |
| **Curaleaf** | **Curaleaf** (formerly Grassroots Cannabis) | Multiple | National chain |

### Independents / smaller chains worth knowing
- **Ivy Hall** — Peoria, Chicago, others; opened Dec 2023 in Peoria Heights
- **Mission Dispensaries** — IL + multiple states
- **High Haven** — Darien, Elgin, Normal, Plainfield
- **NuEra** — Aurora, Champaign, Chicago
- **Windy City Cannabis** — Chicagoland
- **High Profile** — Springfield, others
- **Nature's Treatment** — Milan & Galesburg

### In 2020 (first recreational year), **six companies controlled 77% of cultivation:** Verano, Cresco, GTI, Ascend, PharmaCann, Revolution Global. That concentration persists in 2026 and is why deals from the big-6 look similar across their retail brands.

### Deal-setting implication
When a chain like Sunnyside runs "25% off Aeriz on Mondays," it runs at every Sunnyside in the state. PuffPrice can either:
- Treat that as one deal with multiple locations (cleaner UX, less clutter)
- Treat that as N deals (better map-based ranking, more cards)

Current PuffPrice architecture appears to do per-location deals. That's correct for map/GPS ranking. But we should add a concept of "parent deal" for chain-wide offers so we can answer "is this deal running elsewhere?" without duplication.

---

## 4. Deal Types — What's Common in Illinois

From observation of Verilife, RISE, Sunnyside, Ascend, Mission, and independent dispensary deal pages:

### By frequency
1. **Percent-off sales** (most common). Usually 15–40%. Brand-specific (e.g. "25% off Cresco") or category-specific ("20% off edibles").
2. **BOGO** ("buy one get one," often at 50% off or for $1). Highly visible on Weedmaps and dispensary menus during promotional windows.
3. **First-time patient / customer discounts** — typically 15–25% off first order. Nearly universal.
4. **Loyalty points / rewards programs** — chain-specific, long-running, converts over time rather than instant deal.
5. **Veteran / SSI / SSDI / medical discounts** — 10–20% off; legally permitted and commonly shown.
6. **Industry-employee discounts** — 20–25% off; Verilife is explicit about this.
7. **Happy hour / early bird** — 10% off during defined windows (Mon-Wed 8-10am and 2-4pm is a common pattern). Time-sensitive.
8. **Daily-specific deals** — "Mondays = 25% off Aeriz," "Wednesdays = 35% off Cresco," "Fridays = 25% off Ascend." Common at Mission IL.
9. **End-of-month clearance** — less formal, more common when inventory needs to move.
10. **Dollar-amount deals** — "$10/g wax," "$99/oz strain of the day," "$4.20 with any purchase" (4/20-specific).

### By redemption mechanic
- **In-store:** show to budtender, apply at checkout (most common in IL because of cash-only / strict compliance)
- **Online checkout:** apply in cart (increasingly common via Dutchie/Jane menus)
- **Loyalty code:** enter your loyalty number at checkout
- **Automatic based on customer segment:** vet/SSI/industry — verified via ID

### Implication for PuffPrice deal schema
Every deal card should carry:
- **Deal type** (% off / BOGO / first-time / vet / happy hour / daily / clearance / dollar-off)
- **Redemption type** (in-store / online / loyalty-coded / auto-by-segment)
- **Validity window** (once / daily recurring / weekly recurring / date range)
- **Eligibility** (any customer / first-time / vet / medical / industry / SSI/SSDI / birthday / loyalty tier)

If we don't already model these cleanly, this is a schema-level change worth making. It unlocks filtering AND is the structure AI systems want when citing us.

---

## 5. Typical Price Points

Illinois has among the highest cannabis prices in the US, driven by tax structure and limited retail competition. Prices have fallen ~30% since early 2025 but remain elevated vs. mature markets like CO/OR/CA.

### Flower
- **Per-gram average:** $5.87 (down from $7.87 in Jan 2025) — Headset data cited in The Marijuana Herald
- **Per-gram range:** $7.14 – $20+ (wide because strain tier matters enormously)
- **Average item price across all flower:** ~$13
- **Eighth (3.5g) range:**
  - Recreational: **$45 – $65**
  - Medical: **$35 – $55**
  - Value/clearance eighths: as low as $25
  - Top-shelf / craft: $70+
- **Ounce:** $167 average in 2026, down from $400+ in 2020

**What to show on PuffPrice:** When a deal doesn't come with an explicit original price, "eighth for $35 saves ~$15" is defensible framing. Typical savings on an eighth deal runs 20-30%.

### Edibles
- **10mg / 10-pack gummies (100mg total THC):**
  - Typical: **$20 – $35**
  - Budget: $15-20
  - Premium / live rosin / infused flower: $40-60
- Heavy tax burden on edibles because cannabis-infused products hit the 25% infused-product THC tax tier in IL.

### Vapes
- **0.5g cartridge:** **$25 – $45** typical; **$35** is a common anchor
- **1g cartridge:** $40 – $70
- **Disposable vapes:** $25 – $50 depending on size and brand
- **Live resin / rosin carts:** premium tier, $50 – $80

### Pre-rolls
- Single pre-roll (1g): $10 – $18
- Pre-roll multi-pack (5-pack): $25 – $50
- Infused pre-roll: $15 – $30 each

### Concentrates
- 1g shatter / wax / budder: $30 – $60
- 1g live resin / rosin: $50 – $100

### Tax math reality check
IL cannabis tax stacks: **20–40%+ total tax burden** depending on city/county:
- State cannabis tax (tiered by product type): 10% on flower <35% THC, 20% on cannabis-infused, 25% on flower >35% THC
- 6.25% state sales tax
- Municipal cannabis tax (up to 3%)
- Unincorporated county cannabis tax (up to 3.75%)
- Chicago/Cook County exceeds 40% combined on some products

This is why "save $20" is a **big deal** to an Illinois buyer. The tax burden means any dollar saved at the menu is a dollar saved on a larger base than most other states.

### Implication for PuffPrice copy
**Frame savings in dollars, not just percent.** "$23 off" beats "25% off" for an IL consumer who is already feeling the tax hit. Our existing design note about a "$23 callout" matches this exactly — keep it.

---

## 6. Deal Timing — When Dispensaries Run Their Best Deals

### By day of week
- **Monday** — most common "big deal" day. Slow retail traffic day, so dispensaries push BOGO / 25% off to drive footfall.
- **Wednesday** — mid-week promo day; common for brand-specific specials (e.g. "Wake & Bake Wednesday").
- **Friday** — second-highest deal density, but smaller discounts because footfall is naturally higher.
- **Weekend (Sat/Sun)** — fewer discounts; some early-bird specials before 10am.

### By time of day
- **Early bird (8–10am)** — 10% off during the first 2 hours dispensary is open. Very common in IL.
- **Happy hour (2–4pm or 4–7pm depending on location)** — similar 10% off, afternoon slump fill.
- **4:20 hour** — some dispensaries offer 20+ minutes of deeper discount starting at 4:20 PM, especially in the 4/20 window.

### By time of month
- **End of month** — inventory clearance is real; look for "everything above 28% THC" or "all Cresco flower" deals in the last 5 days of the month.
- **1st of month** — fresh new promos launch for the new month's advertising cycle.

### By calendar
- **4/20** — biggest cannabis retail day of the year, called "cannabis Black Friday." In 2026, 4/20 falls on a **Monday**, and dispensaries are running **3-day windows (Sat Apr 18 – Mon Apr 20)**. Discounts run 25–40% off.
- **Greens Day / Black Wednesday (day before Thanksgiving)** — the second-biggest retail day of the year.
- **Green Friday** — post-Thanksgiving, dispensaries run weekend-long discounts.
- **710 (July 10, concentrates holiday)** — modest bump, concentrates-focused deals.
- **Birthday of each brand / anniversary deals** — one-off but promoted heavily.

### Implication for PuffPrice
**The "when should I shop?" answer is a content page.** A page that answers "what day of the week has the best cannabis deals in Illinois?" will capture search traffic AND be AI-citable. See Zone 4 content briefs for specific suggestions.

**PRO alerts should emphasize Monday mornings.** If someone subscribes for a daily digest, Monday morning is the highest-value send because it's when the week's best deals go live.

---

## 7. Other Market Realities Worth Knowing

### Cash-only friction
Most IL dispensaries are **cash-only** for federal banking reasons. Some accept debit. On-site ATMs are common but charge $3-5 fees. This is a universal IL pain point that a deal app can surface:
- Show "cash-only" / "debit accepted" on each dispensary
- Show ATM-on-site badge
- Include the ATM fee in "total savings" calculations if we want to be sharp

### Hemp-derived competition
A significant share of the 2025 IL sales decline (sales dropped 13% to $1.5B) was attributed to **hemp-derived THC products** sold at smoke shops outside the regulated system. PuffPrice is in the regulated-dispensary lane; worth noting this is a tailwind (dispensaries need deal-driven foot traffic more than ever to compete with untaxed hemp alternatives).

### Supply constraints
Only ~29 of 86 craft growers are actively operating. Flower supply tightens periodically, and dispensaries run **surge pricing** — the opposite of a deal. A PuffPrice PRO feature that tracks **when an item's price dropped** would catch supply-glut moments.

### Out-of-state buyers (purchase-limit asymmetry)
- IL residents: 30g flower / 5g concentrate / 500mg edibles
- Out-of-state: **half** of each
- Border dispensaries (Rockford near WI; Collinsville near MO; Danville near IN; Quincy near IA/MO) see a lot of out-of-state traffic despite the lower limits.

This suggests border-city pages should explicitly address **out-of-state visitors** and frame deals in terms of "best dispensary deal near [WI/MO/IA border]."

---

## 8. Market Opportunity Summary for Matthew

- **244 active dispensaries, 6 MSOs dominate, prices still among the highest in the US.** Consumers are price-sensitive by necessity.
- **Deal landscape is messy** — every chain has its own page, every Dutchie/Jane menu hides deals per store, Weedmaps dilutes IL in 30-state scope. PuffPrice is the only state-specific aggregator.
- **Deals cluster on Mondays + end-of-month + 4/20 + Green Wednesday.** These are PRO-tier alert trigger moments.
- **"How many dispensaries are in Illinois" is a citable question with no clean canonical answer online.** Owning that answer (with a live, IDFPR-referenced number) is a Zone 4 quick win.
- **Tax-driven pricing means $ saved > % saved in consumer psychology.** Our $23 callout framing is correct.

---

## Sources

- [IDFPR active adult-use dispensary licenses](https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/licenselookup/adultusedispensaries.pdf)
- [IDFPR Jan-Feb 2026 sales figures](https://idfpr.illinois.gov/news/2026/adult-use-cannabis-sales-figures-released-jan-feb-2026.html)
- [Cannabis Regulation Oversight Office](https://cannabis.illinois.gov)
- [Cannabis.IL dispensary locations](https://cannabis.illinois.gov/about/locations.html)
- [Illinois Marijuana Statistics 2026](https://illinoiscannabis.org/statistics)
- [Illinois Average Cost of Marijuana 2026](https://illinoiscannabis.org/business/cost)
- [Headset IL market data](https://www.headset.io/markets/illinois)
- [Illinois Marijuana Sales Reach $242M in 2026](https://themarijuanaherald.com/2026/03/illinois-marijuana-sales-reach-242-million-in-2026-prices-down-over-30-from-early-2025/)
- [Big Business Runs Illinois Cannabis — South Side Weekly](https://southsideweekly.com/big-business-runs-illinois-cannabis/)
- [GTI, Cresco, Revolution, PharmaCann, Grassroots, Verano — Grown In](https://grownin.com/gti-cresco-revolution-pharmacann-grassroots-verano/)
- [Illinois Cannabis Retail March 2026](https://www.cann.dev/illinois-cannabis-retail-march-2026/)
- [Weed Prices in Springfield, Illinois](https://maribisllc.com/weed-prices-in-springfield/)
- [Find Illinois' best 420 dispensary deals](https://illinoisnewsjoint.com/find-illinois-best-420-dispensary-deals/)
- [420 Retail Guide — Cova](https://www.covasoftware.com/420-retail-guide-for-cannabis-dispensaries)
- [Why Are Illinois Dispensaries So Expensive — Dimov Tax](https://dimovtax.com/illinois-dispensaries-so-expensive/)
- [Illinois Cannabis Market Analysis — Dank Reports](https://www.dankreports.com/illinois-cannabis-market-analysis/)
- [5 Best Chicago Dispensary Deals — Maribis](https://maribisllc.com/chicago-dispensary-deals/)
