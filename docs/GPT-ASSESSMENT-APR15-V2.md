# PuffPrice Strategic Assessment V2 — April 18, 2026

**Prepared by:** Cowork research/strategy pass, Sprint 2
**Owner:** Matthew Burns · matthew@jacarandapeoria.com
**Supersedes:** `docs/GPT-ASSESSMENT-APR15.md` (Sprint 1, April 17)
**Purpose:** Updated external-review document for GPT assessment after Sprint 2 produced deploy-ready content assets on top of the Sprint 1 strategy.

---

## What's New Since V1

### Sprint 2 produced ready-to-deploy content

The first assessment described what PuffPrice **should** say. This one describes what it **now has written and ready to ship**:

- **City page intros (12 cities)** — unique copy for Chicago, Peoria, Rockford, Springfield, Aurora, Joliet, Naperville, Elgin, Waukegan, Champaign, Bloomington, Decatur. Drop-in paragraphs plus nearby-area references and target keywords. See `docs/city-content-final.md`.
- **Zone 4 page copy** — full written content for the three Phase 1 AI-citation pages: Illinois Cannabis Deal Tracker (the live state overview), Illinois Cannabis FAQ (10 schema-ready Q&A), and How PuffPrice Works (the explainer page). See `docs/zone4-pages-final.md`.
- **PRO tier copy** — hero headlines, six PRO feature descriptions, price justification lines, waitlist copy, and objection-handling FAQ. See `docs/pro-copy.md`.
- **Dispensary outreach templates** — three email templates (cold claim, deal-submission invite, 7-day follow-up) in Matthew's Peoria voice. See `docs/outreach-templates.md`.
- **Social media content plan** — platform recommendations, three content pillars, ten ready-to-post items, and a day-by-day 4/20 content calendar (Apr 17–20). See `docs/social-content-plan.md`.
- **Investor/partner one-pager** — 90-second read covering product, market, traction, Zone 4. See `docs/one-pager.md`.

### Since V1 went to GPT, code has apparently shipped:
Based on Matthew's Sprint 2 briefing — dispensary profiles, city pages, deal pages, claim flow, search, Open Graph tags, FAQ schema, recently-viewed pages, Lighthouse 96–100 perf scores. The product has moved from "core user journey clean" to "SEO + structured data + social infrastructure in place" in the window between assessments.

### Clarified numbers
- **293 total listings** in the master database (up from 82 previously cited). The 82 figure specifically describes dispensaries with **at least one active deal** — which is the more meaningful number for a deal-tracker. The 293 is coverage breadth; 82 is coverage depth. Both matter.
- **$2B IL cannabis market in 2024** and **$490M in tax revenue** — confirmed from IDFPR announcement. Adds weight to the market-opportunity framing.

---

## New Strategic Findings from Sprint 2

### 1. Platform limitations narrow organic social to exactly two channels
Meta, TikTok, and Google reject most cannabis content — paid or organic. That leaves **Reddit (especially r/ILTrees with ~34K members, quarantined)** and **X/Twitter** as the only high-signal options. LinkedIn and Instagram are off the table for PuffPrice's first six months. The upside: those two channels are **exactly** where our Dan-persona enthusiasts and our industry/journalist audiences live. Scope is fine; focus is better.

### 2. Outreach must be the opposite of what most cannabis-industry SaaS does
Every template in `docs/outreach-templates.md` deliberately undersells, references that the dispensary is already in our database, and has one ask. Small-business dispensary managers get 30+ SaaS pitches a week. PuffPrice's edge in outreach is sounding like a real person from Peoria — because that's what Matthew is. That's not a gimmick; it's a structural competitive advantage.

### 3. The "state of deals" page is the single most important Zone 4 asset
Inside Sprint 2, working on Zone 4 page copy crystallized that Page 1 of the three (Illinois Cannabis Deal Tracker — `/illinois`) is disproportionately the AI-citation vector. Its opening sentence ("There are currently 56 active cannabis deals at 82 dispensaries...") is the answer AI systems can cite verbatim. Pages 2 and 3 exist to give that page context, link graph, and trust signals. **If only one Zone 4 page ships, it's this one.**

### 4. The $0.99 PRO price does structural work we weren't fully articulating before
Sprint 1 defended $0.99 on psychology grounds (below impulse threshold, category creation). Sprint 2 reinforces it on a second axis: **the price is the hook for word-of-mouth.** "PuffPrice is a dollar a month" is shareable in a way "$4.99" or "$9.99" isn't. Reddit threads, Twitter recommendations, and in-person "you should try this" conversations all go smoother at "a dollar." At even $2.99, the conversation becomes "is it worth it?" which slows acquisition. Keep $0.99 at least through the 90-day window, then assess.

### 5. Peoria is genuinely useful as a brand asset
Matthew noting "Peoria is my home base" caused me to lean into it throughout Sprint 2 — outreach templates sign from Peoria, the one-pager says "built in Peoria," Reddit posts close with "Matthew from Peoria." This is not quaint. It's differentiation against a category full of coastal-SaaS pitches and chain-brand marketing. Keep Peoria explicit in every piece of copy that isn't about a different city.

### 6. The SEO-to-AI hand-off matters more than either alone
Every Sprint 2 content asset serves **both** SEO (Google traffic) and AI citation (ChatGPT/Claude/Perplexity answers). The answer-format openings, the factual stat sentences, the schema markup, the internal link graph — all of these are dual-purpose. A 12-city content rollout that ranks on Google AND gets cited by AI for "Illinois dispensary deals in [city]" is a compounding asset. Either use case alone would still justify the work; having both is why the city pages are ROI-priority #1.

---

## Content Ready to Deploy Now (Code can drop these in)

| Doc | Deploys to | Status |
|---|---|---|
| `docs/city-content-final.md` | `/city/[city]` intros for 12 cities | Ready — needs live data bindings |
| `docs/zone4-pages-final.md` | `/illinois`, `/faq`, `/how-it-works` | Ready — needs schema markup wired |
| `docs/pro-copy.md` | `/alerts`, `/waitlist`, PRO upsell components | Ready — may want A/B variants tested |
| `docs/one-pager.md` | Press kit page + PDF export for outreach | Ready |
| `docs/outreach-templates.md` | Matthew's outbound tool (manual or Resend) | Ready — Matthew approval required before sending |
| `docs/social-content-plan.md` | Matthew's personal posting workflow | Ready — timing windows specified |

**Nothing in this list requires more research to ship.** Everything is production-grade text. The bottleneck is deploy time, not content.

---

## Updated Priority List — Next 30 Days

Refining the V1 priority list with what's changed:

### Immediate (this week, Apr 18–24)

1. **Ship the `/illinois` state-of-deals page with the full content from `docs/zone4-pages-final.md`.** Single highest AI-citation ROI. Page is already written.
2. **Wire answer-format opening lines onto all 12 city pages.** City intro content is ready. Bind the live data (`active_deals_count`, `dispensary_with_deals_count`, `last_updated`) and publish.
3. **Ship `/faq` and `/how-it-works`.** The other two Zone 4 pages. All content in `docs/zone4-pages-final.md`. Schema markup is specified.
4. **Deploy PRO copy to `/alerts` and `/waitlist`.** Hero, subhead, price justification, six feature cards. All final in `docs/pro-copy.md`.
5. **Launch Reddit and Twitter accounts with the launch content from `docs/social-content-plan.md`.** Quarantined subreddit or not — get posting. The 4/20 calendar window is open right now.

### Week 2 (Apr 25–May 1)

6. **Deal detail permalinks** (`/deals/[city]/[deal-slug]`). Each deal gets a schema-annotated page of its own. Critical for sharing, SMS deep-links, and AI-citable per-deal references.
7. **First wave of dispensary outreach (20 emails).** Use Template 1 from `docs/outreach-templates.md`. Pure cold. Manual. Matthew sends each one — 20 isn't too many to personalize.
8. **Run the duplicate-deal dedupe SQL** flagged in Sprint 1 (HANDOFF-UPDATE.md blocker).
9. **Price history infrastructure — phase 1.** Start recording prices at every deal activation. Even if the chart UI isn't visible yet, build the data layer. You'll thank yourself in Month 2.

### Weeks 3–4 (May 2–15)

10. **Ship the price history chart UI.** Spark line on deal cards (free), 30-day chart on product pages (PRO). This is the conversion feature.
11. **Wire SMS alert delivery.** Production-hardened TCPA-compliant. Test inbox (Matthew's phone). Ship gated to PRO.
12. **Daily digest email.** 7:30 AM timezone-aware. Curated top 3–5 for each user's city.
13. **Second wave of outreach.** 30–50 more dispensaries. Template 1 again. Plus Template 3 (follow-ups) for non-responders from wave 1.

---

## Remaining Blockers / What Matthew Still Needs To Do

1. **Register `puffprice.com`.** Still pending per `HANDOFF-UPDATE.md`. Gates everything brand-swap-related including `hi@puffprice.com` email.
2. **Set Vercel env vars:** `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`.
3. **Run duplicate-deal dedupe SQL** (service role, Supabase SQL editor).
4. **Reserve `PuffPrice` username on Twitter and Reddit.** Do this in the next 24 hours. Defensive move — costs nothing, protects the brand.
5. **Approve the outreach templates** before the first wave goes out. The drafts in `docs/outreach-templates.md` need Matthew's sign-off.
6. **Decide on a personal posting cadence for social.** Matthew or a helper — 15–30 min/day is the realistic minimum.

---

## Three Specific Questions for GPT Review

### Question 1 — Zone 4 prioritization
**We have written copy for three Zone 4 pages: state-of-deals, FAQ, and how-it-works. If we can only ship one this week, is `/illinois` (the state-of-deals page) the right choice?** My argument is that the opening sentence ("56 active deals at 82 dispensaries...") is the single most AI-citable artifact on the site, and the other two pages exist to amplify it. Counter-arguments?

### Question 2 — Social platform split
**We've scoped organic social to Reddit (primarily r/ILTrees) and X/Twitter. Is that the right split, or should we be testing anything else — e.g., niche cannabis subreddits beyond r/ILTrees, Bluesky, or a carefully-operated Instagram account that accepts the shadow-ban risk?** For context: Meta and TikTok reject most cannabis content, so paid is off the table entirely; this is all organic.

### Question 3 — PRO feature sequencing
**Sprint 1 and Sprint 2 both land on price history as the #1 PRO conversion feature. But SMS alerts are what most users describe when asked "what would you pay for?" Is the right sequencing (1) ship price history first because it's unique and shareable, then (2) ship SMS after because the infrastructure cost is higher — or (3) ship SMS first because it's what users say they want, even if price history converts better?** This is partly a bandwidth question and partly a product-philosophy question.

---

## Appendix: Sprint 2 Doc Index

| File | Purpose | Lines (approx) |
|---|---|---|
| `docs/city-content-final.md` | 12 city intro blocks with unique copy | 330 |
| `docs/outreach-templates.md` | 3 dispensary outreach email drafts | 180 |
| `docs/pro-copy.md` | PRO page hero + 6 feature descriptions | 160 |
| `docs/zone4-pages-final.md` | 3 Zone 4 Phase 1 pages, full copy | 280 |
| `docs/social-content-plan.md` | Platform rec + 10 posts + 4/20 calendar | 260 |
| `docs/one-pager.md` | Investor/partner 90-second summary | 95 |
| `docs/GPT-ASSESSMENT-APR15-V2.md` | This document | 150 |

## Appendix: Sprint 1 Doc Index (reference)

Already committed at `6fdff69`:
- `docs/competitive-teardown.md` — Weedmaps, Leafly, Dutchie, Jane, IL-specific sites
- `docs/illinois-market-research.md` — dispensary counts, chains, prices, timing
- `docs/seo-keyword-research.md` — quick-win / medium / long-term keyword priorities
- `docs/city-page-content-plan.md` — content briefs for top 5 cities
- `docs/pro-tier-research.md` — $0.99 pricing rationale, feature analysis
- `docs/user-personas.md` — Marcus (regular), Sarah (occasional), Dan (enthusiast)
- `docs/zone4-content-briefs.md` — briefs that became Sprint 2's `zone4-pages-final.md`
- `docs/ROADMAP.md` — week 1–2, month 1, month 2–3, month 3–6 deliverables
- `docs/GPT-ASSESSMENT-APR15.md` — first assessment (now superseded)
