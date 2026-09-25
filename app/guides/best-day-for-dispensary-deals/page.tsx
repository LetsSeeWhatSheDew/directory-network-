// /guides/best-day-for-dispensary-deals — which weekdays Central Illinois
// stores run their deals, computed live from our own deal log. Honest about
// how little history there is: day-by-day comparisons only show once each
// weekday has been logged enough times.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../../components/GuideShell";
import { brand } from "../../../lib/brand";
import {
  getLiveDeals, getObservations, getMarketDays, getRegionStores,
  weekdaysInTitle, normalizeWeekday, weekdayOfDay, fmtDay, todayCT, todayIsoCT,
  WEEKDAYS, DAILY_LOG_START, guideBySlug, type Weekday,
} from "../../../lib/guides";
import { storeName, cleanDealTitle } from "../../../lib/exhale";
import { QuickAnswer, FaqBlock, RelatedGuides, GUIDE_EXTRA_CSS, GUIDE_CRUMBS, guideJsonLd, type Faq } from "../GuideParts";

export const revalidate = 3600;
const SLUG = "best-day-for-dispensary-deals";
const TITLE = "The best day for dispensary deals in Central Illinois";
/** A weekday needs this many logged days before we compare it. */
const MIN_DAYS_PER_WEEKDAY = 3;

export const metadata: Metadata = {
  title: "Best Day for Dispensary Deals in Central Illinois (Live Data)",
  description:
    "Which weekdays Peoria, Bloomington-Normal, Champaign-Urbana, Pekin and Springfield dispensaries run their deals, from PuffPrice's own daily log of each store's website. Updated hourly.",
  alternates: { canonical: `${brand.url}/guides/${SLUG}` },
};

type DayDeal = { store: string; slug: string; city: string; title: string; lastSeen: string; firstSeen: string; pcts: number[]; live: boolean };

export default async function BestDayPage() {
  const stores = await getRegionStores();
  const [live, obs, market] = await Promise.all([getLiveDeals(), getObservations(stores), getMarketDays()]);
  const bySlug = new Map(stores.map((s) => [s.slug, s]));
  const updated = todayCT();

  // 1) Standing weekday deals: any deal whose title names a weekday, or a
  //    live deal with recurring_days set. Grouped by weekday and store.
  const dayDeals = new Map<Weekday, Map<string, DayDeal>>();
  const add = (d: Weekday, key: string, dd: Omit<DayDeal, "pcts"> & { pct: number | null }) => {
    const m = dayDeals.get(d) || new Map<string, DayDeal>();
    const cur = m.get(key);
    if (cur) {
      if (dd.lastSeen > cur.lastSeen) cur.lastSeen = dd.lastSeen;
      if (dd.firstSeen < cur.firstSeen) cur.firstSeen = dd.firstSeen;
      if (dd.pct != null && !cur.pcts.includes(dd.pct)) cur.pcts.push(dd.pct);
      cur.live = cur.live || dd.live;
    } else {
      m.set(key, { ...dd, pcts: dd.pct != null ? [dd.pct] : [] });
    }
    dayDeals.set(d, m);
  };
  const liveIds = new Set(live.map((d) => d.deal_id));
  for (const o of obs) {
    const s = bySlug.get(o.listing_slug);
    if (!s) continue;
    for (const d of weekdaysInTitle(o.title)) {
      add(d, o.listing_slug, {
        store: storeName({ name: s.name, slug: s.slug }), slug: s.slug, city: s.city,
        title: cleanDealTitle(o.title).replace(/\s*[—-]\s*\d+%\s*off.*$/i, ""),
        lastSeen: o.observed_day, firstSeen: o.observed_day, pct: o.discount_pct, live: liveIds.has(o.deal_id),
      });
    }
  }
  const today = todayIsoCT();
  for (const d of live) {
    const days = new Set<Weekday>(weekdaysInTitle(d.deal_title));
    for (const r of d.recurring_days || []) { const w = normalizeWeekday(r); if (w) days.add(w); }
    for (const w of days) {
      const slug = d.slug || d.listing_slug || "";
      add(w, slug, {
        store: storeName(d), slug, city: d.city || "",
        title: cleanDealTitle(d.deal_title).replace(/\s*[—-]\s*\d+%\s*off.*$/i, ""),
        lastSeen: (d.verified_at || today).slice(0, 10), firstSeen: (d.verified_at || today).slice(0, 10),
        pct: d.discount_unit === "percent" ? d.discount_value : null, live: true,
      });
    }
  }
  const weekdayRows = WEEKDAYS.map((w) => ({ w, deals: [...(dayDeals.get(w)?.values() || [])].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)) }));
  const withDeals = weekdayRows.filter((r) => r.deals.length > 0);
  const liveNow = live.length;
  const liveDayOnly = live.filter((d) => weekdaysInTitle(d.deal_title).length || (d.recurring_days || []).length).length;

  // 2) The daily log since DAILY_LOG_START, summed across cities per day,
  //    grouped by weekday.
  const perDay = new Map<string, { deals: number; wsum: number; w: number }>();
  for (const m of market) {
    const cur = perDay.get(m.observed_day) || { deals: 0, wsum: 0, w: 0 };
    cur.deals += m.deals_live;
    if (m.avg_discount_pct != null) { cur.wsum += m.avg_discount_pct * m.deals_live; cur.w += m.deals_live; }
    perDay.set(m.observed_day, cur);
  }
  const loggedDays = [...perDay.keys()].sort();
  const byWeekday = WEEKDAYS.map((w) => {
    const ds = loggedDays.filter((d) => weekdayOfDay(d) === w).map((d) => perDay.get(d)!);
    const n = ds.length;
    const avgDeals = n ? Math.round(ds.reduce((a, b) => a + b.deals, 0) / n) : null;
    const w8 = ds.reduce((a, b) => a + b.w, 0);
    const avgPct = w8 ? Math.round(ds.reduce((a, b) => a + b.wsum, 0) / w8) : null;
    return { w, n, avgDeals, avgPct };
  });
  const comparable = byWeekday.every((r) => r.n >= MIN_DAYS_PER_WEEKDAY);
  const best = comparable ? [...byWeekday].sort((a, b) => (b.avgDeals || 0) - (a.avgDeals || 0))[0] : null;
  const readyDate = new Date(new Date(DAILY_LOG_START + "T12:00:00Z").getTime() + (7 * MIN_DAYS_PER_WEEKDAY - 1) * 86_400_000).toISOString().slice(0, 10);

  const namedDays = withDeals.map((r) => `${r.w} (${r.deals.map((d) => d.store).join(", ")})`);
  const quick = best
    ? `Across the ${loggedDays.length} days we've logged since ${fmtDay(DAILY_LOG_START)}, ${best.w} has had the most dispensary deals live in Central Illinois, about ${best.avgDeals} a day. ${withDeals.length ? `Standing day-of-week deals we've seen on stores' own sites: ${namedDays.join("; ")}.` : ""}`
    : `There's no single best day yet: ${liveNow ? (liveDayOnly === 0 ? `all ${liveNow} deals live at Central Illinois stores today run any day of the week` : `${liveNow - liveDayOnly} of the ${liveNow} deals live at Central Illinois stores today run any day of the week`) : "most deals we track run any day of the week"}. ${withDeals.length ? `The standing day-of-week deals we've seen on stores' own sites are ${namedDays.join("; ")}.` : ""} We've logged every day since ${fmtDay(DAILY_LOG_START)}, so a fair day-by-day comparison needs until about ${fmtDay(readyDate)}.`;

  const faqs: Faq[] = [
    { q: "What day do Central Illinois dispensaries have the best deals?", a: quick },
    { q: "Do Central Illinois dispensaries do daily specials like Munchie Monday or Wax Wednesday?", a: withDeals.length ? `A few do. On stores' own sites we've seen: ${withDeals.map((r) => `${r.w}: ${r.deals.map((d) => `${d.title} at ${d.store} (last seen ${fmtDay(d.lastSeen)})`).join("; ")}`).join(". ")}.` : "We haven't seen a standing weekday special on any Central Illinois store's own site yet." },
    { q: "Where does this data come from?", a: `From PuffPrice's own log. Every day we check each Central Illinois dispensary's website and record every deal we see. Deals from aggregator sites are left out. Daily logging started ${fmtDay(DAILY_LOG_START)}; before that, only the first and last time we saw a deal were kept.` },
    { q: "Is there a big sale day coming up?", a: "Green Wednesday, the day before Thanksgiving (Nov 25, 2026), is when a lot of dispensaries run their biggest fall sales. We list every Central Illinois deal that morning." },
  ];

  return (
    <GuideShell
      crumbs={GUIDE_CRUMBS}
      eyebrow={`Guide · live data · ${updated}`}
      title={TITLE}
      lede={<>{guideBySlug(SLUG).blurb} No store pays to be on this page.</>}
      jsonLd={guideJsonLd({ slug: SLUG, title: TITLE, faqs, dateModified: today })}
    >
      <style>{GUIDE_EXTRA_CSS}</style>
      <QuickAnswer updated={updated}>{quick}</QuickAnswer>

      <h2 className="gp-h2">Standing day-of-week deals</h2>
      <p className="gp-p">Deals a store names after a weekday, or tells us repeat on set days. Pulled from our log of each store&apos;s own site, back to April 2026.</p>
      {withDeals.length ? (
        <div className="gp-list">
          {withDeals.flatMap((r) =>
            r.deals.map((d) => (
              <Link key={`${r.w}-${d.slug}`} href={`/dispensary/${d.slug}`} className="gp-row">
                <span className="gp-row-main">
                  <span className="gp-row-title">{r.w} · {d.store}</span>
                  <span className="gp-row-sub">
                    {d.title} · {d.pcts.length ? `${d.pcts.length > 1 ? `${Math.min(...d.pcts)}–${Math.max(...d.pcts)}` : d.pcts[0]}% off when we saw it` : "discount varies"} · {d.firstSeen === d.lastSeen ? `seen ${fmtDay(d.lastSeen)}` : `seen ${fmtDay(d.firstSeen)} to ${fmtDay(d.lastSeen)}`}
                  </span>
                </span>
                <span className={d.live ? "gp-pill" : "gp-pill muted"}>{d.live ? "Live now" : "Not live today"}</span>
              </Link>
            ))
          )}
        </div>
      ) : (
        <p className="gp-note">We haven&apos;t seen a standing weekday deal on any Central Illinois store&apos;s own site yet.</p>
      )}
      <p className="gp-note">Weekdays with nothing listed: {weekdayRows.filter((r) => !r.deals.length).map((r) => r.w).join(", ") || "none"}. That means we haven&apos;t seen a day-named deal, not that nothing is on sale.</p>

      <h2 className="gp-h2">Deals live by weekday</h2>
      <p className="gp-p">
        Every morning we count the deals live across Central Illinois. Here is the average by weekday since {fmtDay(DAILY_LOG_START)} ({loggedDays.length} day{loggedDays.length === 1 ? "" : "s"} logged).
        {!comparable && ` We only compare weekdays once each one has at least ${MIN_DAYS_PER_WEEKDAY} logged days, around ${fmtDay(readyDate)}.`}
      </p>
      <div className="gp-table-wrap">
        <table className="gp-table">
          <thead><tr><th>Weekday</th><th>Days logged</th><th style={{ textAlign: "right" }}>Avg deals live</th><th style={{ textAlign: "right" }}>Avg % off</th></tr></thead>
          <tbody>
            {byWeekday.map((r) => (
              <tr key={r.w}>
                <td>{r.w}</td>
                <td>{r.n}{r.n > 0 && r.n < MIN_DAYS_PER_WEEKDAY ? " (too few)" : ""}</td>
                <td className="num">{r.avgDeals ?? "—"}</td>
                <td className="num">{r.avgPct != null ? `${r.avgPct}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="gp-note">Average % off counts percent-off deals only; bundle prices like &quot;2 for $60&quot; have no percent to average. Full daily numbers by city are on the <Link href="/deal-index">Deal Index</Link>.</p>

      <h2 className="gp-h2">How to get the best price any day</h2>
      <ul className="gp-ul">
        <li>Check <Link href="/out-the-door">out-the-door prices</Link>. Illinois taxes add a lot at the register, and a smaller discount in a lower-tax town can win.</li>
        <li>Ask about <Link href="/guides/dispensary-first-time-discounts-central-illinois">first-time, veteran and senior discounts</Link>. They often beat the posted deal.</li>
        <li>Medical card holders pay far less tax. See <Link href="/guides/illinois-medical-cannabis-card-2026">whether a card is worth it</Link>.</li>
        <li>Mark <Link href="/green-wednesday">Green Wednesday</Link> (Nov 25, 2026) on your calendar.</li>
      </ul>

      <FaqBlock faqs={faqs} />
      <h2 className="gp-h2">About this data</h2>
      <p className="gp-note">Source: PuffPrice&apos;s daily check of each Central Illinois dispensary&apos;s own website (deal_observations and daily_market_stats). Aggregator listings are excluded. Refreshed hourly. <Link href="/how-we-rank">How we rank</Link>.</p>
      <RelatedGuides current={SLUG} extra={[{ href: "/this-week", label: "This week's best deals" }, { href: "/deal-index", label: "Deal Index" }]} />
    </GuideShell>
  );
}
