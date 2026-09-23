// app/this-week/page.tsx — "This week in Central Illinois deals".
// Rolling 7-day report built from the daily deal log (deal_observations).
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import TrustLine from "../components/TrustLine";
import StoreAvatar from "../components/StoreAvatar";
import WeeklySignup from "../components/WeeklySignup";
import { brand } from "../../lib/brand";
import { storeImageUrl } from "../../lib/storeImage";
import { getWeeklyReport, reportRangeLabel, type ReportDeal } from "../../lib/weeklyReport";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "This Week in Central Illinois Dispensary Deals",
  description:
    "Every dispensary deal we saw in Peoria, Bloomington-Normal, Champaign-Urbana and Springfield over the last 7 days — biggest discounts, new deals, and which cities had the most. Checked daily on each store's own site.",
  alternates: { canonical: `${brand.url}/this-week` },
};

const CAT_LABEL: Record<string, string> = {
  flower: "Flower", edibles: "Edibles", vapes: "Vapes", concentrate: "Concentrates",
  concentrates: "Concentrates", prerolls: "Pre-rolls", "pre-rolls": "Pre-rolls", other: "Store-wide / other", topicals: "Topicals", accessories: "Accessories",
};

function DealRow({ d }: { d: ReportDeal }) {
  return (
    <Link href={`/dispensary/${d.slug}`} className="tw-row">
      <StoreAvatar src={storeImageUrl(d.logoUrl, d.slug)} name={d.store} size={40} />
      <span className="tw-row-main">
        <span className="tw-row-title">{d.title}</span>
        <span className="tw-row-sub">{d.store} · {d.city}{d.alsoAt.length > 0 ? ` + ${d.alsoAt.join(", ")}` : ""}{d.stillLive ? "" : " · ended"}</span>
      </span>
      {d.pct != null && <span className="tw-pct">{d.pct}%</span>}
    </Link>
  );
}

export default async function ThisWeekPage() {
  const r = await getWeeklyReport();
  const range = r ? reportRangeLabel(r) : "";
  const jsonLd = r && r.biggest.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Biggest Central Illinois dispensary discounts, ${range}`,
    itemListElement: r.biggest.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${d.title} — ${d.store}, ${d.city}`,
      url: `${brand.url}/dispensary/${d.slug}`,
    })),
  } : null;

  return (
    <>
      <Nav variant="light" />
      <style>{`
        .tw-wrap{max-width:880px;margin:0 auto;padding:12px clamp(1rem,4vw,2rem) 48px;font-family:var(--font-body);color:var(--pp-ink)}
        .tw-eyebrow{font-family:var(--font-mono);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--pp-muted)}
        .tw-h1{font-family:var(--font-display);font-size:clamp(1.8rem,5vw,2.6rem);line-height:1.08;margin:6px 0 10px;letter-spacing:-.02em}
        .tw-lede{color:var(--pp-muted);max-width:60ch;margin:0 0 20px}
        .tw-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:var(--pp-border);border:1px solid var(--pp-border);border-radius:14px;overflow:hidden;margin:0 0 28px}
        .tw-stat{background:var(--pp-surface);padding:16px}
        .tw-stat b{display:block;font-family:var(--font-mono);font-size:1.7rem;font-weight:700;color:var(--pp-canopy);line-height:1}
        .tw-stat span{display:block;margin-top:6px;font-size:.8rem;color:var(--pp-muted)}
        @media(max-width:640px){.tw-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
        .tw-h2{font-family:var(--font-display);font-size:1.2rem;margin:28px 0 10px}
        .tw-list{display:flex;flex-direction:column;border:1px solid var(--pp-border);border-radius:14px;overflow:hidden;background:var(--pp-surface)}
        .tw-row{display:flex;align-items:center;gap:12px;padding:12px 14px;text-decoration:none;color:inherit;border-top:1px solid var(--pp-border)}
        .tw-row:first-child{border-top:none}
        .tw-row:hover{background:var(--pp-paper)}
        .tw-row-main{display:flex;flex-direction:column;min-width:0;flex:1}
        .tw-row-title{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .tw-row-sub{font-size:.82rem;color:var(--pp-muted)}
        .tw-pct{font-family:var(--font-mono);font-weight:700;font-size:1.05rem;color:var(--pp-signal-ink);background:var(--pp-best-tint);padding:4px 9px;border-radius:8px;flex:0 0 auto}
        .tw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}
        .tw-city{border:1px solid var(--pp-border);border-radius:12px;padding:12px 14px;background:var(--pp-surface);text-decoration:none;color:inherit}
        .tw-city b{font-family:var(--font-display)}
        .tw-city span{display:block;font-size:.82rem;color:var(--pp-muted);margin-top:2px}
        .tw-note{font-size:.82rem;color:var(--pp-muted);margin-top:22px}
        .tw-cta{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-top:28px;padding:18px;border-radius:14px;background:var(--pp-canopy);color:var(--pp-canopy-text)}
        .tw-cta a{background:var(--pp-paper);color:var(--pp-canopy);font-weight:700;padding:10px 16px;border-radius:10px;text-decoration:none}
      `}</style>
      <main className="tw-wrap">
        <div className="tw-eyebrow">Weekly report · {range || "Central Illinois"}</div>
        <h1 className="tw-h1">This week in Central Illinois dispensary deals</h1>
        <p className="tw-lede">
          Every deal we saw on a Central Illinois dispensary&apos;s own site over the last 7 days. Updated hourly from our daily checks.
        </p>
        <TrustLine />

        {!r || r.dealsSeen === 0 ? (
          <p style={{ marginTop: 24 }}>
            We don&apos;t have enough of this week logged yet to report on. Today&apos;s live deals are on the <Link href="/deals/all">all deals page</Link>.
          </p>
        ) : (
          <>
            <div className="tw-stats" style={{ marginTop: 20 }}>
              <div className="tw-stat"><b>{r.dealsSeen}</b><span>deals seen</span></div>
              <div className="tw-stat"><b>{r.storesWithDeals}</b><span>stores running deals</span></div>
              <div className="tw-stat"><b>{r.biggest[0]?.pct != null ? `${r.biggest[0].pct}%` : "—"}</b><span>biggest discount</span></div>
              <div className="tw-stat"><b>{r.newCount}</b><span>new this week</span></div>
            </div>

            {r.biggest.length > 0 && (
              <>
                <h2 className="tw-h2">Biggest discounts live now</h2>
                <div className="tw-list">{r.biggest.map((d) => <DealRow key={d.dealId} d={d} />)}</div>
              </>
            )}

            {r.newDeals.length > 0 && (
              <>
                <h2 className="tw-h2">New this week, still running</h2>
                <div className="tw-list">{r.newDeals.map((d) => <DealRow key={d.dealId} d={d} />)}</div>
              </>
            )}

            <h2 className="tw-h2">By city</h2>
            <div className="tw-grid">
              {r.byCity.map((c) => (
                <Link key={c.city} className="tw-city" href={`/city/${c.city.toLowerCase().replace(/\s+/g, "-")}`}>
                  <b>{c.city}</b>
                  <span>{c.deals} {c.deals === 1 ? "deal" : "deals"} · {c.stores} {c.stores === 1 ? "store" : "stores"}{c.topPct != null ? ` · up to ${c.topPct}%` : ""}</span>
                </Link>
              ))}
            </div>

            {r.byCategory.length > 0 && (
              <>
                <h2 className="tw-h2">By category</h2>
                <div className="tw-grid">
                  {r.byCategory.map((c) => (
                    <div key={c.category} className="tw-city">
                      <b>{CAT_LABEL[c.category] || c.category}</b>
                      <span>{c.deals} {c.deals === 1 ? "deal" : "deals"}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <p className="tw-note">
              {r.endedCount > 0 ? `${r.endedCount} ${r.endedCount === 1 ? "deal" : "deals"} ended this week. ` : ""}
              {r.daysTracked < 7
                ? `Our day-by-day log started Sep 22, 2026 — this report covers ${r.daysTracked} ${r.daysTracked === 1 ? "day" : "days"} of daily checks so far and fills out as the week goes on.`
                : "Covers 7 days of daily checks."}{" "}
              <Link href="/how-we-rank">How we check deals</Link>.
            </p>
          </>
        )}

        <div className="tw-cta" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <b style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>Get this report every Monday</b>
          <WeeklySignup tone="dark" />
        </div>
      </main>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <Footer />
    </>
  );
}
