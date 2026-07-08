# Distribution Draft Pack — July 2026
**Author:** Cowork (Claude)
**Date:** 2026-07-08
**Status:** ⚠️ **DRAFT — NOTHING HERE IS APPROVED OR PUBLISHED.** Every post below awaits Matthew's explicit sign-off. No email sent, no post published.

---

## ‼️ READ FIRST — DATA BLOCKER (this changes what the posts can honestly say)

The brief asked for three Reddit posts built on **real dollar prices with the actual out-the-door (OTD) math** — e.g. "every deal under $25 OTD in Peoria." I queried the live Supabase DB (project ref `hnbjufmtmrhexmdrfubw`, read-only) on 2026-07-08. Here is the honest state:

| Check | Result |
|---|---|
| Active Central-IL deals (`project_tag='green'`, `is_active=true`) | **9** |
| …of those, with a real `sale_price` | **0** |
| …with a real `original_price` (baseline) | **0** |
| …with `price_per_gram` | **0** |
| …with a real `expires_at` | **0** |
| Green deals ever (active or not) with a baseline+sale **price pair** | **0** |
| Price-pipeline tables `menu_items` / `price_baselines` / `menu_snapshots` / `deal_price_history` | **empty (0 rows each)** |
| `anchor_skus` (reference baseline prices) | 54 rows, but **observed 2026-04-22 (≈11 weeks stale), several explicitly extrapolated, IL-wide (not Central-IL-specific)** |

**Consequences, per the session's hard rules ("real prices and real `expires_at`; if you can't verify a deal, it doesn't go in the draft"):**

1. **The dollar-denominated "under $25 OTD" posts cannot be written from real data.** There are no dollar prices attached to any current deal. I will not invent them. → The dollar version is marked **INSUFFICIENT DATA / BLOCKED** below.
2. **The "how much do sales actually save you" myth-buster requires baseline-vs-sale price pairs. There are zero.** → **INSUFFICIENT DATA — skipped**, exactly as the brief instructed ("skip if INSUFFICIENT DATA").
3. **What CAN be posted honestly today:** a roundup of the 9 real, currently-verified **percentage** promos, by area, with dispensary names and source links, plus a reusable IL tax/OTD framework the reader applies themselves. That is real and postable. It is *not* the dollar-OTD post the brief envisioned — it's the honest maximum the current data supports. I've drafted it that way and flagged the gap in-line.

`anchor_skus` is a *reference scaffold* (what flower "typically" costs in IL), not current observed deals. I have **not** used it to state any current deal price. It appears once below only as clearly-labeled April context, and could be dropped entirely.

**What unblocks the specified posts:** the deal scraper populating `sale_price` / `original_price` (and ideally `price_out_the_door`) on real menu items — i.e. the `menu_items` → `price_baselines` pipeline going live. Until then, dollar-OTD posts are not possible without fabrication.

---

## Verified deal inventory used in these drafts (live DB, 2026-07-08)

All 9 are `source='website'` (direct dispensary sites), `is_active=true`, `verified_at` = 2026-07-08 (early UTC). None carries a price or an expiry; all are standing customer-segment or category percentage discounts.

| Dispensary | City | Deal | Discount | Source |
|---|---|---|---|---|
| Cookies Dispensary Bloomington | Bloomington | First-time customer | 25% off | cookiesbloomington.com/specials |
| Cookies Dispensary Bloomington | Bloomington | Military | 20% off | cookiesbloomington.com/specials |
| Cookies Dispensary Bloomington | Bloomington | Pre-rolls | 30% off | cookiesbloomington.com |
| NOXX East Peoria | East Peoria | Edibles | 20% off | noxx.com/specials |
| Ivy Hall Dispensary | Peoria | Veterans | 20% off | ivyhalldispensary.com |
| Cookies Peoria Heights | Peoria Heights | Flower | 25% off | cookiespeoriaheights.com |
| Cookies Peoria Heights | Peoria Heights | First-time customer | 25% off | cookiespeoriaheights.com/specials |
| Cookies Peoria Heights | Peoria Heights | Vapes | 20% off | cookiespeoriaheights.com |
| SHARE (Springfield) | Springfield | Senior (55+) | 10% off | everyoneshares.com |

> Honest limitation to remember when posting: these are *standing* discounts with no listed end date and no dollar amount. "Verified today" is true and postable. "Expires Sunday" or "$X OTD" is **not** — we don't have that data.

---

## The IL cannabis tax + OTD framework (verifiable — safe to publish)

Unlike the deal prices, Illinois tax rates are public and verifiable. This is the reusable math a reader applies to *any* Illinois cannabis purchase. It's the genuinely useful, evergreen core of every post — it works even while our per-deal dollar data is missing.

**Illinois adult-use cannabis is taxed in layers, stacked on the shelf price:**

1. **State cannabis excise tax (potency-based):**
   - **10%** — cannabis flower with THC at or below 35%
   - **25%** — cannabis flower with THC above 35%
   - **20%** — cannabis-infused products (edibles, most vapes/concentrates classed as infused)
2. **State sales tax: 6.25%**, plus **local (municipal + county) general sales tax** — varies by city.
3. **Municipal Cannabis Retailers' Occupation Tax:** up to **3%** (set in 0.25% increments), plus a **county** cannabis ROT (Peoria County adds **3%** on sales inside a municipality).

**Net effect:** combined effective tax at an Illinois register runs roughly **19%–41% depending on the city** (Chicago is ~37%). Central-IL cities sit in the middle of that band. **Rule of thumb for a shopper: expect roughly a third added at the register on flower, and more on edibles/vapes because the infused-product excise is 20% vs 10%.**

**Worked example — ILLUSTRATIVE ONLY (not a real listed deal; we have no real prices):**
> A $40 eighth of flower (≤35% THC) with a 25% off promo → $30.00 before tax.
> Apply a representative Central-IL combined rate of ~30% (10% excise + ~6.25% state + local + municipal/county): ≈ **$39 OTD**.
> The same eighth at full $40 → ≈ **$52 OTD**. So the promo saves ≈ **$13 OTD**, and roughly **$9 of that $52 sticker OTD is tax**.

⚠️ The dollar figures above are a hypothetical to *demonstrate the method*, clearly labeled. The exact Central-IL combined rate must be confirmed per city via the **MyTax Illinois Tax Rate Finder** before any city-specific dollar number is published. Do not publish the illustrative numbers as if they were a real deal.

*(Sources for tax structure at bottom.)*

---

## Reddit Post 1 — Peoria area (DRAFT, value-first, real % promos)

**Working title:** *Current verified dispensary promos in the Peoria area (Peoria / Peoria Heights / East Peoria) — plus how to calculate your real out-the-door price*

> Rounded up the standing discounts running right now at dispensaries in the Peoria area and checked each against the dispensary's own site today (July 8). These are the recurring/customer-segment deals — no dollar amounts, because the stores publish these as percentages, not fixed prices. So the genuinely useful part is the tax math at the bottom: it's how you figure your *actual* out-the-door price on anything.
>
> **Peoria**
> - Ivy Hall Dispensary — 20% off for veterans (ivyhalldispensary.com)
>
> **Peoria Heights**
> - Cookies Peoria Heights — 25% off flower
> - Cookies Peoria Heights — 20% off vapes
> - Cookies Peoria Heights — 25% off your first visit
>
> **East Peoria**
> - NOXX East Peoria — 20% off edibles
>
> **How to get your real out-the-door price (this is the part that matters):**
> Illinois stacks tax on the shelf price, so the sticker is never what you pay.
> - Flower (≤35% THC): 10% state excise + 6.25% state sales tax + local + city/county cannabis tax → figure **~30%ish added** in the Peoria area (confirm your exact city rate; Peoria County adds 3% inside a municipality).
> - Edibles / infused: the excise jumps to **20%**, so the same sticker costs you more OTD than flower.
> - So a 25%-off flower deal doesn't fully cancel the tax — do the discount first, then add tax on the discounted price.
>
> Example of the method (made-up numbers to show the steps): $40 eighth − 25% = $30, + ~30% tax ≈ **$39 out the door**, vs ~$52 at full price. Plug in the real shelf price when you're in the store.
>
> If a listed promo is gone when you get there, that's on the dispensary changing it — worth calling first for anything you're driving for.
>
> —
> *Source: pulled from each dispensary's own website, re-checked July 8, 2026. I keep a running verified list at puffprice.com (Central Illinois only).*

*Posting note: PuffPrice named once, at the bottom, as the source. No marketing voice. The tax method is the value; the deal list is real but percentage-only.*

---

## Reddit Post 2 — Bloomington / Central IL radius (DRAFT, value-first, real % promos)

**Working title:** *Verified dispensary promos in Bloomington right now + the Illinois out-the-door tax math (Bloomington-Normal / Champaign area)*

> Same idea as the Peoria roundup, for the Bloomington-Normal / Champaign side. Honest heads-up: right now the only currently-verified standing promos I can confirm in this radius are in **Bloomington**. I checked Normal and Champaign dispensary sites too and didn't find published standing specials today — so I'm not going to list deals that aren't actually posted. (If you know one that's running, drop it and I'll verify and add it.)
>
> **Bloomington**
> - Cookies Dispensary Bloomington — 25% off your first visit
> - Cookies Dispensary Bloomington — 20% off for military
> - Cookies Dispensary Bloomington — 30% off pre-rolls
>
> **Normal / Champaign / Urbana:** no publicly-posted standing promo I could verify today. Everyday menu prices only. (Not the same as "no good prices" — just no *advertised* discount to point at right now.)
>
> **The out-the-door math (works anywhere in Illinois):**
> - Flower ≤35% THC: 10% state excise + 6.25% state sales + local + municipal/county cannabis tax.
> - Infused (edibles/most vapes): 20% excise instead of 10% — costs more OTD for the same sticker.
> - Order of operations: take the discount off the shelf price first, *then* add tax. A "30% off" pre-roll deal still gets taxed on the discounted price.
> - Confirm your city's exact combined rate on the MyTax Illinois rate finder before you count on a specific dollar figure.
>
> —
> *Source: each dispensary's own website, re-checked July 8, 2026. Running verified Central-Illinois list at puffprice.com.*

*Posting note: the honesty about Normal/Champaign having no verifiable posted deals is deliberate — it's on-brand (trust-first) and invites contributions, which is the community-value play.*

---

## Reddit Post 3 — "how much do dispensary sales actually save you" myth-buster

**Status: ❌ INSUFFICIENT DATA — NOT DRAFTED (per brief instruction to skip).**

The myth-buster requires **real baseline-vs-sale price pairs** ("regular $X → sale $Y, here's the true saving after tax"). The DB has **zero** deals with both an `original_price` and a `sale_price` (0 of any green deal, ever). `anchor_skus` carries reference ranges (e.g. "Cresco premium 3.5g typically $40, sale floor ~$28") but they are April-observed, partly extrapolated, IL-wide, and not tied to a currently-live deal — using them to claim "sales save you $X today" would be fabrication.

**This post becomes possible the moment the scraper writes real `original_price`/`sale_price` pairs on live menu items.** At that point it's arguably the strongest of the three, because it's the one only PuffPrice's baseline pipeline can credibly do. Flagging it as the highest-value post to unblock.

---

## The 5 communities + self-promotion rules + cadence

**⚠️ Rule-text verification note (evidence-first):** I attempted to fetch each subreddit's live rules in this session and could not verify exact rule text (Reddit's rules pages are not reliably indexable/fetchable here; two direct fetch attempts timed out). **Do not treat the rule descriptions below as quoted rules.** Before posting, open each subreddit's sidebar / "Rules" tab and read the actual current rules — they change and mods enforce their own. What I *can* state with confidence is the well-established **sitewide norm** and a safe cadence.

**The one rule that governs all of them (well-established, cited):** Reddit's own guidance and every practitioner guide converge on the same principle — self-promotion should be a *small minority* of your activity. The classic heuristic is the **9:1 / "10% rule"**: for every post that links your own thing, you should have ~9 contributions that don't. Value-first posts (the full useful content *in* the post, link only as a source at the bottom) are treated very differently from link-drops. All three drafts above are built that way on purpose.

**Recommended communities (in priority order):**

1. **r/ILTrees** — the main Illinois cannabis community. Best topical fit for the tax/OTD content. *Verify:* whether promo links are allowed at all, whether there's a designated deals/weekly thread, and any "no vendor/no self-promo" rule. Lead here with the tax-method post (pure value), link only as source.
2. **r/PeoriaIL (and/or r/peoria)** — home-market local sub for Post 1. *Verify:* local subs are often the strictest on anything resembling advertising; look for a "no self-promotion / no solicitation" rule and whether a mod-approved "local resource" exception exists. Consider messaging mods first.
3. **r/BloomingtonNormal** — local sub for Post 2. *Verify:* same as above; local relevance (a free verified-deals resource for the town) is the framing most likely to be tolerated.
4. **r/Champaign / r/UIUC** — university-market reach for the Champaign-Urbana angle. *Verify:* r/UIUC in particular tends to have strict self-promo and content rules; may be value-post-only with no link.
5. **r/illinois** — statewide catch-all, useful for the evergreen tax explainer (least deal-specific). *Verify:* larger sub, stricter automod; a genuinely informational tax post is the only thing likely to survive here, with no link or link-in-comments-if-asked.

**Posting cadence that won't get flagged:**
- **Max one post per subreddit per ~2 weeks.** No cross-posting the identical text to all five the same day — that pattern-matches to spam and automod/mods catch it. Vary the lead and the community fit.
- **Stagger:** e.g. Week 1 → r/ILTrees (tax-method post). Week 1–2 → r/PeoriaIL (Post 1). Week 2 → r/BloomingtonNormal (Post 2). Week 3+ → r/Champaign, then r/illinois, only if the first two landed without removal.
- **Warm the account first:** comment helpfully in each sub before posting. A brand-new or link-only account posting a roundup is the fastest way to a removal + shadow-flag.
- **Link discipline:** PuffPrice mentioned once, at the very bottom, as "source." If a sub bans links outright, post the full value and put the link in a comment *only if someone asks*.
- **The one-metric test (ties to the assessment):** the first wave's real job is to answer *do strangers arrive and return within 14 days?* Tag links with a UTM (the site already has `UtmCapture.tsx`) so arrivals from each sub are attributable, and watch 14-day return, not vanity upvotes.

---

## Instagram-ready version (DRAFT asset copy)

*Context: Matthew has local reach via @jacarandapeoria (a yoga account). Whether to cross-post cannabis content from a yoga/wellness brand is **entirely his call** — there's a brand-fit and audience-fit question here that only he can answer. This is prepped copy only, not a recommendation to post.*

**Format:** single graphic or 3-card carousel. Brand per identity package — navy `#0F1F3D` / green `#16A34A` / cream `#F5F4F0`, Geist Display headline, tabular-nums. No smoke, no leaf-on-white, no neon-green.

**Card 1 (hook):**
> Your dispensary receipt is ~30% tax.
> Here's how to know your *real* out-the-door price. 🧾

**Card 2 (the method):**
> Illinois stacks tax on the shelf price:
> • Flower (≤35% THC): 10% state excise
> • Edibles / infused: 20% excise
> • + 6.25% state sales + your city + county cannabis tax
> Take the discount FIRST, then add tax.

**Card 3 (real promos + source):**
> Verified in the Peoria area today (July 8):
> • Cookies Peoria Heights — 25% off flower
> • NOXX East Peoria — 20% off edibles
> • Ivy Hall (Peoria) — 20% off for veterans
> Full verified Central-IL list → puffprice.com

**Caption:**
> The sticker price is never what you pay in Illinois. Quick math for figuring your real out-the-door total — plus the promos actually posted in the Peoria area today. Verified list at puffprice.com (link in bio). Central Illinois only. Prices/promos change — call ahead for anything you're driving for.

*Honesty note: the promos on Card 3 are the real verified % discounts. No dollar figures on the asset, because we don't have verified per-deal dollar prices. The "~30% tax" framing is a rule-of-thumb from the verified state tax structure, not a per-store quote.*

---

## DRAFT status summary
- **Everything in this file is a DRAFT awaiting Matthew's sign-off.** Nothing posted, nothing sent.
- **Real-data posts delivered:** Reddit Post 1 (Peoria area), Reddit Post 2 (Bloomington/Central IL), Instagram carousel — all built only on the 9 verified promos + verifiable IL tax structure.
- **INSUFFICIENT DATA / blocked:** the dollar-denominated "under $25 OTD" versions (no real prices in DB) and Reddit Post 3 myth-buster (no baseline-sale pairs). Both unblock when the price pipeline populates `sale_price`/`original_price`.
- **Needs verification before posting:** exact per-subreddit self-promotion rules (read live sidebars); exact per-city combined tax rate for any published dollar figure (MyTax Illinois).

## Sources
- IL cannabis tax structure: [Illinois Dept. of Revenue — Cannabis Taxes](https://tax.illinois.gov/research/taxinformation/other/cannabis-taxes.html) · [IDOR FY 2026-06 municipal/county ROT changes](https://tax.illinois.gov/research/publications/bulletins/fy-2026-06.html) · [Illinois Cannabis Tax Rate 2026 (cannabispromotions)](https://cannabispromotions.com/taxes/states/illinois) · [Tax Foundation: 2026 recreational marijuana taxes by state](https://taxfoundation.org/data/all/state/recreational-marijuana-taxes/)
- Reddit self-promotion norms: [What are Reddit's rules? — Reddit Help](https://support.reddithelp.com/hc/en-us/articles/360043503951-What-are-Reddit-s-rules) · [Complete guide to Reddit self-promotion rules 2026 (Redship)](https://redship.io/blog/reddit-self-promotion-rules)
- Deal + count data: live Supabase query, project ref `hnbjufmtmrhexmdrfubw`, 2026-07-08 (read-only MCP).
