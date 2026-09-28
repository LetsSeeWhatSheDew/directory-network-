// lib/social/captions.ts — ready-to-paste captions, drafted from the same
// data as the images.
//
// Voice (docs/brand/2026-04-28-identity-package.md §2.6, Breathe spec): calm,
// warm, a little wry; civic, like a local price report. Specific over
// abstract. No pot puns, no stoner humor, no "High Times", no emoji, no
// "buy now". Every caption ends with the as-of line (Central Time), "21+"
// and "puffprice.com", then 3–5 local hashtags. Numbers only come from the
// data passed in; estimates say they're estimates.

import type { CheapestData, CityData, DriveThruData, IndexData, LawData, SavingData, SocialData, SocialTemplate } from "./types";
import { shortDay } from "./time";

export const SITE = "puffprice.com";

const REGION_TAG: Record<string, string[]> = {
  Peoria: ["#PeoriaIL"],
  "East Peoria": ["#EastPeoria", "#PeoriaIL"],
  "Peoria Heights": ["#PeoriaHeights", "#PeoriaIL"],
  Pekin: ["#PekinIL", "#PeoriaIL"],
  Bloomington: ["#BloomingtonNormal"],
  Normal: ["#BloomingtonNormal"],
  Champaign: ["#ChampaignUrbana"],
  Urbana: ["#ChampaignUrbana"],
  Springfield: ["#SpringfieldIL"],
};

/** 3–5 local hashtags: the cities' own tags first, then the region, padded. */
export function hashtags(cities: string[], extra: string[] = []): string {
  const out: string[] = [];
  const add = (t: string) => {
    if (out.length < 5 && !out.includes(t)) out.push(t);
  };
  for (const c of cities) for (const t of REGION_TAG[c] || []) add(t);
  add("#CentralIllinois");
  for (const t of extra) add(t);
  for (const t of ["#PeoriaIL", "#Illinois", "#CentralIL"]) if (out.length < 3) add(t);
  return out.join(" ");
}

function footer(asOf: string, tags: string): string {
  return `As of ${asOf} · 21+ · ${SITE}\n${tags}`;
}

/** "All house flower" reads as "all house flower" mid-sentence; brand names keep their capital. */
const inline = (product: string) => product.replace(/^(All|Any|Every|Each|Select|Selected|Our|Entire|Storewide|Sitewide|House)\b/, (w) => w.toLowerCase());

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const money = (n: number) => `$${n.toFixed(2)}`;

export function savingCaption(d: SavingData): string | null {
  if (!d.postable || d.status === "unknown") return null;
  if (d.status === "none") {
    return [
      `No single everyday discount stood out this morning, so there's no headline number today.`,
      `We still checked: ${plural(d.live, "deal")} live across ${plural(d.stores, "Central Illinois store")}, each read from the store's own website. The full list is on ${SITE}.`,
      footer(d.asOf, hashtags([], ["#Illinois"])),
    ].join("\n\n");
  }
  const x = d.deal;
  return [
    `Today's biggest everyday saving in Central Illinois: ${x.saving} off ${inline(x.product)}, at ${x.store} in ${x.city}.`,
    `It's one of ${plural(d.live, "deal")} live across ${plural(d.stores, "store")} this morning, each checked on the store's own website. Nobody pays us to rank, and the counter always has the final word.`,
    footer(d.asOf, hashtags([x.city])),
  ].join("\n\n");
}

export function cityCaption(d: CityData): string | null {
  if (!d.postable || d.status !== "ok") return null;
  const n = d.deals.length;
  const lines = d.deals.map((x, i) => `${i + 1}. ${x.saving} off ${inline(x.product)}, ${x.store}`);
  return [
    `${d.city}, today. The ${n === 1 ? "biggest everyday saving" : `${n} biggest everyday savings`} we found, one per store:`,
    lines.join("\n"),
    `${plural(d.live, "deal")} live in ${d.city} in all, read from each store's own site. You can close the other tabs.`,
    footer(d.asOf, hashtags([d.city])),
  ].join("\n\n");
}

export function indexCaption(d: IndexData): string | null {
  if (!d.postable || d.status !== "ok") return null;
  const top = d.cities.slice(0, 3).map((c) => `${c.city} ${c.deals}${c.avgPct != null ? ` (avg ${c.avgPct}% off)` : ""}`);
  const avg = d.avgPct != null ? `, and the average percent-off deal took ${d.avgPct}% off` : "";
  return [
    `The Central Illinois Deal Index for ${shortDay(d.day)}: ${plural(d.deals, "deal")} live at ${plural(d.stores, "store")}${avg}.`,
    top.length ? `Most deals by city: ${top.join(", ")}.` : "",
    `We count every deal we see on each dispensary's own website, every day. It's a price report, not an ad.${d.coverageNote ? ` ${d.coverageNote}` : ""}`,
    footer(d.asOf, hashtags(d.cities.map((c) => c.city), ["#CentralIllinois"])),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function cheapestCaption(d: CheapestData): string | null {
  if (!d.postable || d.status !== "ok") return null;
  const lines = d.rows.map((r) => `${r.city}: ${r.store}, ${money(r.pretax)} on the shelf, about ${money(r.otd)} out the door`);
  return [
    `The cheapest eighth (3.5g, any brand) we could find on each store's own menu, city by city:`,
    lines.join("\n"),
    `Out-the-door prices are our estimate with each city's cannabis taxes added. Only cities where we could read a menu are listed.`,
    footer(d.asOf, hashtags(d.rows.map((r) => r.city))),
  ].join("\n\n");
}

export function lawCaption(d: LawData): string | null {
  const f = d.fact;
  return [
    `${f.headline}`,
    f.body,
    `Source: ${f.sourceName}. Not legal advice. More on ${SITE}${f.page}`,
    footer(d.asOf, hashtags([], [...f.tags, "#PeoriaIL", "#Illinois"])),
  ].join("\n\n");
}

export function driveThruCaption(d: DriveThruData): string | null {
  if (!d.postable || d.status !== "ok") return null;
  const n = d.open.length;
  const status =
    n === 0
      ? `As of ${d.asOf}, none of the ${d.tracked} Central Illinois dispensaries we track has opened one.`
      : `As of ${d.asOf}, ${n} of the ${d.tracked} Central Illinois dispensaries we track ${n === 1 ? "has" : "have"} one open: ${d.open.map((o) => `${o.store} in ${o.city}`).join(", ")}.`;
  const announced = d.announced > 0 ? ` ${plural(d.announced, "more store has", "more stores have")} announced one.` : "";
  return [
    `Illinois made dispensary drive-thrus legal on June 12, 2026. ${status}${announced}`,
    `The holdup is mostly local: a city usually has to update its cannabis ordinance before a store can even apply to the state. If you want one in your town, that's a city council conversation.`,
    footer(d.asOf, hashtags([], ["#PeoriaIL", "#CityCouncil", "#IllinoisLaw"])),
  ].join("\n\n");
}

export function captionFor(t: SocialTemplate, all: SocialData): string | null {
  switch (t) {
    case "saving": return savingCaption(all.saving);
    case "city": return cityCaption(all.city);
    case "index": return indexCaption(all.index);
    case "cheapest": return cheapestCaption(all.cheapest);
    case "law": return lawCaption(all.law);
    case "drive-thru": return driveThruCaption(all["drive-thru"]);
  }
}

/** Words and marks the captions must never contain (checked by the tests). */
export const BANNED = /high times|stoner|\bblaze|\bdank\b|\btoke|\b420\b|\bstoned\b|\bbaked\b|\blit\b|buy now|shop now|order now|don'?t miss|hurry|\bpremium\b|\bcurated\b|\bdiscover\b/i;
