# Out-of-the-Box Ideas from External Review
**Date:** April 24, 2026 (morning)
**Author:** Cowork (Claude), synthesizing GPT + DeepSeek feedback from April 23 reviews
**Status:** Research doc + tracking ledger. Idea 1 promoted to drafted-content-and-spec status on 2026-04-28; Ideas 2 and 3 remain queued for roadmap review.

## Status ledger (updated 2026-04-28)

| Idea | State | Artifact |
|---|---|---|
| **Idea 1 — Out-the-door tax calculator** | **Drafted, awaiting implementation** | Article: `docs/content/illinois-cannabis-tax-explainer-draft.md`. Calculator spec (Code-ready): `docs/content/tax-calculator-spec.md`. Per-city tax data table embedded in the spec. |
| **Idea 2 — Cannabis deal calendar** | Queued. No artifact yet. | — |
| **Idea 3 — SMS-first lookup** | Queued. No artifact yet. | — |

---

## Purpose

External review on April 23 surfaced three product ideas that sit outside the current roadmap but are worth queuing for post-pivot consideration. This doc captures each one with enough detail to decide whether to promote it to a real spec later — and enough honesty about what's blocked to avoid lighting work on fire prematurely.

**Hard constraints while reading this:**
- None of these ship in April.
- All three assume the Central IL scope lock (`docs/central-illinois-scope.md`) is holding.
- None require schema migrations beyond what's already in-flight.

---

## Idea 1 — Out-the-door tax calculator on deal cards

### The pitch

Every PuffPrice deal card shows a listed price — but the listed price is a lie. In Illinois, the actual out-the-door price includes the state cannabis tax (rate varies by THC potency: 10% up to 35% THC, 20% for 35%+ flower, 25% for concentrates / edibles), state sales tax (6.25%), local sales tax (varies), municipal cannabis tax (varies), and county cannabis tax (varies). A $35 eighth is rarely $35 at checkout. In Cook County it can land closer to $45. In Tazewell County (East Peoria) closer to $40.

Calculator on each deal card. User lands on a deal. They see: "Listed: $35. Out-the-door in East Peoria: $41.28. Drive 45 minutes to Pekin and the same deal is $40.06 / in Springfield $41.64 / in Chicago $47.15."

### Why it matters

Three reasons stacked on top of each other:

1. **Genuine consumer value.** The #1 complaint in Illinois cannabis consumer forums is "why is my out-the-door so much higher than the listed price?" We solve it in three lines of arithmetic.
2. **The moat play.** Weedmaps, Leafly, Dutchie show list prices. None of them do out-the-door. County-level + municipal tax data is publicly available but nobody in the deal-listing space assembles and exposes it. First mover wins the long tail of "true price" search traffic.
3. **Directly reinforces the scope lock.** Central IL counties (Peoria, Tazewell, McLean, Champaign, Sangamon) have some of the lowest effective cannabis taxes in the state. An out-the-door calculator gives Central IL buyers a quantified reason to shop locally instead of driving north. That's the exact anti-Chicago story the Central IL pivot depends on.

### What we already have

- **Tax framing in content pilots.** `docs/content-pilots/2026-04-23-nuera-east-peoria.md`, `2026-04-23-cookies-chicago.md`, and `2026-04-23-high-haven-elgin.md` all surface county-level tax differences narratively. This is the seed data, not the structured reference.
- **Deal schema with price fields.** `deals.sale_price`, `deals.original_price`, `deals.price_per_gram`, `deals.weight_grams`, `deals.mg_thc`, `deals.category` — all exist. The primitives for calculating pre-tax bases are in place.
- **Listing-level city and state.** `master_listings.city` and `master_listings.state` are populated enough to look up the right tax rate once we have a rate table.

### What we don't have

- **A canonical cannabis-tax-by-county-IL reference file.** No `docs/illinois-tax-guide.md` or `lib/taxRates.ts` currently exists despite references in other docs. This is the single biggest unblock.
- **Potency-based branching.** Illinois taxes cannabis at different rates by THC percentage. We don't currently enforce that the scraper captures potency well enough to branch.
- **County mapping.** `master_listings` has city but not county. Either a derived field (`city → county`) or a new column.
- **Edge cases.** Home rule municipalities can add their own cannabis tax. Chicago, Evanston, Peoria, and others have city-level add-ons that aren't uniform across "Cook County."

### Rough scope

- **Phase A (research):** Build `docs/illinois-tax-reference.md` with the current state + county + major-city tax rates. 1 focused Cowork session. No code.
- **Phase B (data):** Add a `county` column (or derived mapping) to `master_listings`. Single migration. Backfill for 23 Central IL dispensaries first.
- **Phase C (ui):** Add out-the-door math to the deal card component. Server-side calculation, cached. No live API dependency.
- **Phase D (copy):** Expand the listing detail pages to explain the calculation. Makes the page more citable and AI-indexable.

### What's blocked on

- **Accurate potency capture.** Without THC % on ≥80% of flower deals, the 10%-vs-20% state-tax branch is a guess. Requires a scraper pass or manual data-entry discipline.
- **County-level tax rate stability.** Rates move. We need either a quarterly refresh process or a clear "as of [date]" disclaimer on every displayed out-the-door number.
- **Legal review.** "Out-the-door" is a number consumers rely on. If we're off by 5% because a municipality changed rates mid-quarter, it's an embarrassment at best and a trust-collapse at worst. Need a caveat model.

### Verdict

**High-value, medium-scope. First priority for post-Central-IL-pivot roadmap planning.** The Phase A research doc is cheap enough that Cowork should do it even if Phases B–D get deferred — the reference file alone is useful for content and for answering AI-citation queries about Illinois cannabis tax.

---

## Idea 2 — Cannabis deal calendar

### The pitch

A calendar view, live at `/calendar` or `/deals/calendar`, showing cyclical cannabis deal events:

- **4/20** (April 20) — largest promotional day of the year
- **7/10** (oil/dab day, 710) — concentrate-specific
- **Green Wednesday** (day before Thanksgiving) — second-largest
- **Black Friday / Cyber Monday**
- **New Year** (inventory-clearing sales)
- **St. Patrick's Day** (green-branded pushes)
- **Weekly recurring:** Munchie Monday (many operators), Wax Wednesday, Flower Friday, Shatterday, etc.

Each calendar entry shows which Central IL dispensaries run promotions on that day and what discount to expect, based on historical and current `deals` rows.

### Why it matters

1. **Cyclical is predictable.** PuffPrice's current index is a real-time snapshot. A calendar turns us from "where are the deals today?" into "here's what deals will happen, plan around them." That's a structural upgrade.
2. **Pre-event SEO.** "4/20 deals Peoria" and "Green Wednesday Illinois" are search volume peaks, not plateaus. Being the page that already ranks when the search surge hits wins more traffic per pageview than steady-state SEO.
3. **Pro-tier signal.** A calendar naturally leads to "notify me when this event comes around." That's a clean Pro subscription story ("$0.99/month for calendar reminders + savings estimator"), firmer than the current "SMS alerts" framing.
4. **Low implementation cost relative to what it unlocks.** We already have the `deals` rows with `is_recurring` and `recurring_days`. The calendar is largely a SELECT away.

### What we already have

- **`deals.is_recurring` and `deals.recurring_days`** — weekly-recurring deals are already marked.
- **`deals.starts_at` / `deals.expires_at`** — event-anchored deals already fit the model.
- **Scraper ingest validation** (shipped April 23) — new deals land with timestamps. Historical pattern-matching on 4/20 2025 → 4/20 2026 becomes possible once we have 12 months of data.

### What we don't have

- **A year of historical deals.** We have ~100 deal rows total right now. That's a snapshot, not a history. Calendar predictions depend on seeing the 4/20 2026 cycle happen, capturing it, and using it as a prediction for 4/20 2027. We're in the first-cycle capture phase.
- **A calendar UI component.** Not scaffolded. Would need a month-grid component and URL routing (`/calendar/2026-04`, `/calendar/2026-05`).
- **Event-classification logic.** Distinguishing "4/20 sale" from "student discount with 'valid ID' tagline that happens to mention April" requires better deal-title parsing than the current scraper produces.

### Rough scope

- **Phase A (data):** Tag historical deals with `event_type` (`4_20`, `green_wednesday`, `weekly_recurring`, `one_off`). Cowork manual tagging for the first ~50 rows; scraper enrichment for future rows.
- **Phase B (page):** Static `/calendar` landing with hardcoded annual events + dynamic weekly recurrences pulled from `deals.recurring_days`.
- **Phase C (component):** Proper month-grid UI with filtering by city / category.
- **Phase D (notifications):** Pro-tier feature: "Remind me 7 days before Green Wednesday." Minimal backend (cron + Resend).

### What's blocked on

- **Data quantity.** Calendar is less useful with 100 deals than with 1,000. It gets better as the scraper captures more. First valuable version probably arrives after summer 2026.
- **Classification accuracy.** Bad event-tags become visible in the UI — wrong "4/20 deals" listing is worse than no listing. Needs a QA pass before public.

### Verdict

**High-value, timing-dependent.** Do the Phase A tagging work now (Cowork, opportunistic — add classification to the ingest validation script already shipped). Defer the UI until Q3 when data depth justifies it. The tagged-data work is cheap insurance that we have a calendar feature when we're ready to ship it.

---

## Idea 3 — SMS-first lookup ("text ZIP, get deals")

### The pitch

A phone number that accepts SMS. User texts their ZIP. PuffPrice texts back the top 3 active deals within 15 miles, with out-the-door price (if Idea 1 ships first) and a short dispensary name. Optional: a reply of `MORE` paginates; `STOP` opts out.

This is the zero-UI version of PuffPrice. The parking-lot user gets what they came for in one SMS round-trip — no app, no browser, no account.

### Why it matters

1. **Matches the "real person in a parking lot" CLAUDE.md principle.** Nothing is closer to a person who just wants to know "what's the cheap flower near me right now." No web page reads faster than "text `61602`, get deals."
2. **Clean Pro migration path.** Free SMS: top 3 deals in your ZIP, one query at a time. Pro ($0.99/month): daily morning SMS with deals across saved locations, push alerts when a watched brand drops, savings tracking. The Free → Pro gap is clear and fair.
3. **Inherently accessibility-friendly.** SMS works on feature phones. Works in low-bandwidth rural areas. Works with screen readers by default. Cheaper to support than a full mobile UI.
4. **Distribution angle.** "Text this number" fits on a business card, a flyer in a parking lot, a sticker on a gas pump. Easier to spread than a URL.

### What we already have

- **Resend** for transactional email. No current SMS stack.
- **ZIP / city / lat-lng lookup logic** in `lib/decisionEngine.ts` (ranking algorithm). The routing-to-nearest logic exists; we just need an SMS interface on top of it.
- **Pro tier already priced** ($0.99/month, Stripe wired up April 23). SMS-premium is a clean extension of the existing tier.

### What we don't have

- **Twilio / a short code.** Need a 10DLC-registered phone number to send compliant high-volume messaging. Not trivial — cannabis is a restricted category under carrier rules.
- **An SMS receiver.** Webhook endpoint to receive inbound messages. None exists.
- **Compliance framing.** SMS-based cannabis marketing has stricter rules than web display. Need an opt-in UX (user texts first → we respond) and a clean STOP-handling flow.
- **Rate limiting / cost controls.** At Twilio pricing, a viral moment could burn real money. Need per-phone rate limits, budget caps, and a "service temporarily unavailable" fallback.
- **Enough deals per ZIP.** Currently only ZIPs around 61603 (East Peoria area), 61611 (East Peoria), 61820 (Champaign), and 61604 (Peoria) have ≥3 active deals in the 15-mile radius under the Central IL scope. SMS returning "0 deals near you" on most IL ZIPs is a credibility-killer first impression.

### Rough scope

- **Phase A (research):** 10DLC / short code feasibility for a single-founder cannabis site. Actual Twilio quote. Cowork-only; 1 focused session.
- **Phase B (compliance):** Opt-in microsite (`/sms`) with double-consent flow. Legal review.
- **Phase C (implementation):** Twilio webhook → serverless function → decision engine → SMS reply. 2-3 engineering days.
- **Phase D (Pro-tier wrapping):** Saved locations, daily digest, brand alerts. 1 week.

### What's blocked on

- **Deal density.** The hardest block. Needs ≥3 deals per major ZIP for SMS to feel useful. Central IL has this in ~4 ZIPs today. Entire state has it in maybe 10. Scale-out gated on scraper + outreach completion.
- **Carrier approval for cannabis-category SMS.** 10DLC review is slow and unpredictable. Could be 2 weeks, could be 2 months.
- **Unit economics.** Twilio at ~$0.0079/SMS outbound + ~$0.0075 inbound in the US. At 1,000 queries/day that's real money; at 10/day it's free. Gated on the marketing question of whether anyone actually uses SMS as a first touch.

### Verdict

**Structurally correct direction, premature to build.** SMS-first matches the product's founding principle (parking-lot user) better than the current web-first UI. But implementation is blocked on (a) enough deal density per ZIP, (b) carrier compliance, (c) a Pro-tier migration story that's more vivid than the current one.

Revisit **after** Central IL scope lock has ≥3 deals per covered ZIP and Pro MRR has a first paying customer. Until then, keep it as a thesis, not a sprint.

---

## Cross-idea pattern notes

Three common threads:

1. **All three reinforce the Central IL pivot.** Tax calculator makes Central IL's lower effective tax visible. Calendar gives Central IL buyers a reason to return throughout the year. SMS works because Central IL is small enough that "text your ZIP" actually returns useful results in the geographies we care about.
2. **All three are blocked on data density, not code.** Tax calculator needs a reference file. Calendar needs a year of deal history. SMS needs enough deals per ZIP. Shipping the underlying data is the precondition for any of them.
3. **All three have clean Pro-tier hooks.** Tax calculator → "compare out-the-door prices across counties" (Pro feature). Calendar → "remind me before 4/20" (Pro). SMS → "daily ZIP-based digest" (Pro). The Pro-tier story gets clearer with all three than without any one.

## What I'd prioritize if asked (I wasn't)

1. **Idea 1 Phase A (`docs/illinois-tax-reference.md`) this sprint.** Cheap, unblocks everything downstream, directly strengthens the Central IL positioning. Cowork can do this.
2. **Idea 2 Phase A (deal event-tagging in ingest)** opportunistically — bundle with the ingest validation work already shipped April 23.
3. **Idea 3 on hold** until Central IL deal density improves. Revisit after May 24 scope review.

No implementation started in this session. Matthew's roadmap decision.

---

## Addendum — 2026-04-25: Idea 4 — Turn SMS into real enough

### The pitch

Short version of Idea 3 above, designed to land before the full 10DLC stack. One Twilio number or Zapier webhook. One manual-trigger route. One test user (Matthew). The homepage SMS promise — "text a ZIP, get deals" — becomes technically true for one phone number, today, with no compliance theater.

The flow:

1. A Twilio phone number (or a Zapier inbound-SMS webhook with a free Twilio trial credit) receives a text.
2. The inbound body is piped to a simple handler (Zapier → email, or a one-route serverless endpoint).
3. Matthew reads the incoming ZIP, runs a SELECT against the live Central IL deals table, and sends a reply — either by hand or via a queued Twilio send.
4. The loop closes in under 5 minutes for test users.

Volume is zero. Compliance burden is zero (single test user, opt-in by virtue of being Matthew). The point is not scale. The point is that the homepage's implicit SMS promise isn't vaporware the first time a real person tests it.

### Why this matters relative to Idea 3

Idea 3 ships the full SMS experience with Pro-tier wrapping, ZIP-based digest, alerts, etc. — blocked on 10DLC approval, deal density, unit economics, and compliance review. Months of work.

Idea 4 is the **minimum viable credibility** version. It doesn't try to scale. It tries to make the homepage honest for one reader.

This matters because the Central IL scope lock is fundamentally about "don't make claims you can't stand behind." If the homepage says SMS is an option and the answer to "how do I use it?" is "we haven't built it yet," the scope-lock credibility story has a hole in it. Patching the hole is cheap once you stop trying to make SMS a product.

### What we already have

- Stripe Pro tier live (April 23). Any payment friction is handled.
- Decision engine (`lib/decisionEngine.ts`) already does ZIP-based deal ranking for the web surface.
- Matthew has a phone. Matthew can manually reply.

### What we'd need

- One Twilio trial number (~free; no 10DLC needed for single-receiver test traffic) OR a Zapier account with SMS triggers enabled.
- A one-page internal route (or just an email forward) where Matthew can see the inbound text.
- A manually-triggered reply template pulling from the existing deals query.
- Optional: a "test-user" gating screen on the homepage SMS feature, so we only solicit SMS from people Matthew invites personally for the pilot period.

### What's blocked on

Essentially nothing. Single test user scope removes carrier-compliance and volume concerns. The main judgment call is whether to keep this as a dev-only demo or offer it as a personal-invite pilot. Pilot-mode is more useful feedback but takes a few more hours of setup.

### Verdict

**Medium priority, post-Stripe.** Not urgent because Stripe Pro is live and cleaner. But the moment Matthew has a real prospect on the phone asking about SMS alerts or the homepage SMS promise, this unblocks the "yes, here's how" answer without lying. That conversational unblock is worth the hour or two of Zapier wiring.

Do it before attempting the full Idea 3 build — proves the loop works end to end on a single user before investing in 10DLC, compliance, and Pro-tier integration.

Source: DeepSeek's April 23 external review, paraphrased and expanded.

---

## Addendum — 2026-04-26: Idea 5 — Verified deal source link on every deal card

### The pitch

Every deal card on PuffPrice shows the deal title, the dispensary, and a link to the dispensary listing. Idea 5: optionally also show a "View source" link that goes to the page where the scraper extracted the deal — the dispensary's `/specials`, `/deals`, embedded menu URL, or whatever direct source the deal carries in `deals.source_url`.

A user clicks "View source" and lands on the dispensary's own deal page in a new tab. They see the same deal in the dispensary's own words, on the dispensary's own domain, with the dispensary's own pricing. Maximum trust. The data isn't just "PuffPrice says NOXX has 20% off edibles" — it's "PuffPrice says NOXX has 20% off edibles, and here's noxx.com/specials so you can confirm in one click."

### Why it matters

1. **Trust ceiling.** Every aggregator hits a trust ceiling at some point — "how do I know this isn't stale or wrong?" A one-click verifiable source moves the ceiling up. Especially valuable for the Central IL pivot where the credibility story depends on "we don't bullshit."
2. **Free SEO signal.** Outbound links to dispensary domains are a "we're embedded in the local cannabis ecosystem" signal. Modest direct value, but a useful piece of the topical-authority story.
3. **Pairs with the deal data policy.** The April 26 deal data policy (`docs/deal-data-policy.md`) commits to direct sources only — no aggregators. "View source" makes that policy visible to the user, not just to internal docs. The honesty becomes a feature.
4. **Falsifiability is the moat.** Weedmaps and Leafly do not surface their source page (they often don't have a single one — deals come from operator portals or partnership feeds). A direct-source-only competitor that lets you check the math has a structural advantage that's hard to imitate.

### What we already have

- **`deals.source_url`** is populated on every direct-source deal today (10 of 10 active CIL deals as of 2026-04-26 night). This is the field the link would point to.
- **`deals.source`** distinguishes website / social / direct-contact tiers. The UI can vary per tier — "View source" for `source='website'`, "Verified by call" for `source='direct_contact'`, etc.
- **Deal card component** already exists and already renders an outbound link to the dispensary listing. Adding a second outbound link is a low-touch UI change.

### What we don't have

- **A click-tracking decision.** Outbound clicks on deal sources are useful analytics but require a decision on whether to interstitial them through `/r/source/[id]` for tracking, or to let them go straight to the dispensary domain. The latter is faster and more honest; the former gives us better attribution data.
- **A "source page may be stale" caveat.** Sometimes the deal exists in our DB because it was scraped 12 hours ago, but the dispensary updated their `/specials` page 2 hours ago and the deal is no longer there. The user clicks "View source" and finds the deal missing. Need a small piece of UI to say "Sourced from [URL] at [timestamp]" so the user understands the freshness window.
- **A fallback for direct-contact deals.** Deals verified by phone don't have a meaningful source URL. The UI should hide "View source" for those, or replace it with "Verified by direct contact, [date]."

### Rough scope

- **Phase A (UI):** Add a "View source" link to the deal card component for `source='website'` deals. Open in new tab. 1 hour of work.
- **Phase B (caveat):** Add a small "Sourced [N hours] ago" label next to the link. 1 hour.
- **Phase C (analytics, optional):** Decide on interstitial vs. direct outbound. If interstitial, scaffold `/r/source/[deal_id]` with a 302 to the source URL and click logging into `deal_clicks`.

### What's blocked on

Nothing structurally. Could ship Phase A in a single small PR.

### Verdict

**Low priority post-Stripe, but worth queueing.** Not urgent because the current deal cards are working. But the moment a user emails asking "is this deal real?" — and that email will arrive — having "View source" already shipped is the cleanest possible response. Build it before the email lands, not after.

Source: surfaced during the 2026-04-26 evening audit conversation (Matthew + Claude). Triggered by the realization that the new deal data policy makes per-deal source links cheap and natural.
