// /guides/dispensary-first-time-discounts-central-illinois — live list of
// conditional discounts (first-time, veterans, seniors, medical…) from the
// deals we find on each store's own site.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../../components/GuideShell";
import { brand } from "../../../lib/brand";
import { getLiveDeals, discountKind, fmtDay, todayCT, todayIsoCT, type DiscountKind, type LiveDeal } from "../../../lib/guides";
import { storeWithCity, cleanDealTitle, saveLabel } from "../../../lib/exhale";
import { QuickAnswer, FaqBlock, RelatedGuides, GUIDE_EXTRA_CSS, GUIDE_CRUMBS, guideJsonLd, type Faq } from "../GuideParts";

export const revalidate = 3600;
const SLUG = "dispensary-first-time-discounts-central-illinois";
const TITLE = "First-time, veteran and senior dispensary discounts in Central Illinois";
const ORDER: DiscountKind[] = ["First-time", "Veterans & military", "Seniors", "Medical patients", "Industry", "Birthday"];

export const metadata: Metadata = {
  title: "First-Time Dispensary Discounts in Central Illinois (Plus Veteran & Senior Deals)",
  description:
    "Every first-time customer, veteran, military and senior discount posted by Peoria, Bloomington-Normal, Champaign-Urbana, Pekin and Springfield dispensaries on their own sites, store by store. Updated hourly.",
  alternates: { canonical: `${brand.url}/guides/${SLUG}` },
};

export default async function DiscountsPage() {
  const live = await getLiveDeals();
  const updated = todayCT();
  const groups = new Map<DiscountKind, LiveDeal[]>();
  for (const d of live) {
    const k = discountKind(d.deal_title);
    if (!k) continue;
    groups.set(k, [...(groups.get(k) || []), d]);
  }
  for (const [, ds] of groups) ds.sort((a, b) => (Number(b.discount_value) || 0) - (Number(a.discount_value) || 0));
  const line = (k: DiscountKind) => (groups.get(k) || []).map((d) => `${storeWithCity(d)} (${cleanDealTitle(d.deal_title)})`).join("; ");
  const storesIn = (k: DiscountKind) => new Set((groups.get(k) || []).map((d) => d.slug || d.listing_slug)).size;
  const ft = groups.get("First-time") || [];
  const vet = groups.get("Veterans & military") || [];
  const sen = groups.get("Seniors") || [];
  const nFt = storesIn("First-time"), nVet = storesIn("Veterans & military"), nSen = storesIn("Seniors");

  const quick = ft.length || vet.length || sen.length
    ? `As of ${updated}, ${[
        nFt ? `${nFt} Central Illinois store${nFt === 1 ? " posts" : "s post"} a first-time customer discount on ${nFt === 1 ? "its" : "their"} own site: ${line("First-time")}` : "",
        nVet ? `${nVet} store${nVet === 1 ? " posts" : "s post"} a veteran or military discount` : "",
        nSen ? `${nSen} store${nSen === 1 ? " posts" : "s post"} a senior discount` : "",
      ].filter(Boolean).join(". ")}. Bring your ID (plus proof of service for veteran deals) and ask at the counter, since stores don't always post every discount online.`
    : `As of ${updated}, we don't see a first-time, veteran or senior discount posted on any Central Illinois store's own site. Ask at the counter: stores don't always post these online.`;

  const faqs: Faq[] = [
    { q: "Which Central Illinois dispensaries have a first-time discount?", a: ft.length ? `Today: ${line("First-time")}. Each is taken from the store's own website.` : "None posted on a store's own site today. Ask when you check in; some stores offer one without posting it." },
    { q: "Do Central Illinois dispensaries give veteran discounts?", a: vet.length ? `Yes. Posted today: ${line("Veterans & military")}. nuEra's FAQ also says it gives veterans 10% with proof of service.` : "Some do. nuEra's FAQ says it gives veterans 10% with proof of service. Ask at the counter." },
    { q: "Are there senior discounts at dispensaries near Peoria or Bloomington?", a: sen.length ? `Posted today: ${line("Seniors")}.` : "None posted on a store's own site today." },
    { q: "Can I stack a first-time discount with a sale?", a: "It depends on the store, so ask at the counter which one saves you more on what you're buying." },
  ];

  return (
    <GuideShell
      crumbs={GUIDE_CRUMBS}
      eyebrow={`Guide · live list · ${updated}`}
      title={TITLE}
      lede={<>Discounts for a certain group of people, pulled from each store&apos;s own site and refreshed every hour. Store by store, biggest first.</>}
      jsonLd={guideJsonLd({ slug: SLUG, title: TITLE, faqs, dateModified: todayIsoCT() })}
    >
      <style>{GUIDE_EXTRA_CSS}</style>
      <QuickAnswer updated={updated}>{quick}</QuickAnswer>

      {ORDER.filter((k) => groups.get(k)?.length).map((k) => (
        <section key={k}>
          <h2 className="gp-h2">{k}</h2>
          <div className="gp-list">
            {groups.get(k)!.map((d) => {
              const pill = saveLabel(d);
              return (
                <Link key={d.deal_id} href={`/dispensary/${d.slug || d.listing_slug}`} className="gp-row">
                  <span className="gp-row-main">
                    <span className="gp-row-title">{storeWithCity(d)}</span>
                    <span className="gp-row-sub">{cleanDealTitle(d.deal_title)}{d.verified_at ? ` · checked ${fmtDay(d.verified_at)}` : ""}</span>
                  </span>
                  {pill ? <span className="pp-save">{pill}</span> : <span className="gp-pill muted">Ask</span>}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      {groups.size === 0 && <p className="gp-note" style={{ marginTop: 18 }}>No store-posted discounts of this kind today.</p>}
      <p className="gp-note">Only what stores post on their own websites. A store missing here may still offer a discount in person. Everyday deals for everyone are on <Link href="/deals/all">the deals page</Link>.</p>

      <h2 className="gp-h2">Before you go</h2>
      <ul className="gp-ul">
        <li>Bring a valid, unexpired government photo ID. You must be 21 or older, or a registered medical patient.</li>
        <li>For veteran or military deals, bring proof of service; stores decide what they accept.</li>
        <li>A first-time discount is for your first visit, so it can be worth planning a bigger purchase around it.</li>
        <li>Pay with cash or debit. <Link href="/guides/can-you-use-a-credit-card-at-illinois-dispensaries">Credit cards generally don&apos;t work.</Link></li>
        <li>New to this? Our <Link href="/cannabis/illinois/first-time-guide">first-time guide</Link> covers what happens at the counter.</li>
      </ul>

      <FaqBlock faqs={faqs} />
      <h2 className="gp-h2">About this data</h2>
      <p className="gp-note">From PuffPrice&apos;s daily check of each Central Illinois dispensary&apos;s own website; no aggregators. nuEra veteran policy from <a href="https://nueracannabis.com/faq/" rel="nofollow noopener" target="_blank">nuEra&apos;s FAQ</a>, checked Sep 25, 2026. <Link href="/how-we-rank">How we rank</Link>.</p>
      <RelatedGuides current={SLUG} />
    </GuideShell>
  );
}
