import Link from "next/link";
import type { ReactNode } from "react";
import { Leaf, CategoryArt, Grain } from "./Art";
import GoldLocate from "./GoldLocate";
import GoldSignup from "./GoldSignup";
import { HeroTicket, MiniTicket, Arrow, Check } from "./Kit";
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
import { ctTime, ctDay, pickOpenFirst, type GoldHome as Data, type GoldDeal } from "../../../lib/home/goldData";

const CATS: { slug: string; label: string }[] = [
  { slug: "flower", label: "Flower" },
  { slug: "edibles", label: "Edibles" },
  { slug: "vapes", label: "Vapes" },
  { slug: "concentrate", label: "Dabs & wax" },
];

export default function GoldHome({ data, origin, faq }: { data: Data; origin: Origin | null; faq?: ReactNode }) {
  // Open stores first: the best deal at a store you can walk into right now.
  const pick = pickOpenFirst(data.pool, origin, data.open);
  const hero = (pick?.deal as GoldDeal) || null;
  const more = lowestList(data.pool, 4, origin, hero?.deal_id || null) as GoldDeal[];
  const city = origin?.city || null;
  const towns = CENTRAL_IL_PUBLIC_CITIES.map((c) => ({ ...c, n: data.byCity[c.name] || 0 })).filter((c) => c.n > 0);

  return (
    <div className="g-root">
      <section className="g-hero" aria-labelledby="g-h1">
        <Grain />
        <span className="g-hero-glow" aria-hidden="true" />
        <div className="g-wrap g-hero-in">
          <div className="g-hero-copy">
            <Leaf tone="gold" className="g-hero-leaf" />
            <h1 id="g-h1" className="g-display">
              Best Bud <span className="g-buck">For Your <span className="g-gold-text">Buck$</span></span>
            </h1>
            <div className="g-eyebrow" style={{ marginTop: 14 }}>{data.total} deals · {data.stores} stores · all of Central IL</div>
            <GoldLocate serverCity={city} />
          </div>
          {hero ? (
            <HeroTicket deal={hero} miles={pick?.miles ?? null} scope={pick?.scope || "region"} status={data.open[(hero.slug || hero.listing_slug) as string] || null} />
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
                <span>{data.byCategory[c.slug] ? `${data.byCategory[c.slug]} in Central IL` : "See today's deals"}</span>
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
              <h2 id="g-alert" className="g-display">Your town&rsquo;s best deals, <span className="g-italic g-gold-text">every Monday.</span></h2>
              <p>One email a week. Unsubscribe in one tap.</p>
            </div>
            <GoldSignup defaultCity={city} />
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

      {faq}
    </div>
  );
}

/** Visible FAQ that backs the home page's FAQPage schema. */
export function GoldFaq({ entries }: { entries: { q: string; a: string }[] }) {
  return (
    <section className="g-sec g-sec-paper g-faq" aria-labelledby="g-faq">
      <div className="g-wrap">
        <div className="g-eyebrow">Good questions</div>
        <h2 id="g-faq" className="g-display">Asked a lot</h2>
        <div className="g-faq-list">
          {entries.map((e, i) => (
            <details key={i} className="g-faq-item">
              <summary>{e.q}</summary>
              <p>{e.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
