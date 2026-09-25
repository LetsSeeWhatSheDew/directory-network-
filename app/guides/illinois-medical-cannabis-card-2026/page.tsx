// /guides/illinois-medical-cannabis-card-2026
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../../components/GuideShell";
import { brand } from "../../../lib/brand";
import { getRegionStores, fmtDay, todayIsoCT, FACTS_VERIFIED } from "../../../lib/guides";
import { getFeatureRows, featuresBySlug } from "../../../lib/waysToBuy";
import { calculateOutTheDoor, findCityRates, formatUsd } from "../../../lib/taxRates";
import { QuickAnswer, FaqBlock, Sources, RelatedGuides, GUIDE_EXTRA_CSS, GUIDE_CRUMBS, guideJsonLd, type Faq } from "../GuideParts";

export const revalidate = 3600;
const SLUG = "illinois-medical-cannabis-card-2026";
const TITLE = "Getting an Illinois medical cannabis card in 2026";
const CHECKED = fmtDay(FACTS_VERIFIED);

export const metadata: Metadata = {
  title: "Illinois Medical Cannabis Card 2026: How to Get One, Cost & Tax Savings",
  description:
    "How to get an Illinois medical cannabis card: a health care professional's certification, an IDPH online application, $50 a year. Medical purchases skip the cannabis excise tax and pay 1% state tax. Central Illinois medical dispensaries.",
  alternates: { canonical: `${brand.url}/guides/${SLUG}` },
};

const EXAMPLE_PRICE = 50;
const EXAMPLE_CITY = "peoria";

export default async function MedicalCardPage() {
  const [stores, rows] = await Promise.all([getRegionStores(), getFeatureRows()]);
  const F = featuresBySlug(rows);
  const medical = stores.filter((s) => F.get(s.slug)?.medical?.status === "yes");
  const cityRates = findCityRates(EXAMPLE_CITY);
  const rec = cityRates ? calculateOutTheDoor(EXAMPLE_PRICE, "flower", cityRates) : null;
  const med = EXAMPLE_PRICE * 1.01;
  const yearsToPayOff = rec ? Math.ceil(50 / (rec.outTheDoor - med)) : null;

  const quick = `Get a written certification from a physician, advanced practice registered nurse or physician assistant, then apply online with the Illinois Department of Public Health. It costs $50 for one year, $100 for two or $125 for three ($25/$50/$75 at the reduced rate), and a provisional registration lets you buy while IDPH reviews it. Medical purchases skip Illinois's cannabis excise tax and local cannabis taxes and pay a 1% state rate${rec ? `, so $${EXAMPLE_PRICE} of flower in Peoria comes to about ${formatUsd(med)} instead of about ${formatUsd(rec.outTheDoor)}` : ""}.`;

  const faqs: Faq[] = [
    { q: "How do I get a medical cannabis card in Illinois?", a: "1) See a certifying health care professional (a physician, APRN or physician assistant) you have a bona fide relationship with, who certifies that you have a qualifying condition. 2) Apply online through IDPH within 90 days of that certification and pay the fee. 3) Once the application is complete you get a provisional registration you can use at a dispensary, with a valid driver's license or state ID, while IDPH decides. IDPH has 90 days to approve or deny a complete application." },
    { q: "How much does an Illinois medical card cost?", a: "IDPH charges $50 for 1 year, $100 for 2 years or $125 for 3 years. The reduced fee is $25, $50 or $75. A designated caregiver is $25, $50 or $75. The visit with your health care professional is a separate cost that IDPH doesn't set." },
    { q: "How much tax do medical patients pay in Illinois?", a: "Registered patients don't pay the Cannabis Purchaser Excise Tax (10% to 25% for everyone else), and medical cannabis is excluded from city and county cannabis taxes. It's taxed like other qualifying drugs, at the 1% state rate, according to the Illinois Department of Revenue." },
    { q: "What conditions qualify for medical cannabis in Illinois?", a: "IDPH lists more than 50 debilitating conditions, including cancer, chronic pain, PTSD, fibromyalgia, multiple sclerosis and seizures. The full list is on IDPH's debilitating conditions page, and there's also an Opioid Alternative Patient Program for adults 21 and over." },
    { q: "Which dispensaries in Central Illinois sell medical?", a: medical.length ? `As of today, stores that say on their own site they serve medical patients: ${medical.map((s) => `${s.name} (${s.city})`).join(", ")}.` : "Since Sept 10, 2026, any Illinois dispensary can add medical sales. Our medical page lists which Central Illinois stores have confirmed it." },
    { q: "How much can a medical patient buy?", a: "An 'adequate medical supply' under Illinois law is 2.5 ounces of usable cannabis over 14 days. A certifying health care professional can support a waiver for more." },
  ];

  return (
    <GuideShell
      crumbs={GUIDE_CRUMBS}
      eyebrow={`Guide · medical · checked ${CHECKED}`}
      title={TITLE}
      lede={<>How the Illinois medical card works, what it costs, and when the tax savings pay for it.</>}
      jsonLd={guideJsonLd({ slug: SLUG, title: TITLE, faqs, dateModified: todayIsoCT() })}
    >
      <style>{GUIDE_EXTRA_CSS}</style>
      <QuickAnswer updated={CHECKED}>{quick}</QuickAnswer>

      <h2 className="gp-h2">The steps</h2>
      <ol className="gp-ul">
        <li><b>Get certified.</b> A physician, advanced practice registered nurse or physician assistant who treats you certifies that you have a qualifying condition. IDPH lists more than 50, from cancer and chronic pain to PTSD and fibromyalgia.</li>
        <li><b>Apply online with IDPH</b> within 90 days of the certification, and pay the fee.</li>
        <li><b>Shop with your provisional registration.</b> A completed online application gets you a provisional registration that works at a dispensary for 90 days, or until IDPH issues your card or denies you. Bring it with your driver&apos;s license or state ID.</li>
        <li><b>Get your card.</b> IDPH has 90 days to decide on a complete application. The card then shows up in your online patient account to print or download.</li>
      </ol>

      <h2 className="gp-h2">What it costs (IDPH fees)</h2>
      <div className="gp-table-wrap">
        <table className="gp-table">
          <thead><tr><th>Card</th><th style={{ textAlign: "right" }}>1 year</th><th style={{ textAlign: "right" }}>2 years</th><th style={{ textAlign: "right" }}>3 years</th></tr></thead>
          <tbody>
            <tr><td>Patient</td><td className="num">$50</td><td className="num">$100</td><td className="num">$125</td></tr>
            <tr><td>Patient, reduced fee</td><td className="num">$25</td><td className="num">$50</td><td className="num">$75</td></tr>
            <tr><td>Designated caregiver</td><td className="num">$25</td><td className="num">$50</td><td className="num">$75</td></tr>
          </tbody>
        </table>
      </div>
      <p className="gp-note">IDPH also lists a $50, three-year renewal for patients with life-long conditions. Your health care professional&apos;s visit is billed separately.</p>

      {rec && (
        <>
          <h2 className="gp-h2">The tax difference, worked out</h2>
          <div className="gp-table-wrap">
            <table className="gp-table">
              <thead><tr><th>${EXAMPLE_PRICE} of flower (shelf price) in Peoria</th><th style={{ textAlign: "right" }}>Out the door</th></tr></thead>
              <tbody>
                <tr><td>Recreational (excise + state, local and cannabis taxes)</td><td className="num">{formatUsd(rec.outTheDoor)}</td></tr>
                <tr><td>Medical (1% state rate)</td><td className="num">{formatUsd(med)}</td></tr>
                <tr><td>You keep</td><td className="num">{formatUsd(rec.outTheDoor - med)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="gp-note">Recreational total from the same rate table as our <Link href="/illinois-cannabis-tax-calculator">tax calculator</Link>. At that gap, a $50 one-year card pays for itself after about {yearsToPayOff} purchases like this one, before the cost of the certification visit. Edibles, vapes and concentrates carry a higher recreational excise, so the gap is bigger.</p>
        </>
      )}

      <h2 className="gp-h2">Where to buy medical in Central Illinois</h2>
      <p className="gp-p">Since Sept 10, 2026, Illinois dispensaries can add a medical license. {medical.length ? `${medical.length} Central Illinois stores say on their own site that they serve medical patients:` : "No Central Illinois store has confirmed it on its own site yet."}</p>
      {medical.length > 0 && (
        <div className="gp-list">
          {medical.map((s) => (
            <Link key={s.slug} href={`/dispensary/${s.slug}`} className="gp-row">
              <span className="gp-row-main"><span className="gp-row-title">{s.name}</span><span className="gp-row-sub">{s.city}</span></span>
              <span className="gp-pill">Medical</span>
            </Link>
          ))}
        </div>
      )}
      <p className="gp-note">The exact wording each store uses, and what changed in September, is on our <Link href="/medical">medical dispensaries page</Link>.</p>

      <FaqBlock faqs={faqs} />
      <Sources
        checked={CHECKED}
        items={[
          { href: "https://dph.illinois.gov/topics-services/prevention-wellness/medical-cannabis.html", label: "IDPH — Medical Cannabis Patient Program" },
          { href: "https://dph.illinois.gov/topics-services/prevention-wellness/medical-cannabis/mcpp-registry-card-application-fees.html", label: "IDPH — Registry card application fees" },
          { href: "https://dph.illinois.gov/topics-services/prevention-wellness/medical-cannabis/debilitating-conditions.html", label: "IDPH — Debilitating conditions" },
          { href: "https://www.ilga.gov/legislation/ILCS/details?ActID=3503&ChapterID=35&SeqStart=&ChapAct=FullText", label: "Illinois General Assembly — Compassionate Use of Medical Cannabis Program Act, 410 ILCS 130 (Secs. 10, 55, 60: certifying professionals, provisional registration, 90-day review, adequate supply)" },
          { href: "https://tax.illinois.gov/research/taxinformation/other/cannabis-tax-frequently-asked-questions.html", label: "Illinois Department of Revenue — Cannabis tax FAQ (medical at the 1% state rate; excise and local cannabis taxes don't apply)" },
          { href: "https://idfpr.illinois.gov/news/2026/illinois-expands-access-medical-cannabis-patients-and-dispensaries.html", label: "IDFPR — Illinois Expands Access for Medical Cannabis Patients and Dispensaries (Sept 10, 2026: medical licenses issued to 37 existing dispensaries)" },
        ]}
      />
      <RelatedGuides current={SLUG} extra={[{ href: "/medical", label: "Medical dispensaries in Central Illinois" }, { href: "/illinois-cannabis-tax", label: "Illinois cannabis tax explained" }]} />
    </GuideShell>
  );
}
