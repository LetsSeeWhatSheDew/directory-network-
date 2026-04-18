# How We Source Our Data

**Date:** April 18, 2026
**Owner:** Matthew
**Purpose:** Drop-in content for a `/data-sources` (or `/how-we-source-data`) page. This page exists to answer the skeptic asking "is this legit?" — not to market PuffPrice. Honest, specific, no marketing language.

> **Source basis:** `docs/illinois-market-research.md` (Section 4, deal types and redemption), PuffPrice project state and architecture notes, the PuffPrice Promise (`docs/puffprice-promise.md`). Written to hold up under scrutiny from Dan (power user) without alienating Sarah (occasional).

---

## Page H1

> **# How we source our data**

## Opening paragraph

> PuffPrice tracks active deals at licensed Illinois dispensaries. We're not a dispensary, we don't sell cannabis, and we don't take affiliate commissions that would change which deals we show you. What follows is exactly where our data comes from, how often it refreshes, and what our limits are — so you can decide whether to trust it. Fair questions. Here are the answers.

---

## Section 1 — Where deal data comes from

**H2:** Where the data comes from

Three sources, in roughly the order we rely on them:

1. **Public dispensary menus and websites.** Every Illinois dispensary publishes its own deal page — usually on its own site and usually on a Dutchie or Jane menu. We monitor the ~240 licensed adult-use dispensaries in Illinois and pull what they publish. When a chain (RISE, Sunnyside, Verilife, Zen Leaf, Ascend, Curaleaf) runs a statewide promotion, we capture it once and note which locations it applies to.

2. **Dispensary submissions.** Some dispensaries email deals directly to us through a submission form. These are verified against the dispensary's own public menu before they go live. If the submission doesn't match the public menu, the public menu wins.

3. **Tips from shoppers.** If you went to a dispensary and the deal at the register was different from ours, you can email **hi@puffprice.com** and we'll re-verify. Tips are the second-fastest way we catch a stale deal; the first is our own monitoring loop.

We do **not** scrape Weedmaps, Leafly, iHeartJane aggregations, or Dutchie store listings as primary sources. Those are aggregators, like us, and we'd rather go to the original.

---

## Section 2 — How often it updates

**H2:** How often it updates

Deal data is pulled on a rolling basis, with each dispensary re-checked at least **once per day** during operating hours. Chain-wide promotions are checked twice daily because they change more often. Weekday mornings and Friday afternoons are our heaviest refresh windows, because that's when dispensaries publish new deals.

Every deal on PuffPrice shows the time it was last confirmed. If a deal was last confirmed more than 24 hours ago, we flag it. If more than 72 hours, we hide it until a re-check clears it.

---

## Section 3 — What "active deal" means (and doesn't)

**H2:** What "active deal" means — and what it doesn't guarantee

A deal marked "active" on PuffPrice means: **we pulled it from the dispensary's published menu or confirmed source within the last day, and it was advertised as available at the time we saw it.**

It doesn't guarantee:

- That the specific item will still be in stock when you get there. Inventory moves fast, especially on 4/20 week and on end-of-month clearance.
- That every customer qualifies. Some deals require a loyalty account, medical card, vet/SSI/SSDI status, or first-time-customer eligibility. Those conditions are on the deal card when we know them.
- That the dispensary will honor it exactly as described. Budtenders are human, menus have typos, and promotions occasionally get pulled without notice. **Always verify at the register before you commit to purchase.**

---

## Section 4 — How to report a wrong or expired deal

**H2:** How to report a deal that's wrong

If a deal on PuffPrice doesn't match what's on the dispensary menu or at the register, tell us. One line in an email is fine:

> Subject: Wrong deal
> "The [deal name] at [dispensary name, city] wasn't honored / was expired / was different. I went on [date]."

Email **hi@puffprice.com**. We investigate the same day. If the deal was wrong, we update the listing and — if it was a significant error — we note the correction in the deal's history. You don't need an account to report. You don't need to justify anything.

---

## Section 5 — Why some dispensaries have more data than others

**H2:** Why some dispensaries show more deals than others

Three patterns explain most of the variation:

- **Chain vs. independent.** Large chains (RISE, Sunnyside, Verilife) run promotional calendars at the state level, so their locations often show the same 3–6 deals per week. Independents run deals on a more ad-hoc basis — fewer deals at any given time, but sometimes deeper discounts.
- **Daily-specials volume.** Some dispensaries structure their pricing around "Mondays = 25% off Aeriz, Wednesdays = 35% off Cresco, Fridays = 20% off edibles." Those show up as multiple deals on PuffPrice. Others keep a stable price floor and only run 2–3 promos a month. Both models are valid; they just look different on our list.
- **How publicly the menu is updated.** A handful of IL dispensaries still publish deals mainly in-store and on Instagram, not on their websites. Those are harder for us to track until we work out a submission relationship. If you're a dispensary in this situation, email hi@puffprice.com — we'll set up a direct submission feed at no cost.

Fewer deals listed does not mean fewer deals running. It often means the dispensary updates its menu less publicly than others.

---

## Section 6 — What we're working on

**H2:** What we're working on

Honest about the limits. In rough priority order:

- **Price history.** Showing how a deal compares to the 30-day rolling average for the same product. This is the single best defense against the "inflated-shelf, then discounted" trick. In development.
- **Stock visibility.** Knowing whether the specific item is in stock before you drive there. Dependent on dispensary APIs. Available for a subset of chains today; expanding.
- **Medical vs. recreational pricing side by side.** Most dispensaries publish one or the other. Our goal is to show both where both exist.
- **Chain-wide deal deduplication.** When Sunnyside runs "25% off Aeriz" at every IL location, you should see that as one deal with a location picker — not as 10 near-duplicates on the list.
- **Out-of-state purchase limits.** Reminders on border dispensary pages (Rockford, Collinsville, Danville, Quincy) about the 15g/2.5g/250mg limits for non-IL residents.

None of this is shipped yet as of April 2026. We'll update this page as each lands.

---

## Closing paragraph

> We take sourcing seriously because we know trust is the whole product. If you think we got something wrong — or if you just want to ask how something works — email us at hi@puffprice.com. A real person reads every one of those.

---

## Implementation notes for Code

- Page route suggestion: `/data-sources` or `/how-we-source-data`. Link from the footer and from the end of `/about` and `/start`.
- Every H2 should be a jump anchor. In-page nav is useful because this page will grow as we ship.
- The PuffPrice Promise statements (see `docs/puffprice-promise.md`) echo through this page. Don't re-state them here — link or reference.
- The word "currently" and the date stamp at the top should update when the doc does. Stale "as of" dates on a trust page are self-defeating.
- This page is designed for skeptics. Keep the voice steady and the admissions honest. Don't add marketing lines ("we're passionate about transparency"). Those undo the page's purpose.
