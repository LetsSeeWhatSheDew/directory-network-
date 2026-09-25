// app/on-the-way/page.tsx — best deal on your route. Pick where you're
// starting and where you're headed; we list the Central Illinois towns you
// pass through (within ~12 miles of the straight line between them) in the
// order you reach them, with the best everyday deals at each stop.
// Plain GET form: works with no JavaScript. Real deals only.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import OtdLine from "../components/OtdLine";
import { brand } from "../../lib/brand";
import { amountOf, isConditional, needsQuantity, saveLabel, storeName, cleanDealTitle, directionsHref, type ExDeal } from "../../lib/exhale";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Best Dispensary Deal on Your Route: Peoria, Bloomington-Normal, Champaign, Springfield",
  description:
    "Driving between Peoria, Pekin, Bloomington-Normal, Champaign-Urbana and Springfield? See the best dispensary deals in each town you pass, in the order you reach them.",
  alternates: { canonical: `${brand.url}/on-the-way` },
};

// City centers (approximate downtown coordinates).
const TOWNS: { slug: string; name: string; lat: number; lng: number; group: string[] }[] = [
  { slug: "peoria", name: "Peoria", lat: 40.6936, lng: -89.589, group: ["Peoria", "Peoria Heights"] },
  { slug: "east-peoria", name: "East Peoria", lat: 40.6662, lng: -89.5801, group: ["East Peoria"] },
  { slug: "pekin", name: "Pekin", lat: 40.5675, lng: -89.6407, group: ["Pekin"] },
  { slug: "bloomington-normal", name: "Bloomington-Normal", lat: 40.4995, lng: -88.992, group: ["Bloomington", "Normal"] },
  { slug: "champaign-urbana", name: "Champaign-Urbana", lat: 40.1135, lng: -88.2254, group: ["Champaign", "Urbana"] },
  { slug: "springfield", name: "Springfield", lat: 39.7817, lng: -89.6501, group: ["Springfield"] },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

type Deal = ExDeal & { deal_id: string };

async function getDeals(): Promise<Deal[]> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=deal_id,deal_title,category,city,name,slug,listing_slug,discount_value,discount_unit,discount_type,lat,lng&order=discount_value.desc.nullslast&limit=1000`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, next: { revalidate: 900 } }
    );
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

// The main roads between the towns, with approximate driving miles
// (I-74 Peoria–Bloomington–Champaign, I-474/I-155 through Pekin, I-55 and
// I-72 to Springfield, IL-9 Pekin–Bloomington). Shortest road path wins.
const ROADS: [string, string, number][] = [
  ["peoria", "east-peoria", 3], ["peoria", "pekin", 11], ["east-peoria", "pekin", 10],
  ["east-peoria", "bloomington-normal", 36], ["pekin", "bloomington-normal", 38],
  ["bloomington-normal", "champaign-urbana", 50], ["pekin", "springfield", 60],
  ["bloomington-normal", "springfield", 65], ["champaign-urbana", "springfield", 86],
];

function path(from: string, to: string): { slug: string; mile: number }[] {
  const dist: Record<string, number> = { [from]: 0 };
  const prev: Record<string, string | null> = { [from]: null };
  const todo = new Set(TOWNS.map((t) => t.slug));
  while (todo.size) {
    let u: string | null = null;
    for (const s of todo) if (dist[s] != null && (u == null || dist[s] < dist[u])) u = s;
    if (u == null) break;
    todo.delete(u);
    if (u === to) break;
    for (const [a, b, m] of ROADS) {
      const v = a === u ? b : b === u ? a : null;
      if (!v || !todo.has(v)) continue;
      if (dist[v] == null || dist[u] + m < dist[v]) { dist[v] = dist[u] + m; prev[v] = u; }
    }
  }
  const out: { slug: string; mile: number }[] = [];
  for (let s: string | null = to; s; s = prev[s] ?? null) out.unshift({ slug: s, mile: dist[s] ?? 0 });
  return out;
}

export default async function OnTheWayPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const from = TOWNS.find((t) => t.slug === sp.from) || TOWNS[0];
  let to = TOWNS.find((t) => t.slug === sp.to) || TOWNS[3];
  if (to.slug === from.slug) to = TOWNS.find((t) => t.slug !== from.slug)!;
  const deals = await getDeals();
  const route = path(from.slug, to.slug);
  const total = route[route.length - 1]?.mile ?? 0;

  const stops = route
    .map(({ slug, mile }) => ({ t: TOWNS.find((x) => x.slug === slug)!, mile }))
    .map(({ t, mile }) => {
      const here = deals.filter((d) => t.group.includes(String(d.city || "")));
      const best = here
        .filter((d) => amountOf(d) && !isConditional(d))
        .sort((a, b) => (needsQuantity(a) ? 1 : 0) - (needsQuantity(b) ? 1 : 0) || amountOf(b)!.value - amountOf(a)!.value);
      const seen = new Set<string>();
      const top = best.filter((d) => { const k = String(d.slug || d.listing_slug); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 3);
      const priced = here.filter((d) => !amountOf(d)).slice(0, 1);
      return { t, mile, count: here.length, top, priced };
    });

  const sel = { padding: "12px 14px", borderRadius: 14, border: "1px solid var(--pp-border)", background: "var(--pp-surface)", color: "var(--pp-ink)", fontSize: 16, minWidth: 0, flex: "1 1 140px" } as const;

  return (
    <GuideShell
      crumbs={[{ href: "/ways-to-buy", label: "Ways to buy" }]}
      eyebrow="On the way · best deal on your route"
      title="Driving somewhere? Stop where it's cheapest."
      lede={<>Pick where you&apos;re starting and where you&apos;re headed. Here are the towns you pass through, in the order you reach them, with the best deals at each stop this morning.</>}
    >
      <style>{`
        .otw-form{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:20px 0 6px;padding:14px;border-radius:20px;background:var(--pp-haze);border:1px solid var(--pp-haze-border)}
        .otw-form span{font-size:.9rem;color:var(--pp-muted)}
        .otw-go{padding:12px 20px;border-radius:14px;border:1px solid var(--pp-btn-border);background:var(--pp-btn);color:var(--pp-btn-fg);font-weight:600;font-size:15px;cursor:pointer;flex:1 1 100%}
        @media(min-width:640px){.otw-go{flex:0 0 auto}}
        .otw-line{position:relative;margin:26px 0 0 10px;padding-left:26px;border-left:2px dashed var(--pp-border-2)}
        .otw-stop{position:relative;margin-bottom:26px}
        .otw-stop:before{content:"";position:absolute;left:-35px;top:6px;width:14px;height:14px;border-radius:50%;background:var(--pp-mark-dot);box-shadow:0 0 0 6px color-mix(in srgb, var(--pp-mark-dot) 18%, transparent)}
        .otw-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:8px}
        .otw-head b{font-family:var(--font-breath);font-weight:400;font-size:1.6rem;color:var(--pp-ink)}
        .otw-head span{font-family:var(--font-mono);font-size:.8rem;color:var(--pp-muted);white-space:nowrap}
        .otw-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-top:1px solid var(--pp-border);text-decoration:none;color:inherit}
        .otw-row:first-child{border-top:none}
        .otw-row small{display:block;font-size:.82rem;color:var(--pp-muted)}
        .otw-acts{display:flex;gap:14px;font-size:.85rem;margin-top:8px}
        .otw-acts a{color:var(--pp-mark);font-weight:600;text-decoration:none}
      `}</style>

      <form className="otw-form" method="get" action="/on-the-way">
        <select name="from" defaultValue={from.slug} aria-label="Starting from" style={sel}>
          {TOWNS.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
        </select>
        <span>to</span>
        <select name="to" defaultValue={to.slug} aria-label="Headed to" style={sel}>
          {TOWNS.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
        </select>
        <button className="otw-go" type="submit">Show the way</button>
      </form>
      <p className="gp-note">About {total} miles by the main roads. Mileage is approximate; your map app knows your exact way.</p>

      <div className="otw-line">
        {stops.map(({ t, mile, count, top, priced }) => (
          <section key={t.slug} className="otw-stop">
            <div className="otw-head">
              <b>{t.name}</b>
              <span>{mile === 0 ? "start" : `~mile ${mile}`} · {count} deal{count === 1 ? "" : "s"}</span>
            </div>
            {top.length + priced.length > 0 ? (
              <div className="gp-list">
                {[...top, ...priced].map((d) => {
                  const title = cleanDealTitle(d.deal_title);
                  const pill = saveLabel({ ...d, deal_title: title });
                  return (
                    <Link key={d.deal_id} href={`/deal/${d.deal_id}`} className="otw-row">
                      <span style={{ minWidth: 0 }}>
                        <b style={{ fontWeight: 600 }}>{storeName(d)}</b>
                        <small>{title}</small>
                        <OtdLine deal={{ ...d, deal_title: title }} />
                      </span>
                      {pill ? <span className="pp-save">{pill}</span> : <span className="gp-pill muted">Deal</span>}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="gp-note">No deal posted here this morning.</p>
            )}
            <div className="otw-acts">
              <Link href={`/city/${t.group[0].toLowerCase().replace(/\s+/g, "-")}`}>All {t.name} deals →</Link>
              {top[0] && <a href={directionsHref(top[0])} target="_blank" rel="noopener noreferrer">Directions to the best one</a>}
            </div>
          </section>
        ))}
      </div>
      <p className="gp-note">Deals checked on each store&apos;s own site this morning. The counter always has the final word. Buy on the way, enjoy it at home.</p>
    </GuideShell>
  );
}
