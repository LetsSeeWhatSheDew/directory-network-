// /guides/illinois-cannabis-prices-2026 — statewide price picture (IDFPR,
// Headset) plus what Central Illinois deals look like today (live).
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../../components/GuideShell";
import OtdLine from "../../components/OtdLine";
import { brand } from "../../../lib/brand";
import { getLiveDeals, getMarketDays, fmtDay, todayCT, todayIsoCT, FACTS_VERIFIED } from "../../../lib/guides";
import { storeWithCity, cleanDealTitle, amountOf, isConditional } from "../../../lib/exhale";
import { priceChip } from "../../../lib/otd";
import { QuickAnswer, FaqBlock, Sources, RelatedGuides, GUIDE_EXTRA_CSS, GUIDE_CRUMBS, guideJsonLd, type Faq } from "../GuideParts";

export const revalidate = 3600;
const SLUG = "illinois-cannabis-prices-2026";
const TITLE = "Illinois cannabis prices in 2026";

// IDFPR adult-use totals, released Jan 30, 2026.
const SALES_2025 = 1_506_740_852.75;
const SALES_2024 = 1_722_756_045.71;
const ITEMS_2025 = 52_146_122;
const ITEMS_2024 = 48_953_357;
const PER_ITEM_2025 = SALES_2025 / ITEMS_2025; // ≈ $28.89
const PER_ITEM_2024 = SALES_2024 / ITEMS_2024; // ≈ $35.19
// Headset, Illinois market page, August 2026.
const HEADSET = { month: "August 2026", avgItem: 27.33, sales: "$136.73 million", salesYoY: "5.3%", unitsYoY: "10.1%" };

const pct = (a: number, b: number) => Math.round(((a - b) / b) * 1000) / 10;
const money = (n: number) => `$${n.toFixed(2)}`;
const billions = (n: number) => `$${(n / 1e9).toFixed(2)} billion`;
const millions = (n: number) => `${(n / 1e6).toFixed(1)} million`;

export const metadata: Metadata = {
  title: "Illinois Cannabis Prices 2026: What Weed Costs Now (Sales Data + Today's Deals)",
  description:
    "Illinois adult-use sales fell to $1.51 billion in 2025 while items sold rose, and Headset puts the August 2026 average item price at $27.33. Plus live Central Illinois deal prices.",
  alternates: { canonical: `${brand.url}/guides/${SLUG}` },
};

export default async function PricesPage() {
  const [live, market] = await Promise.all([getLiveDeals(), getMarketDays()]);
  const updated = todayCT();
  const priced = live
    .map((d) => ({ d, chip: priceChip(d) }))
    .filter((x) => x.chip && !isConditional(x.d));
  const pctDeals = live.filter((d) => amountOf(d)?.kind === "percent" && !isConditional(d));
  const latestDay = market.length ? market[market.length - 1].observed_day : null;
  const latest = latestDay ? market.filter((m) => m.observed_day === latestDay).sort((a, b) => b.deals_live - a.deals_live) : [];
  const avgOff = pctDeals.length ? Math.round(pctDeals.reduce((a, d) => a + (amountOf(d)?.value || 0), 0) / pctDeals.length) : null;

  const quick = `Illinois shoppers are spending less per item: IDFPR reports ${billions(SALES_2025)} in 2025 sales versus ${billions(SALES_2024)} in 2024, even as items sold rose from ${millions(ITEMS_2024)} to ${millions(ITEMS_2025)}. Headset puts the average Illinois item at ${money(HEADSET.avgItem)} in ${HEADSET.month}, before tax.${live.length ? ` In Central Illinois today we see ${live.length} deals${avgOff != null ? `, and the everyday percent-off deals average ${avgOff}% off` : ""}.` : ""}`;

  const faqs: Faq[] = [
    { q: "How much does weed cost in Illinois in 2026?", a: `Headset's data puts the average item sold in Illinois at ${money(HEADSET.avgItem)} in ${HEADSET.month}. That's the shelf price across all product types; Illinois taxes are added at the register.` },
    { q: "Are Illinois cannabis prices going down?", a: `Per item, yes. IDFPR's totals work out to about ${money(PER_ITEM_2025)} per item in 2025 against ${money(PER_ITEM_2024)} in 2024, our math from their figures. IDFPR notes the state moved to a new tracking system (Metrc) in July 2025 that records discounts at checkout more accurately, so part of the drop may be better reporting of discounts.` },
    { q: "Why is weed so expensive in Illinois?", a: "Mostly tax. Illinois adds a cannabis excise tax of 10%, 20% or 25% depending on the product, plus state and local sales taxes and local cannabis taxes. Our tax explainer and calculator show the exact total for each Central Illinois city." },
    { q: "Where is the cheapest weed in Central Illinois?", a: priced.length ? `Today's lowest stated prices are on this page, pulled from each store's own site. For example: ${priced.slice(0, 3).map((x) => `${cleanDealTitle(x.d.deal_title)} at ${storeWithCity(x.d)}`).join("; ")}.` : "It changes daily. Our deal pages list every deal we find on each store's own site, with the price after tax where the store posts a price." },
  ];

  return (
    <GuideShell
      crumbs={GUIDE_CRUMBS}
      eyebrow={`Guide · prices · ${updated}`}
      title={TITLE}
      lede={<>What cannabis costs in Illinois right now, from the state&apos;s own sales numbers and an industry tracker, and what the deals look like in Central Illinois today.</>}
      jsonLd={guideJsonLd({ slug: SLUG, title: TITLE, faqs, dateModified: todayIsoCT() })}
    >
      <style>{GUIDE_EXTRA_CSS}</style>
      <QuickAnswer updated={updated}>{quick}</QuickAnswer>

      <h2 className="gp-h2">The statewide numbers</h2>
      <div className="gp-table-wrap">
        <table className="gp-table">
          <thead><tr><th>Adult-use, full year</th><th style={{ textAlign: "right" }}>2024</th><th style={{ textAlign: "right" }}>2025</th><th style={{ textAlign: "right" }}>Change</th></tr></thead>
          <tbody>
            <tr><td>Sales</td><td className="num">{billions(SALES_2024)}</td><td className="num">{billions(SALES_2025)}</td><td className="num">{pct(SALES_2025, SALES_2024)}%</td></tr>
            <tr><td>Items sold</td><td className="num">{millions(ITEMS_2024)}</td><td className="num">{millions(ITEMS_2025)}</td><td className="num">+{pct(ITEMS_2025, ITEMS_2024)}%</td></tr>
            <tr><td>Sales per item (our math)</td><td className="num">{money(PER_ITEM_2024)}</td><td className="num">{money(PER_ITEM_2025)}</td><td className="num">{pct(PER_ITEM_2025, PER_ITEM_2024)}%</td></tr>
          </tbody>
        </table>
      </div>
      <p className="gp-note">Source: IDFPR adult-use sales figures, released Jan 30, 2026. IDFPR notes Illinois switched to the Metrc tracking system in July 2025, which records discounts and promotions at checkout more accurately, so 2025 and 2024 aren&apos;t a perfect like-for-like.</p>
      <p className="gp-p">
        The more recent picture comes from Headset, a cannabis sales-data company: in {HEADSET.month} Illinois sales were {HEADSET.sales}, up {HEADSET.salesYoY} from a year earlier, with units up {HEADSET.unitsYoY}, and the average item sold for <b>{money(HEADSET.avgItem)}</b>. Units growing faster than sales is the same story: people are buying more, and paying a little less for each thing.
      </p>

      <h2 className="gp-h2">What Central Illinois deals look like today</h2>
      {latest.length > 0 && (
        <div className="gp-table-wrap" style={{ marginBottom: 12 }}>
          <table className="gp-table">
            <thead><tr><th>City</th><th style={{ textAlign: "right" }}>Deals live</th><th style={{ textAlign: "right" }}>Stores discounting</th><th style={{ textAlign: "right" }}>Avg % off</th></tr></thead>
            <tbody>
              {latest.map((c) => (
                <tr key={c.city}>
                  <td><Link href={`/city/${c.city.toLowerCase().replace(/\s+/g, "-")}`}>{c.city}</Link></td>
                  <td className="num">{c.deals_live}</td>
                  <td className="num">{c.stores_with_deals}</td>
                  <td className="num">{c.avg_discount_pct != null ? `${c.avg_discount_pct}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {latestDay && <p className="gp-note">From our check of each store&apos;s own site on {fmtDay(latestDay)}. Day-by-day history is on the <Link href="/deal-index">Deal Index</Link>.</p>}

      {priced.length > 0 ? (
        <>
          <h2 className="gp-h2">Deals with a stated price</h2>
          <p className="gp-p">Only deals where the store posts an actual price. Where we know the product type, the line underneath adds Illinois and local tax.</p>
          <div className="gp-list">
            {priced.map(({ d, chip }) => (
              <Link key={d.deal_id} href={`/deal/${d.deal_id}`} className="gp-row">
                <span className="gp-row-main">
                  <span className="gp-row-title">{cleanDealTitle(d.deal_title)}</span>
                  <span className="gp-row-sub">{storeWithCity(d)}{d.verified_at ? ` · checked ${fmtDay(d.verified_at)}` : ""}</span>
                  <OtdLine deal={d} />
                </span>
                <span className="gp-row-right">{chip}</span>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <p className="gp-note">No Central Illinois store is posting a flat price today. Percent-off deals are on <Link href="/deals/all">the deals page</Link>.</p>
      )}

      <h2 className="gp-h2">The price at the register</h2>
      <p className="gp-p">Every number above is before tax. Illinois stacks a cannabis excise tax, state and local sales tax, and city and county cannabis taxes, so the register total runs well above the shelf price. We don&apos;t repeat the math here: see <Link href="/illinois-cannabis-tax">how Illinois cannabis tax works</Link>, run a number through the <Link href="/illinois-cannabis-tax-calculator">tax calculator</Link>, or browse <Link href="/out-the-door">today&apos;s deals with tax already added</Link>.</p>

      <FaqBlock faqs={faqs} />
      <Sources
        checked={fmtDay(FACTS_VERIFIED)}
        items={[
          { href: "https://idfpr.illinois.gov/news/2026/adult-use-cannabis-sales-figures-released-for-nov-dec-2025.html", label: "IDFPR — Adult Use Cannabis Sales Figures Released for November-December 2025 (Jan 30, 2026)" },
          { href: "https://www.headset.io/markets/illinois", label: "Headset — Illinois Cannabis Prices and Trends (August 2026)" },
          { href: "https://tax.illinois.gov/research/taxinformation/other/cannabis-taxes.html", label: "Illinois Department of Revenue — Cannabis Taxes" },
        ]}
      />
      <RelatedGuides current={SLUG} extra={[{ href: "/about/index", label: "PuffPrice Index (flower price per gram)" }]} />
    </GuideShell>
  );
}
