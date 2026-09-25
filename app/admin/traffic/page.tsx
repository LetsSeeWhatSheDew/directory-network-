// app/admin/traffic/page.tsx — first-party traffic, last 30 days.
// Gated by middleware (/admin/:path*). Reads `events` with the service key
// and aggregates in memory; see lib/traffic.ts.
import type { Metadata } from "next";
import Link from "next/link";
import { getRecentEvents, type EventRow } from "../../../lib/traffic";
import { COUNTING_SINCE_LABEL } from "../../../lib/analyticsDb";

export const metadata: Metadata = { title: "Admin · Traffic", robots: "noindex, nofollow" };
export const dynamic = "force-dynamic";

const VIEW = new Set(["store_view", "deal_view"]);
const TAP = new Set(["directions_tap", "call_tap", "website_tap", "order_tap", "deal_tap"]);

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" });
const dayKey = (iso: string) => dayFmt.format(new Date(iso));

type Day = { views: number; taps: number; qr: number; other: number; vids: Set<string> };
type Store = { views: number; directions: number; calls: number; web: number; dealTaps: number; qr: number; vids: Set<string> };

function aggregate(rows: EventRow[]) {
  const days = new Map<string, Day>();
  const stores = new Map<string, Store>();
  const refs = new Map<string, number>();
  const qr = new Map<string, number>();
  const types = new Map<string, number>();
  const allVids = new Set<string>();

  // Pre-fill 30 days so quiet days show as zero rows.
  for (let i = 29; i >= 0; i--) days.set(dayKey(new Date(Date.now() - i * 86400000).toISOString()), { views: 0, taps: 0, qr: 0, other: 0, vids: new Set() });

  for (const r of rows) {
    const t = r.event_type;
    const m = r.metadata || {};
    types.set(t, (types.get(t) || 0) + 1);
    const vid = m.vid || null;
    if (vid) allVids.add(vid);

    const k = dayKey(r.created_at);
    const d = days.get(k) || { views: 0, taps: 0, qr: 0, other: 0, vids: new Set<string>() };
    if (VIEW.has(t)) d.views++;
    else if (TAP.has(t)) d.taps++;
    else if (t === "qr_scan") d.qr++;
    else d.other++;
    if (vid) d.vids.add(vid);
    days.set(k, d);

    if (r.listing_id) {
      const s = stores.get(r.listing_id) || { views: 0, directions: 0, calls: 0, web: 0, dealTaps: 0, qr: 0, vids: new Set<string>() };
      if (VIEW.has(t)) s.views++;
      if (t === "directions_tap") s.directions++;
      if (t === "call_tap") s.calls++;
      if (t === "website_tap" || t === "order_tap") s.web++;
      if (t === "deal_tap") s.dealTaps++;
      if (t === "qr_scan") s.qr++;
      if (vid && VIEW.has(t)) s.vids.add(vid);
      stores.set(r.listing_id, s);
    }

    if (m.ref_host && VIEW.has(t)) refs.set(m.ref_host, (refs.get(m.ref_host) || 0) + 1);
    if (t === "qr_scan") {
      const c = m.utm_campaign || "(none)";
      qr.set(c, (qr.get(c) || 0) + 1);
    }
  }
  return { days, stores, refs, qr, types, allVids };
}

const th: React.CSSProperties = { textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--pp-border)", fontSize: ".78rem", color: "var(--pp-muted)", fontWeight: 600 };
const td: React.CSSProperties = { padding: "6px 10px", borderBottom: "1px solid var(--pp-border)", fontSize: ".88rem" };
const num: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "var(--font-mono)" };
const h2: React.CSSProperties = { margin: "28px 0 8px", fontSize: "1.1rem" };

export default async function AdminTrafficPage() {
  const res = await getRecentEvents(30);
  if (!res) {
    return (
      <main className="pp-container-detail" style={{ padding: "32px 16px" }}>
        <Link href="/admin" style={{ fontSize: ".85rem" }}>← Admin</Link>
        <h1 style={{ margin: "12px 0 4px" }}>Traffic</h1>
        <p>Couldn&apos;t read the events table. Check that SUPABASE_SERVICE_ROLE_KEY is set for this environment.</p>
      </main>
    );
  }
  const { rows, truncated } = res;
  const { days, stores, refs, qr, types, allVids } = aggregate(rows);
  const dayList = [...days.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  const topViews = [...stores.entries()].sort((a, b) => b[1].views - a[1].views).slice(0, 20);
  const tapsOf = (s: Store) => s.directions + s.calls + s.web + s.dealTaps;
  const topTaps = [...stores.entries()].filter(([, s]) => tapsOf(s) > 0).sort((a, b) => tapsOf(b[1]) - tapsOf(a[1])).slice(0, 20);
  const topRefs = [...refs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  const qrList = [...qr.entries()].sort((a, b) => b[1] - a[1]);
  const typeList = [...types.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <main className="pp-container-detail" style={{ padding: "32px 16px" }}>
      <Link href="/admin" style={{ fontSize: ".85rem" }}>← Admin</Link>
      <h1 style={{ margin: "12px 0 4px" }}>Traffic, last 30 days</h1>
      <p style={{ color: "var(--pp-muted)", marginBottom: 12 }}>
        First-party counts from <code>events</code> (counting since {COUNTING_SINCE_LABEL}). {rows.length.toLocaleString("en-US")} events, {allVids.size.toLocaleString("en-US")} unique browsers.
        {truncated ? " Showing the most recent 50,000 events only." : ""} Days are Central time.
      </p>
      {typeList.length > 0 && (
        <p style={{ fontSize: ".85rem", color: "var(--pp-body)" }}>
          {typeList.map(([t, n]) => `${t} ${n}`).join(" · ")}
        </p>
      )}

      <h2 style={h2}>By day</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr><th style={th}>Day</th><th style={{ ...th, textAlign: "right" }}>Views</th><th style={{ ...th, textAlign: "right" }}>Taps</th><th style={{ ...th, textAlign: "right" }}>QR scans</th><th style={{ ...th, textAlign: "right" }}>Other</th><th style={{ ...th, textAlign: "right" }}>Unique</th></tr></thead>
          <tbody>
            {dayList.map(([k, d]) => (
              <tr key={k}><td style={td}>{k}</td><td style={num}>{d.views}</td><td style={num}>{d.taps}</td><td style={num}>{d.qr}</td><td style={num}>{d.other}</td><td style={num}>{d.vids.size}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={h2}>Top stores by views</h2>
      {topViews.length ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead><tr><th style={th}>Store</th><th style={{ ...th, textAlign: "right" }}>Views</th><th style={{ ...th, textAlign: "right" }}>Unique</th><th style={{ ...th, textAlign: "right" }}>QR</th></tr></thead>
            <tbody>
              {topViews.map(([slug, s]) => (
                <tr key={slug}><td style={td}><Link href={`/for-dispensaries/${slug}`}>{slug}</Link></td><td style={num}>{s.views}</td><td style={num}>{s.vids.size}</td><td style={num}>{s.qr}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p>No store events yet.</p>}

      <h2 style={h2}>Top stores by taps</h2>
      {topTaps.length ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead><tr><th style={th}>Store</th><th style={{ ...th, textAlign: "right" }}>Directions</th><th style={{ ...th, textAlign: "right" }}>Call</th><th style={{ ...th, textAlign: "right" }}>Web/order</th><th style={{ ...th, textAlign: "right" }}>Deal taps</th><th style={{ ...th, textAlign: "right" }}>Total</th></tr></thead>
            <tbody>
              {topTaps.map(([slug, s]) => (
                <tr key={slug}><td style={td}>{slug}</td><td style={num}>{s.directions}</td><td style={num}>{s.calls}</td><td style={num}>{s.web}</td><td style={num}>{s.dealTaps}</td><td style={num}>{tapsOf(s)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p>No taps yet.</p>}

      <h2 style={h2}>Top referrers (page views)</h2>
      {topRefs.length ? (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr><th style={th}>Host</th><th style={{ ...th, textAlign: "right" }}>Views</th></tr></thead>
          <tbody>{topRefs.map(([h, n]) => <tr key={h}><td style={td}>{h}</td><td style={num}>{n}</td></tr>)}</tbody>
        </table>
      ) : <p>No external referrers yet.</p>}

      <h2 style={h2}>QR scans by campaign</h2>
      {qrList.length ? (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr><th style={th}>utm_campaign</th><th style={{ ...th, textAlign: "right" }}>Scans</th></tr></thead>
          <tbody>{qrList.map(([c, n]) => <tr key={c}><td style={td}>{c}</td><td style={num}>{n}</td></tr>)}</tbody>
        </table>
      ) : <p>No counter card scans yet.</p>}
    </main>
  );
}
