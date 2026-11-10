// app/for-dispensaries/[slug]/market-report/page.tsx — the paid product, as a
// free sample: one store against every store within 15 miles. Two letter
// pages, built to print or save as PDF. noindex.
//
// Every number comes from a live table (deal_observations, deals, the menu
// reader's latest_menu_items via getCheapestBoard) or from lib/searchDemand.ts
// (Search Console, copied by hand with its date). Missing data says so.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Host_Grotesk } from "next/font/google";
import { getRegionStores, type RegionStore } from "../../../../lib/waysToBuy";
import { getCheapestBoard, REF_DEF, REF_UNITS, money, citySlugOf, type CheapestItem } from "../../../../lib/menuPrices";
import { cityCenter, milesBetween } from "../../../../lib/cityProfiles";
import { CITY_IMPRESSIONS, SEARCH_WINDOW, TOP_SEARCHES } from "../../../../lib/searchDemand";

export const revalidate = 3600;

const sans = Host_Grotesk({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--mr-sans" });
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const RADIUS = 15;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = (await getRegionStores()).find((s) => s.slug === slug);
  return { title: store ? `Market report: ${nice(store)}` : "Market report", robots: { index: false, follow: false } };
}

const nice = (s: Pick<RegionStore, "name" | "city">) => {
  const n = s.name.replace(/^nuera\b/i, "nuEra");
  return n.toLowerCase().includes(s.city.toLowerCase()) ? n : `${n} ${s.city}`;
};

type Obs = { observed_day: string; discount_pct: number | null; deal_id: string | null };
type Row = {
  store: RegionStore;
  mi: number;
  days: number;
  typical: number | null;
  deepest: number | null;
  distinctDeals: number;
  liveNow: number;
  browserRead: boolean;
};

function median(xs: number[]) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export default async function MarketReport({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stores = await getRegionStores();
  const store = stores.find((s) => s.slug === slug);
  if (!store) notFound();
  const center = cityCenter(store.city);
  if (!center) notFound();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const H = { apikey: anon, Authorization: `Bearer ${anon}` };

  const near = stores
    .map((s) => {
      const c = cityCenter(s.city);
      return { s, mi: c ? milesBetween(center, c) : Infinity };
    })
    .filter((x) => x.mi <= RADIUS);

  // eslint-disable-next-line react-hooks/purity -- server component; "now" is the request time
  const now = Date.now();
  const since = new Date(now - 30 * 86400000).toISOString().slice(0, 10);
  const [obsByStore, liveRes, renderedRes, board] = await Promise.all([
    // One request per store: PostgREST caps a response at 1,000 rows.
    Promise.all(
      near.map(async ({ s }) => {
        try {
          const r = await fetch(
            `${SUPABASE_URL}/rest/v1/deal_observations?select=observed_day,discount_pct,deal_id&project_tag=eq.green&listing_slug=eq.${encodeURIComponent(s.slug)}&observed_day=gt.${since}&limit=1000`,
            { headers: H, next: { revalidate: 3600 } }
          );
          return (r.ok ? await r.json() : []) as Obs[];
        } catch {
          return [] as Obs[];
        }
      })
    ),
    fetch(`${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=listing_slug&limit=2000`, { headers: H, next: { revalidate: 3600 } }),
    fetch(`${SUPABASE_URL}/rest/v1/deals?select=listing_slug&project_tag=eq.green&source=eq.website_rendered&limit=2000`, { headers: H, next: { revalidate: 3600 } }),
    getCheapestBoard({ nearCity: citySlugOf(store.city) }),
  ]);
  const live: Array<{ listing_slug: string }> = liveRes.ok ? await liveRes.json() : [];
  const rendered = new Set(((renderedRes.ok ? await renderedRes.json() : []) as Array<{ listing_slug: string }>).map((d) => d.listing_slug));

  const rows: Row[] = near.map(({ s, mi }, i) => {
    const obs = obsByStore[i];
    const pcts = obs.map((o) => Number(o.discount_pct)).filter((p) => p > 0 && p <= 100);
    return {
      store: s,
      mi: Math.round(mi * 10) / 10,
      days: new Set(obs.map((o) => o.observed_day)).size,
      typical: pcts.length ? Math.round(median(pcts)!) : null,
      deepest: pcts.length ? Math.max(...pcts) : null,
      distinctDeals: new Set(obs.map((o) => o.deal_id).filter(Boolean)).size,
      liveNow: live.filter((d) => d.listing_slug === s.slug).length,
      browserRead: rendered.has(s.slug),
    };
  });
  rows.sort((a, b) => b.days - a.days || (b.typical ?? -1) - (a.typical ?? -1) || a.mi - b.mi);
  const me = rows.find((r) => r.store.slug === slug)!;
  const rank = rows.indexOf(me) + 1;
  const others = rows.filter((r) => r !== me);
  const peerDays = median(others.map((r) => r.days));
  const deepestNear = others.filter((r) => r.deepest != null).sort((a, b) => b.deepest! - a.deepest!)[0];
  const withTypical = rows.filter((r) => r.typical != null).sort((a, b) => b.typical! - a.typical!);
  const typicalRank = me.typical != null ? withTypical.indexOf(me) + 1 : null;

  // Shelf prices: this store's lowest out-the-door price per reference item,
  // against every store within NEAR_MILES the menu reader read in the last 36h.
  const prices = REF_UNITS.map((ref) => {
    const list: CheapestItem[] = board.byRef[ref];
    const mine = list.find((x) => x.listingSlug === slug) || null;
    return { ref, list, mine, rank: mine ? list.indexOf(mine) + 1 : null, low: list[0] || null };
  });
  const pricedHere = prices.some((p) => p.mine);
  const impressions = CITY_IMPRESSIONS[citySlugOf(store.city)] ?? null;
  const CITY_WORDS = ["peoria", "springfield", "champaign", "urbana", "bloomington", "normal", "pekin"];
  const searches = TOP_SEARCHES.filter(([q]) => !CITY_WORDS.some((c) => q.includes(c)) || q.includes(store.city.toLowerCase())).slice(0, 6);
  const checks: Array<[string, boolean, string]> = [
    ["Deals on your PuffPrice page today", me.liveNow > 0, me.liveNow > 0 ? `${me.liveNow} live, re-checked every morning` : "none found on your site right now"],
    ["Shelf prices in the price comparison", pricedHere, pricedHere ? "read from your online menu" : "we can't read your menu yet; send us its link"],
    ["Phone number", !!store.phone, store.phone || "missing"],
    ["Link to your website", !!store.website, store.website ? "linked from your page" : "missing"],
  ];
  const today = new Date(now).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Chicago" });
  const name = nice(store);

  // Plain-sentence findings, only from numbers above.
  const findings: string[] = [];
  findings.push(
    me.days > 0
      ? `You had at least one deal on your site on ${me.days} of the last 30 days. The typical store near you: ${peerDays ?? "—"} days.`
      : `We didn't find a deal on your site in the last 30 days. ${others.filter((r) => r.days > 0).length} of the ${others.length} stores near you did.`
  );
  if (me.typical != null && typicalRank)
    findings.push(`Your typical deal is ${me.typical}% off: #${typicalRank} of ${withTypical.length} nearby stores that post a percentage.`);
  if (deepestNear && me.deepest != null && me.deepest >= deepestNear.deepest!)
    findings.push(`Your ${me.deepest}% off was the deepest deal within ${RADIUS} miles this month. Next deepest: ${deepestNear.deepest}% at ${nice(deepestNear.store)}.`);
  else if (deepestNear)
    findings.push(`The deepest deal near you this month was ${deepestNear.deepest}% off at ${nice(deepestNear.store)}${me.deepest != null ? `. Yours peaked at ${me.deepest}%` : ""}.`);
  for (const p of prices) {
    if (p.mine && p.rank && p.low)
      findings.push(
        p.rank === 1
          ? `You have the lowest ${REF_DEF[p.ref].short} out the door within ${RADIUS} miles: ${money(p.mine.otd)}.`
          : `Your lowest ${REF_DEF[p.ref].short} is ${money(p.mine.otd)} out the door: #${p.rank} of ${p.list.length}. Lowest nearby: ${money(p.low.otd)} at ${p.low.storeName}.`
      );
  }
  if (!pricedHere) findings.push(board.stores ? `We can't read your menu prices yet, so shoppers comparing an eighth, a cart or gummies don't see you. ${board.stores} store${board.stores === 1 ? " is" : "s are"} near you already in that comparison.` : `No store within ${RADIUS} miles is in our shelf-price comparison yet. Send us your menu link and you're the first one shoppers see.`);
  if (impressions) findings.push(`Google showed PuffPrice's ${store.city} page ${impressions.toLocaleString("en-US")} times in four weeks (${SEARCH_WINDOW.from} – ${SEARCH_WINDOW.to}).`);

  return (
    <div className={`mr-root ${sans.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <p className="mr-screen">
        Sample market report. Print it or save as PDF (letter, &ldquo;Actual size&rdquo;, background graphics on).
      </p>

      <section className="mr-page">
        <header className="mr-top">
          <span className="mr-word">
            <i aria-hidden="true" />
            PuffPrice
          </span>
          <span>Market report · {today}</span>
        </header>

        <p className="mr-kicker">Prepared for</p>
        <h1 className="mr-h1" data-keep-font="">
          {name}
        </h1>
        <p className="mr-lede">
          How your deals and prices compare with the {others.length} other stores within {RADIUS} miles of {store.city}, from our daily read of every store&apos;s own website and menu.
        </p>

        <div className="mr-stats">
          <div>
            <span>Days with a deal</span>
            <b>{me.days}<small>/30</small></b>
            <em>nearby typical: {peerDays ?? "—"}</em>
          </div>
          <div>
            <span>Typical deal</span>
            <b>{me.typical != null ? `${me.typical}%` : "—"}</b>
            <em>{typicalRank ? `#${typicalRank} of ${withTypical.length} nearby` : "no % deals seen"}</em>
          </div>
          <div>
            <span>Deals live today</span>
            <b>{me.liveNow}</b>
            <em>on your PuffPrice page</em>
          </div>
          <div>
            <span>Deal frequency rank</span>
            <b>#{rank}<small>/{rows.length}</small></b>
            <em>within {RADIUS} miles</em>
          </div>
        </div>

        <h2 className="mr-h2" data-keep-font="">What stands out</h2>
        <ol className="mr-find">
          {findings.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ol>

        <h2 className="mr-h2" data-keep-font="">Every store near you, last 30 days</h2>
        <table className="mr-t">
          <thead>
            <tr>
              <th>Store</th>
              <th>Miles</th>
              <th>Days with a deal</th>
              <th>Typical</th>
              <th>Deepest</th>
              <th>Live today</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.store.slug} className={r === me ? "me" : ""}>
                <td>
                  {nice(r.store)}
                  {r.browserRead ? <sup>†</sup> : null}
                </td>
                <td>{r.mi}</td>
                <td>
                  <span className="mr-bar" style={{ ["--w" as string]: `${(r.days / 30) * 100}%` }} />
                  {r.days}
                </td>
                <td>{r.typical != null ? `${r.typical}%` : "—"}</td>
                <td>{r.deepest != null ? `${r.deepest}%` : "—"}</td>
                <td>{r.liveNow}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mr-note">
          Miles are between city centers. &ldquo;Typical&rdquo; is the median percent-off of the store&apos;s deals; dollar-off and bundle deals have no percent and aren&apos;t in it.
          {rows.some((r) => r.browserRead) ? " † Menus that only load in a real browser; until Nov 10 we read those less often than daily, so their day counts can run low." : ""}
        </p>
        <footer className="mr-foot">
          <span>puffprice.com · Nobody pays to rank, including you.</span>
          <span>1 / 2</span>
        </footer>
      </section>

      <section className="mr-page">
        <header className="mr-top">
          <span className="mr-word">
            <i aria-hidden="true" />
            PuffPrice
          </span>
          <span>{name}</span>
        </header>

        <h2 className="mr-h2 first" data-keep-font="">Shelf prices near you, out the door</h2>
        {board.stores ? (
          <div className="mr-prices">
            {prices.map((p) => (
              <div key={p.ref} className="mr-pcol">
                <h3 data-keep-font="">{REF_DEF[p.ref].label}</h3>
                <ol>
                  {p.list.slice(0, 7).map((x) => (
                    <li key={x.listingSlug} className={x.listingSlug === slug ? "me" : ""}>
                      <span>{x.storeName}</span>
                      <b>{money(x.otd)}</b>
                    </li>
                  ))}
                  {p.mine && p.rank! > 7 ? (
                    <li className="me">
                      <span>#{p.rank} {p.mine.storeName}</span>
                      <b>{money(p.mine.otd)}</b>
                    </li>
                  ) : null}
                  {!p.list.length ? <li><span>No store read in the last 36 hours</span></li> : null}
                </ol>
              </div>
            ))}
          </div>
        ) : (
          <p className="mr-p">The menu reader hasn&apos;t read a store within {RADIUS} miles of {store.city} in the last 36 hours. This section fills in on the next daily read.</p>
        )}
        <p className="mr-note">
          Lowest price per store for the same size, any brand, from each store&apos;s own online menu, with {store.city}-area sales tax added. Flower over 35% THC and infused flower are left out (they&apos;re taxed at a higher rate).
          {!pricedHere ? " Your menu isn't in this read yet." : ""}
        </p>

        <h2 className="mr-h2" data-keep-font="">Shoppers are searching</h2>
        <div className="mr-search">
          <div>
            <b>{impressions != null ? impressions.toLocaleString("en-US") : "—"}</b>
            <span>
              times Google showed PuffPrice&apos;s {store.city} page, {SEARCH_WINDOW.from} – {SEARCH_WINDOW.to}
            </span>
          </div>
          <ul>
            {searches.map(([q, n]) => (
              <li key={q}>
                <span>&ldquo;{q}&rdquo;</span>
                <b>{n}</b>
              </li>
            ))}
          </ul>
        </div>
        <p className="mr-note">From Google Search Console, pulled {SEARCH_WINDOW.pulled}. Top searches PuffPrice appeared for, site-wide, Aug 9 – Nov 8, 2026, with how many times.</p>

        <h2 className="mr-h2" data-keep-font="">Your listing, as shoppers see it today</h2>
        <ul className="mr-checks">
          {checks.map(([k, ok, v]) => (
            <li key={k} className={ok ? "ok" : "no"}>
              <i aria-hidden="true">{ok ? "✓" : "!"}</i>
              <span>{k}</span>
              <em>{v}</em>
            </li>
          ))}
        </ul>
        <p className="mr-note">Something wrong? Send the page on your site that shows the change and we fix it the same day.</p>

        <div className="mr-offer">
          <div>
            <p className="mr-kicker">The monthly report</p>
            <h2 className="mr-h2 flat" data-keep-font="">This page, every month, for your store.</h2>
            <ul>
              <li>Where your deals and shelf prices land against every store within {RADIUS} miles</li>
              <li>Which nearby stores ran what, and how deep</li>
              <li>What Central Illinois shoppers search for, and how often</li>
              <li>One plain-English takeaway, delivered as a PDF</li>
            </ul>
          </div>
          <div className="mr-price">
            <b>$99</b>
            <span>a month, founding price for the first five stores</span>
            <em>This first report is free. Billed by invoice. Cancel any time.</em>
          </div>
        </div>
        <p className="mr-rule">
          <b>Nobody pays to rank, including you.</b> Buying the report never changes where your deals show up on PuffPrice. Being listed stays free.
        </p>
        <footer className="mr-foot">
          <span>Questions or corrections: hi@puffprice.com · puffprice.com/for-dispensaries</span>
          <span>2 / 2</span>
        </footer>
      </section>
    </div>
  );
}

const CSS = `
.mr-root{--ink:#16150F;--muted:#6B6759;--rule:#E3DED2;--paper:#FFFDF8;--gold:#B08A3E;--gold-soft:#F4ECD8;--green:#1E3A2B;
  font-family:var(--mr-sans),system-ui,sans-serif;color:var(--ink);background:#E9E5DC;padding:24px 0 48px;min-height:100vh}
.mr-screen{max-width:8.5in;margin:0 auto 14px;font-size:13px;color:#555;text-align:center}
.mr-page{width:8.5in;height:11in;box-sizing:border-box;margin:0 auto 24px;background:var(--paper);padding:.55in .6in .45in;display:flex;flex-direction:column;box-shadow:0 1px 2px rgba(0,0,0,.06),0 14px 40px rgba(0,0,0,.10);position:relative;overflow:hidden}
.mr-top{display:flex;justify-content:space-between;align-items:center;font-size:9pt;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--rule);padding-bottom:.12in}
.mr-word{display:inline-flex;align-items:center;gap:7px;color:var(--ink);font-weight:600;letter-spacing:-.01em;text-transform:none;font-size:13pt}
.mr-word i{width:9px;height:9px;border-radius:50%;background:var(--gold);display:inline-block}
.mr-kicker{margin:.3in 0 0;font-size:9pt;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);font-weight:600}
.mr-root h1.mr-h1{margin:.04in 0 0;font-family:var(--mr-sans),sans-serif!important;font-weight:300;font-size:34pt;line-height:1.02;letter-spacing:-.035em;color:var(--ink)}
.mr-lede{margin:.1in 0 0;font-size:11pt;line-height:1.45;color:#3F3C33;max-width:6.2in}
.mr-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:.12in;margin-top:.24in}
.mr-stats div{border:1px solid var(--rule);border-radius:10px;padding:.12in .14in;display:flex;flex-direction:column;gap:2px;background:#fff}
.mr-stats span{font-size:8pt;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.mr-stats b{font-size:26pt;font-weight:400;letter-spacing:-.03em;line-height:1.05}
.mr-stats small{font-size:11pt;color:var(--muted);margin-left:2px}
.mr-stats em{font-style:normal;font-size:8.5pt;color:var(--muted)}
.mr-root h2.mr-h2{margin:.26in 0 .08in;font-family:var(--mr-sans),sans-serif!important;font-weight:600;font-size:13pt;letter-spacing:-.01em;color:var(--ink)}
.mr-root h2.mr-h2.first{margin-top:.22in}
.mr-root h2.mr-h2.flat{margin:.02in 0 .06in;font-size:15pt}
.mr-find{margin:0;padding-left:.22in;font-size:10.5pt;line-height:1.45}
.mr-find li{margin:.03in 0;padding-left:.04in}
.mr-find li::marker{color:var(--gold);font-weight:600}
.mr-t{width:100%;border-collapse:collapse;font-size:9.5pt}
.mr-t th{text-align:left;font-weight:500;font-size:8pt;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--ink);padding:.05in .06in}
.mr-t td{border-bottom:1px solid var(--rule);padding:.055in .06in;font-variant-numeric:tabular-nums}
.mr-t tr.me td{background:var(--gold-soft);font-weight:600}
.mr-t sup{color:var(--gold);margin-left:2px}
.mr-bar{display:inline-block;width:.6in;height:6px;border-radius:3px;background:var(--rule);margin-right:6px;position:relative;vertical-align:middle;overflow:hidden}
.mr-bar::after{content:"";position:absolute;inset:0 auto 0 0;width:var(--w);background:var(--green)}
.mr-note{margin:.08in 0 0;font-size:8pt;line-height:1.4;color:var(--muted)}
.mr-p{font-size:10.5pt;line-height:1.45}
.mr-prices{display:grid;grid-template-columns:repeat(3,1fr);gap:.14in}
.mr-pcol{border:1px solid var(--rule);border-radius:10px;padding:.1in .12in;background:#fff}
.mr-root .mr-pcol h3{margin:0 0 .06in;font-family:var(--mr-sans),sans-serif!important;font-size:10pt;font-weight:600;color:var(--ink)}
.mr-pcol ol{list-style:none;margin:0;padding:0;font-size:9pt}
.mr-pcol li{display:flex;justify-content:space-between;gap:6px;padding:.035in 0;border-bottom:1px solid var(--rule)}
.mr-pcol li:last-child{border-bottom:0}
.mr-pcol li.me{background:var(--gold-soft);font-weight:600;margin:0 -.06in;padding-left:.06in;padding-right:.06in}
.mr-pcol li b{font-weight:500;font-variant-numeric:tabular-nums}
.mr-search{display:grid;grid-template-columns:2.1in 1fr;gap:.2in;align-items:start}
.mr-search>div{display:flex;flex-direction:column;gap:4px}
.mr-search>div b{font-size:34pt;font-weight:300;letter-spacing:-.035em;line-height:1}
.mr-search>div span{font-size:9pt;color:var(--muted);line-height:1.4}
.mr-search ul{list-style:none;margin:0;padding:0;font-size:9.5pt;columns:2;column-gap:.2in}
.mr-search li{display:flex;justify-content:space-between;gap:6px;padding:.035in 0;border-bottom:1px solid var(--rule);break-inside:avoid}
.mr-search li b{font-weight:500;color:var(--muted)}
.mr-offer{margin-top:auto;display:grid;grid-template-columns:1fr 2in;gap:.2in;background:var(--green);color:#F4EFE4;border-radius:12px;padding:.2in .24in}
.mr-offer .mr-kicker{margin:0;color:#E2BE6E}
.mr-root .mr-offer h2.mr-h2{color:#F4EFE4}
.mr-offer ul{margin:0;padding-left:.18in;font-size:9.5pt;line-height:1.5;color:#DCE3DA}
.mr-price{display:flex;flex-direction:column;justify-content:center;gap:3px;border-left:1px solid rgba(244,239,228,.2);padding-left:.2in}
.mr-price b{font-size:36pt;font-weight:300;letter-spacing:-.04em;line-height:1;color:#E2BE6E}
.mr-price span{font-size:9.5pt}
.mr-price em{font-style:normal;font-size:8.5pt;color:#B9C7BB;line-height:1.4}
.mr-checks{list-style:none;margin:0;padding:0;font-size:10pt}
.mr-checks li{display:grid;grid-template-columns:.26in 2.6in 1fr;align-items:center;padding:.06in 0;border-bottom:1px solid var(--rule)}
.mr-checks i{font-style:normal;width:.18in;height:.18in;border-radius:50%;display:inline-grid;place-items:center;font-size:8pt;font-weight:700;color:#fff;background:var(--green)}
.mr-checks li.no i{background:var(--gold)}
.mr-checks em{font-style:normal;color:var(--muted);font-size:9pt}
.mr-rule{margin:.14in 0 0;font-size:9.5pt;line-height:1.45;color:#3F3C33}
.mr-foot{margin-top:.16in;padding-top:.1in;border-top:1px solid var(--rule);display:flex;justify-content:space-between;font-size:8pt;color:var(--muted)}
.mr-page>.mr-foot{margin-top:auto}
.mr-page:last-child>.mr-foot{margin-top:.16in}
@page{size:8.5in 11in;margin:0}
@media print{
  html,body{background:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body > *:not(.mr-root){display:none!important}
  body::after{display:none!important}
  .mr-root{background:none;padding:0}
  .mr-screen{display:none}
  .mr-page{margin:0;box-shadow:none;break-after:page}
}
@media (max-width:8.6in){.mr-root{overflow-x:auto}.mr-page{margin-left:16px;margin-right:16px}}
`;
