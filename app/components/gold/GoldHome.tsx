import Link from "next/link";
import { Leaf, CategoryArt, Grain } from "./Art";
import { GoldHeader, GoldFooter } from "./Chrome";
import {
  nearestExhale,
  lowestList,
  amountOf,
  productOf,
  storeName,
  storeHref,
  directionsHref,
  milesTo,
  milesLabel,
  type Origin,
} from "../../../lib/exhale";
import { effectiveCategory } from "../../../lib/inferCategory";
import { CENTRAL_IL_PUBLIC_CITIES } from "../../../lib/constants/regions";
import { ctTime, ctDay, type GoldHome as Data, type GoldDeal } from "../../../lib/home/goldData";

const CATS: { slug: string; label: string }[] = [
  { slug: "flower", label: "Flower" },
  { slug: "edibles", label: "Edibles" },
  { slug: "vapes", label: "Vapes" },
  { slug: "concentrate", label: "Dabs & wax" },
];

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="m7.5 12.5 3 3 6-6.5" />
    </svg>
  );
}

/** Picture for a deal: the inferred category, with vape words winning
 *  ("live resin all-in-one" is a vape, not a concentrate). */
function artCategory(d: GoldDeal): string | null {
  const t = `${d.deal_title || ""} ${d.deal_description || ""}`;
  if (/\b(vapes?|all[- ]in[- ]ones?|aio|carts?|cartridges?|disposables?|pods?)\b/i.test(t)) return "vapes";
  if (/\b(pre[- ]?rolls?|joints?|blunts?)\b/i.test(t)) return "flower";
  return effectiveCategory(d);
}

function seenLine(d: GoldDeal): string {
  const day = ctDay(d.verified_at);
  const t = ctTime(d.verified_at);
  const store = storeName(d);
  if (!day || !t) return `Seen on ${store}'s own site. Nobody pays to rank.`;
  return `Seen on ${store}'s own site ${day} at ${t}. Nobody pays to rank.`;
}

function HeroTicket({ deal, miles }: { deal: GoldDeal; miles: number | null }) {
  const a = amountOf(deal)!;
  const cat = artCategory(deal);
  const ml = milesLabel(miles);
  const isPct = a.kind === "percent";
  return (
    <div>
      <article className="g-ticket" aria-label={`Best deal near you: ${a.big} off ${productOf(deal)} at ${storeName(deal)}`}>
        <div className="g-ticket-top">
          <div className="g-ticket-label">
            <span>Best deal near you</span>
            <span>{deal.city}</span>
          </div>
          <div className="g-save g-display">
            {a.upTo && <span className="g-off" style={{ display: "block", marginLeft: 0, fontSize: 20 }}>up to</span>}
            <span className="g-num">{isPct ? a.big.replace("%", "") : a.big}</span>
            <span className="g-off g-italic">{isPct ? "% off" : "off"}</span>
          </div>
          <div className="g-ticket-art">
            <CategoryArt category={cat} />
          </div>
          <p className="g-product">{productOf(deal)}</p>
        </div>
        <div className="g-tear" aria-hidden="true" />
        <div className="g-ticket-bot">
          <div className="g-store">
            <div>
              <Link href={storeHref(deal)} className="g-store-name">{storeName(deal)}</Link>
              <div className="g-meta">
                <span>{deal.city}, IL</span>
                {deal.drive_thru ? <span>Drive-thru</span> : null}
              </div>
            </div>
            {ml && (
              <div className="g-miles">
                {ml.replace(" mi", "")}
                <small>{ml.startsWith("under") ? "" : "miles"}</small>
              </div>
            )}
          </div>
          <a className="g-btn" href={directionsHref(deal)} target="_blank" rel="noopener noreferrer">
            Take me there <Arrow />
          </a>
        </div>
      </article>
      <p className="g-proof">
        <Check />
        <span>{seenLine(deal)}</span>
      </p>
    </div>
  );
}

function MiniTicket({ deal, origin }: { deal: GoldDeal; origin: Origin | null }) {
  const a = amountOf(deal)!;
  const ml = milesLabel(milesTo(deal, origin));
  const isPct = a.kind === "percent";
  return (
    <Link className="g-mini" href={storeHref(deal)}>
      <div className="g-mini-top">
        <div className="g-mini-save g-display">
          {isPct ? a.big.replace("%", "") : a.big}
          <small className="g-italic">{isPct ? "%" : "off"}</small>
        </div>
        <CategoryArt category={artCategory(deal)} className="g-mini-art" />
      </div>
      <div className="g-mini-prod">{productOf(deal)}</div>
      <div className="g-mini-store">
        <span>{storeName(deal)}</span>
        <span>{ml || deal.city}</span>
      </div>
    </Link>
  );
}

export default function GoldHome({ data, origin }: { data: Data; origin: Origin | null }) {
  const pick = nearestExhale(data.pool, origin);
  const hero = (pick?.deal as GoldDeal) || null;
  const more = lowestList(data.pool, 4, origin, hero?.deal_id || null) as GoldDeal[];
  const city = origin?.city || null;
  const towns = CENTRAL_IL_PUBLIC_CITIES.map((c) => ({ ...c, n: data.byCity[c.name] || 0 })).filter((c) => c.n > 0);

  return (
    <div className="g-root">
      <GoldHeader city={city} />

      <section className="g-hero" aria-labelledby="g-h1">
        <Grain />
        <span className="g-hero-glow" aria-hidden="true" />
        <div className="g-wrap g-hero-in">
          <div className="g-hero-copy">
            <Leaf tone="gold" className="g-hero-leaf" />
            <h1 id="g-h1" className="g-display">
              Best Bud <span className="g-buck">For Your <span className="g-gold-text">Buck$</span></span>
            </h1>
            <div className="g-eyebrow" style={{ marginTop: 14 }}>{data.total} deals · {data.stores} stores · today</div>
          </div>
          {hero ? (
            <HeroTicket deal={hero} miles={pick?.miles ?? null} />
          ) : (
            <p className="g-hero-sub">Nothing worth the drive yet today. We check again tomorrow morning.</p>
          )}
        </div>
      </section>

      {more.length > 0 && (
        <section className="g-sec g-sec-paper" aria-labelledby="g-more">
          <div className="g-wrap">
            <div className="g-sec-head">
              <div>
                <div className="g-eyebrow">Also worth the trip</div>
                <h2 id="g-more" className="g-display">More near {city || "you"}</h2>
              </div>
              <Link className="g-more" href="/deals">All {data.total}</Link>
            </div>
            <div className="g-row g-row-paper">
              {more.map((d) => (
                <MiniTicket key={d.deal_id} deal={d} origin={origin} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="g-sec" aria-labelledby="g-cats">
        <div className="g-wrap">
          <div className="g-sec-head">
            <div>
              <div className="g-eyebrow">What are you into?</div>
              <h2 id="g-cats" className="g-display">Shop by <span className="g-italic">the good stuff</span></h2>
            </div>
          </div>
          <div className="g-cats">
            {CATS.map((c) => (
              <Link key={c.slug} className="g-cat" href={`/deals/${c.slug}`}>
                <CategoryArt category={c.slug} className="g-cat-art" />
                <b>{c.label}</b>
                <span>{data.byCategory[c.slug] ? `${data.byCategory[c.slug]} deals today` : "See today's deals"}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="g-sec g-sec-night" aria-labelledby="g-towns">
        <div className="g-wrap">
          <div className="g-sec-head">
            <div>
              <div className="g-eyebrow">Pick your town</div>
              <h2 id="g-towns" className="g-display">Deals by town</h2>
            </div>
          </div>
          <div className="g-towns">
            {towns.map((t) => (
              <Link key={t.slug} className="g-town" href={`/city/${t.slug}`}>
                {t.name} <small>{t.n}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="g-sec" aria-labelledby="g-alert">
        <div className="g-wrap">
          <div className="g-alert">
            <Leaf tone="ghost" className="g-alert-leaf" />
            <div>
              <div className="g-eyebrow">Free. Email only.</div>
              <h2 id="g-alert" className="g-display">The best deal in your town, <span className="g-italic g-gold-text">every morning.</span></h2>
              <p>One email a day, at most. Unsubscribe in one tap.</p>
            </div>
            <form className="g-form" action="/alerts" method="get">
              <label className="sr-only" htmlFor="g-email">Email address</label>
              <input id="g-email" className="g-input" type="email" name="email" placeholder="you@email.com" autoComplete="email" required />
              <button className="g-btn g-btn-gold" type="submit">Send me the deal <Arrow /></button>
            </form>
          </div>
        </div>
      </section>

      <section className="g-sec g-sec-paper" aria-labelledby="g-trust">
        <div className="g-wrap">
          <div className="g-sec-head">
            <div>
              <div className="g-eyebrow">Why trust it</div>
              <h2 id="g-trust" className="g-display">Straight from the counter</h2>
            </div>
            <Link className="g-more" href="/how-we-rank">How we rank</Link>
          </div>
          <div className="g-trust">
            <div className="g-trust-item">
              <Check />
              <div><b>The stores&rsquo; own sites</b><span>Every deal is read off the dispensary&rsquo;s website or menu. Never Leafly or Weedmaps.</span></div>
            </div>
            <div className="g-trust-item">
              <Check />
              <div><b>Checked every morning</b><span>Last check {ctDay(data.lastSeen) || "today"}{ctTime(data.lastSeen) ? ` at ${ctTime(data.lastSeen)}` : ""}. Old deals drop off on their own.</span></div>
            </div>
            <div className="g-trust-item">
              <Check />
              <div><b>Nobody pays to rank</b><span>The biggest saving near you goes first. Stores can&rsquo;t buy a spot.</span></div>
            </div>
          </div>
        </div>
      </section>

      <GoldFooter />
    </div>
  );
}
