# Competitive Visual Teardown — Price-Intelligence & Deal Products, July 2026
**Author:** Cowork (Claude)
**Date:** 2026-07-08
**Purpose:** Reference bar for the PuffPrice redesign (running in parallel in the Code lane). Opinionated. Every "steal" and "refuse" is checked against the locked brand identity package (`docs/brand/2026-04-28-identity-package.md`).
**Status:** Reference doc. Not a spec. Code owns implementation.

---

## How to read this

Each product gets: what it *is*, the two or three specific things that make it feel current in 2026, what PuffPrice should **steal**, and what it should **refuse**. "Steal" means the pattern survives contact with our brand (navy/green/cream, Geist Display + Inter, serif long-form, tabular-nums, trust-first voice). "Refuse" means it fights our brand or our user — a real person in a parking lot who already knows what they're shopping for.

The through-line: **PuffPrice is GasBuddy for weed with GoodRx's price-delta discipline.** Everything below is measured against that sentence.

---

## 1. GasBuddy — the stated model

**What it is:** Live map of fuel prices, tap a pin for station detail + how recently the price was reported. Free map is the product; the Pay-with-GasBuddy card and points/receipts layer is the money.

**What makes it feel current:**
- **The map IS the interface.** You open it and you're looking at prices on geography, not a search box. Price is the first-class citizen — the number sits on the pin, not behind a tap.
- **Recency as a trust signal, everywhere.** "Price reported 2h ago" is attached to every station. In a category where the #1 fear is "is this still true?", the timestamp is doing the heavy lifting.
- **Sort/filter is one thumb-reach:** fuel grade, price, distance, amenities. No modal, no multi-step.

**What PuffPrice should STEAL:**
- **Price-on-the-pin.** A Central IL user in a parking lot wants the number on the map, not one tap away. This maps directly to our GPS-aware premise — "nearest deal, and what it is, before I tap."
- **Recency stamp on literally everything.** We already have `verified_at` and the amber "verification pending" state (72h+) in the brand system. GasBuddy proves the timestamp is not clutter — it's the reason people trust the app over the sign on the road. Lean harder into it, not softer.
- **Free map is sacred, money is a layer.** Our FREE tier (full deal access, no account) is the GasBuddy free-map equivalent. Keep PRO as a layer on top, never a gate in front.

**What PuffPrice should REFUSE:**
- **Sponsored pins cluttering the map.** GasBuddy's map is visibly polluted with sponsored station pins, and reviewers call it out. Our terracotta "best deal" badge rule (max one per card, reserved for genuinely special) is the antidote — do not sell pin placement. It's the single fastest way to kill the trust premise.
- **Gamified points/receipt-snapping.** That's an engagement-farming mechanic for a daily-commodity purchase. Our user buys cannabis on a considered cadence, not daily. Games would read as desperate and off-voice.

---

## 2. GoodRx — price comparison done well

**What it is:** Search a drug, enter ZIP, see cash-vs-coupon prices ranked across nearby pharmacies, pull the coupon up on screen. No account required to compare.

**What makes it feel current:**
- **It leads with the delta.** The hero of a GoodRx result is the gap between the price you'd pay and the price with the coupon. The savings number is the largest thing on the card — the drug name is secondary. The entire product is organized around "here is how much less."
- **No-signup comparison.** You get the full price comparison before you're asked for anything. Trust is earned before the ask.
- **Ranked list with the winner pinned.** Cheapest pharmacy is at top, visually distinguished, with distance. Everything else is "or, if you'd rather."

**What PuffPrice should STEAL:**
- **Lead with the price delta in the biggest type on the card.** This is the highest-leverage borrow in this whole doc. Our type scale already reserves Geist Display 700 tabular-nums for "Price / discount." Use it at H2/H3 size (32–40px) for the *savings*, not the sticker price. The card should answer "how much do I save" before "what is it." Right now our deal data is percentage-only (see the distribution draft's data blocker) — so the delta we can show today is the **%**, rendered huge. When real dollar OTD prices land, the delta becomes `$X off` in 40px.
- **No-account comparison as a brand promise, not a growth hack.** GoodRx proves you can show everything and still convert. Our "FREE: no account, full deal access, always" is the same bet. Make the comparison view the front door.
- **Pin the winner.** Our decision engine (`lib/decisionEngine.ts`) already ranks. Visually pin the #1 deal per city/category the way GoodRx pins the cheapest pharmacy — one clearly-best card, then the rest.

**What PuffPrice should REFUSE:**
- **The opaque "cash price" theater.** GoodRx's "regular price" is a semi-fictional list price that makes the coupon look bigger. Our brand voice is trust-first: counts round *down*, claims are verifiable. Do **not** manufacture an inflated baseline to inflate the savings %. If we can't verify the baseline, we show the deal without a fake delta. (This is exactly why the myth-buster post is blocked — see distribution draft.)
- **Coupon-code maze.** GoodRx's RxBIN/RxPCN/group-ID surface is necessary for pharmacy adjudication and is genuinely ugly. We have no equivalent need. A PuffPrice deal is "walk in, it's on the menu." Keep it that simple.

---

## 3. Honey (PayPal) — the cautionary tale

**What it is:** Browser extension that auto-applies coupon codes at checkout and pitches a "we found you the best code" promise.

**Why it's in this doc as a REFUSE, not a steal:** In December 2024, a widely-circulated exposé alleged Honey re-attributed affiliate commissions to itself at checkout (last-click cookie replacement) and suppressed better codes that partnered vendors didn't want shown. Honey lost roughly 3M of ~20M users within two weeks, ~8M off the Chrome Web Store by end of 2025, drew 20+ class actions, and PayPal disabled the disputed code in January 2026. Google changed Chrome Web Store policy in March 2025 to ban extensions claiming affiliate commission without providing a discount. *(Reported figures; cited below. Treat as directional, not audited.)*

**What PuffPrice should STEAL:** essentially the visual grammar of the *promise* — "we surface the best available deal" is a strong pitch **only if it's true**. Honey's UI was fine. Its data integrity wasn't.

**What PuffPrice should REFUSE — this is the important one:**
- **Never let a monetization mechanic secretly reorder what the user sees.** The Honey failure was not visual; it was that the ranking served the business, not the user. Our decision engine must rank for the user, full stop. If we ever take dispensary money (B2B is on the table — see assessment), the paid relationship must never touch deal ranking or which deal is shown. Bright line.
- **"Best deal" claims are load-bearing.** The moment we show a "best in city" badge that isn't actually the best, we are Honey. Our terracotta badge should be algorithmic and explainable, never sold.

**Design takeaway:** the trust signals (verified timestamp, "how we rank" transparency) aren't decoration — they're the moat. Honey is proof that a deal product lives and dies on whether the user believes the ranking is honest.

---

## 4. Flipp — weekly-flyer / circular aggregator

**What it is:** Aggregates grocery/retail flyers into a location-aware, card-based browse. Friendly pastel aesthetic, custom illustrated icons, "circle" (clip) an item, location-based store selection, quick onboarding.

**What makes it feel current:**
- **Card-based deals with large, scannable text.** The whole surface is built for thumb-scrolling and glance-reading.
- **"Circle it" micro-interaction** — a lightweight save gesture that feels tactile and specific to the domain.
- **Location-personalized on first run** — it asks which nearby stores you care about and tunes to them.

**What PuffPrice should STEAL:**
- **The scannable card + large deal text.** Confirms our instinct: Inter 600 card titles, big tabular-nums price. Flipp's readability comes from *size and spacing discipline*, not decoration.
- **Location-first personalization.** "Which cities/dispensaries near you?" as an early, optional, no-account tuning step fits our GPS premise and our no-signup rule.
- **A domain-specific save gesture.** A "watch this deal" / "notify me if this drops" clip is the natural PRO hook and a better one than Flipp's, because ours can text you (SMS is scaffolded).

**What PuffPrice should REFUSE:**
- **The pastel + illustration aesthetic.** This is the biggest trap for us. The brand identity package is explicit: the site is *over-indexed on illustration and emoji* and photography is the fix — "NYT food section, not Cosmopolitan lifestyle." Flipp's cheerful pastel/illustrated look is exactly the "we didn't pick a real brand" signal we're moving away from. Steal Flipp's *layout logic*, refuse its *skin*.
- **Flyer/circular metaphor.** We are not a flyer. We are a live, ranked, GPS-aware price truth. Don't borrow the "browse the weekly ad" mental model — it implies stale and passive.

---

## 5. Cannabis menu / deal experiences — Dutchie, Jane, Weedmaps

These are the incumbents our user already tolerates. Studied as a group because the lesson is shared.

### Dutchie (dispensary storefront / e-commerce menu)
Powers a huge share of dispensary "order online" menus. Current touches: gallery carousels with real bud shots + label images, search by terpene, total-terpene % on product cards and detail pages. It's a **commerce** surface — built to sell inventory for one store.

### Jane (menu platform)
The other dominant embeddable POS menu. Same job as Dutchie: render one store's live inventory for ordering.

### Weedmaps (deals surface at weedmaps.com/deals)
The closest thing to a direct competitor. Two deal types (in-store applied at checkout vs online applied in-bag). Covers BOGOs, bundles, first-time discounts, loyalty, promo codes, coupons, limited-time offers, brand sales. Business-side tooling lets dispensaries self-create deals with a preview mode. Deals "change regularly, check back often."

**What PuffPrice should STEAL:**
- **Rich product identity on the card (from Dutchie/Jane):** brand, weight, THC %, category icon. When our menu/price pipeline is populated, a deal card with `brand · 3.5g · 24% THC · flower` reads as *specific*, which is our voice ("$35 eighth at nuEra Pekin, today" beats "great deals"). Our anchor_skus schema already carries brand/tier/weight/THC — the card anatomy should expose it.
- **Category iconography (from all three):** we've already speced lucide `Leaf / Cigarette / Cookie / Droplet` for flower/vape/edible/concentrate. This is table-stakes and we're on it.
- **Deal-type taxonomy (from Weedmaps):** BOGO / first-time / bundle / % off / promo. Our data already distinguishes discount types. Surfacing a small, consistent deal-type chip helps scanning. (Note: our scraper deliberately deactivates BOGO false-positives — so if we show a BOGO chip, it's real.)

**What PuffPrice should REFUSE:**
- **The "check back often, deals change regularly" cop-out (Weedmaps).** That sentence is an admission that the platform doesn't know what's currently true. Our *entire* differentiation is `verified_at` + the pending/expired state machine. We say "verified 2h ago," never "check back often." This is the sentence that defines us against Weedmaps — put the recency stamp exactly where Weedmaps puts the disclaimer.
- **Single-store commerce framing (Dutchie/Jane).** Those menus optimize one dispensary selling its inventory. We are cross-store *comparison*. Refuse the "add to bag / checkout" grammar; ours is "here's the best price near you, go get it." We are the layer above the menu, not another menu.
- **Terpene-percentage maximalism (Dutchie).** Total-terpene % on every card is connoisseur-grade density that our parking-lot user doesn't decide on. Keep THC %, drop terpene % from the card (fine on a detail page later). Information density should serve the decision, not flex the catalog.
- **Sold/self-serve deal placement (Weedmaps).** Weedmaps lets dispensaries create and preview their own deals — which means the deal surface is partly an ad product. Same bright line as Honey: our deals are scraped-and-verified from direct dispensary sources, not dispensary-authored marketing. Refuse the ad-product model on the consumer surface.

---

## Synthesis — the PuffPrice reference bar (what "current" means for us)

Ranked by leverage:

1. **Lead every card with the delta, in Geist Display tabular-nums, bigger than the product name.** (GoodRx.) Today that's the discount %; when dollar OTD data lands it's `$X off`. This single decision is what makes us feel like a price-intelligence product and not a directory.
2. **Recency stamp on everything; it's the moat.** (GasBuddy + against Weedmaps.) "Verified 2h ago" where Weedmaps writes "check back often." The amber pending / red expired states are a feature, show them.
3. **Price-on-the-map / nearest-first.** (GasBuddy.) The GPS premise means the number should be visible on geography, one thumb-reach to sort by price/distance.
4. **Free, no-account comparison as the front door.** (GoodRx + GasBuddy free map.) Everything visible before any ask. PRO is a layer, never a gate.
5. **Specific card anatomy: brand · weight · THC · category icon.** (Dutchie/Jane.) Specificity is our voice. Drop terpene-% and any connoisseur density that doesn't drive the buy.
6. **Scannable large-text cards with disciplined spacing.** (Flipp's layout, not its skin.)
7. **A "watch this deal → text me" save gesture** as the natural PRO hook. (Flipp's "circle it," upgraded by our SMS scaffold.)

**The refusals, as one rule each:**
- No sponsored/sold placement on the map or in ranking. (Honey, Weedmaps.)
- No manufactured baseline to inflate savings. (GoodRx.)
- No pastel/illustration skin — photography per the identity package. (Flipp.)
- No "check back often" — recency stamp instead. (Weedmaps.)
- No single-store "add to bag" commerce grammar — we're the comparison layer. (Dutchie/Jane.)
- No gamification of a considered purchase. (GasBuddy.)

**The one-sentence bar:** *GoodRx's price-delta discipline, on GasBuddy's nearest-first map, with a recency stamp where Weedmaps prints a disclaimer — rendered in the navy/green/cream editorial brand, never in the pastel-directory skin.*

---

## Open items / honesty notes
- This teardown is built from current product descriptions, published case studies, and reporting (sourced below) plus hands-off reasoning — **not** a fresh pixel-by-pixel audit of each live app in July 2026. If the redesign wants exact measurements (type sizes, card padding, tap-target px), that's a follow-up screenshot pass, ideally in the Chrome lane against the live products.
- The Honey figures are widely-reported, not independently audited here. They're used to make a *design-integrity* point, which stands regardless of the exact user-loss number.
- Every "steal" was checked against `docs/brand/2026-04-28-identity-package.md`. Where a borrowed pattern conflicts with the locked brand (e.g. Flipp's aesthetic), the brand wins and it's filed under "refuse."

## Sources
- [GasBuddy App](https://www.gasbuddy.com/app) · [thoughtbot GasBuddy case study](https://thoughtbot.com/case-studies/gasbuddy) · [Firstcard GasBuddy review 2026](https://www.firstcard.app/learn/gasbuddy-app-review)
- [How GoodRx works](https://www.goodrx.com/how-goodrx-works) · [GoodRx mobile](https://www.goodrx.com/mobile) · [GoodRx APIs](https://www.goodrx.com/developer)
- [PayPal Honey — Wikipedia](https://en.wikipedia.org/wiki/PayPal_Honey) · [Richmond JOLT analysis](https://jolt.richmond.edu/2025/03/07/sweet-deal-or-sweet-scam-how-honey-is-allegedly-hurting-content-creators-commissions/)
- [Flipp](https://flipp.com/) · [DesignRush: Flipp design](https://www.designrush.com/best-designs/apps/flipp)
- [Dutchie](https://dutchie.com/) · [Jane vs Dutchie (Hybrid Marketing Co.)](https://hybridmarketingco.com/jane-vs-dutchie-the-battle-for-dispensary-menu-domination/) · [Weedmaps Deals](https://weedmaps.com/deals) · [Weedmaps for Business: Deals](https://weedmaps.com/business/deals/)
