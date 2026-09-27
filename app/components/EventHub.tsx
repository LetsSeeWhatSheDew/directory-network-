// Sale-day hub (4/20, 7/10; Green Wednesday has its own page with the same
// shape). Before the day: what it is, how we'll track it, any deal a store has
// already announced for it, and "email me that morning". On the day: every
// live deal, biggest everyday saving first, fairness-capped per store.
// Real deals only, from the live view (lib/dealOfTheDay readLiveDeals).
import Link from "next/link";
import GuideShell from "./GuideShell";
import OtdLine from "./OtdLine";
import StoreOverflowLinks from "./StoreOverflowLinks";
import WatchControl from "./WatchControl";
import { FaqBlock, GUIDE_EXTRA_CSS, type Faq } from "../guides/GuideParts";
import { brand } from "../../lib/brand";
import { daysUntil, type SaleEvent } from "../../lib/events";
import { readLiveDeals, type LiveDeal } from "../../lib/dealOfTheDay";
import { rankStoreDeals } from "../../lib/routeDeals";
import { capPerStore, STORE_CAP } from "../../lib/storeCap";
import { saveLabel, storeWithCity, cleanDealTitle } from "../../lib/exhale";
import { CENTRAL_IL_CITIES } from "../../lib/constants/regions";
import { watchesAvailable } from "../../lib/dealWatch";

export const EVENT_CSS = `
.ev-count{display:flex;align-items:baseline;gap:10px;margin:22px 0 6px;flex-wrap:wrap}
.ev-count b{font-family:var(--font-body);font-weight:700;font-size:clamp(64px,16vw,96px);letter-spacing:-.055em;line-height:.9;color:var(--pp-big)}
.ev-count span{font-size:1.05rem;color:var(--pp-body)}
.ev-panel{background:var(--pp-haze);border:1px solid var(--pp-haze-border);border-radius:20px;padding:18px;margin:22px 0}
.ev-panel b.t{display:block;font-family:var(--font-breath);font-weight:400;font-size:1.5rem;line-height:1.1;margin-bottom:8px;color:var(--pp-ink)}
.ev-panel p{margin:0 0 6px;color:var(--pp-body);font-size:.95rem;line-height:1.5}
.ev-steps{margin:0;padding-left:1.2rem;line-height:1.6;max-width:66ch}
.ev-steps li{margin-bottom:6px}
`;

function DealRow({ d }: { d: LiveDeal }) {
  const title = cleanDealTitle(d.deal_title);
  const pill = saveLabel({ ...d, deal_title: title });
  return (
    <Link href={`/deal/${d.deal_id}`} className="gp-row" data-track="deal_tap" data-track-deal={d.deal_id} data-track-from="event_hub">
      <span className="gp-row-main">
        <span className="gp-row-title">{storeWithCity(d)}</span>
        <span className="gp-row-sub">{title}</span>
        <OtdLine deal={{ ...d, deal_title: title }} />
      </span>
      {pill ? <span className="pp-save">{pill}</span> : <span className="gp-pill muted">Deal</span>}
    </Link>
  );
}

export default async function EventHub({ ev, extraFaqs = [] }: { ev: SaleEvent; extraFaqs?: Faq[] }) {
  const deals = await readLiveDeals();
  const n = daysUntil(ev);
  const isDay = n === 0;
  const past = n < 0;
  const all = deals || [];
  const announced = all.filter((d) => ev.match.test(`${d.deal_title || ""} ${d.deal_description || ""}`));
  const ranked = rankStoreDeals(all);
  const list = capPerStore(isDay ? ranked : rankStoreDeals(announced), STORE_CAP.cityList);
  const preview = capPerStore(ranked.filter((d) => saveLabel(d)), STORE_CAP.shortList).kept.slice(0, 5);
  const canWatch = !past && !isDay && watchesAvailable() && !!process.env.RESEND_API_KEY;
  const url = `${brand.url}${ev.path}`;

  const faqs: Faq[] = [
    { q: `When is ${ev.name}?`, a: `${ev.dateLabel}.` },
    { q: `What is ${ev.name}?`, a: ev.what },
    {
      q: `How will PuffPrice track ${ev.name} deals?`,
      a: `The morning of ${ev.name} we check every Central Illinois dispensary's own website, the same way we do every day, and put every deal we find on this page, biggest everyday saving first, with the price after tax where a store posts a price. Before then, any deal a store announces for the day shows up here as soon as it's on their site.`,
    },
    ...extraFaqs,
  ];
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: `${ev.name} ${ev.date.slice(0, 4)}: Central Illinois dispensary deals`,
      startDate: ev.date,
      endDate: ev.date,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: { "@type": "Place", name: "Central Illinois", address: { "@type": "PostalAddress", addressRegion: "IL", addressCountry: "US" } },
      organizer: { "@type": "Organization", name: brand.name, url: brand.url },
      url,
    },
  ];

  return (
    <GuideShell
      crumbs={[{ href: "/deals/all", label: "Deals" }]}
      eyebrow={`${ev.name} · ${isDay ? "today" : n > 0 ? `${n} day${n === 1 ? "" : "s"} away` : ev.dateLabel}`}
      title={`${ev.name} in Central Illinois`}
      lede={
        <>
          {ev.name} is <b>{ev.dateLabel}</b>. {ev.what}{" "}
          {isDay
            ? "Here's every live deal from the stores' own sites, biggest saving first. We re-check them every morning."
            : past
            ? "This year's has passed; next year's date goes up here once it's set."
            : "This page is ready and waiting. That morning it fills with every deal we find, so you won't have to open twenty tabs."}
        </>
      }
      jsonLd={jsonLd}
    >
      <style>{GUIDE_EXTRA_CSS + EVENT_CSS}</style>

      {n > 0 && (
        <div className="ev-count" aria-label={`${n} days until ${ev.name}`}>
          <b>{n}</b>
          <span>days to go. Nothing to do yet.</span>
        </div>
      )}

      {canWatch && (
        <div className="ev-panel">
          <b className="t">Get it the morning of</b>
          <p>One email on {ev.dateLabel.replace(/, \d{4}$/, "")} with the best deals we find. That&apos;s the only one.</p>
          <WatchControl kind="event" event={ev.id} eventName={ev.name} cities={CENTRAL_IL_CITIES.map((c) => c.name)} />
        </div>
      )}

      {deals === null ? (
        <p className="gp-note" role="status">We couldn&apos;t read today&apos;s deals just now. Give it a minute and refresh.</p>
      ) : list.kept.length > 0 ? (
        <>
          <h2 className="gp-h2">{isDay ? `Every deal today · ${ranked.length}` : "Announced early"}</h2>
          {!isDay && <p className="gp-note">Deals stores have already posted that mention {ev.name}.</p>}
          <div className="gp-list">{list.kept.map((d) => <DealRow key={d.deal_id} d={d} />)}</div>
          <StoreOverflowLinks stores={list.overflow} />
        </>
      ) : !isDay ? (
        <p className="gp-note" style={{ marginTop: 18 }}>No store has announced a {ev.name} deal yet. The first one that does shows up here.</p>
      ) : (
        <p className="gp-note" style={{ marginTop: 18 }}>No deals are live yet this morning. Check back after 7 AM Central.</p>
      )}

      <h2 className="gp-h2">How we&apos;ll track the day</h2>
      <ol className="ev-steps">
        <li>That morning we read every Central Illinois dispensary&apos;s own website and official posts. Never Weedmaps, Leafly or other aggregators.</li>
        <li>Every deal goes on this page, biggest everyday saving first. First-time, &ldquo;up to&rdquo; and buy-several deals are listed, just not on top.</li>
        <li>Where a store posts a price, we add Illinois and local tax so you see what it costs at the register.</li>
        <li>No store can pay for a spot, and no store can take more than {STORE_CAP.cityList} rows. <Link href="/how-we-rank">How we rank</Link>.</li>
      </ol>

      {!isDay && preview.length > 0 && (
        <>
          <h2 className="gp-h2">Can&apos;t wait? The best deals today</h2>
          <div className="gp-list">{preview.map((d) => <DealRow key={d.deal_id} d={d} />)}</div>
        </>
      )}

      <FaqBlock faqs={faqs} />
      <p className="gp-note">Buy on the day, enjoy it at home. The counter always has the final word. Independent. Nobody pays us to rank. 21+.</p>
    </GuideShell>
  );
}
