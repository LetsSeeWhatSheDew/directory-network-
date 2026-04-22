# PuffPrice sales playbook — 2026-04-22

**Author:** Cowork
**Date:** 2026-04-22 (authored 2026-04-21 night)
**Audience:** Matthew, working from home this week.
**Goal:** Replace vibes + 5 brand drafts with a concrete Monday-morning playbook.

**Pairs with:**
- `docs/drafts/brand-outreach-20260421/` — the 5 existing brand drafts this playbook revises.
- `docs/research/affiliate-shortlist-20260421.md` — 5-brand feasibility deep-dive.
- `docs/research/affiliate-revenue-feasibility-20260421.md` — longer 10-15 brand long-list.
- `docs/audits/deal-data-freshness-20260421.md` — the honesty constraint (don't claim real-time intelligence we don't have yet).
- `docs/ops/index-data-workflow-20260422.md` — Path C is the "trial" ask for dispensary outreach.
- `lib/brands.ts` — the 5 brand pages already shipping on the site.

**Tone constraints (per brand voice work):**
- Plain-spoken. No corporate filler.
- Slightly cheeky but trust-first.
- **No fabricated metrics.** Real numbers only: 61 dispensaries, 49 active deals post-migrations, 25 IL cities. Past Cowork drafts had "50k visitors by summer" — that's the kind of claim to cut.
- Matthew sends from `matthew@jacarandapeoria.com` until `hi@puffprice.com` or `partnerships@puffprice.com` ships.

---

## Executive summary — the three tiers

| Tier | Target | Week-1 ask | Success metric |
|---|---|---|---|
| **1 — Dispensaries** (B2B) | 15 prioritized IL dispensaries | Trial: submit 3 deals via `/deals/submit` — no commitment, no contract | 3 dispensaries submit at least 1 deal in 14 days |
| **2 — Brand affiliates** | Cresco, GTI, PAX first; Kiva, Verano next | Brand page pilot OR affiliate signup (PAX) | 1 signed partnership (any size) in 30 days |
| **3 — Community organic** | r/ILTrees + 3-5 IL Facebook groups + earned media | Genuine participation + PuffPrice Index story pitch | 100 real organic visits/week by day 30 |

Do all three in parallel — they feed each other. Dispensary outreach is slow; brand outreach has long cycles; community gives you weekly dopamine and builds the traffic story that makes tiers 1 and 2 easier to close.

---

# Tier 1 — Dispensary outreach (B2B)

## Why start here

57 of the 61 IL dispensaries on PuffPrice are **unclaimed**. Not one has a reason to actively care about the directory today. The only dispensary-side pitch that's real right now is: "we surface your deals to consumers searching for deals in your city — submit your current promos so they're accurate."

The ask is **not**: "pay us." The ask is: "submit 3 deals via `/deals/submit` — no login, no contract, 5 minutes." The value delivered is **traffic accuracy**: consumers who find a stale deal in your shop and drive there angry — that happens today, and this is how to stop it.

Once a dispensary submits even one deal, Matthew has a warm introduction for paid upsells later. Cold → warm conversion is the whole job of Tier 1.

## Priority ranking criteria

1. **Actively promoting.** They're already running sales the deal feed surfaces → they care about accuracy.
2. **Has contact info on file.** Phone and website populated in `master_listings` — no lead-gen stall.
3. **Non-MSO.** Cresco (Sunnyside) and GTI (Rise) are corporate chains with centralized marketing — they won't submit individual deals per-store. Ivy Hall, Trinity, NOXX, nuEra, Revolution, Terrace, Seven Point, Hi5, Altius, Zen Leaf (all independent IL operators) will act faster.
4. **High-promotion density.** Dispensaries currently showing up in 3+ active deals on PuffPrice already see the value — the directory is surfacing their content, we just need them to co-sign it.
5. **Non-claimed listing.** Every priority candidate is `claimed = false` today — activating the claim flow is its own conversion funnel.

## Top 15 target dispensaries

Ranked by a composite of deal density × contact completeness × non-MSO status. Every row below has phone + website populated in master_listings (verified via the query at the bottom of this doc) — Matthew can call or web-form from day one.

| # | Dispensary | City | Phone | Deals in PuffPrice today | Angle |
|---|---|---|---|---|---|
| 1 | **nuEra East Peoria** | East Peoria | (309) 839-1330 | 6 | 6 active deals already running; homepage hero picks them frequently. Show the dispensary its own hero card — strongest natural pitch. |
| 2 | **nuEra Urbana** | Urbana | (217) 607-2867 | — (but sibling to above) | Same ownership as #1 — close one nuEra location and the other 5 open via warm intro. nuEra Chicago, Aurora, Champaign, East Peoria, Urbana are all on PuffPrice. |
| 3 | **Seven Point Danville** | Danville | (217) 481-3420 | 4 | Running 4 active brand-specific promos (Shine, Dogwalkers, Good Green, Shine). They're actively running coupon codes — ask them to post codes directly via `/deals/submit`. |
| 4 | **Zen Leaf Naperville** | Naperville | (331) 249-8221 | 3 | Strongest Verano-branded deal activity on the feed. Gateway to the Zen Leaf Aurora sister store + to Verano corporate via a happy-retailer reference. |
| 5 | **Terrace Cannabis Moline** | Moline | (309) 704-0420 | 3 | Running Bedford Grow + "Ascend Brands" umbrella deals. Small independent on the Quad Cities corridor; low-friction approval chain. |
| 6 | **High Haven Elgin** | Elgin | (224) 238-3328 | 2 | Surfacing Daze Off + Grow Science craft brands we can't find elsewhere — clear data differentiation pitch. |
| 7 | **Revolution Normal** | Normal | (309) 260-2609 | — | Revolution has 3 locations (Normal, Moline, Schaumburg). If Moline (#5) converts, Normal/Schaumburg follow. Also the anchor SKU source for half the PuffPrice PPG data. |
| 8 | **Ivy Hall Dispensary (Peoria)** | Peoria | (855) 489-4255 | 2 (post-join-fix) | Local to Matthew. Ivy Hall network has 8+ stores statewide — one claim cascades. |
| 9 | **Trinity on University (Peoria)** | Peoria | (309) 863-2122 | — | Independent Peoria operator with 2 locations. Local-to-Matthew — walk-in possible. |
| 10 | **Trinity on Glen (Peoria)** | Peoria | (309) 869-8064 | — | Sister to #9. |
| 11 | **NOXX East Peoria** | East Peoria | (309) 670-9087 | — | Peoria-adjacent, mid-size chain. Complements nuEra East Peoria (#1) for a "we cover your market" pitch. |
| 12 | **AYR Wellness Normal** | Normal | (309) 571-1420 | — | Bloomington-Normal market coverage. |
| 13 | **Beyond Hello Peoria** | Peoria | (309) 232-8134 | — | PharmaCann chain; Peoria-local. Matthew can tie it to the Ozone anchor SKU work. |
| 14 | **Lyfe Dispensary (Rockford)** | Rockford | (815) 708-8710 | — | Rockford market, independent. |
| 15 | **Shangri-La Springfield** | Springfield | (217) 576-8848 | — | Springfield market coverage. |

**Dispensaries to deprioritize or skip entirely in Tier 1:**
- **Cresco / Sunnyside (7 stores)** — centralized marketing; Tier 2 instead.
- **GTI / Rise (6 stores)** — centralized marketing; Tier 2 instead.
- **PharmaCann / Verilife + Beyond Hello** — centralized; contact via brand route (though Beyond Hello Peoria at #13 is fine as a local-market data point).
- **Curaleaf** — centralized; contact via brand route.
- The 6 orphaned-listing dispensaries (bisa-lina-joliet, cookies-chicago, curaleaf-morris, natures-treatment-milan, perception-cannabis-chicago, mood-shine-chicago-heights) — resolve the master_listings row first, then outreach.

## Dispensary pitch sequence

Four touches over 14 days. Sequence, not a one-shot email.

### Touch 1 — Email (day 0)

Template below. Goal: 3 deals submitted via `/deals/submit`. No ask for meeting, payment, or commitment.

**Subject (pick one per send for A/B):**
1. `Your [Dispensary Name] deals are on PuffPrice — quick accuracy check`
2. `Illinois deal finder has [Dispensary Name] — here's what we're showing`
3. `60-second favor: confirm [Dispensary Name]'s current deals`

**Body (≤ 150 words):**
```
Hi [Dispensary Name] team,

I run PuffPrice (puffprice.com) — an Illinois cannabis deal finder.
Consumers use it to spot deals near them.

Your shop is on our directory — here's your page:
[direct /l/{slug} link]

Right now we're showing [N] active deals for you. I want to make
sure they're current. If any are stale or wrong, or if you have
new ones dropping this week, the 5-minute fix is our submission form:

  https://puffprice.com/deals/submit

No login, no contract. Just puts your correct deals in front of
buyers in [City] searching for what you actually sell.

Questions or want to see how we rank? Reply and I'll answer directly.

Matthew Cavalier
Founder, PuffPrice
matthew@jacarandapeoria.com
```

**Key constraints:**
- Links to the dispensary's actual PuffPrice page in line 2 — proves this isn't a spam blast, we know who they are.
- Specific number `N` (pulled from the SQL query at the bottom of this doc before each send).
- `/deals/submit` is the real CTA — low-friction, no ask for money.
- No "20-minute call" ask. That's Touch 3.

### Touch 2 — Follow-up email (day 5)

If no response. **Shorter**, ~80 words. Same thread, not a new one.

```
Hey [name], quick follow-up — did the PuffPrice link come through?

If submitting 3 deals isn't worth 5 minutes, no worries — I can
also just confirm what we're showing is accurate via a 2-minute
phone call. Or email back the corrections here.

Either works. Or if this isn't the right inbox, pointing me to the
right person helps too.

Matthew
```

### Touch 3 — Phone call (day 10)

If still no response. Phone number pulled from master_listings. Call during posted hours (use the listing_hours table).

**Opening (≤ 20 seconds — dispensary front desk):**

> Hi, this is Matthew from PuffPrice — I emailed about your current
> dispensary deals. I don't want to take much of your day; I just
> want to make sure what our site shows is accurate. Who handles
> the website and promotions for [Dispensary Name]?

**Get a name, transfer, or callback number. That's it. Don't pitch on the call unless you get transferred to the right person.**

**If transferred to decision-maker (2-3 minute pitch):**

> Thanks for taking a minute. PuffPrice is an Illinois deal finder —
> puffprice.com. Consumers searching for deals land on us and we
> route them to the dispensary running the best current deal in
> their area. You're already on the directory. I want to make sure
> the deals we're showing are yours and current — not stale, not
> wrong.
>
> Your page shows [X deals]. If those are wrong, or you've got new
> ones, our /deals/submit form takes 5 minutes. No login. Free.
>
> Would [Wednesday / end of week] work for you to send 3 current
> deals through that form? I'll watch for them and confirm they
> landed right.

**Commit to a specific day if they agree.** "I'll watch for them" makes it a visible commitment.

### Touch 4 — Check-in email (day 14)

Only if deals did NOT land in `deal_submissions`. If they did, send a thank-you instead.

**If submitted (day 14 celebration email):**
```
Your deals landed — thank you. Live on the site this morning:

  [direct links to approved /deal/{id} pages]

If you see any errors in how they're rendered, reply here and I'll
fix same-day. Otherwise I'll check back in two weeks with site traffic
numbers from your page so you can see what PuffPrice is doing for you.

Matthew
```

**If still silent (day 14 close-out):**
```
No worries [name] — I'll close this out.

PuffPrice is live at puffprice.com and your page stays online with
what we've got. If priorities shift and you want to take 5 minutes
to update your deals, the form is always there: puffprice.com/deals/submit.

All the best,
Matthew
```

Do NOT send a 5th email, 6th email, LinkedIn message, or DM. One "no" (or one silent close-out) is a no. The list has 60+ targets — the conversion problem is coverage, not persistence.

## Tier 1 success criteria

| Day | Target |
|---|---|
| 7 | 5 dispensaries emailed at Touch 1. 2 responses (opens, replies, or voicemail callbacks). 0 submissions OK. |
| 14 | 10 dispensaries emailed. 3 responses. 1 submission. |
| 30 | 20 dispensaries emailed. 6 responses. 3 dispensaries have submitted at least 1 deal. |

**If at day 30 you have zero submissions from 20 emails:** the pitch isn't resonating. Go back and rewrite based on what the 6 responders said. Don't send to the next 20 until the pitch is refined.

---

# Tier 2 — Brand affiliate outreach

## What already exists

5 draft emails in `docs/drafts/brand-outreach-20260421/`:
- `cresco-outreach.md` — Cresco Labs (via contact form)
- `gti-outreach.md` — GTI (media@gtigrows.com)
- `kiva-outreach.md` — Kiva Confections (via contact form)
- `pax-outreach.md` — PAX Labs (affiliates@pax.com or FlexOffers)
- `wyld-outreach.md` — Wyld (retailer form)

**Note on the 5th:** Wyld has no IL footprint per `lib/brands.ts`, which is why the 5 brand pages on the site are Cresco/GTI/Verano/Kiva/PAX (not Wyld). The Wyld draft is a nice-to-have when/if they enter the IL market; it's not a tier-1 send this week.

## Per-draft review and recommendation

### 1. PAX Labs — SEND AS-IS (highest-priority send)

**Verdict:** Send as-is. One line to edit.

- Only brand with a real click-through affiliate program — federal-legal hardware, no state-THC complexity.
- Draft at 149 words, proper notes on FlexOffers fallback.
- **One edit:** the draft says "5 active concentrate deals + 3 active vape deals every week" — confirm current counts before sending. Quick query:
  ```sql
  SELECT category, COUNT(*) FROM deals
  WHERE is_active = true GROUP BY category;
  ```
  Today: concentrate = 5, vapes = 4 — update the draft to `"5 active concentrate deals + 4 active vape deals"` before sending.
- **Send via:** `affiliates@pax.com` direct email (NOT the FlexOffers form — FlexOffers is currently inactive for PAX per last session's research).

**Action this week:** Send Monday. Expected response: signup instructions or a "not accepting new affiliates right now" form reply. Either way, data.

### 2. GTI — SEND AS-IS

**Verdict:** Send as-is. Update the Dogwalkers deal reference.

- Clean draft at 146 words. `media@gtigrows.com` is a verified public inbox.
- **One edit:** The Dogwalkers promo at seven-point-danville is still live in the feed — the citation is accurate. Confirm "35%-off-Dogwalkers promos out of Seven Point Danville" is still running before send (it is, per query).
- **Send via:** `media@gtigrows.com` with `press@gtigrows.com` as cc.

**Action this week:** Send Tuesday (stagger after PAX). Expected: a press/media reply that redirects to the right partnerships person. GTI is corporate and slow — plan for 2-week cycle.

### 3. Cresco Labs — SEND AS-IS

**Verdict:** Send via corporate contact form at `crescolabs.com/contact`.

- 148-word draft, hits High Supply + Sunnyside + Simply Herb + Mindy's in one breath.
- **Send via:** Web form only (no public inbox that resolves to the right team). Backup email `dana.mason@crescolabs.com` is unverified — skip for now.

**Action this week:** Send Wednesday. Web forms are lossy — expected response rate is ~30% vs. 60%+ for direct email. If no response by day 14, a LinkedIn message to N. Fox (Head of Brand Marketing) is the Touch 2.

### 4. Kiva Confections — EDIT THEN SEND

**Verdict:** Send, but trim to emphasize IL exclusivity angle.

- 143-word draft is too brand-genteel. Kiva runs lean partnerships with scrappy operators (Fatburger, Garden Society) — the right tone is "we're small and fast" not "we're the serious Illinois deal site."
- **Edit:** Change the second paragraph from the current "Edibles are a real category on our feed (7 active deals as of this week, with Kiva products surfacing in 3 of them)" to:

  > Edibles are one-sixth of our current deal feed, but Kiva
  > products keep surfacing in the underlying data: Camino,
  > Petra, Terra. The deals go to Kiva's retail partners — we
  > want to connect the dots back to the Kiva brand itself.

- **Edit:** soften "featured brand on the /cannabis-edibles section" to "featured brand on our edibles category page" (keep it concrete, lose the corporate path-slug language).
- **Send via:** `kivaconfections.com/contact` web form. Backup: LinkedIn DM to David Hudson.

**Action:** Send next week (after PAX + GTI responses inform the pitch).

### 5. Wyld — HOLD

**Verdict:** Don't send this week.

- Wyld has no IL footprint. Sending now reads as "we noticed we have nothing for Illinois" which kills the pitch.
- Hold until Wyld launches IL product (tracked via brand news) OR PuffPrice expands to a state where Wyld is active (MI, OH, NV, CO).
- Keep the draft — it's solid for when the moment is right.

### Missing from the current draft set

**Verano** is in the 5-brand shortlist (`lib/brands.ts` ships the page) but has no outreach draft yet. Matthew should draft one after the Kiva pitch lands (it'll be a natural follow-up: "we launched the Verano page — here's the pitch").

Reuse the GTI structure: observed Savvy deal activity, Zen Leaf retail footprint, specific brand-page ask.

## Follow-up cadence for brand outreach

Different from dispensary cadence — longer cycles, bigger orgs.

| Day | Action |
|---|---|
| 0 | Touch 1 (the draft, as edited) |
| 7 | No-response follow-up on the same thread — 2-line check-in |
| 14 | One more if still silent (optional — skip if previous was ignored) |
| 21 | Close out. Move on. |

**Success metric:** 1 signed partnership (any size — even a $500 one-month sponsored slot) within 30 days. That's validation. Above that is bonus.

**If PAX says yes first,** that's not validation of the IL MSO pitch — it's a clean affiliate signup. Keep chasing GTI + Cresco regardless.

## What you're NOT doing on brand outreach this week

- **Not calling brand HQs.** Call works for local dispensaries; corporate comms teams at Cresco/GTI have built walls against cold calls. Email + form first.
- **Not LinkedIn DMs to C-suite.** Brand outreach at this stage goes to mid-level marketing / partnerships. C-suite gets it after a signed pilot is running.
- **Not offering discounts, rev shares, or free months.** The pitch is the pitch. If they counter, fine — negotiate then. Don't pre-concede on Touch 1.

---

# Tier 3 — Community organic

Slowest to compound, cheapest to start, unlocks earned media down the line. Pure-brand channels — no paid content, no growth hacking.

## 3a. r/ILTrees participation

**Positioning:** Matthew shows up as "guy who runs PuffPrice" exactly once on the sidebar intro, then stops leading with that. Real participation = answer questions, share knowledge, mention PuffPrice **only** when it's the actual answer to a real question.

Reddit mods ban promo accounts within 2-4 posts. The safe cadence: **5 comments a week, max 1 PuffPrice mention per week**, always in reply to a real question PuffPrice genuinely answers.

**5 example comments Matthew could make this week** (pulled from common r/ILTrees patterns + real deals in the feed today):

1. **On a "who's got the best deal on flower this week in [city]" post:**
   > In Peoria specifically the current rotation is Ivy Hall on
   > Savvy (30% off, stackable) and nuEra East Peoria doing 15%
   > Friday flower. I tracked both on my site, PuffPrice, if it
   > helps — but either counter at the shop will confirm them
   > direct.

   *(Mentions the site once, still delivers real value. The "counter at the shop will confirm" line is the trust layer.)*

2. **On a "Rythm vs Cresco — which is better for flower?" taste debate:**
   > Both have premium 3.5g at the $40-45 tier. Rythm tends to
   > run higher terp testing but Cresco premium has tighter QC
   > imo. Neither loses for the money. The place to care about
   > the price difference is the 14g and 28g tiers where $10-20
   > actually compounds.

   *(No PuffPrice mention. Pure cannabis knowledge. This is the foundational post — it builds the identity that makes Post 1 feel organic.)*

3. **On a "first time visiting Illinois — best stop near [expressway exit]" post:**
   > If you're coming up I-74 from the west, nuEra East Peoria
   > (Exit 95) is the cleanest stop — 6 current deals running
   > Mon through Fri. If it's a weekend, Ivy Hall Peoria is 10
   > minutes north and usually has a better first-visit discount.
   > Call before driving — the deals rotate.

   *(Practical route info, specific deals cited. Doesn't link PuffPrice but obviously could — credibility-building before a future "here's the tracker" post.)*

4. **On a "anyone tried Daze Off flower?" taste question:**
   > Reefer Gladness is their best-rated strain — but it's thin
   > on IL menus. I've seen it at High Haven Elgin and a couple
   > of the Rockford shops in the last month. If you're driving
   > far for it, call first to confirm stock.

   *(Uses the specific SKU mentioned in PuffPrice's high-haven-elgin deal. Accurate. Knowledgeable.)*

5. **On a "why are edibles so expensive in IL" policy gripe:**
   > State-capped mg per pack is the direct cause — 100mg max
   > means the per-mg pricing in IL is roughly 2x what CO or MI
   > sees. Kiva chocolates run $20-22 for a 100mg bar; Camino
   > gummies about $23. Best routes to save are multi-pack promos
   > and anything labeled 'Muchie Monday' at local shops.

   *(Pure knowledge drop. Caps at $0 promotion. Establishes Matthew as the person who knows the policy mechanics.)*

**Rules Matthew follows on r/ILTrees:**
1. First post in every thread: answer the question, no brand mention.
2. 1-in-5 comments can include "I track this on PuffPrice" if it's actual answer to actual question.
3. Never upvote/downvote own comments from another account. Mods catch this.
4. If a mod PM's about self-promo, stop for 2 weeks. Come back slow.

**Target:** 2-3 genuine organic clicks per week from r/ILTrees by day 30. Not a traffic firehose — a trust channel.

## 3b. IL cannabis Facebook groups

Five IL-focused groups worth a real research pass before posting:

1. **"Illinois Cannabis Enthusiasts" (Facebook Group)** — ~10-15k members, active discussion, active moderation. Posts about deals are on-topic.
2. **"Chicago Cannabis" (Facebook Group)** — Chicago-specific, ~5-8k members. More event-focused but deals + dispensary tips resonate.
3. **"Peoria-area Weed Talk" (Facebook Group, if it exists — verify)** — hyperlocal, Matthew's home market. If not, worth being the first PuffPrice mention in Peoria-local general Facebook groups.
4. **"Illinois Dispensary Reviews"** — review-focused; PuffPrice tie-in is "compare prices" angle.
5. **"[City] Cannabis Club"** for each of the top 5 cities on the directory (Chicago, Peoria, Aurora, Naperville, Carol Stream). Hit one per week.

**Approach:** Post once in each group with a valuable deal roundup — NOT a "hey check out my site" ad. Example:

> **This week's best Illinois flower deals — all in one place**
>
> Spent my Sunday reviewing what's running right now, sharing
> the cheapest per-gram picks:
>
> - Peoria: Ivy Hall 30% off Savvy (stackable to 35%)
> - Naperville: Zen Leaf 30% off Timeless vapes
> - Moline: Terrace Cannabis 25% off Bedford Grow
> - Chicago: High Supply ounces on the Lower West Side
>
> Full list with per-gram and distance calcs on PuffPrice if
> you want the live feed. Happy hunting.

- One post per group per week. Rotate cities each week.
- Always answer comments (driving engagement ≠ dropping links).
- Don't join more than 2-3 groups in the same week — Facebook throttles new-member-posting.

**Target:** 50-100 real clicks per week from Facebook groups by day 30.

## 3c. Earned media (longer-term)

The PuffPrice Index — once it clears the `sample_size ≥ 10` threshold and goes live at `/about/index` — is the real earned-media pitch. Until then, hold.

When it's live, the story is: **"Illinois cannabis prices are X — here's how we built the first public index tracking them."** That's pitch-worthy to:

- **Marijuana Business Daily** (mjbizdaily.com) — tips@mjbizdaily.com. They cover data-driven cannabis stories and Illinois is a reportedly-hot market. Pitch: "we built the first open IL price index — here's what it shows."
- **Cannabis Business Times** (cannabisbusinesstimes.com) — editorial@cannabisbusinesstimes.com. Similar angle.
- **Chicago Tribune / Sun-Times** business desks — local angle: "Chicago-area deal site launches IL price index."
- **Peoria Journal Star** — Matthew-local, they'll bite.
- **Crain's Chicago Business** — they track MSOs. A data-point story about IL consumer cannabis prices fits.

**Template pitch email (for when Index is live):**

Subject: `Illinois' first public cannabis price index — PuffPrice launched it this week`

Body (≤ 100 words):
> Hi [name],
> I run PuffPrice (puffprice.com), a Chicago-area deal finder.
> We just published the first Illinois cannabis price index —
> tracks flower price-per-gram statewide, updated weekly,
> sourced from [N] dispensary deals across [M] cities. Full
> methodology at puffprice.com/about/index.
>
> Happy to share the data, explain the math, or answer
> questions about what the state's prices look like right now
> vs. legalization-era 2020. Interested?
>
> Matthew Cavalier
> puffprice.com

**Hold this pitch until Index is live.** Sending "we're going to do this" is lame. Sending "we did this" is a story.

---

# Week-one operating rhythm

If Matthew works from home Mon-Fri and wants to execute every tier:

| Day | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| **Mon** | Email Touch 1 to #1–3 (nuEra East Peoria, nuEra Urbana, Seven Point) | Send PAX draft | 1 comment on r/ILTrees |
| **Tue** | Email Touch 1 to #4–6 (Zen Leaf Naperville, Terrace, High Haven) | Send GTI draft | 1 comment on r/ILTrees |
| **Wed** | Email Touch 1 to #7–9 (Revolution Normal, Ivy Hall, Trinity on University) | Submit Cresco contact form | 1 comment on r/ILTrees |
| **Thu** | Email Touch 1 to #10–12 (Trinity on Glen, NOXX, AYR) | Respond to whatever came back | 1 FB group post (Illinois Cannabis Enthusiasts) |
| **Fri** | Email Touch 1 to #13–15 (Beyond Hello Peoria, Lyfe, Shangri-La) | Triage the inbox; plan week 2 | 1 comment on r/ILTrees + 1 FB post (Chicago Cannabis) |

Total: 15 dispensary emails, 3 brand emails, 5 r/ILTrees comments, 2 FB posts. One week of execution, all measurable.

Week 2 is Touch 2 follow-ups for Tier 1, Kiva draft send for Tier 2, next Tier 3 city-specific FB groups.

---

# Metrics + accountability

Track once a week in a simple Google Sheet. Columns:

| Sent | Opened | Replied | Converted (submission, signup, meeting) |
|---|---|---|---|

One row per outreach target. Review Friday each week — any target at 3+ touches with no response is done; move on.

**Honest 30-day outcome projections:**
- Tier 1 realistic: 3 dispensaries submit ≥1 deal. Stretch: 1 claim completed (paid $0; just activates the claim flow + establishes relationship).
- Tier 2 realistic: PAX signup done. 1-2 brand responses with interest. 0 signed brand partnerships yet.
- Tier 3 realistic: 50-100 Facebook-sourced visits/week by day 30. 5-10 r/ILTrees mentions of PuffPrice that aren't Matthew's. 0 earned media yet (Index not live).

If those land, there's enough traction to keep the MSOs warm while the paid flow matures. If they don't, the pitch is the problem, not the targets.

---

# Appendix — the target-refresh query

Run before every Tier 1 batch send. Gives Matthew the current deal count per dispensary for the personalized `N` in Touch 1.

```sql
SELECT
  ml.slug,
  ml.name,
  ml.city,
  ml.phone,
  ml.website,
  COUNT(d.id) FILTER (WHERE d.is_active = true) AS active_deals,
  ml.claimed
FROM public.master_listings ml
LEFT JOIN public.deals d ON d.listing_slug = ml.slug
WHERE ml.project_tag = 'green'
  AND ml.city IN (
    'Chicago','Peoria','East Peoria','Naperville','Aurora','Carol Stream',
    'Schaumburg','Bloomington','Normal','Champaign','Urbana','Springfield',
    'Rockford','Joliet','Quincy','Galesburg','Moline','Waukegan',
    'Mundelein','Elgin','Danville','Crestwood','Westmont','Collinsville',
    'Effingham','Columbia'
  )
  AND ml.phone IS NOT NULL
  AND ml.claimed = false
GROUP BY ml.slug, ml.name, ml.city, ml.phone, ml.website, ml.claimed
ORDER BY active_deals DESC, ml.name ASC;
```

Copies to Matthew's clipboard → he runs it Monday morning → any deal-count changes get reflected in that day's Touch 1 emails.
