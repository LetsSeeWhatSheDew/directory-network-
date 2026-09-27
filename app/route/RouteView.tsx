// Shared body for /route and /route/[pair]: the city picker, and (for a
// pair) the stores with live deals near the straight line between the two
// cities, in the order you reach them (lib/routeDeals.ts).
import Link from "next/link";
import OtdLine from "../components/OtdLine";
import type { Faq } from "../guides/GuideParts";
import { ROUTE_CITIES, COMMON_PAIRS, CORRIDOR_MILES, pairSlug, routeCity, viaHref, driveHref, type RoutePlan } from "../../lib/routeDeals";
import { saveLabel, cleanDealTitle, storeName, amountOf, productOf } from "../../lib/exhale";

const CSS = `
.rt-form{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:20px 0 6px;padding:14px;border-radius:20px;background:var(--pp-haze);border:1px solid var(--pp-haze-border)}
.rt-form span{font-size:.9rem;color:var(--pp-muted)}
.rt-form select{padding:12px 14px;border-radius:14px;border:1px solid var(--pp-border);background:var(--pp-surface);color:var(--pp-ink);font-size:16px;min-width:0;flex:1 1 140px}
.rt-go{padding:12px 20px;border-radius:14px;border:1px solid var(--pp-btn-border);background:var(--pp-btn);color:var(--pp-btn-fg);font-weight:600;font-size:15px;cursor:pointer;flex:1 1 100%}
@media(min-width:640px){.rt-go{flex:0 0 auto}}
.rt-sum{margin:18px 0 4px;padding:16px 18px;border-radius:18px;background:var(--pp-surface);border:1px solid var(--pp-border)}
.rt-sum p{margin:0;line-height:1.55;color:var(--pp-body)}
.rt-sum p + p{margin-top:6px}
.rt-sum a{color:var(--pp-mark);font-weight:600;text-decoration:none}
.rt-line{position:relative;margin:26px 0 0 10px;padding-left:26px;border-left:2px dashed var(--pp-border-2)}
.rt-end{position:relative;margin:0 0 22px;font-family:var(--font-breath);font-size:1.5rem;color:var(--pp-ink)}
.rt-end:last-child{margin:0}
.rt-end:before{content:"";position:absolute;left:-34px;top:9px;width:12px;height:12px;border-radius:50%;border:2px solid var(--pp-mark);background:var(--pp-paper)}
.rt-stop{position:relative;margin-bottom:26px}
.rt-stop:before{content:"";position:absolute;left:-35px;top:6px;width:14px;height:14px;border-radius:50%;background:var(--pp-mark-dot);box-shadow:0 0 0 6px color-mix(in srgb, var(--pp-mark-dot) 18%, transparent)}
.rt-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px}
.rt-head a{font-weight:600;font-size:1.05rem;color:var(--pp-ink);text-decoration:none}
.rt-head span{font-family:var(--font-mono);font-size:.76rem;color:var(--pp-muted)}
.rt-acts{display:flex;flex-wrap:wrap;gap:14px;font-size:.85rem;margin-top:8px}
.rt-acts a{color:var(--pp-mark);font-weight:600;text-decoration:none}
.rt-pairs{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-top:8px}
.rt-pairs a{display:flex;flex-direction:column;gap:3px;padding:14px 16px;border-radius:16px;border:1px solid var(--pp-border);background:var(--pp-surface);color:inherit;text-decoration:none}
.rt-pairs a b{font-weight:600}
.rt-pairs a span{font-size:.82rem;color:var(--pp-muted)}
`;

const mi = (n: number) => (n < 1 ? "under 1 mi" : `${Math.round(n)} mi`);

export function RoutePicker({ from, to }: { from?: string; to?: string }) {
  return (
    <form className="rt-form" method="get" action="/route">
      <select name="from" defaultValue={from || "peoria"} aria-label="Starting from">
        {ROUTE_CITIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
      </select>
      <span>to</span>
      <select name="to" defaultValue={to || "bloomington"} aria-label="Headed to">
        {ROUTE_CITIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
      </select>
      <button className="rt-go" type="submit">Show deals on the way</button>
    </form>
  );
}

export function CommonPairs({ except }: { except?: string }) {
  return (
    <div className="rt-pairs">
      {COMMON_PAIRS.filter(([a, b]) => pairSlug(a, b) !== except).map(([a, b]) => (
        <Link key={pairSlug(a, b)} href={`/route/${pairSlug(a, b)}`}>
          <b>{routeCity(a)!.name} to {routeCity(b)!.name}</b>
          <span>Deals along the way</span>
        </Link>
      ))}
    </div>
  );
}

export function routeFaqs(plan: RoutePlan | null, fromName: string, toName: string): Faq[] {
  const best = plan?.best;
  const bestA = best ? amountOf(best.deal) : null;
  return [
    {
      q: `Are there dispensaries between ${fromName} and ${toName}?`,
      a: plan
        ? plan.stops.length
          ? `Yes. This morning ${plan.stops.length} store${plan.stops.length === 1 ? "" : "s"} within ${CORRIDOR_MILES} miles of the straight line from ${fromName} to ${toName} had a deal posted: ${plan.stops.slice(0, 6).map((s) => `${storeName(s.deals[0] || { slug: s.slug, name: s.name })} (${s.city})`).join(", ")}${plan.stops.length > 6 ? " and more" : ""}.`
          : `None of the stores within ${CORRIDOR_MILES} miles of the straight line from ${fromName} to ${toName} had a deal posted this morning. Stores in both cities are on their city pages.`
        : "We couldn't read today's deals just now. Try again in a minute.",
    },
    {
      q: `What's the best dispensary deal on the drive from ${fromName} to ${toName}?`,
      a: best && bestA
        ? `${bestA.big} off ${productOf({ ...best.deal, deal_title: cleanDealTitle(best.deal.deal_title) }).toLowerCase()} at ${storeName(best.deal)} in ${best.stop.city}, about ${Math.round(best.stop.along)} miles along the way (straight line). Checked on the store's own site this morning.`
        : "No everyday percent- or dollars-off deal on this route this morning. Any priced or conditional deals are listed on the page.",
    },
    {
      q: "How do you decide what's on the way?",
      a: `Every store within ${CORRIDOR_MILES} miles of the straight line between the two city centers, ordered by how far along the line it sits. Miles are straight-line, not driving miles, so treat them as a rough guide; the Google Maps links route you through the store for real. Up to two deals per store are shown, everyday savings first, and no store pays to be listed.`,
    },
  ];
}

export function RouteStops({ plan }: { plan: RoutePlan }) {
  const { from, to } = plan;
  return (
    <>
      <div className="rt-sum">
        <p>
          About <b>{Math.round(plan.miles)} miles</b> in a straight line; the drive is longer. {plan.stops.length > 0 ? (
            <><b>{plan.stops.length}</b> store{plan.stops.length === 1 ? "" : "s"} within {CORRIDOR_MILES} miles of the way {plan.stops.length === 1 ? "has" : "have"} a deal posted this morning.</>
          ) : (
            <>No store within {CORRIDOR_MILES} miles of the way has a deal posted this morning.</>
          )}
        </p>
        {plan.best && (
          <p>
            Best saving on the way: <b>{saveLabel(plan.best.deal)}</b> at {storeName(plan.best.deal)}, {plan.best.stop.city}, about mile {Math.round(plan.best.stop.along)}.
          </p>
        )}
        <p><a href={driveHref(from, to)} target="_blank" rel="noopener noreferrer">Open the drive in Google Maps</a></p>
      </div>

      <div className="rt-line">
        <div className="rt-end">{from.name}</div>
        {plan.stops.map((s) => (
          <section key={s.key} className="rt-stop" aria-label={`${storeName(s.deals[0] || { slug: s.slug, name: s.name })}, ${s.city}`}>
            <div className="rt-head">
              <Link href={`/dispensary/${s.slug}`}>{storeName(s.deals[0] || { slug: s.slug, name: s.name })}{s.city ? ` · ${s.city}` : ""}</Link>
              <span>~mile {Math.round(s.along)} · {s.off < 1 ? "on the way" : `${mi(s.off)} off the line`}</span>
            </div>
            <div className="gp-list">
              {s.deals.map((d) => {
                const title = cleanDealTitle(d.deal_title);
                const pill = saveLabel({ ...d, deal_title: title });
                return (
                  <Link key={d.deal_id} href={`/deal/${d.deal_id}`} className="gp-row" data-track="deal_tap" data-track-deal={d.deal_id} data-track-from="route">
                    <span className="gp-row-main">
                      <span className="gp-row-title" style={{ fontWeight: 500 }}>{title}</span>
                      <OtdLine deal={{ ...d, deal_title: title }} />
                    </span>
                    {pill ? <span className="pp-save">{pill}</span> : <span className="gp-pill muted">Deal</span>}
                  </Link>
                );
              })}
            </div>
            <div className="rt-acts">
              <a href={viaHref(from, to, s)} target="_blank" rel="noopener noreferrer" data-track="directions_tap" data-track-slug={s.slug} data-track-from="route_via">
                Add as a stop ({s.detour < 1 ? "barely out of the way" : `~${Math.round(s.detour)} mi extra`})
              </a>
              {s.total > s.deals.length && <Link href={`/dispensary/${s.slug}`}>All {s.total} deals here →</Link>}
            </div>
          </section>
        ))}
        <div className="rt-end">{to.name}</div>
      </div>
      <p className="gp-note">
        Miles are straight-line from city centers and each store&apos;s location, so they&apos;re a rough guide; &ldquo;Add as a stop&rdquo; opens the real route in Google Maps. Deals checked on each store&apos;s own site this morning. The counter always has the final word. Buy on the way, enjoy it at home.
      </p>
    </>
  );
}

export { CSS as ROUTE_CSS };
