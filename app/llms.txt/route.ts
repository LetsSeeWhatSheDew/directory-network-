// /llms.txt — a plain map of PuffPrice for AI assistants and answer engines.
import { brand } from "@/lib/brand";
import { GUIDES } from "@/lib/guides";
import { COMMON_PAIRS, pairSlug, routeCity, CORRIDOR_MILES } from "@/lib/routeDeals";
import { SALE_EVENTS } from "@/lib/events";

export const revalidate = 86400;

export function GET() {
  const u = brand.url;
  const body = `# PuffPrice

> Central Illinois cannabis deal and price comparison (Peoria, East Peoria, Peoria Heights, Pekin, Bloomington, Normal, Champaign, Urbana, Springfield). Deals are checked daily on each dispensary's own website. No store pays to rank.

## Live data
- [MCP server for AI assistants](${u}/developers): remote MCP endpoint ${u}/mcp (Streamable HTTP, no auth, read-only) with find_deals, deal_of_the_day, deals_on_route, list_dispensaries (includes each store's deal accuracy), out_the_door_price, illinois_cannabis_rules, deal_index
- [Deal of the day](${u}/deal-of-the-day): today's biggest everyday saving at a Central Illinois dispensary (stated percent or dollars off, re-checked on the store's own site within 7 days, no conditional or buy-several deals; ties rotate between stores). Share images: ${u}/og/deal-of-the-day?size=og (1200x630) and ?size=post (1080x1350)
- [Everything, full text (deals by city, index, ways to buy, law)](${u}/llms-full.txt)
- [Today's deals, JSON](${u}/api/public/deals): every live deal with store, city, discount and last-verified time
- [This week's report](${u}/this-week): biggest discounts and new deals, last 7 days
- [Deal Index](${u}/deal-index): daily deals live, stores discounting and average discount by city
- [Cheapest eighth, cart and gummies today](${u}/cheapest): lowest out-the-door menu price per store for 3.5g flower, a 1g vape cartridge and 100mg gummies, read twice a day from each store's own online menu (same size, any brand; never an average). Per city: ${u}/cheapest/<city>

- [Price watch](${u}/price-watch): email alert when the cheapest eighth, 1g cart or 100mg gummies at a chosen store drops (out-the-door, from the store's own menu)

## On the way (deals along a drive)
- [Best deal on your route](${u}/route): stores within ${CORRIDOR_MILES} miles of the straight line between any two of the 12 Central Illinois cities, in the order you reach them, with live deals. Any pair: ${u}/route/<from>-to-<to>
${COMMON_PAIRS.map(([a, b]) => `- [${routeCity(a)!.name} to ${routeCity(b)!.name}](${u}/route/${pairSlug(a, b)})`).join("\n")}

## Sale days
${SALE_EVENTS.map((e) => `- [${e.name}, ${e.dateLabel}](${u}${e.path}): every Central Illinois deal that morning; announced deals before`).join("\n")}

## Ways to buy
- [Compare every store](${u}/ways-to-buy): drive-thru, medical, order ahead, curbside, closing time
- [Drive-thru tracker](${u}/drive-thru)
- [Medical dispensaries](${u}/medical)
- [Open latest tonight](${u}/open-late)

## Illinois law
- [Is cannabis delivery legal in Illinois?](${u}/illinois-cannabis-delivery)
- [Nov 12, 2026 hemp / delta-8 change](${u}/illinois-hemp-law)
- [Illinois cannabis laws](${u}/cannabis/illinois/laws)

## Guides (plain answers, sourced)
- [All guides](${u}/guides)
${GUIDES.map((g) => `- [${g.question}](${u}/guides/${g.slug}): ${g.blurb}`).join("\n")}

## Cities
${["peoria", "east-peoria", "peoria-heights", "pekin", "bloomington", "normal", "champaign", "urbana", "springfield"].map((c) => `- [${c.replace(/-/g, " ")}](${u}/city/${c})`).join("\n")}

## Method
- [How we rank](${u}/how-we-rank)
- [Deal accuracy score](${u}/how-we-rank#accuracy): per store, 80% shoppers' Yes/No taps on its deals (last 90 days) + 20% share of its live deals re-found on its own site in the last 48 hours; shown only with 5+ taps; never affects ranking
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=86400" } });
}
