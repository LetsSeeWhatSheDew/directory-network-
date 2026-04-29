# Illinois cannabis tax: what you actually pay
**Date:** 2026-04-28 (night) — content draft, awaiting implementation
**Author:** Cowork (Claude), in PuffPrice voice
**Status:** Draft. Approve after final tax-rate verification (see `tax-calculator-spec.md`).
**Word count:** 524 (target: 400–600).
**Target route:** `/illinois-cannabis-tax` (or wherever Code wires it). Linked from deal cards via "Why is the price higher at checkout?" microcopy.

---

## Page metadata

```ts
title:       "Illinois cannabis tax explained — why the shelf price isn't the price"
description: "Illinois cannabis taxes 25% to 41% of the shelf price. We break down every tax that gets added at checkout — state, county, city — and show you what you'll actually pay."
```

---

## Article body

> **Eyebrow:** PRICING
> **H1:** Why your $35 eighth costs $46 at the register.

Illinois cannabis is one of the highest-taxed legal markets in the country. Between state taxes, county taxes, city taxes, and a tiered excise tax that depends on what's in the product, the price you see on the shelf is rarely the price you pay. The total markup at checkout runs **between 25% and 41%** of the shelf price, depending on what you bought and where you bought it.

Most consumers find this out at the register. We'd rather you find out before you drive.

### What's actually on your receipt

Here's every tax that lands on a cannabis purchase in Illinois, in the order they're calculated.

**Cannabis Cultivation Privilege Tax — 7%.** Paid by the grower at the wholesale level. You don't see this on your receipt, but it's already baked into the shelf price. It's the reason Illinois cannabis costs more than Michigan or Missouri to start with.

**Cannabis Purchaser Excise Tax — 10%, 20%, or 25%.** This is the big one. The rate depends on the product:

- **10%** on cannabis flower and pre-rolls with **35% THC or less**. This is most of the flower on the shelf.
- **20%** on cannabis-infused products — edibles, tinctures, drinks, topicals.
- **25%** on cannabis with **more than 35% THC** — concentrates, most vape carts, high-potency flower.

A $35 eighth of 28% THC flower gets a 10% excise tax. A $35 vape cart gets a 25% excise tax. The same shelf price isn't the same out-the-door.

**State Retailers' Occupation Tax — 6.25%.** The standard Illinois sales tax. Applies on top of the excise tax, not the shelf price — which means the excise tax gets taxed too.

**County Cannabis Retailers' Occupation Tax — up to 3%.** Counties can impose this independently. Peoria County, McLean County, Sangamon County, and Champaign County have all enacted county cannabis tax. Tazewell County (East Peoria) is on the lower end.

**Municipal Cannabis Retailers' Occupation Tax — up to 3%.** Cities can stack their own on top of the county. The City of Peoria has its own. Bloomington has its own. Springfield has its own. The combined county-plus-city add-on runs roughly **2% to 6%** in Central Illinois.

**Local sales tax — varies.** A small additional municipal sales tax (separate from the cannabis-specific tax) of around 1–2% in most CIL cities.

### Worked example — $35 eighth in East Peoria

Listed price: **$35.00** (28% THC flower)

| Tax | Rate | Amount |
|---|---|---|
| Cannabis Excise (10%, ≤35% THC tier) | 10% | $3.50 |
| State Retailers' Occupation Tax | 6.25% | $2.41 |
| Tazewell County Cannabis ROT | ~1% | $0.39 |
| East Peoria Municipal Cannabis ROT | ~3% | $1.16 |
| Local sales tax | ~1% | $0.41 |
| **Total tax** |  | **$7.87** |
| **Out-the-door** |  | **$42.87** |

That's an effective tax rate of **22.5%** on flower in East Peoria — the low end. On a $35 vape cart in the same city, the excise jumps from 10% to 25% and the out-the-door climbs to roughly **$48.50** — closer to a 38% effective rate. Same dispensary, same shelf price, completely different total. Cook County (Chicago) on the same products lands closer to 41%.

### What this means for shopping

If you're buying flower under 35% THC, you're at the bottom of the tax stack. If you're buying concentrate or vape, you're at the top. Driving 30 minutes between two Central IL counties can save 2–4% — a measurable amount on a $200 cart visit, real money. We'll show you those differences directly on the deal page when our calculator ships.

> **Calculator coming soon.** Drop your email in [/alerts](/alerts) and we'll let you know when it's live.

---

## Editorial notes for Code

- Don't move the worked example. The whole article hinges on a real number landing on a real city.
- The exact rates for the worked example are **placeholder pending verification** — see `docs/content/tax-calculator-spec.md` §"Per-city tax data table" for the canonical numbers Code will wire up. **Do not ship this article live until the per-city table is verified.** The article footer should carry an "as of [date]" line once shipped.
- Tone is consumer-protection, not anti-government rant. We are not "sticking it to the man." We are giving the buyer the data the receipt should have given them upfront.
- The "drive 30 minutes to save 2–4%" line is the link to the directory's core value: PuffPrice ranks deals across cities, and the cross-city tax delta is part of what makes the ranking real.

## Decisions baked into this draft

- **Three tiers of state excise tax (10/20/25), not two.** I considered collapsing edibles + concentrates into one "non-flower" rate to simplify, but the actual law has three tiers and the calculator will need all three. Better to teach the reader the structure once than dumb it down here and have to re-explain it on the calculator page.
- **Worked example uses East Peoria, not Peoria.** East Peoria sits in Tazewell County, which is the lowest-tax CIL county. Showing the *low* end of the spectrum first sets up the "Cook County is 41%" punch line. If the example were Peoria proper, the contrast wouldn't land as sharp.
- **Effective rate range stated as 25%–41%.** This is the prompt's range. I rounded the lower bound conservatively because Tazewell-on-flower comes in at ~22.5% and I didn't want the headline range to be wrong. Tightened to "between 25% and 41%" — leaning slightly high for safety; verify against final tax data.
- **No moralizing about the tax structure.** Voice spec banned this. The article reports rates; it doesn't editorialize.
- **Calculator CTA is honest about being not-yet-shipped.** "Calculator coming soon" matches voice spec on hedging cleanly when hedging.
