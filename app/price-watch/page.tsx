// app/price-watch/page.tsx — "email me when it drops" for one item at one
// store: the cheapest eighth, 1g cart or 100mg gummies each store lists on
// its own online menu today (lib/menuPrices.ts). A watch is a deal_alerts row
// (lib/dealWatch.ts, 'price_watch') with the same double opt-in, one-tap stop
// and daily send as every other PuffPrice email (lib/watchRuns.ts).
// Watch buttons show only when email sending is configured; the prices
// always come from today's menu reads, never an estimate.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import WatchControl from "../components/WatchControl";
import { FaqBlock, GUIDE_EXTRA_CSS, type Faq } from "../guides/GuideParts";
import { brand } from "../../lib/brand";
import { getCheapestBoard, REF_UNITS, REF_DEF, money, checkedLabel, type RefUnit } from "../../lib/menuPrices";
import { watchesAvailable } from "../../lib/dealWatch";
import { itemWords, MIN_DROP_CENTS } from "../../lib/priceWatch";

export const metadata: Metadata = {
  title: "Price Watch: Get an Email When a Dispensary Price Drops",
  description:
    "Watch the cheapest eighth, 1g vape cart or 100mg gummies at any Central Illinois dispensary. We read each store's own menu twice a day and email you when the out-the-door price drops. Free.",
  alternates: { canonical: `${brand.url}/price-watch` },
};

const FAQS: Faq[] = [
  {
    q: "What exactly am I watching?",
    a: "The cheapest item of one exact size at one store: an eighth of flower (3.5g), a 1g vape cartridge or a 100mg pack of gummies, any brand. If a cheaper product shows up at that size, that counts as a drop too. Prices are out the door, with Illinois and local tax added.",
  },
  {
    q: "When will you email me?",
    a: `When the out-the-door price falls at least $${(MIN_DROP_CENTS / 100).toFixed(2)} below the price you started watching at (or the last price we emailed you). If it goes back up, the next drop counts again. Set an "only if it's under" price and we'll wait for that. At most one email a day, and nothing at all until you tap the confirm link.`,
  },
  {
    q: "Where do the prices come from?",
    a: "Each store's own online menu, read around 6 AM and noon Central. If we can't read a store's menu on a given day, nothing happens that day: we never guess a price.",
  },
];

export default async function PriceWatchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const board = await getCheapestBoard();
  const on = watchesAvailable() && !!process.env.RESEND_API_KEY;
  const hasData = REF_UNITS.some((r) => board.byRef[r].length > 0);
  const focus = (ref: RefUnit, slug: string) => sp.item === ref && sp.store === slug;

  return (
    <GuideShell
      crumbs={[{ href: "/cheapest", label: "Cheapest today" }]}
      eyebrow="Price watch"
      title="Tell me when it drops"
      lede={<>Pick an item at a store. We read the store&apos;s own menu twice a day and send one short email when the out-the-door price falls. No drop, no email.</>}
      jsonLd={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }}
    >
      <style>{GUIDE_EXTRA_CSS + `
        .pw-row{padding:13px 14px;border-top:1px solid var(--pp-border);scroll-margin-top:90px}
        .pw-row:first-child{border-top:none}
        .pw-row[data-focus="1"]{background:var(--pp-paper)}
        .pw-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
        .pw-top a{font-weight:600;color:inherit;text-decoration:none}
        .pw-prod{font-size:.88rem;color:var(--pp-body);overflow-wrap:anywhere}
        .pw-meta{font-size:.76rem;color:var(--pp-muted)}
        .pw-r{text-align:right;flex:0 0 auto}
        .pw-r b{font-family:var(--font-mono);font-weight:500;font-size:1.1rem;letter-spacing:-.02em;display:block}
        .pw-r span{font-size:.74rem;color:var(--pp-muted);white-space:nowrap}
        .pw-row .wc{margin:8px 0 0}
      `}</style>

      {!on && hasData && (
        <p className="gp-note" role="status">Price alerts are switched off for the moment, so there&apos;s nothing to sign up for right now. Today&apos;s prices are below.</p>
      )}

      {!hasData ? (
        <div className="gq">
          <p className="gq-l">No menu prices yet</p>
          <p>
            We only let you watch a price we read today, and we don&apos;t have a fresh menu read right now. The menu reader runs around 6 AM and noon Central.
            In the meantime, <Link href="/cheapest">today&apos;s cheapest</Link> and <Link href="/out-the-door">out-the-door deal prices</Link> cover the same question.
          </p>
        </div>
      ) : (
        REF_UNITS.map((ref) => {
          const rows = board.byRef[ref];
          if (!rows.length) return null;
          return (
            <section key={ref} aria-labelledby={`pw-${ref}`}>
              <h2 className="gp-h2" id={`pw-${ref}`}>
                {REF_DEF[ref].label} <span style={{ fontFamily: "var(--font-mono)", fontSize: ".8rem", color: "var(--pp-muted)" }}>{REF_DEF[ref].size}</span>
              </h2>
              <div className="gp-list">
                {rows.map((it) => (
                  <div key={it.listingSlug} id={`${ref}-${it.listingSlug}`} className="pw-row" data-focus={focus(ref, it.listingSlug) ? "1" : undefined}>
                    <div className="pw-top">
                      <span style={{ minWidth: 0 }}>
                        <Link href={`/dispensary/${it.listingSlug}`}>{it.storeName}</Link>
                        <span className="pw-meta"> · {it.city}</span>
                        <br />
                        <span className="pw-prod">{it.brand && !it.product.toLowerCase().startsWith(it.brand.toLowerCase()) ? `${it.brand} ` : ""}{it.product}</span>
                        <br />
                        <span className="pw-meta">checked {checkedLabel(it.checkedAt)} on the store&apos;s own menu</span>
                      </span>
                      <span className="pw-r">
                        <b>{money(it.otd)}</b>
                        <span>{money(it.pretax)} + tax</span>
                      </span>
                    </div>
                    {on && (
                      <WatchControl
                        kind="price"
                        slug={it.listingSlug}
                        storeName={it.storeName}
                        item={ref}
                        itemLabel={itemWords(ref)}
                        nowLabel={money(it.otd)}
                        startOpen={focus(ref, it.listingSlug)}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="gp-note">Out the door in the store&apos;s city, {REF_DEF[ref].taxNote}.</p>
            </section>
          );
        })
      )}

      <FaqBlock faqs={FAQS} />
      <p className="gp-note">Menu prices change during the day and can differ in store. The counter always has the final word. Independent. Nobody pays us to rank. 21+.</p>
    </GuideShell>
  );
}
