# PuffPrice — External Review Package
**Date:** 2026-07-08
**Prepared by:** Cowork (Claude), docs/reference-data lane
**Reviewer:** GPT (per standing external-review workflow)
**Live at:** puffprice.com — Central Illinois cannabis deal intelligence

**Reading note:** All counts here are verified against the live Supabase DB (project ref `hnbjufmtmrhexmdrfubw`, read-only) on 2026-07-08, or explicitly marked as INSUFFICIENT DATA / PENDING. No number in this document is estimated. Where a source didn't exist in the session, it says so.

---

## 1. State of the product

PuffPrice is a GPS-aware cannabis deal finder scoped, since the April 24 hard lock, to **Central Illinois only** — 12 cities in scope, 9 currently populated with licensed dispensaries. It is built for a specific person: someone in a parking lot who wants to know the best nearby price right now, not a developer and not a dispensary owner.

**What is live (verified in DB, 2026-07-08):**

- **29 active dispensary listings** across the Central-IL scope (`project_tag='green'`, `is_active=true`, `type='dispensary'`, scope cities). This is up from the 26 recorded at the April 26 CLAUDE.md snapshot.
- **9 populated cities:** Springfield (9), Peoria (5), Normal (4), East Peoria (3), Champaign (3), Bloomington (2), Peoria Heights (1), Pekin (1), Urbana (1). Three in-scope cities remain empty-with-nearest-alternative placeholders (Bartonville, Morton, Washington).
- **9 active deals**, all `source='website'` (direct dispensary sites — no aggregators, per the April 26 data policy). This is down from 10 at the April snapshot.
- **Page surface:** canonical `/city/[city]` and `/dispensary/[slug]` patterns, listing detail at `/l/[id]` with the content-depth layer, deal engine at `/deals/[category]`, `/about` + `/about/index` (the PuffPrice Index methodology / statewide price-per-gram benchmark), the Illinois cannabis tax explainer + calculator (shipped in the May 1 Code session), content pages (`first-time-guide`, `laws`, `open-now`), brand pages scaffolded at `/brand`, consumer signup at `/alerts`, pricing at `/upgrade`. Sitemap scoped to Central-IL only; out-of-scope URLs 404.
- **Trust machinery:** `verified_at` freshness with a 72h+ "verification pending" state and 7-day auto-deactivation via the `mark-stale-deals` cron; daily scrape cron (09:00 UTC, Hobby-plan-limited from the original 6-hour spec).
- **Brand identity locked** (April 28 package): wordmark, navy/green/cream palette, Geist Display + Inter + Source Serif 4, photography direction, lucide icon system, trust-first voice. A visual upgrade implementing against it has been running in the Code lane.

**What shipped in this sprint (July 2026):** ⏳ **PENDING.** `docs/SPRINT-REPORT-JUL26.md` does not exist in the repo as of this writing, so the Code lane's July sprint output cannot be summarized here. When Code lands that report, this section should be updated. (What *is* observable: the working branch is `feat/design-direction-v2`, consistent with the brand visual upgrade being in progress.)

**What is scaffolded but deliberately dormant:**

- **SMS alerts** — the headline PRO feature; scaffolded, not activated. (No SMS provider spend to date.)
- **Price history / savings dashboard** — depends on the price-baseline pipeline, which is currently empty (see the critical caveat below).
- **Stripe / PRO billing** — env vars scaffolded; not connected. MRR is $0 by design, not by failure. The stated posture ("free for dispensaries, forever" + a $0.99 consumer PRO) is a bet not yet placed.

**Critical product caveat the reviewer must weigh:** the deal data is currently **percentage-only**. Of the 9 active deals, **zero** carry a dollar `sale_price`, `original_price`, `price_per_gram`, or `expires_at`. The price-intelligence pipeline tables (`menu_items`, `price_baselines`, `menu_snapshots`, `deal_price_history`) are **empty**; only `anchor_skus` has data (54 reference rows, observed April 22, partly extrapolated, IL-wide). In other words: **the product is positioned as price intelligence, but the live deal surface today is a verified list of standing percentage promos, not dollar prices or true out-the-door comparisons.** The PuffPrice Index and any "savings" claim depend on a pipeline that is not yet producing data. This is the single most important fact in this package, and it constrains both the distribution plan (Section 4) and the monetization question (Section 3).

---

## 2. State of the audience

**INSUFFICIENT DATA — traffic and engagement numbers are not available in this session.**

No GA4 or Google Search Console findings were provided (Chrome's "Part A" report was not pasted into the session, and no analytics MCP is connected/authorized here). Per the hard rules, I am **not estimating traffic**. What can be stated factually:

- GA4 is wired (`NEXT_PUBLIC_GA_MEASUREMENT_ID = G-TML9Y6VMC2`) and UTM capture exists (`UtmCapture.tsx`), so attribution *can* be measured once data is pulled.
- MRR is **$0** (Stripe not connected) — this is a known fact, not an audience metric.
- The honest baseline assumption for review purposes: **PuffPrice's primary problem is that essentially nobody knows it exists.** This is asserted in the brief and is consistent with a pre-revenue, pre-distribution product. It should be treated as the working hypothesis the distribution plan (Section 4) is designed to test — not as a measured fact.

**What would close this gap:** paste GA4 (users, sessions, returning users, top landing pages, geography) and GSC (impressions, clicks, top queries, "puffprice" branded query volume) for the trailing 28–90 days. Until then, every audience-dependent decision below is explicitly conditional.

---

## 3. The monetization question (framed for review)

The decision on the table: **consumer PRO ($0.99/mo deal-hunter tier) vs. dispensary B2B (competitive price intelligence built from the baseline pipeline).** Stripe stays off until one is validated. That is stated here as a **decision, not a gap** — turning on billing before there is either a consumer willing to pay or a dispensary willing to pay would be building a checkout for a product no one has agreed to buy.

Both sketches below use labeled assumptions. They are order-of-magnitude, not a model.

### 3a. Consumer PRO — $0.99/month

Features: SMS alerts, daily digest, price history, savings dashboard.

The structural problem is the **payment-processing floor**. Standard card processing is roughly **2.9% + $0.30 per transaction**. On a $0.99 charge that's about **$0.33 in fees — a third of the revenue gone before anything else.** Net is ~**$0.66/subscriber/month**. Then SMS erodes it further: per-message US costs (~$0.0079 and up) mean a daily digest (~30 messages/month) runs ~$0.24+/subscriber/month, plus any alert texts. Realistic net contribution is on the order of **$0.30–$0.50/subscriber/month.**

| Assumption | Value |
|---|---|
| Price | $0.99/mo |
| Processing fee | ~$0.33/txn (2.9% + $0.30) |
| SMS cost (daily digest + alerts) | ~$0.24–$0.40/sub/mo |
| **Net contribution** | **~$0.30–$0.50/sub/mo** |

At Central-IL scale, the subscriber ceiling is the issue. With 9 populated cities and 29 dispensaries, even an *optimistic* capture — say a few hundred paying deal-hunters — nets roughly **low-hundreds of dollars per month**, against real support and SMS-deliverability overhead. 500 subscribers ≈ **$150–$250/mo net**. To clear even $1,000/mo net you'd need ~2,000–3,000 paying subscribers in a 9-city rural/small-metro footprint — a very heavy lift for a product nobody yet knows exists (Section 2).

There is also a **signaling** question: $0.99 may actively *undersell* the product. It's priced like an impulse app-store unlock, not like a tool that saves someone $10–$15 out-the-door per purchase (Section 4's math). A deal-hunter who saves $13 on one eighth would rationally pay far more than $0.99/month — the price may be anchoring the product as trivial.

### 3b. Dispensary B2B — competitive price intelligence

The asset: once the baseline pipeline (`menu_items` → `price_baselines` → the PuffPrice Index) is producing real data, PuffPrice would know, per SKU/category/city, what every scraped competitor is charging and where a given dispensary sits in the distribution. That is exactly the report a dispensary's category buyer or GM pays for today — and no one is selling it for Central Illinois.

The price anchors are already documented in the project's own history: the earlier B2B posture pitched **PuffPrice at $49–$149/mo against Leafly ($600+/mo) and Weedmaps ($495+/mo)** per dispensary (per `docs/PROJECT_STATE.md`). Those competitor numbers are the ceiling; the value here (competitive pricing intel, not just a listing) arguably justifies the middle of that range.

| Assumption | Value |
|---|---|
| Price | $99–$299/mo per dispensary (intel tier, below Leafly/Weedmaps listing fees) |
| Processing fee impact | Negligible as % of a $99–$299 charge |
| Realistic Central-IL reachable accounts | some fraction of the 29 in-scope dispensaries |
| **Illustrative:** 10 accounts × $150/mo | **~$1,500/mo** |
| **Illustrative:** 6 accounts × $199/mo | **~$1,200/mo** |

Ten B2B accounts at $150/mo produce more revenue than ~3,000 consumer subscribers at $0.99 — with a handful of relationships to service instead of thousands of support tickets and SMS deliverability headaches. On a per-unit and per-effort basis, **B2B is not close.** The catch is the two hard dependencies: (1) the price pipeline must actually be producing reliable data (it isn't yet), and (2) it directly tensions the locked brand promise **"free for dispensaries, forever."** Selling dispensaries an intel product is compatible with free *listings* — but the reviewer should stress-test whether it muddies the trust-first consumer positioning, and whether a dispensary paying for intel would ever expect (and must be refused, per the Honey/Weedmaps bright line in the visual teardown) any influence over consumer-facing deal ranking.

### 3c. What evidence would settle it

- **For B2B:** a single Central-IL dispensary GM saying "yes, I'd pay $X/month to see where my prices sit against the market" — a real LOI or a paid pilot. That one conversation is worth more than any amount of consumer traffic speculation. *Prerequisite: the price pipeline must produce a report worth showing.*
- **For consumer:** evidence that strangers arrive *and return* (Section 4's one-metric test), plus any signal of willingness to pay above the processing floor. If retention is real but $0.99 conversion is near-zero, the signal is "reprice or bundle," not "kill."
- **The pipeline is the fork.** Both paths, and the product's own "price intelligence" identity, depend on the baseline pipeline going live. Until it does, the honest status is: the product cannot yet fully be either the consumer tool or the B2B tool it's positioned as. **Prioritizing the pipeline may matter more than choosing the monetization path.**

---

## 4. The distribution plan

Full drafts live in `reference-data/distribution-drafts-jul26.md` (all DRAFT, awaiting sign-off). Summary:

The first wave is **value-first Reddit + Instagram**, built only on the 9 verified promos and the (verifiable) Illinois tax/out-the-door math. Because the DB has no dollar deal prices, the posts lead with the genuinely useful, evergreen asset — *how to compute your real out-the-door price in Illinois* (10% flower excise / 20% infused, + 6.25% state sales + local + municipal/county cannabis tax; roughly a third added at the register) — with the real percentage promos underneath and PuffPrice named once at the bottom as the source. Three communities and cadence are speced (r/ILTrees, local city subs, r/illinois), with a hard rule: verify each sub's live self-promotion rules first, one post per sub per ~2 weeks, warm the account, link discipline.

**Two of the originally-requested posts are blocked by data, not by choice:** the "under $25 OTD" dollar roundups (no real prices exist) and the "how much do sales really save you" myth-buster (zero baseline-vs-sale pairs). Both unblock the moment the price pipeline populates.

**The one-metric test:** *Do strangers arrive and return within 14 days of the first Reddit wave?* UTM-tag every link (the site already captures UTMs), and judge the wave on 14-day return — not upvotes, not one-time clicks. If yes, distribution is working and the monetization question (Section 3) becomes urgent. If no, the problem is the product or the audience fit, and no monetization choice matters yet.

---

## 5. Ten questions for the reviewer

1. **Is the baseline/price-intelligence pipeline better monetized B2B than B2C?** Given 29 Central-IL dispensaries and competitor listing fees at $495–$600/mo, does 6–10 B2B intel accounts at $99–$299 beat any realistic consumer-subscriber count — and is that where effort should go first?

2. **Does $0.99 signal low value and cap willingness to pay?** A user who saves ~$13 OTD on one purchase could rationally pay far more. Is $0.99 anchoring the product as trivial, and what's the right price test?

3. **What, concretely, would make a Central-IL dispensary pay?** Is it "where do my prices rank vs. the market," "who's undercutting me this week," foot-traffic attribution, or something else — and which of those can the current data actually deliver?

4. **Should the price pipeline be the #1 priority over any monetization move?** The product is positioned as price intelligence but currently serves percentage promos with no dollar prices. Is fixing that the real unlock for *both* revenue paths?

5. **Does a paid B2B product fatally tension "free for dispensaries, forever"?** Can "free listings + paid intel" coexist without eroding the trust-first consumer brand — and where exactly is the line that keeps paid relationships out of consumer deal ranking?

6. **Is Central Illinois large enough to matter, or is it a proof-of-concept for a statewide/multi-region play?** The statewide DB is preserved and hidden behind a one-line scope flag. Is the CIL lock a permanent focus or a beachhead?

7. **Is Reddit value-first the right first channel, or is in-person dispensary sales (the earlier "unfair advantage" in Peoria) the faster path to the one B2B conversation that settles Section 3?**

8. **What is the honest retention hypothesis for a deal product with a considered (non-daily) purchase cycle?** Cannabis isn't bought daily; does a 14-day return metric even fit the buying rhythm, or should the window be 30 days?

9. **Is the AI-citation / MCP play (Zone 4) a distraction or the actual moat?** The plan is to become the source AI cites for IL cannabis deals via `mcp.puffprice.com`. Is that a real Month-3–6 priority, or premature until there's audience and data density?

10. **Given no audience data yet (Section 2), what is the smallest experiment that produces a real go/no-go signal in 30 days** — and which single metric should trigger turning Stripe on?

---

## Appendix — verification log
- Deal / listing / pipeline counts: live Supabase queries, project ref `hnbjufmtmrhexmdrfubw`, 2026-07-08, read-only MCP.
- `SPRINT-REPORT-JUL26.md`: confirmed **absent** from repo at write time → Section 1 sprint output marked PENDING.
- GA4 / GSC / Chrome Part A: **not provided** in session → Section 2 marked INSUFFICIENT DATA; no traffic estimated.
- B2B competitor price anchors (Leafly $600+, Weedmaps $495+; prior PuffPrice $49/$149 tiers): `docs/PROJECT_STATE.md` (dated April 12, 2026 — used only for the historical pricing anchors, not for current live-state counts).
- Stripe fee floor (2.9% + $0.30): standard published card-processing rate; used illustratively.
