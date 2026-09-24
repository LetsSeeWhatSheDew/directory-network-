// app/ways-to-buy/page.tsx — every Central IL store, every way to buy, side by side.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import StoreAvatar from "../components/StoreAvatar";
import { brand } from "../../lib/brand";
import { storeImageUrl } from "../../lib/storeImage";
import { getRegionStores, getFeatureRows, featuresBySlug, getClosingTonight, type Feature } from "../../lib/waysToBuy";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Ways to Buy Cannabis in Central Illinois — Drive-Thru, Medical, Order Ahead",
  description:
    "Every Central Illinois dispensary side by side: who has drive-thru, who sells medical, who lets you order ahead or pick up curbside, and who's open latest tonight. Checked on each store's own site.",
  alternates: { canonical: `${brand.url}/ways-to-buy` },
};

const COLS: { f: Feature; label: string }[] = [
  { f: "drive_thru", label: "Drive-thru" },
  { f: "medical", label: "Medical" },
  { f: "order_ahead", label: "Order ahead" },
  { f: "curbside", label: "Curbside" },
];

export default async function WaysToBuyPage() {
  const [stores, rows] = await Promise.all([getRegionStores(), getFeatureRows()]);
  const F = featuresBySlug(rows);
  const tonight = await getClosingTonight(stores);
  const count = (f: Feature) => rows.filter((r) => r.feature === f && r.status === "yes").length;
  const latest = tonight.find((t) => t.closesAt);

  return (
    <GuideShell
      eyebrow="Ways to buy · Central Illinois"
      title="Every way to buy, side by side"
      lede={<>Drive-thru, medical, order ahead, curbside, open late — what each Central Illinois store actually offers, checked on the store&apos;s own site. A check mark means we found it in writing; a dash means we haven&apos;t confirmed it yet.</>}
    >
      <div className="gp-grid" style={{ marginTop: 22 }}>
        <Link href="/drive-thru" className="gp-card gp-hero-card">
          <b>Drive-thru</b>
          <span>Legal in Illinois since June 12, 2026. {count("drive_thru") > 0 ? `${count("drive_thru")} open in Central IL.` : "None open in Central IL yet — we'll list the first one the day it opens."}</span>
        </Link>
        <Link href="/open-late" className="gp-card">
          <b>Open latest tonight</b>
          <span className="gp-big">{latest ? latest.closesLabel.replace("Open until ", "") : "—"}</span>
          <span>{latest ? `${latest.store.name} · ${latest.store.city}` : "Hours not listed yet"}</span>
        </Link>
        <Link href="/medical" className="gp-card">
          <b>Medical</b>
          <span className="gp-big">{count("medical")}</span>
          <span>stores confirmed selling medical (1% state tax with a card)</span>
        </Link>
        <Link href="#compare" className="gp-card">
          <b>Order ahead · Curbside</b>
          <span className="gp-big">{count("order_ahead")} · {count("curbside")}</span>
          <span>stores confirmed for online pre-order · curbside pickup</span>
        </Link>
        <Link href="/illinois-cannabis-delivery" className="gp-card">
          <b>Delivery</b>
          <span>Not legal in Illinois yet. See where the bills stand and get told the day it changes.</span>
        </Link>
      </div>

      <h2 className="gp-h2" id="compare">Compare every store</h2>
      <p className="pp-swipe-hint">Swipe the table sideways to see every column →</p>
      <div style={{ overflowX: "auto", border: "1px solid var(--pp-border)", borderRadius: 14, background: "var(--pp-surface)" }}>
        <table className="gp-table" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th>Store</th>
              {COLS.map((c) => <th key={c.f} style={{ textAlign: "center" }}>{c.label}</th>)}
              <th style={{ textAlign: "right" }}>Tonight</th>
            </tr>
          </thead>
          <tbody>
            {tonight.map(({ store: s, closesLabel }) => {
              const f = F.get(s.slug) || {};
              return (
                <tr key={s.slug}>
                  <td>
                    <Link href={`/dispensary/${s.slug}`} style={{ display: "flex", alignItems: "center", gap: 10, color: "inherit", textDecoration: "none" }}>
                      <StoreAvatar src={storeImageUrl(s.logo_url, s.slug)} name={s.name} size={30} />
                      <span><b style={{ fontWeight: 600 }}>{s.name}</b><br /><span className="gp-row-sub">{s.city}</span></span>
                    </Link>
                  </td>
                  {COLS.map((c) => {
                    const r = f[c.f];
                    return (
                      <td key={c.f} style={{ textAlign: "center" }} title={r ? r.evidence : "Not confirmed yet"}>
                        {r?.status === "yes" ? <span className="gp-pill">✓</span> : r?.status === "announced" ? <span className="gp-pill muted">Coming</span> : r?.status === "no" ? <span className="gp-src">No</span> : <span className="gp-src">—</span>}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: ".85rem" }}>{closesLabel.replace("Open until ", "til ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="gp-note">
        Every ✓ links back to the store&apos;s own wording on its page — open any store to see the exact quote and source. Run a store and see something wrong or missing? Tell us from the store&apos;s page and we&apos;ll re-check it.
      </p>
    </GuideShell>
  );
}
