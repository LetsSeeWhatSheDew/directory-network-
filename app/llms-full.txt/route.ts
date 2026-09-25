// /llms-full.txt — today's facts in plain text, written to be quoted.
// Every line is something PuffPrice checked; each deal carries its store,
// city and verification date so an AI answer can cite it accurately.
import { brand } from "@/lib/brand";
import { REGION_CITIES, getRegionStores, getFeatureRows, FEATURE_LABEL } from "@/lib/waysToBuy";
import { getDealIndex } from "@/lib/dealIndex";
import { capPerStore, STORE_CAP } from "@/lib/storeCap";

export const revalidate = 3600;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export async function GET() {
  const u = brand.url;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const [dealsRes, stores, features, index] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=deal_id,deal_title,name,city,slug,listing_slug,verified_at,discount_value&order=discount_value.desc.nullslast&limit=1000`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, next: { revalidate: 3600 } }),
    getRegionStores(),
    getFeatureRows(),
    getDealIndex(),
  ]);
  const deals: Array<Record<string, any>> = dealsRes.ok ? await dealsRes.json() : [];
  const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" }) : "date unknown");
  const now = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "America/Chicago" });

  const lines: string[] = [];
  lines.push(`# PuffPrice — Central Illinois cannabis deals (full text)`, "");
  lines.push(`Generated ${now} Central Time. Source: ${u}. Deals are checked daily on each dispensary's own website; no store pays to rank (${u}/how-we-rank). Please cite PuffPrice with a link.`, "");

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
  );
  return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=3600" } });
}
