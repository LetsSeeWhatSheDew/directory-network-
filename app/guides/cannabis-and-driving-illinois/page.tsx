// /guides/cannabis-and-driving-illinois — DUI limit, the container rule
// (changed June 12, 2026 by SB 3222), and odor-based car searches.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../../components/GuideShell";
import { brand } from "../../../lib/brand";
import { fmtDay, FACTS_VERIFIED } from "../../../lib/guides";
import { QuickAnswer, FaqBlock, Sources, RelatedGuides, GUIDE_EXTRA_CSS, GUIDE_CRUMBS, guideJsonLd, type Faq } from "../GuideParts";

const SLUG = "cannabis-and-driving-illinois";
const TITLE = "Cannabis and driving in Illinois";
const CHECKED = fmtDay(FACTS_VERIFIED);

export const metadata: Metadata = {
  title: "Can You Drive With Weed in the Car in Illinois? 2026 Container Rule & DUI Limit",
  description:
    "Illinois rules for cannabis in the car after SB 3222: sealed, odor-proof, child-resistant packaging, no use in the vehicle, and the 5 ng/mL THC DUI limit. Plus what the Illinois Supreme Court said about the smell of cannabis.",
  alternates: { canonical: `${brand.url}/guides/${SLUG}` },
};

const quick = "You can drive with cannabis in the car in Illinois if it's in a secured, sealed or resealable, odor-proof, child-resistant container kept out of reach. Since June 12, 2026, the out-of-reach part doesn't apply when it's still sealed in the dispensary's original packaging. Nobody may use cannabis in a vehicle, and driving with 5 ng/mL or more of THC in whole blood (10 ng/mL in other bodily substances) within 2 hours of driving, or while impaired, is DUI.";

const faqs: Faq[] = [
  { q: "Can you have weed in your car in Illinois?", a: quick },
  { q: "Does cannabis have to be in the trunk in Illinois?", a: "Not always, since June 12, 2026. The Vehicle Code still says cannabis must be in a secured, sealed or resealable, odor-proof, child-resistant container that is 'inaccessible', but SB 3222 (Public Act 104-0463) added an exception: that inaccessibility rule doesn't apply to cannabis bought from a licensed dispensary and carried in a secured, sealed, odor-proof, child-resistant container in its original packaging. An opened package, or anything outside its original packaging, still needs to be out of reach. The trunk is still the safest place." },
  { q: "What is the THC limit for driving in Illinois?", a: "It's a DUI to drive with, within 2 hours of driving, 5 nanograms or more of delta-9-THC per milliliter of whole blood or 10 nanograms or more per milliliter of another bodily substance. It's also a DUI to drive while impaired by cannabis at any level. A first DUI is a Class A misdemeanor." },
  { q: "Can police search my car if they smell cannabis in Illinois?", a: "In People v. Redmond (Sept 19, 2024) the Illinois Supreme Court held that the smell of burnt cannabis alone is not enough for a warrantless car search. In People v. Molina (Dec 5, 2024) it held that the smell of raw cannabis alone is enough, because it suggests cannabis isn't in an odor-proof container as the law requires. A 2025 bill to end odor-based stops (SB 42) passed the Senate but stalled in the House." },
  { q: "Can a passenger smoke cannabis in a car in Illinois?", a: "No. The Cannabis Regulation and Tax Act bans using cannabis in any motor vehicle, and passengers may only have cannabis in the passenger area in a sealed, odor-proof, child-resistant container. Breaking the Vehicle Code's container rules, or a driver using cannabis in the vehicle, is a Class A misdemeanor." },
  { q: "Do medical cannabis patients have a different DUI rule?", a: "Partly. The 5 ng/mL blood rule does not apply to a registered medical patient with a valid card unless they are impaired by cannabis. Driving while impaired is still a DUI, and having a card is not a defense." },
];

export default function DrivingPage() {
  return (
    <GuideShell
      crumbs={GUIDE_CRUMBS}
      eyebrow={`Guide · the law · checked ${CHECKED}`}
      title={TITLE}
      lede={<>What Illinois law says about cannabis in your car, from the Vehicle Code and the June 2026 changes. This is general information, not legal advice.</>}
      jsonLd={guideJsonLd({ slug: SLUG, title: TITLE, faqs, dateModified: FACTS_VERIFIED })}
    >
      <style>{GUIDE_EXTRA_CSS}</style>
      <QuickAnswer updated={CHECKED}>{quick}</QuickAnswer>

      <h2 className="gp-h2">The container rule</h2>
      <p className="gp-p">625 ILCS 5/11-502.15 says a driver may only have cannabis in a vehicle in a <b>secured, sealed or resealable, odor-proof, child-resistant cannabis container that is inaccessible</b>. Passengers have the same rule for the passenger area.</p>
      <p className="gp-p">On June 12, 2026, SB 3222 (Public Act 104-0463) added an exception in the Cannabis Regulation and Tax Act: the inaccessibility requirement doesn&apos;t apply to cannabis <b>bought from a licensed dispensary</b> and carried in a <b>secured, sealed, odor-proof, child-resistant container in its original packaging</b>. It sits right beside the new drive-thru and pickup rules in the same section of the law.</p>
      <ul className="gp-ul">
        <li><b>Unopened, in the store&apos;s packaging:</b> doesn&apos;t have to be out of reach.</li>
        <li><b>Opened, or moved to another container:</b> still has to be sealed, odor-proof, child-resistant and out of reach. The trunk is the simple answer.</li>
        <li><b>Using it in the car:</b> not allowed for anyone, parked or moving.</li>
      </ul>
      <p className="gp-note">One note of caution: a separate section of the Cannabis Regulation and Tax Act (410 ILCS 705/10-35) still says cannabis in a private vehicle must be &quot;reasonably inaccessible while the vehicle is moving.&quot; Until courts or regulators say how the two fit together, keeping it in the trunk avoids the question.</p>

      <h2 className="gp-h2">Driving high</h2>
      <p className="gp-p">Under 625 ILCS 5/11-501, it&apos;s a DUI to drive or be in actual physical control of a vehicle while impaired by cannabis, or with a THC concentration, within 2 hours of driving, of <b>5 ng/mL or more in whole blood</b> or <b>10 ng/mL or more in another bodily substance</b>. Police can use roadside chemical tests and standardized field sobriety tests. A first DUI is a Class A misdemeanor; penalties go up from there.</p>
      <p className="gp-p">Being legal to buy doesn&apos;t change any of that. If you&apos;re using, get a ride.</p>

      <h2 className="gp-h2">The smell of cannabis and car searches</h2>
      <p className="gp-p">The Illinois Supreme Court decided two cases in 2024. In <i>People v. Redmond</i>, the smell of <b>burnt</b> cannabis alone is not probable cause to search a car. In <i>People v. Molina</i>, the smell of <b>raw</b> cannabis alone is, because it suggests cannabis isn&apos;t in the odor-proof container the law requires. Another reason to keep it sealed.</p>

      <h2 className="gp-h2">Drive-thru and pickup</h2>
      <p className="gp-p">SB 3222 also lets dispensaries add drive-thru windows and pickup once IDFPR approves the setup. See <Link href="/drive-thru">which Central Illinois stores have one</Link>, and <Link href="/ways-to-buy">every way to buy</Link>.</p>

      <FaqBlock faqs={faqs} />
      <Sources
        checked={CHECKED}
        items={[
          { href: "https://www.ilga.gov/legislation/ILCS/details?ActID=1815&ChapterID=49&SeqStart=&ChapAct=FullText", label: "Illinois General Assembly — Illinois Vehicle Code, 625 ILCS 5 (11-501 DUI; 11-501.2 THC concentration; 11-502.15 cannabis in a motor vehicle, as amended by P.A. 104-463)" },
          { href: "https://ilga.gov/documents/legislation/104/SB/10400SB3222lv.htm", label: "Illinois General Assembly — SB 3222 enrolled text (new 410 ILCS 705/15-85(e))" },
          { href: "https://www.ilga.gov/legislation/ILCS/details?ActID=3992&ChapterID=35&SeqStart=&ChapAct=FullText", label: "Illinois General Assembly — Cannabis Regulation and Tax Act, 410 ILCS 705 (Sec. 10-35)" },
          { href: "https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/forms/cannabis/sb-3222-fact-sheet.pdf", label: "IDFPR — SB 3222 fact sheet (signed June 12, 2026)" },
          { href: "https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/cfb29889-7e60-4ac0-91a1-6992011d8fd3/People%20v.%20Redmond,%202024%20IL%20129201.pdf", label: "Illinois Supreme Court — People v. Redmond, 2024 IL 129201" },
          { href: "https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/51effd35-1213-41a2-a00e-ad8c5e38fca8/People%20v.%20Molina,%202024%20IL%20129237.pdf", label: "Illinois Supreme Court — People v. Molina, 2024 IL 129237" },
          { href: "https://www.ilga.gov/Legislation/BillStatus?GAID=18&DocNum=42&DocTypeID=SB&LegId=157147&SessionID=114", label: "Illinois General Assembly — SB 42 bill status (re-referred to House Rules, May 23, 2025)" },
        ]}
      />
      <RelatedGuides current={SLUG} extra={[{ href: "/cannabis/illinois/laws", label: "Illinois cannabis laws" }]} />
    </GuideShell>
  );
}
