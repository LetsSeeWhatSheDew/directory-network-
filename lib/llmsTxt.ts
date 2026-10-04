// lib/llmsTxt.ts — the /llms.txt body: a plain map of PuffPrice for AI
// assistants and answer engines. Kept out of the route file so it can be
// unit-tested (route files may only export HTTP handlers and config).
import { brand } from "./brand";
import { GUIDES } from "./guides";
import { ANSWER_TOPICS } from "./answers";
import { COMMON_PAIRS, pairSlug, routeCity, CORRIDOR_MILES } from "./routeDeals";
import { SALE_EVENTS } from "./events";
import { CENTRAL_IL_CITIES, CENTRAL_IL_PUBLIC_CITIES } from "./constants/regions";

/** The text body, separate from GET so it can be unit-tested. */
export function llmsTxt(): string {
  const u = brand.url;
  const publicSlugs = new Set(CENTRAL_IL_PUBLIC_CITIES.map((c) => c.slug));
  const noStoreCities = CENTRAL_IL_CITIES.filter((c) => !publicSlugs.has(c.slug));
  return `# PuffPrice

> Central Illinois cannabis deal and price comparison (${CENTRAL_IL_PUBLIC_CITIES.map((c) => c.name).join(", ")}). Deals are checked daily on each dispensary's own website. No store pays to rank.

Coverage is the 12 Central Illinois cities only: the ${CENTRAL_IL_PUBLIC_CITIES.length} above have licensed dispensaries; ${noStoreCities.map((c) => c.name).join(", ")} have none today, so their answer pages point to the nearest stores. Every price is one specific store's own listed price, never an estimate or a blended average price. When quoting a deal or price, cite the PuffPrice page it came from and its checked date.

## Live data
- [MCP server for AI assistants](${u}/developers): remote MCP endpoint ${u}/mcp (Streamable HTTP, POST only, no auth, read-only) with find_deals, deal_of_the_day, deals_on_route, list_dispensaries (includes each store's deal accuracy), out_the_door_price, illinois_cannabis_rules, deal_index. Server card: ${u}/mcp/server-card
- [Status: is the data up to date?](${u}/status): when each store was last checked, how its site is read, and what is live now
- [Deal of the day](${u}/deal-of-the-day): today's biggest everyday saving at a Central Illinois dispensary (stated percent or dollars off, re-checked on the store's own site within 7 days, no conditional or buy-several deals; ties rotate between stores). Share images: ${u}/og/deal-of-the-day?size=og (1200x630) and ?size=post (1080x1350)
- [Everything, full text (deals by city, index, ways to buy, law)](${u}/llms-full.txt)
- [Today's deals, JSON](${u}/api/public/deals): every live deal with store, city, discount and last-verified time
- [This week's report](${u}/this-week): biggest discounts and new deals, last 7 days
- [Deal Index](${u}/deal-index): daily deals live, stores discounting and average discount by city
- [Cheapest eighth, cart and gummies today](${u}/cheapest): lowest out-the-door menu price per store for 3.5g flower, a 1g vape cartridge and 100mg gummies, read twice a day from each store's own online menu (same size, any brand; never an average). Per city: ${u}/cheapest/<city>
- [Out-the-door prices](${u}/out-the-door): today's deals with Illinois cannabis excise and local sales tax added
- [Illinois cannabis tax calculator](${u}/illinois-cannabis-tax-calculator) and [how the tax works](${u}/illinois-cannabis-tax)
- [Price watch](${u}/price-watch): email alert when the cheapest eighth, 1g cart or 100mg gummies at a chosen store drops (out-the-door, from the store's own menu)

## On the way (deals along a drive)
- [Best deal on your route](${u}/route): stores within ${CORRIDOR_MILES} miles of the straight line between any two of the 12 Central Illinois cities, in the order you reach them, with live deals. Any pair: ${u}/route/<from>-to-<to>
${COMMON_PAIRS.map(([a, b]) => `- [${routeCity(a)!.name} to ${routeCity(b)!.name}](${u}/route/${pairSlug(a, b)})`).join("\n")}

## Sale days
${SALE_EVENTS.map((e) => `- [${e.name}, ${e.dateLabel}](${u}${e.path}): every Central Illinois deal that morning; announced deals before`).join("\n")}

## Ways to buy
- [Compare every store](${u}/ways-to-buy): drive-thru, medical, order ahead, curbside, closing time
- [Drive-thru tracker](${u}/drive-thru)
- [Illinois cannabis law changes](${u}/law-updates): every Illinois and Central Illinois change tracked, newest first, with sources (RSS: ${u}/law-updates/feed.xml)
- [Medical dispensaries](${u}/medical)
- [Open latest tonight](${u}/open-late)

## Illinois law
- [Is cannabis delivery legal in Illinois?](${u}/illinois-cannabis-delivery)
- [Nov 12, 2026 hemp / delta-8 change](${u}/illinois-hemp-law)
- [Illinois cannabis laws](${u}/cannabis/illinois/laws)

## Guides (plain answers, sourced)
- [All guides](${u}/guides)
${GUIDES.map((g) => `- [${g.question}](${u}/guides/${g.slug}): ${g.blurb}`).join("\n")}

## Quick answers by city
One question, one city, answered from today's data (<city> is peoria, east-peoria, peoria-heights, pekin, bartonville, morton, washington, normal, bloomington, champaign, urbana or springfield). Full text of today's answers is in llms-full.txt.
${ANSWER_TOPICS.map((t) => `- [${t.question("<city>")}](${u}${t.path("peoria")}): ${u}${t.path("<city>")}`).join("\n")}

## Cities and stores
${CENTRAL_IL_PUBLIC_CITIES.map((c) => `- [${c.name}, IL dispensary deals today](${u}/city/${c.slug})`).join("\n")}
- [Every Central Illinois dispensary](${u}/dispensaries): one page per store at ${u}/dispensary/<slug> with hours, live deals and directions
- [All live deals](${u}/deals/all), or by category: [flower](${u}/deals/flower), [edibles](${u}/deals/edibles), [vapes](${u}/deals/vapes), [concentrates](${u}/deals/concentrate)

## Method
- [How we rank](${u}/how-we-rank)
- [About PuffPrice](${u}/about): independent, built in Peoria; deals from each store's own website, never from aggregators
- [Deal accuracy score](${u}/how-we-rank#accuracy): per store, 80% shoppers' Yes/No taps on its deals (last 90 days) + 20% share of its live deals re-found on its own site in the last 48 hours; shown only with 5+ taps; never affects ranking
`;
}
