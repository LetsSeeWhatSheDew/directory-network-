# Truth-in-Pricing Research — Illinois Cannabis

**Date:** April 18, 2026
**Owner:** Matthew
**Purpose:** Document the honest math of Illinois cannabis pricing. Shelf price ≠ what you pay. Every dollar-saved claim on PuffPrice traces back to one of the calculations here. Used as the factual base for `/start`, `/illinois-tax-guide`, and the PuffPrice Promise.

> **Source basis:** Illinois Department of Revenue (IDOR) Cannabis Tax FAQ, IDOR Bulletin FY 2026-06 on MCAN/CCAN rates effective Jan 1 2026, Cannabis Regulation and Tax Act (CRTA, 410 ILCS 705), Civic Federation tax analysis, Illinois Municipal League rate schedules, and dispensary menus from the top six MSOs (RISE, Sunnyside, Verilife, Zen Leaf, Ascend, Curaleaf). Claims are flagged when they are interpretation rather than statute.

---

## 1. Illinois cannabis tax structure — the full stack

Illinois taxes adult-use (recreational) cannabis in four layers. All four apply to the same pre-tax purchase price and are summed at checkout.

### Layer 1 — State Cannabis Purchaser Excise Tax (Cannabis Cultivation Privilege / Purchaser Excise)

Tiered by product type. This is the big one.

| Product type | Tax rate |
|---|---|
| Cannabis flower or non-infused products with adjusted THC **at or below 35%** | **10%** |
| Cannabis flower or non-infused products with adjusted THC **above 35%** | **25%** |
| Cannabis-infused products (edibles, tinctures, topicals, beverages) | **20%** |

**Important classification nuance.** Under CRTA, "cannabis-infused product" means a product containing cannabis *combined with a non-cannabis ingredient* — edibles, drinks, topicals, tinctures. **Vape cartridges, concentrates, live resin, rosin, distillate, and pre-rolls are NOT "infused products."** They're taxed on the THC-potency scale (10% or 25%). Because almost every vape cart and concentrate on the IL shelf tests above 35% THC, in practice they hit the **25% rate**. Pre-rolls made from ≤35% THC flower hit 10%; infused pre-rolls still hit the 25% tier because the infusion pushes total THC above 35% in nearly every product on the market.

### Layer 2 — State Retailers' Occupation Tax (general sales tax)

**6.25%** of the purchase price. Applies to all adult-use cannabis on top of the excise tax.

### Layer 3 — Municipal Cannabis Retailers' Occupation Tax (MCAN)

Home-rule municipalities may impose up to **3%** on adult-use cannabis sales. Nearly every municipality with a dispensary has maxed this at 3%. Collected in ¼-point increments per statute. As of the January 1, 2026 rate bulletin (FY 2026-06), Chicago, Naperville, Aurora, Joliet, Rockford, Peoria, Springfield, Bloomington, Normal, Champaign, Urbana, and the Metro East municipalities are all at 3%.

### Layer 4 — County Cannabis Retailers' Occupation Tax (CCAN)

Counties may impose up to **3.75% in unincorporated areas** and **3% in incorporated areas within the county**. Cook, DuPage, Will, Lake, Kane, Winnebago, Peoria, Sangamon, McLean, Champaign, Madison, and St. Clair counties are all at or near the max in their incorporated areas.

### Plus the general local sales-tax stack

On top of the four cannabis-specific layers, adult-use cannabis is subject to **locally-imposed general retailers' occupation taxes** in the same way as other merchandise:

- **Home Rule Municipal Retailers' Occupation Tax** — up to 2% (Chicago: 1.25%)
- **County Home Rule Retailers' Occupation Tax** — varies (Cook County: 1.75%)
- **Regional Transportation Authority (RTA) Retailers' Occupation Tax** — 1.0% in Cook County, 0.75% in the collar counties (DuPage, Kane, Lake, McHenry, Will)
- **Metro East Transit District** — applies in parts of Madison and St. Clair counties
- **Special business district, fire, mass transit, and flood-prevention taxes** — where imposed

This is the reason the combined burden varies from roughly 20% downstate to **over 41%** on some Chicago transactions.

### Medical cannabis — different rules

Qualified patients with an active Illinois medical cannabis card pay **no excise tax** and only **1% state retailers' occupation tax** (the same rate as prescription drugs and most food). Medical cannabis is **exempt from most local retailers' occupation taxes**, with two narrow exceptions: the RTA Retailers' Occupation Tax and the Metro East Transit District Retailers' Occupation Tax still apply where imposed.

**Net effect:** medical patients in Cook County pay about 2% total tax on cannabis. Recreational buyers in the same store pay 26–41% on the same product. This is the single biggest reason medical is still worth the card-application cost for anyone who uses cannabis regularly and qualifies.

---

## 2. What a $35 eighth actually costs at the register

The example used throughout PuffPrice copy. Assumes an eighth of flower (3.5g) with adjusted THC ≤35% — the most common flower product on an Illinois shelf.

### Chicago (Cook County, recreational)

| Tax line | Rate | On $35 shelf |
|---|---|---|
| State Cannabis Excise (≤35% THC flower) | 10% | $3.50 |
| State Retailers' Occupation Tax | 6.25% | $2.19 |
| Chicago Home Rule ROT | 1.25% | $0.44 |
| Cook County Home Rule ROT | 1.75% | $0.61 |
| RTA ROT (Cook County) | 1.00% | $0.35 |
| Chicago Municipal Cannabis ROT | 3.00% | $1.05 |
| Cook County Cannabis ROT (in a municipality) | 3.00% | $1.05 |
| **Total tax** | **26.25%** | **$9.19** |
| **Out-the-door price** | | **$44.19** |

That $35 eighth is a $44 eighth at the register.

### Peoria (City of Peoria, Peoria County, recreational)

Peoria composite general sales tax is approximately 9.00% (state 6.25% + Peoria County 1.00% + City of Peoria home rule 1.75%). Peoria city has maxed MCAN at 3%; Peoria County charges 3% on sales within municipalities.

| Tax line | Rate | On $35 shelf |
|---|---|---|
| State Cannabis Excise (≤35% THC flower) | 10% | $3.50 |
| State Retailers' Occupation Tax | 6.25% | $2.19 |
| City of Peoria Home Rule ROT | 1.75% | $0.61 |
| Peoria County ROT | 1.00% | $0.35 |
| Peoria Municipal Cannabis ROT | 3.00% | $1.05 |
| Peoria County Cannabis ROT (in a municipality) | 3.00% | $1.05 |
| **Total tax** | **~25.00%** | **$8.75** |
| **Out-the-door price** | | **~$43.75** |

A Peoria eighth at the same shelf price comes out roughly **$0.44 cheaper** at the register than a Chicago one. Not a huge difference on an eighth — but on an ounce it's about $3–4.

### Same eighth, if the flower is high-THC (>35%)

Replace the 10% excise with 25%. Chicago out-the-door jumps from $44.19 to **$49.44** on a $35 shelf. Most top-shelf craft flower is above 35% THC, which is why craft eighths at $55–65 on the shelf sticker out at $70–80.

### Same exercise, for edibles

Replace 10% with 20% (the infused-product rate). A $25 shelf 10-pack of 10mg gummies in Chicago:

$25 × (1 + .2 + .0625 + .0125 + .0175 + .01 + .03 + .03) = **$25 × 1.3625 = $34.06 at the register.**

### Same exercise, for vapes

A $45 half-gram vape cart in Chicago — because the cart's THC is almost always above 35% — carries the 25% excise:

$45 × (1 + .25 + .0625 + .0125 + .0175 + .01 + .03 + .03) = **$45 × 1.4125 = $63.56 at the register.**

A $45 cart is a $64 cart.

### Why prices vary so much between dispensaries for the same product

Four reasons, roughly in order of impact:

1. **Wholesale cost differs.** MSOs that operate their own cultivation (RISE/GTI, Sunnyside/Cresco, Verilife/PharmaCann, Zen Leaf/Verano, Ascend, Curaleaf) get their house brands at internal cost. Independents buy the same products at wholesale markup. That's 10–25% baked into the shelf.
2. **Promotional calendars differ.** Chain A might be running a brand-specific day (35% off Cresco on Wednesdays); chain B is running a category day (20% off edibles). Same product, same week, different prices.
3. **Inventory pressure.** End-of-month clearance, end-of-quarter drops, harvest arrivals, and supply-glut moments all push prices down locally without being a formal "sale."
4. **Local tax differences.** A 1–2 percentage-point difference in combined tax rate between two cities makes a real dollar difference on a $100 basket.

None of this is hidden. All of it is invisible to a shopper who hasn't seen it laid out. That's the gap PuffPrice exists to close.

---

## 3. Common pricing tricks — how dispensary deals mislead

Most of what follows is legal and industry-standard. Labeling it "trickery" is a consumer-protection frame, not a legal claim. These tactics are common at every major IL chain.

### The "BOGO where the free one is the cheap one" trap

Mechanic: "Buy one 10-pack of gummies, get one free." Shopper reads it as "two 10-packs for the price of one." The fine print: **the free item is the lower-priced of the two selected.** A shopper who picks a premium 10-pack ($35) and a budget 10-pack ($18) pays $35 and gets the $18 pack free. The effective discount is 34%, not 50%.

Worse version: **"Mix-and-match BOGO, free item must be equal or lesser value."** Shopper grabs two identical items assuming 50% off — correct. Shopper grabs a premium + budget combo assuming 50% off across the board — they get 34% off. Most shoppers don't run the math.

**Honest framing:** "Buy one, get one at 50% off" on matched items is an honest 25% off total. On mismatched items it's 17–34%. PuffPrice should label BOGO deals with the **effective percentage off** calculated on the full cart, not the marketing language.

### The "X% off inflated shelf" move

Mechanic: A brand raises the MSRP on a product by 15% on the first of the month. On day 5, a dispensary runs a "30% off" sale on that brand. The effective discount from the old price is ~20%, not 30%.

This is very hard to catch without price history. It is specifically why PuffPrice PRO's price-history chart is a conversion feature for Marcus-type buyers — without history, you can't tell.

**Honest framing:** a deal is a deal relative to the **rolling 30-day average shelf price**, not relative to today's MSRP. If we ever advertise a savings amount on PuffPrice, it should be against the 30-day average, and we should say so.

### The "bundle makes you buy more than you wanted" anchor

Mechanic: "Buy 3 eighths, get 20% off." The shopper walked in wanting one eighth. They leave with three. They spent 2× more than they would have, and they'll smoke through it faster.

This is not a bad deal **if you were already going to buy three.** It is a terrible deal if the bundle induced the extra purchase. The honest consumer test: **if you weren't going to buy it anyway, a deal on it isn't savings — it's spending.**

### The "free gift with $50 purchase" escalator

Mechanic: Shopper walks in wanting $38 of product. The "free $5 pre-roll with $50+ purchase" sign pushes them to add $12 to qualify. They got a $5 pre-roll for $12 of additional purchase. They lost $7 and call it a deal.

Again, not wrong *if the shopper wanted that $12 item anyway.* It becomes a trick only when the minimum forces an otherwise-unwanted add-on.

### The "loyalty points with redemption minimums" slow drain

Mechanic: Every $1 earns 1 point. 100 points = $5 off. Points expire 90 days after earned. $100 of purchases earned a $5 discount — a 5% effective return — but only if you remember to redeem before expiry, and only if your next purchase meets the $50 minimum to redeem.

Loyalty is legitimate when your spend is steady. It's a slow drain when you're infrequent, because expiry eats most of the value before you can use it.

### The "flash sale on products that were marked up first" pattern

Mechanic: Inventory that's been sitting at $35 gets re-priced to $40 on Monday morning. Tuesday at 4:20pm, a "flash sale — one hour only — 20% off" drops the price to $32. Shopper feels they got $8 off. They got $3 off.

Flash sales with artificial scarcity are the hardest for consumers to assess in the moment. Price history across dispensaries is the only honest defense.

### The "first-time patient discount, every time" illusion

Not really a trick, but commonly misunderstood. Most IL dispensaries offer 15–25% off to first-time customers. If you shop at five different dispensaries once each, you get the first-timer rate five times. That's a legitimate strategy for occasional shoppers like Sarah. It's not a strategy for regulars like Marcus, who lose access to it after the first visit.

---

## 4. What "real savings" actually means

### The out-the-door test

Any claim of savings should be measured on out-the-door price, not shelf price. A "30% off" on a shelf of an eighth in Chicago where taxes are 26% is actually a different dollar-savings than a "30% off" in Peoria where taxes are 25%. PuffPrice should display **both** where possible: the shelf discount AND the at-the-register cost, because the register cost is what the wallet feels.

### Price per gram as the honest comparison metric

Different dispensaries package at different quantities (1g single, 3.5g eighth, 7g quarter, 14g half, 28g ounce). The only way to compare meaningfully is **price per gram**, at the register, after taxes.

Worked example:
- Dispensary A: eighth for $35 on sale in Peoria → $43.75 otd → **$12.50/g**
- Dispensary B: quarter for $60 normal price in Peoria → $75.00 otd → **$10.71/g**
- Dispensary C: eighth for $45 with "30% off" in Chicago → $31.50 shelf → $39.77 otd → **$11.36/g**

Even though A looks like "a deal" and C advertises the biggest percentage off, **B is actually the cheapest per gram** — and B isn't on sale at all. Most shoppers would pick A or C.

### The "$30 vs $40 when both are on sale" test

- Eighth at $30 in Peoria out-the-door: $30 × 1.25 = **$37.50** → $10.71/g
- Eighth at $40 in Chicago out-the-door: $40 × 1.2625 = **$50.50** → $14.43/g

The $30 eighth saves $13 at the register vs. the $40 eighth — not $10. When people compare flat shelf prices across cities, they're comparing the wrong number. The ratio of the out-the-door prices is bigger than the ratio of the shelf prices because Chicago's tax stack amplifies every pre-tax dollar.

### When a deal is genuinely good

Three tests, any one of which is sufficient:

1. **Price-per-gram at the register is below the 30-day rolling average** for that product across the stores you'd realistically drive to.
2. **The discount applies to something you were going to buy anyway** in the next 7 days (i.e., it's a timing discount, not an induced-purchase discount).
3. **The out-the-door dollar savings exceeds the round-trip cost** (gas + time valued at even $15/hour) of reaching the dispensary offering it vs. your default.

A deal that fails all three is marketing theater. PuffPrice's job is to surface the deals that pass at least one of them.

---

## 5. A plain-English "how to compare cannabis prices" guide

Write this for a Sarah-type user who has never shopped twice in the same month. Short sentences. No jargon.

> **How to tell if a cannabis deal is actually good.**
>
> 1. **Ignore the percentage. Look at the dollar.** A 30% off on a $50 item is $15. A 20% off on a $60 item is $12. The higher percentage isn't always the bigger dollar save.
> 2. **Add the tax in your head.** Whatever the shelf says, assume **about 26% more in Chicago** and **about 25% more downstate** when you're comparing. A $35 shelf is ~$44 at the register in Chicago.
> 3. **Compare per gram, not per package.** An eighth is 3.5 grams. A quarter is 7 grams. "Eighth for $35" is $10/g. "Quarter for $60" is $8.57/g. The quarter is cheaper per gram even though the bigger number scares you.
> 4. **If you weren't going to buy it, a deal on it isn't savings.** A free pre-roll that requires $50 of other purchases isn't free if you only wanted $35 of stuff.
> 5. **BOGO isn't always 50% off.** If the "free" item is lower-priced, you're getting less off than you think. Ask what the discount works out to as a total percent off your cart.
> 6. **First-time discounts are real.** If you've never been to this specific dispensary, you likely qualify for 15–25% off your first order. Ask.
> 7. **Medical cards change everything.** If you qualify, medical cannabis in Illinois is taxed at about 2% total instead of 26–41%. The card pays for itself inside a month for anyone buying weekly.

This is the tone the `/start` page and the `/illinois-tax-guide` page both pull from.

---

## 6. Illinois examples — real comparisons a reader can verify

A $35 shelf-price ≤35% THC eighth, purchased recreational, same deal, different city:

| City | Combined tax | Out-the-door | $ paid above shelf |
|---|---|---|---|
| Chicago (Cook, downtown/near north) | 26.25% | $44.19 | +$9.19 |
| Peoria (City of Peoria, Peoria County) | ~25.00% | ~$43.75 | +$8.75 |
| Springfield (City of Springfield, Sangamon County) | ~24.75% | ~$43.66 | +$8.66 |
| Aurora (Kane County, 0.75% RTA) | ~24.50% | ~$43.58 | +$8.58 |
| Naperville (DuPage, 0.75% RTA) | ~24.25% | ~$43.49 | +$8.49 |
| Bloomington (McLean, no RTA) | ~23.25% | ~$43.14 | +$8.14 |
| Rockford (Winnebago, no RTA) | ~23.50% | ~$43.23 | +$8.23 |

Downstate pricing advantage is real but modest. The bigger driver is **which dispensary** you shop, not **which city** — because dispensary wholesale-cost and promo calendar differences swamp the 1–3 percentage-point geographic tax variance.

A $35 eighth that's **20% off** at a Peoria dispensary but **not on sale** at a Chicago dispensary:
- Peoria: $28.00 shelf × 1.25 = **$35.00** otd
- Chicago: $35.00 shelf × 1.2625 = **$44.19** otd
- The same customer pays **$9.19 more** in Chicago for flower that was advertised at the same sticker price, because of tax plus missed deal.

That $9.19 is a roundtrip Metra ride to Naperville. That's the kind of math PuffPrice should be making visible.

A $45 shelf half-gram vape (>35% THC), not on sale, Chicago vs. Peoria:
- Chicago: $45 × 1.4125 = **$63.56** otd
- Peoria: $45 × 1.3900 (approx) = **$62.55** otd
- Very small difference — because vapes are already hit hard by the 25% THC-tier excise and the tax amplifies at the same proportion everywhere.

---

## 7. Key takeaways for PuffPrice copy

1. **Lead with the dollar, not the percent.** Our $23-callout design decision is already doing this. Keep it.
2. **Display out-the-door prices where we can.** Even as an estimate. "You'll pay about $44 at the register" is more honest than "$35 eighth."
3. **Flag the product-type tax tier in dev.** Flower ≤35% vs. >35% vs. infused vs. vape/concentrate carries completely different tax math. If the deal card doesn't know which tier, the savings estimate is wrong.
4. **Price history is not a luxury feature. It's an anti-deception feature.** Without it, shoppers can't see the "inflated shelf, then marked down" trick. Build it toward the free tier as much as Stripe-PRO economics allow.
5. **Medical vs. rec is first-class.** Dan has a card; Marcus and Sarah don't. The same deal means $8 or $2 in tax depending on card status. Show both on every deal page.
6. **"Weren't going to buy it? Not savings." is a brand value.** Put it somewhere durable — probably in the PuffPrice Promise.

---

## 8. Sources and references

- [Cannabis Taxes — Illinois Department of Revenue](https://tax.illinois.gov/research/taxinformation/other/cannabis-taxes.html)
- [Cannabis Tax Frequently Asked Questions — IDOR](https://tax.illinois.gov/research/taxinformation/other/cannabis-tax-frequently-asked-questions.html)
- [FY 2026-06 Bulletin — MCAN and CCAN Rate Changes, Effective January 1, 2026](https://tax.illinois.gov/research/publications/bulletins/fy-2026-06.html)
- [Municipal Cannabis Retailers' Occupation Tax (MCAN) — IDOR](https://tax.illinois.gov/localgovernments/mcan.html)
- [Illinois Marijuana Tax Revenue 2026 — IllinoisCannabis.org](https://illinoiscannabis.org/business/tax)
- [Illinois Marijuana Tax Handbook 2026 — SalesTaxHandbook](https://www.salestaxhandbook.com/illinois/marijuana)
- [Overview of the Illinois Cannabis Regulation and Tax Act — MPP](https://www.mpp.org/states/illinois/overview-of-the-illinois-cannabis-regulation-and-tax-act/)
- [2026 Recreational Marijuana Taxes by State — Tax Foundation](https://taxfoundation.org/data/all/state/recreational-marijuana-taxes/)
- [Illinois Dispensary Tax Calculator — Cannabiz Credit Association](https://www.cannabizcredit.com/blog/illinois-dispensary-tax-calculator)
- [Legal Recreational Marijuana in Illinois — EarthMed](https://earthmed.com/patient-information/recreational-marijuana)
- Cross-referenced with internal `docs/illinois-market-research.md` (Section 5, Tax math reality check).

**Last verified:** April 18, 2026. MCAN/CCAN rates are per the January 1, 2026 IDOR bulletin; re-verify before the July 1, 2026 effective date of any mid-year rate changes.
