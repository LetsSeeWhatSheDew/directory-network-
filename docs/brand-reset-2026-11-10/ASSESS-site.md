# PuffPrice site assessment, Nov 10, 2026 (phone first)

**Short version:** The bones are good. The data pipeline is honest about itself (`/status` tells the truth), and every page answers a real question. But three things would sink a dispensary meeting today:

1. The deal counts are about 3× too high.
2. One store wears another store's description.
3. The data that a paid dispensary tier would sell (menu prices) stopped coming in on Oct 17.

The look is the "AI landing page" style Matthew suspected: an orb, grain, everything centered, everything a pill. It needs a reset, not a polish.

Method: Playwright with the iPhone 13 profile (390×844), run from Matthew's Mac on Nov 10 around 10:40 AM CT, against https://www.puffprice.com, each route with `?daypart=day` and `?daypart=night`. Database checks were read-only `SELECT`s in Supabase (`hnbjufmtmrhexmdrfubw`). Raw numbers are in `shots/live/audit.json`. The script is `shoot-live.mjs`.

---

## Scorecard

| Area | Score /10 | Why, in one line |
| --- | ---: | --- |
| 1. First-screen clarity | **6** | The 40% is huge and clear. But you get no button to the deal, the headline is cut off by the sticky bar, and "Today's longest exhale" makes you decode a metaphor. |
| 2. Word and number density | **4** | City pages show 93 words and a wall of 8 chips + 3 stat tiles before the first store. A store page is 14,283px tall. |
| 3. Trust and accuracy | **3** | 110 "deals" are really 37. "42 offers" at nuEra East Peoria are really 9. Bloom carries Beyond Hello's description. A store owner would catch this. |
| 4. Reads as AI or template | **3** | Blurred orb, film grain, centered everything, letter-spaced mono labels, rounded cream cards. This is the 2025–26 generated-landing-page look. |
| 5. Speed (LCP, lab) | **7** | Most pages paint the main content in under 1.6s. The store page (4.7s) and `/status` (4.1s) were slow on the day run. |
| 6. Accessibility | **5** | Body contrast is fine. But most tap targets are under 44px (city page: 89 of 92), and the sticky bar covers the footer's legal text. |
| 7. SEO and AI visibility basics | **8** | Every page has a title, canonical and structured data (JSON-LD). `llms.txt` is live. The sitemap has 132 URLs. AI bots are welcomed in robots.txt. |
| 8. Ready for a dispensary meeting | **2** | Not until the counts are fixed. The owner's own page would show their deals listed 7 times over. |

**Fix order before any meeting:** (1) the duplicate deals, (2) the Bloom/Beyond Hello description, (3) a database permission hole I found (see Trust, item T4), then (4) the look.

---

## 1. Trust and accuracy (section 5 problems: confirmed or cleared)

| # | Problem from the brief | Verdict | Evidence |
| --- | --- | --- | --- |
| T1 | Deal counts inflated by daily duplicates | **CONFIRMED, and worse than seen** | `active_deals_with_listings` has **110 active rows** but only **37 distinct deals** (same store + same title). nuEra East Peoria has 42 rows but 9 deals. "40% off Ogeez products" there has 7 live rows, one created each morning from Nov 3 to Nov 9. The same pattern shows at nuEra Urbana (21 rows, 7 deals), nuEra Pekin (18 rows, 7 deals), High Profile Springfield (12 rows, 3 deals) and nuEra Champaign (9 rows, 3 deals). |
| T1a | Home "110 deals… we checked 26 stores" vs `/deals/all` "110 active deals at 9 dispensaries" | **CONFIRMED** | Both numbers come from the same inflated view. On my run, `/deals/all` (set to Peoria) said "66 active deals at 5 dispensaries within 15 miles." That is inflated the same way. |
| T1b | Root cause | **FOUND in code, likely, not yet reproduced** | `lib/scraper/cil-deal-scraper.ts:819` loads "existing deals" with `&limit=500` and no `is_active` filter or sort. The `deals` table now holds **978 rows** for the 26 Central IL stores, so many live deals aren't in that list. The scraper doesn't find them and inserts a new copy every morning (`pickMatchingExisting`, line 662). Then the daily verification sweep (`dailyVerification`) keeps the old copies alive with `status_reason = holding_pattern_within_48h`, until the 7-day age-out. The timeline fits: daily inserts jumped from 2–3 a day to 15–21 a day starting Nov 2. `scripts/scrape-cil-deals.ts` only wraps this module; its own dedupe is just for report counts. |
| T2 | Bloom Wellness Peoria shows Beyond Hello's description | **CONFIRMED** | `master_listings` slug `beyond-hello-peoria` has the name "Bloom Wellness Peoria", but both `short_description` and `long_description` start "Beyond Hello Peoria…". The rename changed the name only. Whether Bloom Wellness is the correct current name is UNVERIFIED (I didn't check the store's own site). |
| T3 | Awkward hero line "Ogeez products at nuEra East Peoria · across Central Illinois" | **PARTLY CLEARED** | With a located visitor (my run resolved to Peoria by IP), the line reads "Ogeez products at nuEra East Peoria · under 1 mi". The "across Central Illinois" version is the fallback when location is unknown, so a cloud or out-of-area visitor still sees it. The line also breaks with a stray "·" at the end of the first line (screenshot `home-day.png`). |
| T4 | **New: database permission hole** | **FOUND** | `master_listings` has row-level security **off**, and the public `anon` key has `INSERT`, `UPDATE` and `DELETE` grants on it. That key ships in every page. In principle, anyone could edit or delete listings for all six projects in that table (green, rent, bid, heal, her, machine). `sql/migrations/2026-09-27-security-hardening.sql` exists in the repo, but these grants say it hasn't been applied, or didn't cover this table. I did not test a write. For Matthew to apply in the SQL editor; I will draft it in Phase 2. |
| T5 | **New: menu reader stopped** | **FOUND** | Newest `menu_snapshots` row: **Oct 17**. Only 48 snapshots exist. `/status` says this honestly ("menu reader last finished 24 days ago"). The "manual" `scraper_runs` rows each day (Nov 3–10) end `failed` with `run_deadline_reached` after 40–105 minutes. This blocks the paid dispensary tiers that sell price comparisons. |
| T6 | **New: stale "checked" dates** | **FOUND** | `/drive-thru` says "As of Sept 23, 2026, none of the 26… has opened one." The store page's feature checks (Medical, Curbside, Order ahead) say "checked Sep 22". Both are seven weeks old and read as abandoned. |
| T7 | **New: public promise vs. dispensary pricing** | **FOUND** | `/upgrade` FAQ: "Dispensary listings are free, forever. PuffPrice is funded by Pro subscribers only." Paid dispensary tools would make the second sentence false. It must change before anything is sold. |

### Open items from Oct 5 (checked, not assumed)

| Item | Status | How I checked |
| --- | --- | --- |
| `menu_platform` enum: 'jane' / 'treez' | **Half done.** Enum is `{jane, dutchie, sweed, joint, other}`. 'treez' is missing. | `enum_range(null::menu_platform)` |
| `security-hardening.sql` applied | **Not applied** (or not fully). See T4. Private tables like `deal_clicks` still grant anon `SELECT`. RLS is on, so policies may still block reads; I didn't test reads with the anon key. | `pg_class.relrowsecurity` + `has_table_privilege` |
| ADMIN_PASSWORD rotated | **UNVERIFIED.** It's a Vercel env value. I didn't open Vercel. | none |
| Menu reader moved to the cloud and running daily | **No.** Last success Oct 17. The GitHub "Daily deal scrape" workflow shows `disabled_inactivity` (last run Sep 8). Daily "manual" runs fail on their deadline. | `menu_snapshots`, `scraper_runs`, `gh workflow list` |
| hi@puffprice.com forwarding proven | **UNVERIFIED.** I didn't send a test (no sends in Phase 1). | none |
| Weekly AI-visibility check failure | **UNVERIFIED.** No workflow or script by that name in the repo. It likely lives in a scheduled Claude task outside the repo. | `grep`, `gh workflow list` |

### Usage numbers (these matter for strategy)

Read from Supabase on Nov 10:

- `deal_alerts`: 0 rows
- `leads` (green): 5
- `listing_claims`: 0
- `deal_clicks`: 14 all-time
- `events`: 55 all-time

GA4 and Search Console were **not** checked (they need Matthew's Google login). These tables may undercount if tracking moved to GA4 only. Even so, there is no proof yet of shopper volume a dispensary would pay to see.

---

## 2. First screen (what a shopper sees in 3 seconds)

| Page | First screen, described plainly | Verdict |
| --- | --- | --- |
| `/` day (`shots/live/home-day.png`) | Logo, then a pill "Location approximate — Peoria · click to update". Then a big pale-green circle with peach blur behind it. Inside: "TODAY'S LONGEST EXHALE", a huge **40% off**, "Ogeez products at nuEra East Peoria · under 1 mi". Below: "BREATHE OUT", then "One of 110 deals…". Then "Take a breath. *We*", cut off by a sticky "See all Central IL deals →" bar. | The number lands. Everything around it is metaphor. There's no button for *this* deal, only for "all deals". The headline is cut in half. |
| `/` night (`home-night.png`) | Same layout on dark green, with yellow fireflies and a glowing yellow 40%. | Prettier than day, same structure. "BREATHE OUT" is low-contrast grey on dark. |
| `/city/peoria` (`city-peoria-day.png`) | Breadcrumb, a big serif title, a 3-line geography paragraph, a "Quick answer" box (5 lines, 4 numbers), 8 pill chips, then 3 stat tiles. No store yet. | The answer is in there, but buried under 93 words. |
| `/deals/all` (`deals-all-day.png`) | "66 active deals at 5 dispensaries…", the title repeats the same claim, trust line, location line, category chips, then "Our recommendation · 40% OFF". | Three sentences before the deal, all repeating the inflated count. |
| `/dispensary/nuera-east-peoria` (`dispensary-…-day.png`) | Logo tile, serif name, "Open until 8:00 PM", three ✓ pills, then big address, phone and website cards. "ACTIVE DEALS · 42 OFFERS" at the fold. | The cleanest page on the site. The 42 is wrong. |
| `/drive-thru`, `/law-updates`, `/how-we-rank`, `/status`, `/alerts` | All text-led. Breadcrumb, mono kicker, serif H1, paragraph, trust line. | Honest and useful. All look alike, which is the "template" feeling. |
| Footer (`footer-day.png`, `footer-night.png`) | Two columns of links, then "Independent. Nobody pays us to rank. 21+." with a dot. | The sticky deals bar covers the last lines of the legal text on phones. |

## 3. Word and number density

First-screen counts at 390×844 (words / numbers): home 71 / 3 · deals 81 / 9 · Peoria 93 / 8 · East Peoria 93 / 8 · store 89 / 10 · drive-thru 86 / 7 · how-we-rank 127 / 2 · law-updates 100 / 0 · status 120 / 8.

Page heights: store page 14,283px (about 17 phone screens) · `/status` 12,814px · home 6,713px · city pages ~5,300px.

**The fix is structural, not trimming.** Give one answer per screen, and put the rest behind a tap. The preview pages in this branch show that pattern.

## 4. What reads as AI or template

- The blurred gradient orb plus film grain on the home screen. This is the most-copied hero of 2025–26.
- Everything centered on the home screen. Everything is a rounded cream card or a pill.
- Three type voices fighting: Instrument Sans, Instrument Serif (condensed, for "Peoria dispensary deals today") and letter-spaced IBM Plex Mono labels ("QUICK ANSWERS", "TODAY'S LONGEST EXHALE").
- Every inner page has the same skeleton: breadcrumb → mono kicker → serif H1 → grey paragraph → trust line.
- The metaphor stack: "exhale", "breathe out", "take a breath", "drop your shoulders". Once is a brand; four times is a template.

What does **not** read as AI and should survive any rebrand:

- the real store logo tiles
- the "How we know" receipts on store pages ("Store page: 'Curbside Pickup' — store's site, checked…")
- `/status` saying "Partly behind"
- plain store facts

Those are the trust assets.

## 5. Speed (lab LCP; LCP = time until the biggest thing on screen is painted)

| Page | Day run | Night run |
| --- | ---: | ---: |
| `/` | 1.41s | 1.63s |
| `/deals/all` | 0.60s | 0.89s |
| `/city/peoria` | 0.84s | 1.72s |
| `/city/east-peoria` | 1.56s | 1.51s |
| `/dispensary/nuera-east-peoria` | **4.67s** | 0.77s |
| `/status` | **4.10s** | 0.14s |
| others | ≤0.26s | ≤0.24s |

The day runs went first, so the slow numbers there are likely cold server renders that were cached by the second run. Field data (real phones, from Search Console's Core Web Vitals) was **not** checked: UNVERIFIED.

## 6. Accessibility

- **Tap targets under 44px** (measured, width or height): home 48 of 74, `/deals/all` 58 of 63, `/city/peoria` 89 of 92, store page 266 of 355. Most of them are inline text links (18–19px tall) and chips (27–33px tall).
- **Contrast:** my automated check found no body-text failures on solid backgrounds. It **could not** measure text over the orb or the gradients, and it skips those. By eye on the screenshots:
  - "BREATHE OUT" and "TODAY'S LONGEST EXHALE" (grey, thin, letter-spaced) are the weakest, especially at night.
  - The "Breathing in" / "Breathe in" helper text measured 1.00:1 (invisible by design: it's text in the animation).
- The sticky CTA bar covers the footer's legal copy.
- The logo is fine for screen readers: `aria-label="PuffPrice — home"`.

## 7. SEO and AI visibility basics

| Check | Result |
| --- | --- |
| Titles | Unique, plain titles on all 10 pages |
| Canonical tags | On all 10 pages |
| `robots` meta | No page sets a `robots` meta, so all are indexable |
| Structured data (JSON-LD) | Home: Organization, WebSite, FAQPage. City: BreadcrumbList, ItemList, FAQPage. Store: LocalBusiness. Deals: ItemList, BreadcrumbList, SpecialAnnouncement. Law updates: ItemList. |
| `/how-we-rank`, `/status`, `/alerts` | No structured data. Fine for these pages. |
| AI files | `llms.txt` returns 200. `robots.txt` names 16 AI crawlers as welcome. The sitemap has 132 URLs. |

**Risk:** the inflated counts go out into the AI channel too. `llms.txt`, the `/mcp` server and the ItemList data all carry the same duplicates. An AI assistant quoting "110 deals" repeats the error at scale. That makes the dedupe fix an AI-visibility fix too.

## 8. Ready for a dispensary meeting?

**No, 2/10.** The store owner's first move will be to open their own page:

- nuEra sees "42 offers" for 9 deals.
- Bloom sees a competitor's paragraph.
- Anyone asking "what would I pay for?" hits the menu-price data, which stopped Oct 17.

Fix T1, T2, T4 and T5 first. That is about one day of work for T1, T2 and T4 (code plus SQL for Matthew to apply), and T5 is its own task. Then the look.

---

## Screenshot index (`shots/live/`)

- `<route>-day.png` and `<route>-night.png`: first screen at 390×844, 2× resolution. Routes: home, deals-all, city-peoria, city-east-peoria, dispensary-nuera-east-peoria, drive-thru, how-we-rank, alerts, law-updates, status.
- `<route>-day-full.jpg`: whole page, day.
- `footer-day.png`, `footer-night.png`
- `audit.json`: every number above, per page and daypart.
