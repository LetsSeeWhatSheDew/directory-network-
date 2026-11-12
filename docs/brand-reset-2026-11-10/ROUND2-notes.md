# Round 2 — after Matthew's decision sheet (Nov 10, 2026)

## What happened with each answer

| # | Your answer (short) | What I did | Status |
| --- | --- | --- | --- |
| 1 | Fix. | Scraper fix + 3 SQL files, on their own branch `claude/trust-fixes-2026-11-10` (separate from the brand work so it can ship alone). | Code done and tested. **You apply the SQL.** Not merged. |
| 2–4 | Best Bud looks cheap; The Scout too; Breathe doesn't look good. Research, then 3 polished, expensive concepts. | Researched premium brands. Built 3 new concepts as real pages with live data: **The Vault**, **The Gallery**, **The Instrument**. Each has a home, a deal that opens in place, and a printable QR flyer. | Ready for your review: `/preview/brand-reset`. |
| 5 | B1, but let's talk free alerts. Free until it's worth charging. | Proposal below. Nothing built. | Your call. |
| 6–7 | Charge when it's worth it. Pro list agreed. | Nothing to do now. | — |
| 8 | Cheap marketing: catchy graphic with a QR, print ~500, put them all over town. | A 4×6 flyer in each of the 3 looks. PDFs are in `flyers/`, and the QR is tagged so scans show up in analytics. | Print-ready. Test-scan before printing 500. |
| 9, 11, 13 | Discuss later. | Parked. | — |
| 10 | Whatever works. | Noted: invoice + ACH when the time comes. | — |
| 12 | Yes, restart the menu reader. | Found the cause and unstuck it (details below). | Unstuck today. The permanent fix is on the trust-fixes branch. |
| 14 | Do ALL growth channels. | The flyer is the first one. The rest need the brand picked first, so the look matches everywhere. | Waits on #2. |
| 15 | No new pages; house-clean what doesn't carry weight. | Candidate cut list below. Nothing deleted. | Your call, after traffic numbers. |

## #1 Trust fixes (branch `claude/trust-fixes-2026-11-10`)

- **Scraper:** it now reads every existing deal (paged, newest first), not just 500 of them. It updates the newest live copy and switches off any extra copies of the same deal.
  - Unit tests: 5 new, 29 existing, all pass.
  - Side effect: this also stops the daily alert email from treating the same deal as "new" every morning. Nobody is subscribed yet, so nobody was hit.
- **SQL for you to run** in the Supabase SQL editor. Each file has a "look first" step and an undo.
  1. `sql/migrations/2026-11-10-dedupe-active-deals.sql`: retires the 73 extra rows today. Preview checked read-only: 73 retire, 37 stay.
  2. `sql/migrations/2026-11-10-master-listings-lockdown.sql`: closes the open write permission on `master_listings`.
     - PuffPrice only writes that table with the server key, so the site keeps working.
     - UNVERIFIED: whether your other 5 projects in that table write to it from a browser.
  3. `sql/migrations/2026-11-10-bloom-peoria-description.sql`: replaces Beyond Hello's text with plain facts (name and address only).
     - The RISE store page blocked my automated read, so hours and phone are UNVERIFIED.
- **Not fixed:**
  - `/drive-thru` still says "checked Sept 23." That page's claim needs a real re-check of 26 store sites, and I didn't fake a new date.

## #12 Menu reader: what was wrong

1. **It was running Oct 4 code.** The job on your Mac runs from `~/puffprice-scraper`, a separate copy of the repo. Each run, `npm install` rewrote `package-lock.json`. That edit then blocked the next `git pull`, so the copy never updated (54 commits behind).
2. **The first store hung every run.** The old code started with Bloom's RISE page, which times out. The whole 16-minute budget burned on it, and 0 stores got read, run after run. Newer code (already on main) rotates stores and caps each one at 90 seconds.

**Done today:** I threw away the auto-generated lockfile edit in `~/puffprice-scraper` and pulled. It's now on current main (`0cb599f`), so the 12:15 run uses the newer code.
- UNVERIFIED: whether today's 12:15 run succeeds. Check `/status` or the log at `~/Library/Logs/puffprice-rendered-scrape.log`.

**Permanent fix** (trust-fixes branch, `scripts/run-rendered-scrape.sh`): throw away lockfile edits before pulling, and install with `npm ci`, which never edits the lockfile.
- Until that merges, the next `npm install` will dirty the lockfile again. If `/status` goes stale before the merge, run:
  `cd ~/puffprice-scraper && git checkout -- package-lock.json && git pull`

**Still open:** it's a Mac job, not a cloud job. It only runs when the Mac is awake. The log shows runs at 8:01 and 13:06 instead of 6:15 and 12:15. Moving it to the cloud (a GitHub Actions job with a real browser) is the next step if you want it independent of the Mac.

## #5 Free alerts — proposal to talk through

**What already exists (built Sep–Oct, never promoted):**
- `/alerts` signup with double opt-in.
- A daily 7:30 AM email.
- Watch types: a city (optionally a category, optionally "at least N% off"), a store, an item's price drop, sale days (4/20, 7/10, Green Wednesday), and law changes.
- One email per person per day, max.

Subscribers in `deal_alerts` today: **0**.

**What I'd offer people (keep it to three choices):**
1. "Best deal in my town, every morning." Pick a city.
2. "Tell me when my store has a deal." Pick a store.
3. "Big ones only." Pick a city and a floor (30% off or more).

**What has to be true before we push it:**
- The dedupe fix is live. Otherwise "new deal" alerts repeat daily.
- Email sending is proven: `hi@puffprice.com` forwarding and the Resend domain. UNVERIFIED; I didn't send a test.
- One test subscriber (you) gets a week of emails, and you like them.
- Then the flyer and the site point to it.

## #8 Flyers

- **Round 3 (current):** one cannabis leaf as the focal point in each design: Gold Leaf, Big Leaf and Leaf Code. Matthew is using all three in different spots.
- **Files, per design** (in `flyers/`):
  - `<name>-letter.pdf`: one flyer per US Letter sheet (7 × 10.5 in, crop marks)
  - `<name>-letter-2up.pdf`: two 4×6 flyers per landscape Letter sheet (cut marks)
  - `<name>-4x6.pdf`: for a print shop or photo paper
- **Each design has its own QR tag**, so GA4 separates them: `utm_source=flyer`, `utm_medium=qr`, `utm_campaign=nov26-gold-leaf` / `nov26-big-leaf` / `nov26-leaf-code`.
- **Copy is evergreen:** no prices or deals that go stale on a pole.
- **Home printing:** print at "Actual size" / 100%, never "Fit to page"; use the best quality setting. Gold Leaf and Big Leaf are heavy-ink designs; a laser printer handles that better than inkjet.
- **Before printing 500:**
  - Scan a printed proof with an iPhone and an Android.
  - Check Peoria's rules on posting bills on poles and public boards (UNVERIFIED).
  - Check whether Illinois cannabis advertising rules reach a third-party deal site's flyers (UNVERIFIED; they're written for licensees).
  - Keep it 21+ and away from schools.

## #15 House-clean: candidate cuts (check traffic first)

GA4 and Search Console weren't checked; they need your Google login. Pull 90 days of page views, then cut what has none. Candidates:

| Group | Routes | Why it might go |
| --- | --- | --- |
| Old design previews | `/lab/a–d` | Superseded by `/preview/brand-reset`. Already noindex. |
| Sale-day pages | `/420`, `/710`, `/green-wednesday` | Three days a year each. Could be one `/sale-days` page. |
| Overlapping deal lists | `/best-deals/*` (12), `/deals/*` (6), `/cheapest`, `/this-week`, `/deal-of-the-day` | Five ways to say "today's deals." Keep `/deals` + city pages. |
| Long-tail variants | `/open-late/*` (13), `/medical/*` (12), `/route/*` (5) | 30 near-empty pages. Fold into city pages as a filter. |
| Scaffolds | `/brand/*` (6), `/grow`, `/on-the-way`, `/early-access`, `/start` | Never populated, or one-off experiments. |
| Legacy URLs | `/l/[id]`, `/cannabis/illinois/*` | Already redirected. Keep the redirects, drop the templates. |
| Keep | `/`, `/city/*`, `/dispensary/*`, `/deals`, `/alerts`, `/how-we-rank`, `/status`, `/law-updates`, tax pages, `/for-dispensaries` | These carry the product and the AI-visibility work. |

Removing a page that Google or an AI assistant already indexes needs a 301 redirect to its closest keeper, not a 404.
