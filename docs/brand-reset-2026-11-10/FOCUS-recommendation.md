# What I'd focus on: the next 30 days

## The answer

1. **Fix the numbers first.** Week 1, before any meeting:
   - Remove the duplicate deals (110 shown, 37 real).
   - Fix Bloom's description.
   - Close the database permission hole.
   - Nothing else matters if a store owner sees "42 offers" for 9.
2. **Brand: Best Bud.** "Best Bud For Your Buck$" becomes the voice.
   - Each deal is one plain sentence, with a check mark saying where and when we saw it.
   - It borrows The Scout's proof marks.
   - Retire the orb, the grain and the breath metaphors.
3. **Shoppers: everything stays free for now.** Free alerts go on as the list-builder. Pro ($2.99/mo or $19/yr) waits for two things:
   - a payment processor that says yes in writing (Stripe prohibits "cannabis dispensaries and related businesses")
   - 100 people on free alerts
4. **Dispensaries: one package, not three tiers.**
   - Listed stays free.
   - The paid package is the **Market Report** at a $99/mo founding price for the first five stores. The first report is free.
   - Billed by invoice and paid by ACH or check, with no card processor in the middle.
   - Market Watch and Pricing Partner wait until the menu-price reader runs daily again (it stopped Oct 17).
5. **Rewrite one public sentence before the first invoice.** `/upgrade` says "PuffPrice is funded by Pro subscribers only." It becomes something like: "Shoppers never pay to see deals. Stores can buy a market report. Nobody can buy rank."

## 30-day plan

| Week | Work | Done when |
| --- | --- | --- |
| 1 | **Trust fixes.** Scraper dedupe (`lib/scraper/cil-deal-scraper.ts`: load existing deals by `is_active=true`, no 500-row cap). Matthew applies two SQL files I write: one to deactivate the extra rows, one for the `master_listings` permissions. Fix Bloom's copy. Refresh the "checked Sep 22/23" dates. | Home, `/deals/all` and every store page show 37-ish, matching the database. Proven with a real browser on production. |
| 2 | **Best Bud on the real home, store and city pages**, with the one-answer-per-screen rule. Breathe stays in git, not deleted. | Phone screenshots of production at 390px, day and night. |
| 2–3 | **Menu reader back up.** Move it to a daily cloud job that finishes inside its time limit. | `/status` says "current" for 7 days straight. |
| 3 | **Free sample reports** for the three stores below. Built from the deal log (the table on `/preview/brand-reset/best-bud/stores` is the start). | Three PDFs ready, every number traceable to a row. |
| 3–4 | **Three meetings.** Show their own page (accurate now), hand them the free report, offer $99/mo. | Three meetings held. Yes, no or not-yet written down, with the reason. |
| 4 | **Ask a bank and one processor** in writing whether they'll take a cannabis-adjacent B2B invoice and consumer subscription. | A written yes or no. |

## The first three meetings (by store type, not names)

1. **A daily-deal store that already wins on PuffPrice.** Like the nuEra stores: a deal 30 of 30 days, and they show up at the top. They have the most to gain from seeing how the stores around them answer. Easiest yes. *Bring:* their accurate page, plus the 15-mile table.
2. **A store with a website PuffPrice can't read yet, or that posts no deals.** For example, the stores marked "none seen" in the sample table. The pitch is the free tier: "claim it, tell us where your deals live, and you'll show up." It earns no money in month one, but it fills gaps in the data, and the data is the product.
3. **A mid-size independent store competing on price** (single location, not a multi-state chain). Local owners decide on the spot, and an independent will feel the "nobody can buy rank" point most. Which Central IL stores are truly independent is UNVERIFIED (I didn't check ownership), so check that before booking. *Bring:* where their deals landed against the chain stores near them.

Leave the multi-state chains (Ascend, Cresco/Sunnyside, etc.) for after month one. Their buying decisions happen out of state, through marketing teams.

## Stop doing

- **Stop adding pages.** The site has 132 sitemap URLs and almost no traffic proof (14 deal clicks in the database, all-time). Make the pages we have right.
- **Stop the breath and exhale language and the motion system** on new work. Keep the code; stop extending it.
- **Stop promising Pro at $0.99.** A third of each payment would go to card fees, and we have no processor.
- **Stop counting raw rows anywhere a person can see a number.** Every count on the site comes from the deduped deals.
- **Stop the featured-listing idea for good.** The table in `STRATEGY-options.md` (C4, 37/100) shows why.

## What I'm not sure of (UNVERIFIED)

- Real shopper traffic. GA4 and Search Console weren't checked; they need Matthew's Google login.
- Whether any processor or bank will take this business. Stripe's own pages say no.
- Whether $99/mo is the right number. It sits under AIQ's legacy $399 store license and Weedmaps' $400+. Headset gives retailers a free dashboard, so the report has to be local and explained, not just data.
- Whether Bloom Wellness is the store's correct current name.
