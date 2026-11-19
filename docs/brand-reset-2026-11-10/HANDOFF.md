You're taking over PuffPrice for one autonomous run of about 5 hours, in this repo. I'm handing you the wheel. Don't stop to ask me questions. Make the best call, write down your assumption, and keep going.

Everything you need is in the brief below: what I want, the rules, the known problems, the deliverables and the time plan. Before you start, save this whole brief to the branch as docs/brand-reset-2026-11-10/HANDOFF.md.

The job in one line: assess puffprice.com phone-first, score the strategy options 1–10 (brand direction, free vs Pro, what dispensaries pay for, growth), tell me what you'd focus on, and build your top 2 brand directions as real preview pages on a branch with a Vercel preview deploy. Then hand me a decision sheet and a draft PR, and STOP.

Don't merge to main, deploy to production, run SQL, send anything or change accounts until I've reviewed it and replied "run it." After that, build what I approved.

It has to look great on a phone, not look AI, and not bury people in numbers. Nobody pays us to rank. No fake data, ever.

=============== BRIEF ===============

# HANDOFF — Nov 10, 2026: PuffPrice brand reset + strategy run

**Read this whole file before doing anything.** It is the full brief for one autonomous run of about 5 hours. Matthew is handing over the wheel. Do not stop to ask him questions. Where something is unclear, make the most reasonable call, write the assumption down, and keep going.

---

## 1. What Matthew wants (his words, Nov 10)

- "I need the design, the visuals, the aesthetics and the branding to be on point before I go put this in front of anybody." He sees the look as the gate to starting sales meetings with dispensaries.
- "I don't want it to look AI. I don't want it to look repeatable. It needs to look wonderful or perfect on a phone."
- Not sold on the Breathe / "Take a breath" concept anymore. He liked the earlier catchiness of **"Best Bud For Your Buck$."** Open to a new brand direction.
- The screens carry "a lot of words, a lot of numbers, a lot of details… when you're high, you don't want all that, but we also need to provide as much as we can." He wants that balance found.
- Weighing **free = basic info, ~$1/month = full detail and upgrades.**
- "I do think the dispensaries should pay something, but we have to know exactly what it is we're providing them." One package as the pitch, or **three dispensary tiers** that grow in price and benefit.
- For this run he wants you to: **assess the website**, build a **game plan with strategy options scored 1–10** on demand and direction, say **what we should focus on from your perspective**, and then, **after he reviews**, do the work.

## 2. The run: two phases, with a hard stop between them

**This run happens in Claude Code, in the repo.** Work on one branch: `claude/brand-reset-2026-11-10`, cut from the latest `main`. Every deliverable lives on that branch:

- documents go under `docs/brand-reset-2026-11-10/`;
- mockups are real pages, built in code;
- push the branch so Vercel builds a **preview deploy** (not production) Matthew can open on his phone;
- open a **draft PR**. Never merge it.

### Phase 1: autonomous, about 5 hours, no questions

Produce all five deliverables in section 3. Allowed:

- Reading anything: the live site, the repo, Supabase (read-only), Search Console and GA4 if you can reach them.
- Building preview pages and docs on the branch.
- Pushing the branch.
- Opening a draft PR.
- Running Playwright for phone screenshots.

**Not allowed in Phase 1:**

- Merging to main or deploying to production
- Changing any existing production page's behavior on main
- Running SQL
- Sending any email (drafts only; his hooks block sends anyway)
- Changing DNS, Stripe, Vercel env or anything on his accounts
- Posting publicly
- Changing the locked design system artifact

### STOP gate

When Phase 1 is done, write the review package (deliverable 5) and stop. Matthew reviews it, fills in the answer column and comes back.

### Phase 2: after his review

Build only what he approved, in the order he set, following the PuffPrice ship rules in section 8.

## 3. Phase 1 deliverables

Save each one in `docs/brand-reset-2026-11-10/` on the branch and link it from the PR description.

1. **Website assessment.** File: `ASSESS-site.md`, with screenshots in `docs/brand-reset-2026-11-10/shots/`.
   - **Coverage:** phone first (390px, iPhone-size), in both day and night (`?daypart=day|night`). Cover at least: `/`, `/deals/all`, `/city/peoria`, `/city/east-peoria`, one `/dispensary/…`, `/drive-thru`, `/how-we-rank`, `/alerts`, `/law-updates`, `/status`, and the footer.
   - **What to judge:**
     1. First-screen clarity: what a shopper sees in 3 seconds.
     2. Word and number density.
     3. Trust and accuracy (section 5 lists known problems; confirm or clear each one).
     4. What reads as AI or template.
     5. Speed (LCP).
     6. Accessibility (contrast, 44px tap targets).
     7. SEO/AI visibility basics.
     8. Whether it's ready for a dispensary meeting.
   - **Format:** a scorecard first (area · score 1–10 · one-line why), then the evidence, with screenshots described plainly.

2. **Strategy options, scored.** File: `STRATEGY-options.md`.
   - **Groups:** score options in four groups:
     - **A. Brand direction.** Breathe kept and cleaned up, plus at least the six directions in section 4. Add any you think are stronger.
     - **B. Consumer model.** Free vs. Pro split, Pro price, and what sits behind the paywall.
     - **C. Dispensary offer.** One package vs. three tiers, contents, prices, and the pitch.
     - **D. Growth channel.** AI visibility, local press, Reddit, QR flyers, SEO city pages, email/alerts, and so on.
   - **Criteria and weights:** score each option 1–10 on these, then show the weighted total:

     | Criterion | Weight |
     | --- | --- |
     | Shopper demand (do real people want it) | ×3 |
     | Revenue potential | ×2 |
     | Fit with "Nobody pays us to rank" and Matthew's locked rules | ×2 |
     | Effort, where 10 = easiest | ×1 |
     | Time to first dollar or first proof, where 10 = fastest | ×1 |
     | Risk, where 10 = safest | ×1 |

   - **Show:**
     - one table per group, sorted by total;
     - the weights above the table, so he can change them;
     - evidence for each number;
     - UNVERIFIED on anything you didn't check against a source.

3. **Your recommendation.** File: `FOCUS-recommendation.md`.
   - The one plan you'd run for the next 30 days: the brand direction, the free/Pro line, the dispensary offer, and the first 3 meetings to book (by store type, not invented people).
   - Then what to stop doing.
   - Plain words, short. Lead with the answer.

4. **Mockups as real pages.** Build working preview pages for your **top 2 brand directions**, using live data from Supabase or the same real deals listed in section 7. Matthew reacts to visuals, not descriptions, so this deliverable matters most.
   - **Routes:**
     - Put them under `app/preview/brand-reset/<direction>/…`.
     - Mark every preview route `noindex`.
     - Keep them out of the sitemap and llms.txt.
     - Gate them behind a query key or an env flag so they never appear in production navigation.
   - **Per direction:**
     - a calm free home screen;
     - a deal opened in place, which actually opens when tapped;
     - a Pro "what $X/mo gets you" screen;
     - a dispensary tier pitch screen.
   - **Index page:** add `app/preview/brand-reset/page.tsx`, linking every screen.
   - **Density rule:** one answer per screen; details on tap.
   - **First screen:** best deal near you · distance or open-now · one button.
   - **Phone check:** test at 390px in day and night with Playwright, and commit the screenshots.
   - **Styling:**
     - Keep the new directions' styles scoped to the preview routes.
     - Don't touch `app/globals.css` BREATHE tokens on main.

5. **Review package.** Three parts:
   - **Decision sheet:** `docs/brand-reset-2026-11-10/DECISIONS.xlsx`. One row per decision, with these columns: the decision · options · your pick · why · his answer (blank).
   - **Draft PR:** title "Brand reset: assessment + options (DO NOT MERGE)". The description gives the summary, links each doc, the preview deploy URL and the `/preview/brand-reset` index.
   - **Final message:** your last message in the session is the same short summary with those links.
   - He fills in the sheet, attaches it and says "run it". That starts Phase 2.

## 4. Brand directions already floated (Nov 10), to score in group A

| # | Direction | Line | Look |
| --- | --- | --- | --- |
| 0 | Breathe, cleaned up (current locked system) | "Take a breath. We found the deal." | Paper and green, the P with a breath dot. Cleaned up: drop the blurred orb and grain, left-aligned, real specifics. Canvas screens already show this. |
| 1 | Deal Forecast | "Today in Central Illinois: 40% off, clearing by 8 PM." | Morning weather report: highs and lows, a daily forecast per city. Shareable daily habit. |
| 2 | Clip It | "Clip the deal." | Midwestern coupon clipping: dashed cut lines, thrift warmth. Close to the rejected "Receipt" direction, so say how it differs. |
| 3 | The Morning Edition | "Central Illinois, checked by 9 a.m." | Small-town newspaper, datelines. A local-paper version was shown Sep 23 and he picked Breathe instead. |
| 4 | Your Bud | "Best Bud For Your Buck$" as the whole brand | Thrifty friend texting you the deal: message-bubble cards, plain talk. |
| 5 | Heartland | "Made in Central Illinois." | River and prairie palette, county-line type, local pride. No hand-drawn map (vetoed as "tacky"). |
| 6 | The Scout | "We scout 26 stores every morning so you don't." | Field notebook, check marks, "verified" stamps. Trust-first, strongest for dispensary meetings. |

The previous session's picks were Deal Forecast for shoppers and The Scout for meetings. You don't have to agree.

**Rejected Sep 23, so don't bring back without a new reason:**

- price-board directions: Price Sign, Scoreboard, Highway, Receipt
- literal smoke
- the two-ring mark
- the wave mark
- sound of any kind

## 5. Known problems found Nov 10 (confirm, then rank)

**Trust (fix before any meeting):**

- **Deal counts are inflated by daily duplicates.** nuEra East Peoria showed "42 offers," but "Ogeez products · Save 40%" was listed 7 times, once per verification date (Nov 5–10). `/deals/all` lists nuEra Pekin 40% twice. Home says "110 deals… we checked 26 stores," while `/deals/all` says "110 active deals at 9 dispensaries." A dispensary owner would catch this in seconds. Check the `deals` / `deal_observations` logic in Supabase (read-only) and the dedupe in `scripts/scrape-cil-deals.ts`. Seen on the live pages only; the database hasn't been checked.
- **Mismatched store description.** On `/city/peoria`, "Bloom Wellness Peoria" carries the description "Beyond Hello Peoria is an adult-use cannabis dispensary…".
- **Awkward hero line.** It reads "Ogeez products at nuEra East Peoria · across Central Illinois".

**Look and UX on the home screen (phone):**

- The geo banner "Looks like you're outside Central Illinois…" is the first thing a visitor reads.
- The blurred gradient orb plus film grain is the 2025–26 "AI landing page" look. Text collides with the orb edge: the label runs past the circle, and so does the deal line.
- "Take a breath. We…" renders in a condensed serif and is cut off by the sticky "See all Central IL deals" bar.
- Night: the "BREATHE OUT" label is nearly invisible (fails contrast).
- Everything is centered, everything is a rounded cream card or a pill. Three type voices compete: sans, serif headings ("Lowest this morning", "Peoria dispensary deals today") and mono labels.
- `/city/peoria` shows about 40 numbers before the first store.

**Business conflicts to resolve in the strategy:**

- Matthew's locked rule: **"No Featured tier — Pro-user funded only, that's why you can trust the deal ranking."** The footer says "Independent. Nobody pays us to rank."
- The Nov 10 income doc suggested selling featured listings. That was wrong under this rule.
- The way through, proposed on Nov 10: **dispensaries pay for tools and data, never for rank.** Draft tiers, prices not tested:

  | Tier | Price | What they get |
  | --- | --- | --- |
  | Listed | Free | Claim the listing, fix details, submit deals, basic monthly report |
  | Insight | ~$99/mo | Real shopper numbers (views, direction taps, calls) and deal attention |
  | Market Watch | ~$249/mo | Their prices against every store within 15 miles weekly, plus undercut alerts |
  | Pricing Partner | ~$499/mo | Market category trends, data export, quarterly pricing review with Matthew |

  - **What has to be true first:** Insight needs real GA4 numbers; Market Watch and Pricing Partner need the menu-price pipeline running reliably.
  - **Price comparison:** one source lists Weedmaps at $400–$1,500/mo per dispensary ([Winston Digital](https://www.winstondigitalmarketing.com/playbooks/weedmaps-vs-leafly-2026/), citing an undated AIQ post).
- **Consumer Pro** is planned at $0.99/mo. At 2.9% + $0.30 per card charge, about a third of each payment goes to fees, so consider $2.99/mo or $19/yr. Keep the answer free, because AI assistants and Google can't cite paywalled content, and AI visibility is his top priority. Put depth and convenience behind Pro: alerts, out-the-door on everything, price history, track record, best deal on your route, savings tally.
- **Stripe:** onboarding is paused and the business is cannabis-adjacent. Whether Stripe will process for this business is UNVERIFIED. Check its restricted-business list and give alternatives.

## 6. Links and assets

| What | Where |
| --- | --- |
| Live site | https://www.puffprice.com (phone screenshots: Playwright `devices['iPhone 13']`, works from the cloud container) |
| Design canvas from Nov 10 (5 phone screens of Breathe cleaned up, real data) | https://claude.ai/artifact/TaBZpgVANu3FQ4Hmj4gySk (Design type; for reference only this run) |
| PuffPrice Design System (current locked Breathe system) | https://claude.ai/artifact/C2wPEV9q47JsdxUhWpe7uy (read only this run) |
| Side-income research doc (Nov 10, includes the PuffPrice math) | https://claude.ai/artifact/MJVuLGj7qtkFFFqdJycT33 |
| Brand decisions log | project doc `claude/DECISIONS-2026-09-23-brand-and-design.md` |
| Earlier aesthetic research | `claude/RESEARCH-2026-09-22-comparables-and-aesthetics.md` |
| Strategy idea list | `claude/STRATEGY-2026-09-22-delivery-and-ahead-of-curve.md` |
| Last state report | `claude/STATE-2026-10-04-night.md` |
| Data brief (4 stores = 86% of deals; 10 of 26 stores show none) | `claude/DATA-BRIEF-2026-10-04.md` |
| Outreach kit | `claude/OUTREACH-KIT-2026-09-25.md` |
| Skill | `puffprice-design` (if the brand changes in Phase 2, update the design system artifact first, then the skill, then the decisions log) |
| Repo | GitHub `LetsSeeWhatSheDew/directory-network-` (private). Read `CLAUDE.md` and `DESIGN.md` in the repo root first. If you can't push, keep everything committed locally, say so in your final message, and give the exact push command. |
| Links above that need a claude.ai login | The canvas, design system and doc links (claude.ai/artifact/…) may not open from Claude Code. If they don't, use the repo's `DESIGN.md`, `app/globals.css` and this file instead. Everything needed is written here. |
| Stack | Next.js 16 · Supabase `hnbjufmtmrhexmdrfubw` (MCP read-only; filter `project_tag='green'`; `active_deals_with_listings` view) · Vercel Hobby · GA4 `G-TML9Y6VMC2` · Search Console under his personal Gmail in Chrome |

## 7. Fixed facts and rules

**Scope.** Central Illinois only, 12 cities: Peoria, East Peoria, Peoria Heights, Pekin, Bartonville, Morton, Washington, Normal, Bloomington, Champaign, Urbana, Springfield.

**Principles that stay whatever the brand:**

- No fake data anywhere. Show INSUFFICIENT DATA rather than a guess. Counts match what's shown.
- Nobody pays to rank.
- Never use a blended price index. Use the comparison ladder: same SKU, then $/g within category and tier, then tier band. Name the rung that's in use.
- No sound. Ever.
- No smoke imagery and no consumption. Social must stay Meta-safe.
- No AI images passed off as real places.
- 21+.
- Reduced motion means a still page.
- No pot puns or stoner humor. "Best Bud For Your Buck$" is his own keeper line and is fine.

**Real numbers from the live site this morning (Nov 10):**

- 26 stores checked.
- Top deal: nuEra East Peoria, 40% off Ogeez products. 504 Riverside Dr, open until 8 PM; Medical, Curbside, Order ahead; a deal on 30 of the last 30 days; typical 30% off; best seen 40%.
- Trinity on Glen: $90 ounces, about $113.85 out the door, open until 10 PM.
- Ivy Hall: veterans 20% off.
- Peoria tax: flower +26.5%, vapes +43.8%, edibles +38%.
- City store counts: Peoria 5, East Peoria 3, Peoria Heights 1, Pekin 1, Bloomington 2, Normal 4, Champaign 3, Urbana 1, Springfield 6.

**Open items from Oct 5 (UNVERIFIED whether done; check, don't assume):**

- Supabase `menu_platform` 'jane'/'treez' enum lines and `security-hardening.sql`
- ADMIN_PASSWORD rotation
- whether the menu reader moved to the cloud and runs daily
- whether hi@puffprice.com forwarding is proven
- why the weekly AI-visibility check failed

## 8. How to work with Matthew

- **Partner, not vendor.** Warm and direct. Tell him what's good, and say plainly what's wrong. No hype, no dares, no "you should walk."
- **Plain words.** Short items, each one understandable on its own. Define any new term the first time and don't invent shorthand for things in his tools.
- **Format.** Scorecards and tables for status. A lean answer first.
- **Show, don't describe.** He decides from mockups.
- **Accuracy beats speed.** Anything not checked against a source is marked UNVERIFIED with where you looked. "You can't just make shit up. This is a business."
- **Phase 2 ship rules:**
  - Work in branches.
  - After any push to main, watch Vercel reach Ready before verifying anything downstream.
  - Prove production claims with a real browser or curl, never cached fetches.
  - Search before you build: extend `scripts/scrape-cil-deals.ts` and the existing crons, and never build parallel systems.
  - Flag irreversible steps before taking them.
  - Matthew applies SQL himself in the Supabase SQL editor.

## 9. Suggested time plan for Phase 1 (about 5 hours)

| Time | Work |
| --- | --- |
| 0:00–0:20 | Read this file, `CLAUDE.md`, `DESIGN.md` and `docs/puffprice-promise.md`. Cut the branch. |
| 0:20–1:30 | Website assessment: Playwright screenshots of every route, day and night, plus the data checks in section 5 (including the dedupe logic in code). |
| 1:30–2:30 | Strategy options and scoring (groups A–D), with sources. |
| 2:30–4:15 | Preview pages for the top 2 directions (about 8 screens), plus phone screenshots. |
| 4:15–4:45 | Recommendation doc and decision sheet. Push, draft PR, preview URL. |
| 4:45–5:00 | Final summary message, STOP. |

If time runs short, cut scope in this order: fewer growth-channel options first, then fewer screens. Never skip the mockups or the decision sheet.
