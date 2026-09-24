// app/deal-index/page.tsx — Central Illinois Deal Index (daily, from our own log).
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import { brand } from "../../lib/brand";
import { getDealIndex } from "../../lib/dealIndex";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Central Illinois Cannabis Deal Index — Daily Discounts by City",
  description:
    "How many dispensary deals are live in Peoria, Bloomington-Normal, Champaign-Urbana, Pekin and Springfield each day, how many stores are discounting, and the average discount — from PuffPrice's daily checks of each store's own site.",
  alternates: { canonical: `${brand.url}/deal-index` },
};

const fmt = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 600, h = 90, max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 8) - 4}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="Deals live per day">
      <polyline points={pts} fill="none" stroke="var(--pp-signal)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default async function DealIndexPage() {
  const { days, latest, latestDay } = await getDealIndex();
  const today = days[days.length - 1];
  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Central Illinois Cannabis Deal Index",
    description: "Daily count of live dispensary deals, stores discounting, and average discount by city in Central Illinois, from PuffPrice's daily checks of each store's own website.",
    url: `${brand.url}/deal-index`,
    creator: { "@type": "Organization", name: "PuffPrice", url: brand.url },
    temporalCoverage: days.length ? `${days[0].day}/${days[days.length - 1].day}` : undefined,
    spatialCoverage: "Central Illinois, USA",
    isAccessibleForFree: true,
  };
  return (
    <GuideShell
      eyebrow={latestDay ? `Deal Index · ${fmt(latestDay)}` : "Deal Index"}
      title="Central Illinois Deal Index"
      lede={<>Every day we check each Central Illinois dispensary&apos;s own site and log every deal we see. This is the running tally: how many deals are live, how many stores are discounting, and how deep the average discount is — by city.</>}
      jsonLd={dataset}
    >
      {today ? (
        <>
          <div className="gp-grid" style={{ marginTop: 22 }}>
            <div className="gp-card"><span>Deals seen this morning</span><span className="gp-big">{today.deals}</span></div>
            <div className="gp-card"><span>Stores discounting</span><span className="gp-big">{today.stores}</span></div>
            <div className="gp-card"><span>Average discount</span><span className="gp-big">{today.avgPct != null ? `${today.avgPct}%` : "—"}</span></div>
          </div>
          {days.length >= 2 && (
            <>
              <h2 className="gp-h2">Deals live, day by day</h2>
              <Spark values={days.map((d) => d.deals)} />
              <p className="gp-note">{fmt(days[0].day)} – {fmt(days[days.length - 1].day)}</p>
            </>
          )}
          <h2 className="gp-h2">By city · {latestDay ? fmt(latestDay) : ""}</h2>
          <div style={{ overflowX: "auto", border: "1px solid var(--pp-border)", borderRadius: 14, background: "var(--pp-surface)" }}>
            <table className="gp-table">
              <thead><tr><th>City</th><th style={{ textAlign: "right" }}>Deals</th><th style={{ textAlign: "right" }}>Stores</th><th style={{ textAlign: "right" }}>Avg. discount</th></tr></thead>
              <tbody>
                {latest.map((c) => (
                  <tr key={c.city}>
                    <td><Link href={`/city/${c.city.toLowerCase().replace(/\s+/g, "-")}`} style={{ color: "inherit" }}>{c.city}</Link></td>
                    <td className="num">{c.deals_live}</td>
                    <td className="num">{c.stores_with_deals}</td>
                    <td className="num">{c.avg_discount_pct != null ? `${c.avg_discount_pct}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="gp-p" style={{ marginTop: 20 }}>The first full day of the log is still being tallied — check back tomorrow.</p>
      )}
      <h2 className="gp-h2">How it&apos;s made</h2>
      <p className="gp-p">Deals only count if we saw them on the dispensary&apos;s own website that day — never from an aggregator, never submitted by a store. &ldquo;Average discount&rdquo; is across percentage-off deals only. The day-by-day log started Sept 22, 2026, so the trend line grows from there.</p>
      <p className="gp-note">Reporters and researchers: you&apos;re welcome to cite these numbers with a link to this page. <Link href="/this-week">This week&apos;s report</Link> · <Link href="/how-we-rank">How we check deals</Link></p>
    </GuideShell>
  );
}
