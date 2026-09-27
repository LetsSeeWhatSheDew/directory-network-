# PuffPrice social kit

Post every day in about a minute: always on-brand, always from real data.

**Where:** `puffprice.com/social` (private: log in at `/admin-login` with the admin password first; also linked from the Admin dashboard). It isn't indexed, it isn't in the sitemap, and no public page links to it.

## The one-minute routine

1. Open `/social`. The box at the top tells you what to post today (see the week below).
2. Pick **Day** or **Night** (it defaults to the time of day: night after 7 PM Central).
3. Tap **Download feed** (4:5, for the feed) or **Download story** (9:16, for Stories).
4. Tap **Copy caption** and paste it. Don't retype the numbers.
5. Look at the "As of" line on the image before you post. If it's older than yesterday, skip that post today.

If a template shows a red "Nothing true to post" box, the data couldn't be read or nothing qualifies today. Pick another template. **Never post an image stamped "Sample data · not live".** Those only appear in local test renders.

## The week

| Day | Post | Where |
|---|---|---|
| Sunday | Law you should know | Anywhere, including Instagram and Facebook |
| Monday | Deal Index, weekly | Anywhere, including Instagram and Facebook |
| Tuesday | Law you should know (a different fact; the card rotates daily) | Anywhere, including Instagram and Facebook |
| Wednesday | City roundup (top 3 deals in one city) | X, Bluesky, Reddit, group texts. **Not Meta.** |
| Thursday | Cheapest eighth by city | X, Bluesky, Reddit, group texts. **Not Meta.** |
| Friday | Today's biggest saving | X, Bluesky, Reddit, group texts. **Not Meta.** |
| Saturday | Drive-thru tracker | Anywhere, including Instagram and Facebook |

On price days, Instagram and Facebook get the week's civic post again, or nothing. A quiet day costs nothing; a removed post or a restricted account does.

The city roundup defaults to the city with the most stores discounting today. Use the city chips on `/social` to pick another one (for example, a different city each Wednesday).

## The six templates

| Template | What it shows | Where the numbers come from |
|---|---|---|
| Today's biggest saving | One deal, one store, one number | The home page's "longest exhale" rule (`lib/exhale`): everyday deals only (no first-time, veteran, "up to" or buy-several deals), re-found on the store's own site in the last 7 days |
| City roundup | Top 3 deals in one city, one per store | Same deals, same rules, only that city. It never fills in with another city's deals |
| Deal Index, weekly | Deals live, stores discounting, average discount, by city, plus 7 days of deals live | `/deal-index` (`lib/dealIndex`) |
| Cheapest eighth by city | Lowest out-the-door eighth in each city | `/cheapest` (`lib/menuPrices`). Only cities where a store's menu could be read today. Out-the-door is labeled as our estimate |
| Law you should know | One dated fact with its source | Text copied from `/cannabis/illinois/laws`, `/illinois-hemp-law`, `/illinois-cannabis-delivery`, `/drive-thru` (`lib/social/laws.ts`) |
| Drive-thru tracker | How many Central Illinois stores have a drive-thru open | `/drive-thru` (`lib/waysToBuy` listing features) |

Every image and caption says **21+**, **puffprice.com** and **"As of <date> CT"**. None of them show a number the data doesn't have.

## Staying inside Meta's rules (Instagram and Facebook), in plain language

Meta doesn't allow posts that try to sell cannabis or push people to buy it, even in states where it's legal. It never allows ads for it. So:

- **Never boost, promote or run an ad** for any PuffPrice post on Instagram or Facebook. Not even the civic ones.
- **Price posts stay off Meta.** Today's biggest saving, City roundup and Cheapest eighth all name a store next to a discount or a price, and Meta can read that as selling. Post those on X, Bluesky, Reddit (check each subreddit's rules first) or in group texts.
- **Civic posts are fine on Meta.** The Deal Index, Law you should know and the Drive-thru tracker are local information: market numbers, dated laws, city council news. No store is being sold.
- **No product, ever.** No product photos, no packaging, no flower, no smoke, no people, nobody using anything. The templates are built this way. Don't add stickers or photos on top in the Instagram editor.
- **No sales pitch.** No "buy now", "shop now", "don't miss it", "link in bio for deals" or countdowns. The captions are written as a price report. Keep them that way.
- **Don't tag stores** in posts on Meta, and don't sell or arrange anything in DMs or comments. If someone asks where to buy, point them to puffprice.com and stop there.
- **Hashtags stay local.** The captions use place tags (#PeoriaIL, #CentralIllinois, #BloomingtonNormal…). Don't add #weed, #cannabis, #420 or leaf emoji. They get posts hidden, and they aren't our voice anyway.
- **Age gate the accounts.** On Instagram (professional account), set the account's minimum age to 21 in the account settings. On the Facebook Page, set the Page's age restriction to 21+. Settings menus move around; if you can't find the option, search the app's settings for "age". Every image already says 21+, but the account setting is what actually keeps under-21s out.

## Voice

Calm, warm, a little wry. Civic, like a local price report. Specific over vague: "35% off house flower at a named store in Peoria", never "amazing deals". No pot puns, no stoner humor, no "High Times", no emoji spam. If you want to add a line of your own, keep it short and don't add a number the image doesn't show.

## For whoever maintains this

- Images: `GET /og/social/<template>?size=feed|story&theme=day|night` (`template` is one of `saving`, `city`, `index`, `cheapest`, `law`, `drive-thru`; add `city=<slug>` for the roundup, `fact=<id>` for the law card, and `download=1` to get a file). Code: `app/og/social/`.
- Data and captions: `lib/social/` (`build.ts` picks the numbers, `captions.ts` writes the text, `laws.ts` holds the law facts, `schedule.ts` holds the week).
- When a law page changes, update the matching fact in `lib/social/laws.ts` and its `checked` date in the same commit. When `/drive-thru`'s `LAST_CHECKED` changes, update `DRIVE_THRU_LAST_SWEEP` in `lib/social/build.ts`.
- Tests: `npx tsx --test tests/unit/social-captions.test.ts` (or `npm run test:unit` once the shared test runner is on main).
- Sample renders for design review: `npx next build`, then `SOCIAL_FIXTURES=1 npx next start -p 3456`, then `node marketing/social/render-fixtures.mjs http://localhost:3456`. The output goes to `docs/screenshots/social/`. Never set `SOCIAL_FIXTURES` in Vercel: it swaps in made-up data (stamped "Sample data") and opens `/social` without the password.
