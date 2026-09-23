// /llms.txt — a plain map of PuffPrice for AI assistants and answer engines.
import { brand } from "@/lib/brand";

export const revalidate = 86400;

export function GET() {
  const u = brand.url;
  const body = `# PuffPrice

> Central Illinois cannabis deal and price comparison (Peoria, East Peoria, Peoria Heights, Pekin, Bloomington, Normal, Champaign, Urbana, Springfield). Deals are checked daily on each dispensary's own website. No store pays to rank.

## Live data
- [Today's deals, JSON](${u}/api/public/deals): every live deal with store, city, discount and last-verified time
- [This week's report](${u}/this-week): biggest discounts and new deals, last 7 days
- [Deal Index](${u}/deal-index): daily deals live, stores discounting and average discount by city

## Ways to buy
- [Compare every store](${u}/ways-to-buy): drive-thru, medical, order ahead, curbside, closing time
- [Drive-thru tracker](${u}/drive-thru)
- [Medical dispensaries](${u}/medical)
- [Open latest tonight](${u}/open-late)

## Illinois law
- [Is cannabis delivery legal in Illinois?](${u}/illinois-cannabis-delivery)
- [Nov 12, 2026 hemp / delta-8 change](${u}/illinois-hemp-law)
- [Illinois cannabis laws](${u}/cannabis/illinois/laws)

## Cities
${["peoria", "east-peoria", "peoria-heights", "pekin", "bloomington", "normal", "champaign", "urbana", "springfield"].map((c) => `- [${c.replace(/-/g, " ")}](${u}/city/${c})`).join("\n")}

## Method
- [How we rank](${u}/how-we-rank)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=86400" } });
}
