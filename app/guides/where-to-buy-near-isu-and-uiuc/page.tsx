// /guides/where-to-buy-near-isu-and-uiuc — Bloomington-Normal and
// Champaign-Urbana stores with live deals. Written for adults 21 and over;
// says so up front and repeats the campus rules.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../../components/GuideShell";
import { brand } from "../../../lib/brand";
import { getRegionStores, getLiveDeals, fmtDay, todayCT, todayIsoCT, FACTS_VERIFIED } from "../../../lib/guides";
import { cleanDealTitle, saveLabel, isConditional } from "../../../lib/exhale";
import { QuickAnswer, FaqBlock, Sources, RelatedGuides, GUIDE_EXTRA_CSS, GUIDE_CRUMBS, guideJsonLd, type Faq } from "../GuideParts";

export const revalidate = 3600;
const SLUG = "where-to-buy-near-isu-and-uiuc";
const TITLE = "Dispensaries near ISU and UIUC (21+)";

export const metadata: Metadata = {
  title: "Dispensaries Near ISU (Normal) and UIUC (Champaign-Urbana): 21+ Guide",
  description:
    "Licensed dispensaries in Bloomington-Normal and Champaign-Urbana with today's deals from each store's own site. For adults 21 and over. Campus rules: cannabis isn't allowed on ISU or U of I property.",
  alternates: { canonical: `${brand.url}/guides/${SLUG}` },
};

const AREAS = [
  { name: "Bloomington-Normal (Illinois State University)", cities: ["Normal", "Bloomington"] },
  { name: "Champaign-Urbana (University of Illinois)", cities: ["Champaign", "Urbana"] },
];

export default async function CampusPage() {
  const [stores, live] = await Promise.all([getRegionStores(), getLiveDeals()]);
  const updated = todayCT();
  const areaStores = AREAS.map((a) => ({ ...a, stores: stores.filter((s) => a.cities.includes(s.city)) }));
  const areaSlugs = new Set(areaStores.flatMap((a) => a.stores.map((s) => s.slug)));
  const student = live.filter((d) => areaSlugs.has(d.slug || d.listing_slug || "") && /student/i.test(d.deal_title || ""));
  const count = (cs: string[]) => stores.filter((s) => cs.includes(s.city)).length;

  const quick = `You must be 21 or older to buy recreational cannabis in Illinois, and you need a valid government-issued photo ID that shows your date of birth. For adults 21+, we list ${count(["Normal", "Bloomington"])} dispensaries in Bloomington-Normal and ${count(["Champaign", "Urbana"])} in Champaign-Urbana, with today's deals below. Cannabis isn't allowed anywhere on ISU or University of Illinois property, including university-owned housing, even if you're 21.`;

  const faqs: Faq[] = [
    { q: "How old do you have to be to buy weed in Illinois?", a: "21. Stores must refuse anyone who can't show a valid, unexpired ID with a photo and date of birth proving they're 21 or older. The only exception is a registered medical cannabis patient buying at a store licensed for medical." },
    { q: "Can I have weed in my dorm at ISU or U of I?", a: "No. Illinois State University's policy prohibits cannabis on university property because it's still illegal under federal law, and the University of Illinois Student Code says possession or use on university property by students of any age is prohibited." },
    { q: "Which dispensaries are closest to Illinois State University?", a: `We list ${count(["Normal"])} in Normal and ${count(["Bloomington"])} in Bloomington: ${stores.filter((s) => ["Normal", "Bloomington"].includes(s.city)).map((s) => `${s.name} (${s.city})`).join(", ")}.` },
    { q: "Which dispensaries are in Champaign-Urbana?", a: `${stores.filter((s) => ["Champaign", "Urbana"].includes(s.city)).map((s) => `${s.name} (${s.city})`).join(", ")}.` },
    { q: "Is there a student discount?", a: student.length ? `Posted today: ${student.map((d) => `${cleanDealTitle(d.deal_title)} at ${d.name} (${d.city})`).join("; ")}. You still have to be 21.` : "We don't see a student discount posted on any of these stores' own sites today. First-time, veteran and senior discounts are listed on our discounts guide." },
  ];

  return (
    <GuideShell
      crumbs={GUIDE_CRUMBS}
      eyebrow={`Guide · 21+ only · ${updated}`}
      title={TITLE}
      lede={<>For adults 21 and over in Bloomington-Normal and Champaign-Urbana. If you&apos;re under 21, none of these stores can sell to you, and nothing here is meant for you.</>}
      jsonLd={guideJsonLd({ slug: SLUG, title: TITLE, faqs, dateModified: todayIsoCT() })}
    >
      <style>{GUIDE_EXTRA_CSS}</style>
      <QuickAnswer updated={updated}>{quick}</QuickAnswer>

      <h2 className="gp-h2">The rules first</h2>
      <ul className="gp-ul">
        <li><b>21 and over only.</b> Stores check a valid, unexpired government-issued ID with your photo and date of birth.</li>
        <li><b>Not on campus.</b> Both universities ban cannabis on university property, including university-owned housing, at any age.</li>
        <li><b>Not in public or in a car.</b> Illinois bans using cannabis in any public place or any vehicle. See <Link href="/guides/cannabis-and-driving-illinois">cannabis and driving</Link>.</li>
        <li><b>Don&apos;t share with anyone under 21.</b> Illinois law bars giving cannabis to anyone under 21 and using it in close proximity to them.</li>
      </ul>

      {areaStores.map((a) => (
        <section key={a.name}>
          <h2 className="gp-h2">{a.name}</h2>
          <div className="gp-list">
            {a.stores.map((s) => {
              const deals = live.filter((d) => (d.slug || d.listing_slug) === s.slug && !isConditional(d));
              const top = deals.find((d) => saveLabel(d)) || deals[0];
              return (
                <Link key={s.slug} href={`/dispensary/${s.slug}`} className="gp-row">
                  <span className="gp-row-main">
                    <span className="gp-row-title">{s.name}</span>
                    <span className="gp-row-sub">{s.city}{s.address1 ? ` · ${s.address1}` : ""}</span>
                    {top && <span className="gp-row-sub">Today: {cleanDealTitle(top.deal_title)}{deals.length > 1 ? ` + ${deals.length - 1} more` : ""}</span>}
                  </span>
                  {top && saveLabel(top) ? <span className="pp-save">{saveLabel(top)}</span> : <span className="gp-pill muted">{deals.length ? "Deal" : "No everyday deal posted"}</span>}
                </Link>
              );
            })}
          </div>
          <p className="gp-note">
            Full list with hours: {a.cities.map((c, i) => (
              <span key={c}>{i > 0 ? " · " : ""}<Link href={`/city/${c.toLowerCase()}`}>{c}</Link></span>
            ))}
          </p>
        </section>
      ))}
      <p className="gp-note">Deals from our check of each store&apos;s own site, {updated}. Everyday deals only here; <Link href="/guides/dispensary-first-time-discounts-central-illinois">first-time, veteran and senior discounts</Link> are listed separately.</p>

      <FaqBlock faqs={faqs} />
      <Sources
        checked={fmtDay(FACTS_VERIFIED)}
        items={[
          { href: "https://www.ilga.gov/legislation/ILCS/details?ActID=3992&ChapterID=35&SeqStart=&ChapAct=FullText", label: "Illinois General Assembly — Cannabis Regulation and Tax Act, 410 ILCS 705 (Sec. 10-35 where use is banned; Sec. 15-85 ID and age checks)" },
          { href: "https://policy.illinoisstate.edu/health-safety/general/5-1-5/", label: "Illinois State University — Policy 5.1.5, Drug-Free Schools and Communities Act / Drug-Free Workplace Act" },
          { href: "https://studentcode.illinois.edu/article1/part3/1-305", label: "University of Illinois Urbana-Champaign — Student Code § 1-305" },
        ]}
      />
      <RelatedGuides current={SLUG} extra={[{ href: "/cannabis/illinois/first-time-guide", label: "First time at a dispensary" }]} />
    </GuideShell>
  );
}
