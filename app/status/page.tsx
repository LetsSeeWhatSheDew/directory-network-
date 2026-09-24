// app/status/page.tsx — "Is PuffPrice up to date?" Every Central Illinois
// store, when we last saw a deal on its own site, how we read it, and what's
// live now. The banner tells the truth about freshness: if the morning check
// didn't run, this page says so. Data: master_listings, the live deals view,
// and deal_observations (the daily log). No invented timestamps.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import StoreAvatar from "../components/StoreAvatar";
import { brand } from "../../lib/brand";
import { storeImageUrl } from "../../lib/storeImage";
import { getRegionStores } from "../../lib/waysToBuy";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Status: Is PuffPrice Up to Date?",
  description:
    "When PuffPrice last checked each Central Illinois dispensary's own website for deals, how it reads each store, and how many deals are live right now.",
  alternates: { canonical: `${brand.url}/status` },
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";
const H = { apikey: ANON, Authorization: `Bearer ${ANON}` };

async function j<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: H, next: { revalidate: 600 } });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

function ago(iso: string): string {
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 1) return "under an hour ago";
  if (h < 36) return `${Math.round(h)} hour${Math.round(h) === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export default async function StatusPage() {
  const [stores, live, obs] = await Promise.all([
    getRegionStores(),
    j<{ slug: string | null; listing_slug: string | null; source: string | null; verified_at: string | null }[]>(
      "active_deals_with_listings?select=slug,listing_slug,source,verified_at&limit=400"
    ),
    j<{ listing_slug: string; observed_at: string }[]>("deal_observations?select=listing_slug,observed_at&project_tag=eq.green&order=observed_at.desc&limit=2000"),
  ]);

  const lastSeen = new Map<string, string>();
  for (const o of obs || []) if (!lastSeen.has(o.listing_slug)) lastSeen.set(o.listing_slug, o.observed_at);
  const liveBy = new Map<string, { n: number; rendered: boolean; site: boolean; verified: string | null }>();
  for (const d of live || []) {
    const k = String(d.slug || d.listing_slug);
    const cur = liveBy.get(k) || { n: 0, rendered: false, site: false, verified: null };
    cur.n += 1;
    if (d.source === "website_rendered") cur.rendered = true;
    if (d.source === "website") cur.site = true;
    if (d.verified_at && (!cur.verified || d.verified_at > cur.verified)) cur.verified = d.verified_at;
    liveBy.set(k, cur);
  }

  const latest = [...(obs || []).map((o) => o.observed_at), ...(live || []).map((d) => d.verified_at || "")].filter(Boolean).sort().pop() || null;
  const hours = latest ? (Date.now() - new Date(latest).getTime()) / 3600000 : null;
  const fresh = hours != null && hours <= 30;
  const liveCount = (live || []).length;
  const withDeals = stores.filter((s) => liveBy.has(s.slug)).length;

  const rows = stores
    .map((s) => {
      const l = liveBy.get(s.slug);
      const seen = [lastSeen.get(s.slug), l?.verified].filter(Boolean).sort().pop() || null;
      return { s, l, seen };
    })
    .sort((a, b) => (b.l?.n || 0) - (a.l?.n || 0) || String(b.seen || "").localeCompare(String(a.seen || "")));

  return (
    <GuideShell
      crumbs={[{ href: "/how-we-rank", label: "How we rank" }]}
      eyebrow="Status · how fresh is this"
      title="Is PuffPrice up to date?"
      lede={<>Every morning we check each Central Illinois store&apos;s own website for deals. Here&apos;s when we last saw one at each store, how we read its site, and what&apos;s live right now. If a check didn&apos;t run, this page says so.</>}
    >
      <style>{`
        .st-banner{display:flex;align-items:center;gap:14px;margin:22px 0 8px;padding:16px 18px;border-radius:20px;background:var(--pp-haze);border:1px solid var(--pp-haze-border)}
        .st-dot{flex:0 0 auto;width:12px;height:12px;border-radius:50%;background:var(--pp-mark);box-shadow:0 0 0 6px color-mix(in srgb, var(--pp-mark) 16%, transparent)}
        .st-dot.late{background:var(--pp-note-edge);box-shadow:0 0 0 6px color-mix(in srgb, var(--pp-note-edge) 20%, transparent)}
        @media (prefers-reduced-motion: no-preference){.st-dot{animation:pp-breath var(--breath) ease-in-out infinite}}
        .st-banner b{display:block;font-family:var(--font-breath);font-weight:400;font-size:1.45rem;line-height:1.1;color:var(--pp-ink)}
        .st-banner span{font-size:.9rem;color:var(--pp-body)}
        .st-nums{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0 6px}
        .st-nums div{padding:12px 14px;border:1px solid var(--pp-border);border-radius:16px;background:var(--pp-surface)}
        .st-nums b{display:block;font-family:var(--font-mono);font-weight:500;font-size:1.6rem;color:var(--pp-ink)}
        .st-nums span{font-size:.78rem;color:var(--pp-muted)}
        .st-how{font-size:.78rem;color:var(--pp-muted)}
      `}</style>

      <div className="st-banner" role="status">
        <span className={`st-dot${fresh ? "" : " late"}`} aria-hidden="true" />
        <div>
          <b>{latest == null ? "We couldn't read the check log just now." : fresh ? "Up to date." : "Running behind."}</b>
          <span>
            {latest == null
              ? "Try again in a minute. Deals on the site are still the ones we last confirmed."
              : fresh
              ? `Last check found deals ${ago(latest)} (${fmt(latest)} CT).`
              : `The last check that found deals was ${ago(latest)} (${fmt(latest)} CT). Deals may have changed since; the counter always has the final word.`}
          </span>
        </div>
      </div>

      <div className="st-nums">
        <div><b>{live ? liveCount : "—"}</b><span>deals live now</span></div>
        <div><b>{stores.length}</b><span>stores we check</span></div>
        <div><b>{live ? withDeals : "—"}</b><span>with a deal today</span></div>
      </div>

      <h2 className="gp-h2">Every store</h2>
      <div className="gp-list">
        {rows.map(({ s, l, seen }) => (
          <Link key={s.slug} href={`/dispensary/${s.slug}`} className="gp-row">
            <StoreAvatar src={storeImageUrl(s.logo_url, s.slug)} name={s.name} size={40} />
            <span className="gp-row-main">
              <span className="gp-row-title">{s.name}</span>
              <span className="gp-row-sub">
                {s.city} · {seen ? `last deal seen ${ago(seen)}` : "no deal seen in our log yet"}
              </span>
              <span className="st-how">
                {l?.rendered ? "Read with a real browser (menu loads with JavaScript)" : l?.site ? "Read from the store's own site" : "Checked daily on the store's own site"}
              </span>
            </span>
            <span className="gp-row-right" style={{ color: l ? "var(--pp-ink)" : "var(--pp-muted)" }}>
              {l ? `${l.n} live` : "none today"}
            </span>
          </Link>
        ))}
      </div>

      <h2 className="gp-h2">How the check works</h2>
      <p className="gp-p">
        Every morning our checker visits each store&apos;s own website, never an aggregator. Stores whose menus load with JavaScript are read with a
        real browser. A deal that disappears from the store&apos;s site comes off PuffPrice at the next check. Nobody pays to be checked, listed or ranked.
      </p>
      <p className="gp-note">
        See a deal that&apos;s wrong? Tap &ldquo;Was this deal right?&rdquo; on any deal, or read <Link href="/how-we-rank">how we rank</Link>.
      </p>
    </GuideShell>
  );
}
