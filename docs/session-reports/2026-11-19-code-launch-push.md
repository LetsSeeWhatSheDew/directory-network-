# 2026-11-19: off the Mac, Pro dropped, email root cause, launch plan

Matthew (Nov 19): "Get me there… I'm giving you the keys." He decided:
- Drop Pro and keep every alert free.
- He's the named face of a monthly price check.

## Shipped to main

- **Deal reader off the Mac.** `.github/workflows/rendered-scrape.yml` runs `scripts/scrape-rendered-deals.ts --apply` at 11:15 and 17:15 UTC.
  - First live run (17:07 UTC): partial, +6 new, 178 re-confirmed, 9 retired.
  - After it, 243 deals at 21 stores were live.
  - Cloudflare blocks GitHub's servers at NOXX (the largest source) and the 3 Bloom stores.
- **Pro removed.**
  - `/upgrade` 308 → `/alerts`.
  - The Stripe routes and checkout button are deleted.
  - Signup and preferences save weekly only.
  - Terms, privacy, about, home FAQ and /start are rewritten to match.
- **/status** says why each store has no deals today (`lib/scraperText.ts`, `tests/unit/noDealsReason.test.ts`).
- **Signup failure code.** A failed confirm email now returns a non-secret `code` (e.g. `resend_403_validation_error`).

## On the branch only (`claude/sweet-maxwell-9f298m`)

- `scripts/ops-snapshot.mjs` + `.github/workflows/ops-snapshot.yml`: a read-only snapshot of mail DNS, production pages, deals per city, subscriber counts and scraper runs. Pushing it to main was blocked by the session's safety check, so Matthew merges it if he wants the daily run.
- `scripts/alert-signup-probe.mjs` + `scripts/resend-domain-check.mjs` + their workflow.

## Found (ops snapshot and probe, Nov 19)

- **Every email fails.** Resend 403 `validation_error`: the domain isn't verified because `send.puffprice.com` has no MX record.
  - Namecheap's Email Forwarding mode blocks custom MX records.
  - Fix steps: `docs/ops/2026-11-19-email-fix.md` (Matthew, about 15 minutes).
- **Alert subscribers: 0 active, 0 pending. deal_clicks: 14 rows all-time.**
- **hi@puffprice.com** = Namecheap forwarding (MX eforward1–5.registrar-servers.com). The target is only visible in Namecheap. A test email draft sits in Matthew's Outlook, tagged NEEDS MATT.
- **Unexplained failing runs.** `scraper_runs` shows trigger=`manual` runs that fail every day at ~14:02 and ~20:08 UTC (Nov 17–19). These aren't the GitHub runs. The source is UNVERIFIED; possibly the Mac's launchd waking without a network.
- **Bloom phones.** The DB already matches public listings for Peoria and Bradford. Northbrook differs from Leafly (`sql/migrations/2026-11-19-bloom-phones.sql`, not applied).

## Docs

- Launch plan page: https://claude.ai/artifact/RwMmJQFb7Tz5sNikCL2iw5
- `docs/strategy/2026-11-19-traction-plan.md`, `docs/strategy/2026-11-19-store-ownership-and-open-items.md`
- `docs/strategy/2026-11-23-green-wednesday-pitch-DRAFT.md`
- `docs/brand/puffprice-design-SKILL-gold-leaf.md`: paste into the claude.ai skill.
- Draft PR LetsSeeWhatSheDew/directory-network-#14 is closed. Its docs and flyers are in `docs/brand-reset-2026-11-10/`.

## Checks

- typecheck: pass.
- `test:unit`: 187 pass.
- `build:fixtures`: pass.

## Afternoon round (same day)

- **Signups survive the email outage.** A signup or watch whose confirm email fails is kept (inactive) and tagged `confirm:unsent`. The daily deal-alerts cron sends those confirms through `lib/confirmRetry.ts` and stops at the first failure.
  - Production probe at 18:09 UTC: `HTTP 200 {"ok":true,"status":"pending","delayed":true}`.
- **Home page** shows "Green Wednesday · Nov 25" under the hero for the week before and the day itself. The `/green-wednesday` countdown drops the Breathe line.
- **The Mac's failing runs, explained** by `scraper_runs.error_summary`.
  - Every Mac run Nov 16-19 hit "hard deadline: run exceeded 16 min" after about 3,650 s: the Mac slept mid-run.
  - `scripts/run-rendered-scrape.sh` now reads NOXX only (`--slug=noxx`); GitHub reads the rest.
- **Price check** (`scripts/price-check.ts`, runs in the daily ops snapshot): cheapest and typical out-the-door eighth, cart and gummies by town.
  - Nov 19, 14 stores: eighth typical $26.59 (cheapest $22.92), cart $40.42, gummies $11.68.
  - The Green Wednesday pitch draft now carries these numbers.
- **Sales kit README** now lists who to visit first, plus the email and ACH status.

## Evening round

- **Search titles** (`lib/cityMeta.ts`, tested): city pages lead with the day's best everyday deal.
  - Live at 18:29 UTC: "Springfield Dispensary Deals Today: 55% Off at SHARE", "East Peoria …: 50% Off at NOXX", "Champaign …: 45% Off at Sunnyside", "Peoria …: 40% Off at Aroma Hill".
  - Home title is now "Dispensary & Weed Deals Today in Central Illinois". The description had said "updated continuously"; it now says twice a day.
- **Typical price by town**: on `/cheapest#by-town` and in `llms-full.txt` (`lib/priceCheck.ts`, tested).
- **Market report PDFs**: a workflow prints them from the live site.
  - Nov 19 run 44587610189: 8 PDFs, 314–335 KB each.
- **Drafts**: Reddit post with UTM links (`docs/strategy/2026-11-24-reddit-post-DRAFT.md`). The pitch links the town table.
- **Scheduled GitHub run** (18:15 UTC, an hour late) read NOXX: 346 deals at 21 stores. The Cloudflare block on NOXX is intermittent.
- **CI** passed on 808cf6d.
