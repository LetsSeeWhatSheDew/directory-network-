// app/deal-of-the-day/page.tsx — today's deal of the day: the biggest real
// saving among live Central Illinois deals (lib/dealOfTheDay.ts), with its
// share images (/og/deal-of-the-day) ready to copy or download.
// Real deals only: if nothing qualifies, the page says so.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import ShareActions from "../components/ShareActions";
import OtdLine from "../components/OtdLine";
import { FaqBlock, GUIDE_EXTRA_CSS, type Faq } from "../guides/GuideParts";
import { brand } from "../../lib/brand";
import { getDealOfTheDay, dotdCopy, checkedLabel, type DotdResult } from "../../lib/dealOfTheDay";
import { directionsHref, storeHref, storeWithCity, productOf, saveLabel, cleanDealTitle } from "../../lib/exhale";
import { todayLabel } from "../og/shared";

export const revalidate = 900;

const URL_ = `${brand.url}/deal-of-the-day`;

function describe(r: DotdResult): string {
  if (r.status !== "ok") return "The biggest real saving at a Central Illinois dispensary today, checked on the store's own site every morning. No store pays to be picked.";
  const c = dotdCopy(r.pick);
  return `${c.saving} ${c.product} at ${c.store}: the biggest everyday saving among ${r.live} live Central Illinois dispensary deals today. Checked on the store's own site. No store pays to be picked.`;
}

export async function generateMetadata(): Promise<Metadata> {
  const r = await getDealOfTheDay();
  const c = r.status === "ok" ? dotdCopy(r.pick) : null;
  const title = c ? `Deal of the Day: ${c.saving} at ${c.store}` : "Dispensary Deal of the Day, Central Illinois";
  const img = (size: string) => `${brand.url}/og/deal-of-the-day?size=${size}&d=${r.day}`;
  return {
    title,
    description: describe(r),
    alternates: { canonical: URL_ },
    openGraph: {
      title,
      description: describe(r),
      url: URL_,
      type: "website",
      images: [{ url: img("og"), width: 1200, height: 630, alt: c ? `${c.saving} ${c.product} at ${c.store}` : "PuffPrice deal of the day" }],
    },
    twitter: { card: "summary_large_image", title, description: describe(r), images: [img("og")] },
  };
}

const CSS = `
.dt-hero{margin:22px 0 8px;padding:20px;border-radius:22px;background:var(--pp-haze);border:1px solid var(--pp-haze-border)}
.dt-big{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.dt-big b{font-family:var(--font-body);font-weight:700;font-size:clamp(64px,16vw,96px);letter-spacing:-.055em;line-height:.9;color:var(--pp-big)}
.dt-big span{font-size:1.2rem;font-weight:600;color:var(--pp-ink)}
.dt-prod{font-size:1.05rem;color:var(--pp-body);margin:10px 0 2px;line-height:1.45}
.dt-store{font-family:var(--font-breath);font-weight:400;font-size:1.7rem;line-height:1.1;margin:10px 0 4px;color:var(--pp-ink)}
.dt-meta{font-family:var(--font-mono);font-size:.76rem;color:var(--pp-muted);margin:4px 0 0}
.dt-acts{display:flex;flex-wrap:wrap;gap:14px;margin-top:14px;font-size:.9rem}
.dt-acts a{color:var(--pp-mark);font-weight:600;text-decoration:none}
.dt-imgs{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,3fr);gap:12px;align-items:start;margin-top:12px}
.dt-imgs figure{margin:0;display:flex;flex-direction:column;gap:6px}
.dt-imgs img{width:100%;height:auto;border-radius:14px;border:1px solid var(--pp-border);background:var(--pp-paper)}
.dt-imgs figcaption{font-family:var(--font-mono);font-size:.7rem;color:var(--pp-muted)}
@media(max-width:560px){.dt-imgs{grid-template-columns:1fr}}
.dt-rules{margin:0;padding-left:1.2rem;line-height:1.6;max-width:66ch}
.dt-rules li{margin-bottom:6px}
`;

export default async function DealOfTheDayPage() {
  const r = await getDealOfTheDay();
  const c = r.status === "ok" ? dotdCopy(r.pick) : null;
  const checked = r.status === "ok" ? checkedLabel(r.pick.verified_at) : null;
  const shareUrl = `${URL_}?utm_source=share&utm_medium=copy_link`;

  const faqs: Faq[] = [
    {
      q: "What is today's best dispensary deal in Central Illinois?",
      a:
        r.status === "ok" && c
          ? `${c.saving} ${c.product} at ${c.store}${checked ? `, checked on the store's own site ${checked} Central` : ""}. It's the biggest everyday saving among ${r.live} live deals at ${r.stores} Central Illinois stores today.`
          : r.status === "none"
          ? `No deal clears the bar today: ${r.live} deals are live, but none is an everyday amount off that we've re-checked in the last week. Every live deal is on the deals page.`
          : "We couldn't read today's deals just now. Every deal is checked on the stores' own sites each morning; try again shortly.",
    },
    {
      q: "How is the deal of the day picked?",
      a: "The biggest real saving wins: a stated percent or dollars off that anyone can get, on a deal we re-found on the store's own site within the last week. First-time, veteran, birthday, 'up to' and buy-several deals don't qualify. Dollars-off deals are compared to percent-off deals as a share of a typical basket for that kind of product. Ties rotate between stores day to day.",
    },
    {
      q: "Can a dispensary pay to be the deal of the day?",
      a: "No. Nobody pays us to rank, and there is no paid placement anywhere on PuffPrice. A store with more deals posted gets no extra chances: the runners-up are one per store.",
    },
    {
      q: "Can I share the deal of the day image?",
      a: "Yes. Copy the link or download the 1080×1350 image (Instagram portrait size) or the 1200×630 link preview. They're drawn from live data and refresh through the day. Meta restricts posts that promote cannabis deals, so X, Threads, Reddit and group texts are the safer places for them.",
    },
  ];

  const jsonLd: object[] = [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Central Illinois", item: brand.url },
        { "@type": "ListItem", position: 2, name: "Deal of the day", item: URL_ },
      ],
    },
  ];
  if (r.status === "ok") {
    const all = [r.pick, ...r.runnersUp];
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Central Illinois dispensary deal of the day, ${r.day}`,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: all.length,
      itemListElement: all.map((d, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${brand.url}/deal/${d.deal_id}`,
        name: `${cleanDealTitle(d.deal_title)} at ${storeWithCity(d)}`,
      })),
    });
  }

  return (
    <GuideShell
      crumbs={[{ href: "/deals/all", label: "Deals" }]}
      eyebrow={`Deal of the day · ${todayLabel()}`}
      title="Today's biggest real saving"
      lede={<>One deal a day: the biggest everyday amount off at a Central Illinois dispensary, checked on the store&apos;s own site. No fine print leads, and nobody pays to be picked.</>}
      jsonLd={jsonLd}
    >
      <style>{GUIDE_EXTRA_CSS + CSS}</style>

      {r.status === "ok" && c ? (
        <section className="dt-hero" aria-label="Deal of the day">
          <div className="dt-big">
            <b>{r.amount.big}</b>
            <span>off</span>
          </div>
          <p className="dt-prod">{c.product}</p>
          <p className="dt-store">{c.store}</p>
          <OtdLine deal={{ ...r.pick, deal_title: c.title }} />
          <p className="dt-meta">
            {checked ? `Checked on the store's own site ${checked} CT` : "Checked on the store's own site"} · {r.eligible} of {r.live} live deals qualified today
          </p>
          <div className="dt-acts">
            <Link href={`/deal/${r.pick.deal_id}`} data-track="deal_tap" data-track-deal={r.pick.deal_id} data-track-from="dotd">See the deal →</Link>
            <a href={directionsHref(r.pick)} target="_blank" rel="noopener noreferrer" data-track="directions_tap" data-track-slug={r.pick.slug || r.pick.listing_slug || undefined} data-track-from="dotd">Directions</a>
            <Link href={storeHref(r.pick)}>Everything at this store</Link>
          </div>
        </section>
      ) : (
        <section className="dt-hero" aria-label="Deal of the day">
          <p className="dt-store" style={{ marginTop: 0 }}>{r.status === "none" ? "No clear winner today." : "We couldn't read today's deals just now."}</p>
          <p className="dt-prod">
            {r.status === "none"
              ? `${r.live} deals are live at ${r.stores} stores, but none is an everyday amount off that we've re-checked this week. Nothing gets promoted just to fill the spot.`
              : "Every deal is checked on the stores' own sites each morning. Give it a minute and refresh."}
          </p>
          <div className="dt-acts"><Link href="/deals/all">Every deal today →</Link></div>
        </section>
      )}

      <h2 className="gp-h2">Share it</h2>
      <p className="gp-note">Drawn from live data, so the numbers are always real. They refresh through the day.</p>
      <div className="dt-imgs">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/og/deal-of-the-day?size=post&d=${r.day}`} alt={c ? `Deal of the day image: ${c.saving} at ${c.store}` : "Deal of the day image"} width={1080} height={1350} />
          <figcaption>Instagram portrait · 1080 × 1350</figcaption>
        </figure>
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/og/deal-of-the-day?size=og&d=${r.day}`} alt={c ? `Link preview: ${c.saving} at ${c.store}` : "Deal of the day link preview"} width={1200} height={630} />
          <figcaption>Link preview · 1200 × 630</figcaption>
        </figure>
      </div>
      <ShareActions
        url={shareUrl}
        from="dotd"
        downloads={[
          { href: `/og/deal-of-the-day?size=post&download=1&d=${r.day}`, label: "Download for Instagram", sub: "1080 × 1350 PNG" },
          { href: `/og/deal-of-the-day?size=og&download=1&d=${r.day}`, label: "Download link preview", sub: "1200 × 630 PNG" },
        ]}
      />
      <p className="gp-note">Meta (Facebook and Instagram) restricts posts that promote cannabis deals. X, Threads, Reddit and group texts are the safer places for these.</p>

      {r.status === "ok" && r.runnersUp.length > 0 && (
        <>
          <h2 className="gp-h2">Also good today</h2>
          <div className="gp-list">
            {r.runnersUp.map((d) => {
              const t = cleanDealTitle(d.deal_title);
              return (
                <Link key={d.deal_id} href={`/deal/${d.deal_id}`} className="gp-row" data-track="deal_tap" data-track-deal={d.deal_id} data-track-from="dotd_runner_up">
                  <span className="gp-row-main">
                    <span className="gp-row-title">{storeWithCity(d)}</span>
                    <span className="gp-row-sub">{productOf({ ...d, deal_title: t })}</span>
                  </span>
                  <span className="pp-save">{saveLabel({ ...d, deal_title: t })}</span>
                </Link>
              );
            })}
          </div>
          <p className="gp-note">One per store, so a store that posts a lot of specials can&apos;t crowd the list.</p>
        </>
      )}

      <h2 className="gp-h2">How we pick it</h2>
      <ol className="dt-rules">
        <li><b>Everyday savings only.</b> A stated percent or dollars off that anyone can get. First-time, veteran, birthday, &ldquo;up to&rdquo; and buy-several deals are real, but they don&apos;t lead.</li>
        <li><b>Fresh.</b> Re-found on the store&apos;s own site within the last 7 days and not past its end date.</li>
        <li><b>Biggest saving wins.</b> Percent-off compares by its percent. A dollars-off deal is compared as a share of a typical basket for that kind of product (for example, $50 of flower). That comparison is only used to order deals; we never show it as a number.</li>
        <li><b>Fair.</b> Ties rotate between stores day to day, and the runners-up are one per store. No store can pay for any of it. <Link href="/how-we-rank">How we rank</Link>.</li>
      </ol>

      <FaqBlock faqs={faqs} />
      <p className="gp-note">The counter always has the final word. Independent. Nobody pays us to rank. 21+.</p>
    </GuideShell>
  );
}
