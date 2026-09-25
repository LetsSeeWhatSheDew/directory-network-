// app/out-the-door/page.tsx — what Central Illinois deals really cost at the
// register. Every live deal that states a real price, with Illinois and local
// tax added (lib/otd.ts → lib/taxRates.ts), cheapest per item first. Plus the
// tax on a $40 purchase in every city, so a percent-off deal can be read too.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import { brand } from "../../lib/brand";
import { otdFor, usd, cityTaxRates, KIND_LABEL, type Otd } from "../../lib/otd";
import { CITY_TAX_RATES, calculateOutTheDoor, TAX_RATES_LAST_UPDATED } from "../../lib/taxRates";
import { storeName, cleanDealTitle } from "../../lib/exhale";
import { capPerStore, STORE_CAP } from "../../lib/storeCap";
import StoreOverflowLinks from "../components/StoreOverflowLinks";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Out-the-Door Cannabis Prices in Central Illinois (Tax Included)",
  description:
    "What today's Peoria, Bloomington-Normal, Champaign-Urbana, Pekin and Springfield dispensary deals really cost at the register, with Illinois and local cannabis tax added. Plus the tax on a $40 purchase in every city.",
  alternates: { canonical: `${brand.url}/out-the-door` },
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

type Row = { deal_id: string; deal_title: string | null; category: string | null; city: string | null; name: string | null; slug: string | null; listing_slug: string | null };

async function getDeals(): Promise<Row[]> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=deal_id,deal_title,category,city,name,slug,listing_slug&limit=1000`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, next: { revalidate: 900 } }
    );
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default async function OutTheDoorPage() {
  const deals = await getDeals();
  const priced: { d: Row; o: Otd }[] = [];
  for (const raw of deals) {
    const d = { ...raw, deal_title: cleanDealTitle(raw.deal_title) };
    const o = otdFor(d);
    if (o) priced.push({ d, o });
  }
  const groups = (["flower", "preroll", "vape", "concentrate", "edible"] as const)
    .map((k) => {
      const sorted = priced.filter((x) => x.o.kind === k).sort((a, b) => (a.o.each ?? a.o.total) - (b.o.each ?? b.o.total));
      // Up to STORE_CAP.cityList per store per group so one long specials page can't fill it.
      const capped = capPerStore(sorted, STORE_CAP.cityList, (x) => String(x.d.listing_slug || x.d.slug || "").toLowerCase());
      return { k, rows: capped.kept, overflow: capped.overflow.map((o) => {
        const first = sorted.find((x) => String(x.d.listing_slug || x.d.slug || "").toLowerCase() === o.key)!.d;
        return { ...o, slug: String(first.slug || first.listing_slug), name: storeName(first), city: first.city };
      }) };
    })
    .filter((g) => g.rows.length);
  const eighth = CITY_TAX_RATES.map((r) => ({ city: r.city, slug: r.slug, f: calculateOutTheDoor(40, "flower", r).outTheDoor, c: calculateOutTheDoor(40, "concentrate", r).outTheDoor, e: calculateOutTheDoor(40, "edible", r).outTheDoor, rates: cityTaxRates(r.city)! }))
    .sort((a, b) => a.f - b.f);
  const low = eighth[0], high = eighth[eighth.length - 1];

  const faq = [
    {
      q: "How much is cannabis tax in Central Illinois?",
      a: `On flower under 35% THC it's about ${pct(low.rates.flower)} to ${pct(high.rates.flower)} of the shelf price, depending on the city. Vapes and concentrates run about ${pct(Math.min(...eighth.map((x) => x.rates.concentrate)))} to ${pct(Math.max(...eighth.map((x) => x.rates.concentrate)))}; edibles about ${pct(Math.min(...eighth.map((x) => x.rates.edible)))} to ${pct(Math.max(...eighth.map((x) => x.rates.edible)))}. Medical patients pay 1%.`,
    },
    {
      q: "What does a $40 eighth cost out the door?",
      a: `${usd(Math.round(low.f * 100) / 100)} in ${low.city} and ${usd(Math.round(high.f * 100) / 100)} in ${high.city}, for flower under 35% THC.`,
    },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <GuideShell
      crumbs={[{ href: "/illinois-cannabis-tax", label: "Illinois cannabis tax" }]}
      eyebrow="Out the door · tax included"
      title="What today's deals really cost at the register"
      lede={
        <>
          Illinois cannabis tax adds about a quarter to almost half of the shelf price, so the sticker isn&apos;t what you pay.
          Here&apos;s every deal we found this morning that states a real price, with the tax already added for that store&apos;s city.
        </>
      }
      jsonLd={jsonLd}
    >
      <style>{`
        .otp-kind{margin-top:30px}
        .otp-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 14px;align-items:center;padding:13px 14px;border-top:1px solid var(--pp-border);color:inherit;text-decoration:none}
        .otp-row:first-child{border-top:none}
        a.otp-row:hover{background:var(--pp-paper)}
        .otp-t{font-weight:600}
        .otp-s{font-size:.82rem;color:var(--pp-muted)}
        .otp-r{text-align:right;display:flex;flex-direction:column;align-items:flex-end}
        .otp-r b{font-family:var(--font-mono);font-weight:500;font-size:1.15rem;letter-spacing:-.02em}
        .otp-r span{font-size:.78rem;color:var(--pp-muted)}
        .otp-table{width:100%;border-collapse:collapse;font-size:.92rem}
        .otp-table th,.otp-table td{padding:10px 8px;border-bottom:1px solid var(--pp-border);text-align:right}
        .otp-table th:first-child,.otp-table td:first-child{text-align:left}
        .otp-table th{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--pp-muted);font-weight:600}
        .otp-table td{font-family:var(--font-mono);font-weight:500}
        .otp-table td:first-child{font-family:var(--font-body);font-weight:600}
        .otp-table td small{display:block;font-size:.72rem;color:var(--pp-muted);font-weight:400}
      `}</style>

      {groups.length === 0 ? (
        <p className="gp-p" style={{ marginTop: 22 }}>
          No deal this morning states a single price we can add tax to. Most are percent-off deals; the table below shows what tax adds in each city.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.k} className="otp-kind">
            <h2 className="gp-h2">{KIND_LABEL[g.k]}</h2>
            <div className="gp-list">
              {g.rows.map(({ d, o }) => (
                <Link key={d.deal_id} href={`/deal/${d.deal_id}`} className="otp-row">
                  <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span className="otp-t">{d.deal_title}</span>
                    <span className="otp-s">{storeName(d)}{d.city && !storeName(d).toLowerCase().includes(d.city.toLowerCase()) ? ` · ${d.city}` : ""} · {usd(o.shelf)} on the shelf</span>
                  </span>
                  <span className="otp-r">
                    <b>{usd(o.total)}</b>
                    <span>{o.each ? `${usd(o.each)} each` : `+${pct(o.rate)} tax`}</span>
                  </span>
                </Link>
              ))}
            </div>
            <StoreOverflowLinks stores={g.overflow} note={false} />
          </section>
        ))
      )}

      <h2 className="gp-h2" style={{ marginTop: 40 }}>What $40 on the shelf costs, city by city</h2>
      <p className="gp-note">Cheapest city first. Flower means under 35% THC; vapes and concentrates are taxed at the higher rate.</p>
      <div style={{ overflowX: "auto", border: "1px solid var(--pp-border)", borderRadius: 14, background: "var(--pp-surface)" }}>
        <table className="otp-table" style={{ minWidth: 520 }}>
          <thead>
            <tr><th>City</th><th>Flower</th><th>Vapes &amp; concentrates</th><th>Edibles</th></tr>
          </thead>
          <tbody>
            {eighth.map((r) => (
              <tr key={r.slug}>
                <td><Link href={`/city/${r.slug}`} style={{ color: "inherit" }}>{r.city}</Link></td>
                <td>{usd(Math.round(r.f * 100) / 100)}<small>+{pct(r.rates.flower)}</small></td>
                <td>{usd(Math.round(r.c * 100) / 100)}<small>+{pct(r.rates.concentrate)}</small></td>
                <td>{usd(Math.round(r.e * 100) / 100)}<small>+{pct(r.rates.edible)}</small></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="gp-h2" style={{ marginTop: 36 }}>How we figure it</h2>
      <p className="gp-p">
        We take the price the store posts, add Illinois&apos; cannabis excise for that kind of product (10% flower and pre-rolls,
        20% edibles, 25% vapes and concentrates), then state sales tax plus the city and county cannabis and sales taxes on top,
        the way the Illinois Department of Revenue stacks them. Rates last checked {TAX_RATES_LAST_UPDATED}. Percent-off deals don&apos;t post a shelf
        price, so they aren&apos;t on this list, and we never guess one.
      </p>
      <p className="gp-note">
        Medical card holders pay 1% instead. Infused pre-rolls and flower above 35% THC are taxed at 25%. The counter always has the final word.{" "}
        <Link href="/illinois-cannabis-tax-calculator">Try any price in the calculator →</Link>
      </p>
      {faq.map((f) => (
        <div key={f.q} style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: "1rem", margin: "0 0 4px" }}>{f.q}</h3>
          <p className="gp-p" style={{ color: "var(--pp-body)" }}>{f.a}</p>
        </div>
      ))}
    </GuideShell>
  );
}
