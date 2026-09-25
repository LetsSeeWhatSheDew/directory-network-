// app/for-dispensaries/[slug]/page.tsx — one store's public deal report.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GuideShell from "../../components/GuideShell";
import { brand } from "../../../lib/brand";
import { getRegionStores, getFeatureRows, FEATURE_LABEL, type Feature } from "../../../lib/waysToBuy";
import { getDealIndex } from "../../../lib/dealIndex";

export const revalidate = 3600;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: "Store deal report | PuffPrice", robots: { index: false, follow: true }, alternates: { canonical: `${brand.url}/for-dispensaries/${slug}` } };
}

type Obs = { deal_id: string; event: string; observed_day: string; title: string | null; discount_pct: number | null };

export default async function StoreReport({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stores = await getRegionStores();
  const store = stores.find((s) => s.slug === slug);
  if (!store) notFound();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [obsRes, liveRes, features, index] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/deal_observations?select=deal_id,event,observed_day,title,discount_pct&project_tag=eq.green&listing_slug=eq.${slug}&observed_day=gte.${since}&limit=2000`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, next: { revalidate: 3600 } }),
    fetch(`${SUPABASE_URL}/rest/v1/deals?select=id,title,discount_value,discount_unit,verified_at&project_tag=eq.green&is_active=eq.true&listing_slug=eq.${slug}`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, next: { revalidate: 3600 } }),
    getFeatureRows(),
    getDealIndex(),
  ]);
  const obs: Obs[] = obsRes.ok ? await obsRes.json() : [];
  const live: Array<{ id: string; title: string; discount_value: number | null; discount_unit: string | null; verified_at: string | null }> = liveRes.ok ? await liveRes.json() : [];
  const distinct = new Map<string, Obs>();
  for (const o of obs) if (o.deal_id) distinct.set(o.deal_id, o);
  const pcts = live.filter((d) => d.discount_unit === "percent" && d.discount_value).map((d) => Number(d.discount_value));
  const myAvg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
  const cityRow = index.latest.find((c) => c.city === store.city);
  const mine = features.filter((f) => f.listing_slug === slug);
  const all: Feature[] = ["drive_thru", "medical", "order_ahead", "curbside"];
  const missing = all.filter((f) => !mine.some((m) => m.feature === f));

  return (
    <GuideShell
      crumbs={[{ href: "/for-dispensaries", label: "For dispensaries" }]}
      eyebrow={`Store report · ${store.city}`}
      title={store.name}
      lede={<>What PuffPrice shoppers see for your store, from our daily checks of your own site. <Link href={`/dispensary/${slug}`}>See your public page →</Link> · <Link href={`/for-dispensaries/${slug}/card`}>Print counter card →</Link></>}
    >
      <div className="gp-grid" style={{ marginTop: 22 }}>
        <div className="gp-card"><span>Deals live now</span><span className="gp-big">{live.length}</span><span>{cityRow ? `${store.city} total: ${cityRow.deals_live} across ${cityRow.stores_with_deals} stores` : ""}</span></div>
        <div className="gp-card"><span>Your avg. % off</span><span className="gp-big">{myAvg != null ? `${myAvg}%` : "—"}</span><span>{cityRow?.avg_discount_pct != null ? `${store.city} average: ${cityRow.avg_discount_pct}%` : ""}</span></div>
        <div className="gp-card"><span>Deals seen, last 30 days</span><span className="gp-big">{distinct.size}</span><span>from our daily log</span></div>
      </div>

      <h2 className="gp-h2">Live deals we found on your site</h2>
      {live.length ? (
        <div className="gp-list">
          {live.map((d) => (
            <div key={d.id} className="gp-row"><span className="gp-row-main"><span className="gp-row-title">{d.title}</span><span className="gp-row-sub">{d.verified_at ? `Verified ${new Date(d.verified_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" })}` : ""}</span></span></div>
          ))}
        </div>
      ) : (
        <p className="gp-p">None right now. If you&apos;re running deals, they may be inside a menu we can&apos;t read yet — send us the link and we&apos;ll add it.</p>
      )}

      <h2 className="gp-h2">Counter card</h2>
      <p className="gp-p">A free 4×6 card for your register: &ldquo;Compare today&apos;s deals in {store.city}&rdquo; with a code that opens your PuffPrice page. Prints two to a letter sheet.</p>
      <p className="gp-p"><Link href={`/for-dispensaries/${slug}/card`} style={{ fontWeight: 700, color: "var(--pp-signal-ink)" }}>Print counter card →</Link></p>

      <h2 className="gp-h2">Ways to buy we confirmed</h2>
      {mine.length ? (
        <ul className="gp-p" style={{ paddingLeft: 18 }}>
          {mine.map((m) => <li key={m.feature}><b>{FEATURE_LABEL[m.feature]}</b> — {m.status === "no" ? "not offered" : m.evidence} (<a href={m.source_url} target="_blank" rel="nofollow noopener noreferrer">source</a>)</li>)}
        </ul>
      ) : <p className="gp-p">Nothing confirmed yet.</p>}
      {missing.length > 0 && <p className="gp-note">Couldn&apos;t confirm on your site: {missing.map((m) => FEATURE_LABEL[m]).join(", ")}. If you offer any of these, put it on your store page and <Link href="/claim">tell us</Link>.</p>}
    </GuideShell>
  );
}
