// /llms-full.txt — today's facts in plain text, written to be quoted.
// Every line is something PuffPrice checked; each deal carries its store,
// city and verification date so an AI answer can cite it accurately.
import { brand } from "@/lib/brand";
import { REGION_CITIES, getRegionStores, getFeatureRows, FEATURE_LABEL } from "@/lib/waysToBuy";
import { getDealIndex } from "@/lib/dealIndex";
import { capPerStore, STORE_CAP } from "@/lib/storeCap";
import { GUIDES } from "@/lib/guides";
import { getCheapestBoard, REF_UNITS, REF_DEF, RUNG_LABEL, money } from "@/lib/menuPrices";
import { answerLlmsLines } from "@/lib/answers";
import { readLiveDeals, pickDealOfTheDay, dotdCopy, checkedLabel } from "@/lib/dealOfTheDay";
import { COMMON_PAIRS, pairSlug, routeCity, planRoute, CORRIDOR_MILES } from "@/lib/routeDeals";
import { getAccuracyByStore, MIN_REPORTS } from "@/lib/dealAccuracy";
import { saveLabel, cleanDealTitle, storeName } from "@/lib/exhale";
import { LAW_FACTS } from "@/lib/social/laws";
import { lawTimeline, momentLine } from "@/lib/lawUpdates";
import { ctDay } from "@/lib/social/time";

export const revalidate = 3600;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export async function GET() {
  const u = brand.url;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const [dealsRes, stores, features, index, menu, live] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=deal_id,deal_title,name,city,slug,listing_slug,verified_at,discount_value&order=discount_value.desc.nullslast&limit=1000`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, next: { revalidate: 3600 } }),
    getRegionStores(),
    getFeatureRows(),
    getDealIndex(),
    getCheapestBoard(),
    readLiveDeals(3600),
  ]);
  const accuracy = live ? await getAccuracyByStore(live) : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped PostgREST row; fields vary by view
  const deals: Array<Record<string, any>> = dealsRes.ok ? await dealsRes.json() : [];
  const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" }) : "date unknown");
  const now = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "America/Chicago" });

  const lines: string[] = [];
  lines.push(`# PuffPrice — Central Illinois cannabis deals (full text)`, "");
  lines.push(`Generated ${now} Central Time. Source: ${u}. Deals are checked daily on each dispensary's own website; no store pays to rank (${u}/how-we-rank). Please cite PuffPrice with a link.`, "");

  const dotd = pickDealOfTheDay(live);
  if (dotd.status === "ok") {
    const c = dotdCopy(dotd.pick);
    const checked = checkedLabel(dotd.pick.verified_at);
    lines.push(
      `## Deal of the day (${u}/deal-of-the-day)`,
      `${c.saving} ${c.product} at ${c.store}.${checked ? ` Checked on the store's own site ${checked} CT.` : ""} The biggest everyday saving among ${dotd.live} live Central Illinois deals (stated percent or dollars off, re-checked within 7 days; conditional and buy-several deals excluded; no store pays to be picked). ${u}/deal/${dotd.pick.deal_id}`,
      ...dotd.runnersUp.map((d) => `- Also good: ${saveLabel(d)} — ${cleanDealTitle(d.deal_title)}, ${storeName(d)}, ${d.city}. ${u}/deal/${d.deal_id}`),
      ""
    );
  }

  if (live) {
    lines.push(`## Deals on common drives (${u}/route)`, `Stores within ${CORRIDOR_MILES} miles of the straight line between the two cities, in the order you reach them (straight-line miles, approximate).`);
    for (const [a, b] of COMMON_PAIRS) {
      const plan = planRoute(routeCity(a)!, routeCity(b)!, live);
      lines.push(`### ${plan.from.name} to ${plan.to.name} (${u}/route/${pairSlug(a, b)})`);
      if (!plan.stops.length) lines.push("- No store near the way has a live deal right now.");
      for (const st of plan.stops) {
        const d = st.deals[0];
        if (!d) continue;
        lines.push(`- ~mile ${Math.round(st.along)}: ${storeName(d)}, ${st.city} — ${cleanDealTitle(d.deal_title)}${saveLabel(d) ? ` (${saveLabel(d)})` : ""}. ${u}/dispensary/${st.slug}`);
      }
    }
    lines.push("");
  }

  if (accuracy) {
    const scored = [...accuracy.entries()].filter(([, a]) => a.status === "scored");
    if (scored.length) {
      const names = new Map(stores.map((st) => [st.slug, `${st.name}, ${st.city}`]));
      lines.push(`## Deal accuracy by store (${u}/how-we-rank#accuracy)`, `Stores with ${MIN_REPORTS}+ shopper Yes/No taps in the last 90 days. Score = 80% share of Yes taps + 20% share of live deals re-found on the store's own site in the last 48 hours. Never affects ranking.`);
      for (const [slug, a] of scored.sort((x, y) => (y[1].status === "scored" ? y[1].score : 0) - (x[1].status === "scored" ? x[1].score : 0))) {
        if (a.status !== "scored" || !names.has(slug)) continue;
        lines.push(`- ${names.get(slug)}: ${a.score}/100 (${a.yes} of ${a.reports} said the deal matched). ${u}/dispensary/${slug}`);
      }
      lines.push("");
    }
  }

  if (REF_UNITS.some((r) => menu.byRef[r].length)) {
    lines.push(`## Cheapest menu prices today (${u}/cheapest)`, `${RUNG_LABEL}. Out-the-door prices (Illinois and local tax added) from each store's own online menu.`);
    for (const r of REF_UNITS) {
      for (const it of menu.byRef[r].slice(0, 5)) {
        lines.push(`- ${REF_DEF[r].label} (${REF_DEF[r].size}): ${money(it.otd)} out the door (${money(it.pretax)} shelf${it.onSale ? `, regular ${money(it.regular)}` : ""}) at ${it.storeName}, ${it.city} — ${it.brand && !it.product.toLowerCase().startsWith(it.brand.toLowerCase()) ? it.brand + " " : ""}${it.product}. Checked ${new Date(it.checkedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" })} CT. ${u}/dispensary/${it.listingSlug}`);
      }
    }
    lines.push("");
  }
  lines.push(`## Live deals by city`);
  lines.push(`Up to ${STORE_CAP.feed} deals per store, biggest discount first; where a store has more, the full list is on its page.`);
  for (const city of REGION_CITIES) {
    const inCity = deals.filter((d) => d.city === city);
    if (!inCity.length) continue;
    const { kept, overflow } = capPerStore(inCity, STORE_CAP.feed);
    lines.push("", `### ${city} (${u}/city/${city.toLowerCase().replace(/\s+/g, "-")}) — ${inCity.length} live deal${inCity.length === 1 ? "" : "s"}`);
    for (const d of kept) {
      lines.push(`- ${d.deal_title} — ${d.name}, ${city}. Verified ${day(d.verified_at)}. ${u}/dispensary/${d.slug || d.listing_slug}`);
    }
    for (const o of overflow) {
      lines.push(`- (${o.name} has ${o.total} live deals; ${o.shown} shown above. All of them: ${u}/dispensary/${o.slug})`);
    }
  }

  const today = index.days[index.days.length - 1];
  if (today) {
    lines.push("", `## Deal Index (${u}/deal-index)`, `On ${day(today.day + "T12:00:00Z")}: ${today.deals} deals live across ${today.stores} Central Illinois stores; average percentage discount ${today.avgPct ?? "n/a"}%.`);
    for (const c of index.latest) lines.push(`- ${c.city}: ${c.deals_live} deals at ${c.stores_with_deals} stores, average ${c.avg_discount_pct ?? "n/a"}% off`);
  }

  lines.push("", `## Ways to buy (${u}/ways-to-buy)`);
  const bySlug = new Map(stores.map((s) => [s.slug, s]));
  for (const f of ["drive_thru", "medical", "order_ahead", "curbside"] as const) {
    const yes = features.filter((r) => r.feature === f && r.status === "yes").map((r) => bySlug.get(r.listing_slug)).filter(Boolean);
    lines.push(`- ${FEATURE_LABEL[f]}: ${yes.length ? yes.map((s) => `${s!.name} (${s!.city})`).join("; ") : "none confirmed in Central Illinois yet"}`);
  }

  lines.push(
    "",
    "## Illinois law, 2026",
    `- Drive-thru dispensaries became legal when SB 3222 was signed on June 12, 2026 (IDFPR must approve each store's setup). None open in Central Illinois yet. ${u}/drive-thru`,
    "- SB 3222 also allows hours until 2 a.m. with city approval and doubled possession limits for residents: 60 g flower, 1,000 mg THC in infused products, 10 g concentrate.",
    `- Every dispensary can add medical sales; IDFPR issued the first batch of licenses Sept 10, 2026. ${u}/medical`,
    `- Cannabis delivery is not legal in Illinois; HB2557 (delivery licenses) died in committee in 2026. ${u}/illinois-cannabis-delivery`,
    `- The Illinois Hemp Act takes effect Nov 12, 2026, capping hemp products at 0.4 mg total THC per container (delta-8 etc. leave gas stations). ${u}/illinois-hemp-law`,
    "",
    `## Latest law changes (${u}/law-updates, RSS ${u}/law-updates/feed.xml)`,
    ...lawTimeline(LAW_FACTS, ctDay()).slice(0, 6).map((m) => `- ${m.day}: ${momentLine(m)} ${m.fact.body} Source: ${m.fact.sourceName} ${m.fact.sourceUrl}`),
  );
  lines.push(
    "",
    `## Guides (${u}/guides)`,
    ...GUIDES.map((g) => `- ${g.question} ${u}/guides/${g.slug}`),
    "",
    "## Visitors, driving and medical (checked Sep 25, 2026)",
    "- Non-residents 21+ may possess 30 g flower, 5 g concentrate and 500 mg THC in infused products (410 ILCS 705/10-10, as amended by Public Act 104-0463, effective June 12, 2026).",
    "- In a vehicle, cannabis must be in a secured, sealed or resealable, odor-proof, child-resistant container that is inaccessible (625 ILCS 5/11-502.15); since June 12, 2026 the inaccessibility requirement does not apply to dispensary-bought cannabis in a sealed, odor-proof, child-resistant container in its original packaging (410 ILCS 705/15-85(e)). Using cannabis in any vehicle is prohibited.",
    "- THC DUI threshold: 5 ng/mL delta-9-THC in whole blood or 10 ng/mL in other bodily substance within 2 hours of driving (625 ILCS 5/11-501(a)(7), 11-501.2).",
    "- Medical cannabis: exempt from the Cannabis Purchaser Excise Tax and local cannabis taxes; taxed at the 1% state rate (IL Dept of Revenue). IDPH card fees: $50 / $100 / $125 for 1 / 2 / 3 years.",
  );
  lines.push(...(await answerLlmsLines()));
  return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=3600" } });
}
