// /guides/buying-cannabis-in-illinois-as-an-out-of-state-visitor
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../../components/GuideShell";
import { brand } from "../../../lib/brand";
import { getRegionStores, getLiveDeals, fmtDay, todayCT, todayIsoCT, FACTS_VERIFIED } from "../../../lib/guides";
import { QuickAnswer, FaqBlock, Sources, RelatedGuides, GUIDE_EXTRA_CSS, GUIDE_CRUMBS, guideJsonLd, type Faq } from "../GuideParts";

export const revalidate = 3600;
const SLUG = "buying-cannabis-in-illinois-as-an-out-of-state-visitor";
const TITLE = "Buying cannabis in Illinois as an out-of-state visitor";
const CHECKED = fmtDay(FACTS_VERIFIED);

export const metadata: Metadata = {
  title: "Can Out-of-State Visitors Buy Weed in Illinois? 2026 Limits, ID & Where to Stop",
  description:
    "Yes, if you're 21+. Since June 12, 2026 visitors may have 30 g flower, 5 g concentrate and 500 mg THC in edibles. What ID works, the rules in the car, and dispensaries along I-74 and I-55 in Central Illinois.",
  alternates: { canonical: `${brand.url}/guides/${SLUG}` },
};

// Central Illinois stops by interstate. Bloomington-Normal is where I-74 and
// I-55 meet; Champaign-Urbana is where I-74 meets I-57.
const CORRIDORS: { road: string; note: string; cities: string[] }[] = [
  { road: "I-74", note: "the Peoria area, Bloomington-Normal and Champaign-Urbana", cities: ["Peoria", "East Peoria", "Peoria Heights", "Bloomington", "Normal", "Champaign", "Urbana"] },
  { road: "I-55", note: "Bloomington-Normal to Springfield", cities: ["Bloomington", "Normal", "Springfield"] },
  { road: "Just south of Peoria", note: "Pekin", cities: ["Pekin"] },
];

export default async function VisitorPage() {
  const [stores, live] = await Promise.all([getRegionStores(), getLiveDeals()]);
  const dealCount = new Map<string, number>();
  for (const d of live) { const k = d.slug || d.listing_slug || ""; dealCount.set(k, (dealCount.get(k) || 0) + 1); }
  const updated = todayCT();

  const quick = "Yes. Anyone 21 or older with a valid, unexpired government photo ID can buy at an Illinois dispensary. Since June 12, 2026 (Public Act 104-0463, SB 3222), visitors may possess up to 30 grams of flower, 5 grams of concentrate and 500 mg of THC in edibles and other infused products, half the resident limit. You pay the same taxes as residents, and you can't take it out of Illinois.";

  const faqs: Faq[] = [
    { q: "Can out-of-state visitors buy weed in Illinois?", a: quick },
    { q: "How much can a non-resident buy in Illinois?", a: "The law caps what you can possess, and a store can't sell you more than that: 30 grams of cannabis flower, 5 grams of cannabis concentrate, and 500 milligrams of THC in cannabis-infused products. The law says these limits are cumulative. Before June 12, 2026 the visitor limits were half that (15 g, 2.5 g, 250 mg)." },
    { q: "What ID do I need to buy cannabis in Illinois from out of state?", a: "Illinois law requires a valid, unexpired government-issued ID with your photo and date of birth, and stores check it electronically. An out-of-state driver's license or state ID works. Stores set their own list beyond that; nuEra, for example, accepts US and international passports and says it does not accept digital IDs, FOID cards or international driver's licenses." },
    { q: "Can I bring cannabis back to my home state?", a: "No. Illinois law only protects you in Illinois, and adult-use marijuana is still illegal under federal law, so taking it across a state line is not protected, even into another legal state." },
    { q: "Where can I use it as a visitor?", a: "Not in public and not in a car. Illinois law bans using cannabis in any public place and in any motor vehicle. Private property with the owner's permission is the legal option, so check your hotel's or host's rules before you buy." },
    { q: "Do visitors pay more tax?", a: "No. Visitors pay the same cannabis excise and sales taxes as residents. The total depends on the product and the city." },
  ];

  return (
    <GuideShell
      crumbs={GUIDE_CRUMBS}
      eyebrow={`Guide · visitors · checked ${CHECKED}`}
      title={TITLE}
      lede={<>Driving through Central Illinois, or here for a game or a visit? Here&apos;s what the law allows, what to bring, and where the stores are along the interstates.</>}
      jsonLd={guideJsonLd({ slug: SLUG, title: TITLE, faqs, dateModified: todayIsoCT() })}
    >
      <style>{GUIDE_EXTRA_CSS}</style>
      <QuickAnswer updated={CHECKED}>{quick}</QuickAnswer>

      <h2 className="gp-h2">Visitor limits since June 12, 2026</h2>
      <div className="gp-table-wrap">
        <table className="gp-table">
          <thead><tr><th>Product</th><th style={{ textAlign: "right" }}>Visitors (21+)</th><th style={{ textAlign: "right" }}>Illinois residents</th></tr></thead>
          <tbody>
            <tr><td>Cannabis flower</td><td className="num">30 g</td><td className="num">60 g</td></tr>
            <tr><td>Cannabis concentrate</td><td className="num">5 g</td><td className="num">10 g</td></tr>
            <tr><td>THC in edibles and other infused products</td><td className="num">500 mg</td><td className="num">1,000 mg</td></tr>
          </tbody>
        </table>
      </div>
      <p className="gp-note">410 ILCS 705/10-10, as amended by Public Act 104-0463 (SB 3222), signed and effective June 12, 2026. The statute says the limits are &quot;cumulative,&quot; and nobody may obtain an amount from a dispensary that would put them over the limit.</p>

      <h2 className="gp-h2">What to bring</h2>
      <ul className="gp-ul">
        <li><b>A valid, unexpired government photo ID</b> showing your date of birth. Stores check it, usually with a scanner. An out-of-state license is fine.</li>
        <li><b>Cash or a debit card.</b> <Link href="/guides/can-you-use-a-credit-card-at-illinois-dispensaries">Credit cards generally don&apos;t work.</Link></li>
        <li><b>A budget that includes tax.</b> Illinois cannabis taxes are high; the <Link href="/illinois-cannabis-tax-calculator">calculator</Link> shows the total by city.</li>
      </ul>

      <h2 className="gp-h2">In the car</h2>
      <p className="gp-p">You can&apos;t use cannabis in a vehicle, and the driver can&apos;t be impaired. Keep what you bought sealed in the store&apos;s odor-proof, child-resistant packaging. The full rules, including what changed on June 12, 2026, are in our <Link href="/guides/cannabis-and-driving-illinois">cannabis and driving guide</Link>.</p>

      <h2 className="gp-h2">Where to stop in Central Illinois</h2>
      {CORRIDORS.map((c) => {
        const here = stores.filter((s) => c.cities.includes(s.city));
        if (!here.length) return null;
        return (
          <div key={c.road} style={{ marginBottom: 16 }}>
            <p className="gp-p" style={{ marginBottom: 8 }}><b>{c.road}</b> · {c.note}</p>
            <div className="gp-list">
              {here.map((s) => {
                const n = dealCount.get(s.slug) || 0;
                return (
                  <Link key={s.slug} href={`/dispensary/${s.slug}`} className="gp-row">
                    <span className="gp-row-main"><span className="gp-row-title">{s.name}</span><span className="gp-row-sub">{s.city}{s.address1 ? ` · ${s.address1}` : ""}</span></span>
                    {n > 0 ? <span className="gp-pill">{n} deal{n === 1 ? "" : "s"} today</span> : <span className="gp-pill muted">No deal posted</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="gp-note">Deal counts from our check of each store&apos;s own site, {updated}. Need something open late? See <Link href="/open-late">who&apos;s open latest tonight</Link>, or find the <Link href="/on-the-way">best deal on your route</Link>.</p>

      <FaqBlock faqs={faqs} />
      <Sources
        checked={CHECKED}
        items={[
          { href: "https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/forms/cannabis/sb-3222-fact-sheet.pdf", label: "IDFPR — SB 3222 fact sheet (Public Act 104-0463, signed June 12, 2026)" },
          { href: "https://ilga.gov/documents/legislation/104/SB/10400SB3222lv.htm", label: "Illinois General Assembly — SB 3222 enrolled text (Sec. 10-10 possession limits)" },
          { href: "https://www.ilga.gov/legislation/ILCS/details?ActID=3992&ChapterID=35&SeqStart=&ChapAct=FullText", label: "Illinois General Assembly — Cannabis Regulation and Tax Act, 410 ILCS 705 (Sec. 10-35 where use is banned; Sec. 15-85 ID rules)" },
          { href: "https://nueracannabis.com/faq/", label: "nuEra — FAQ (accepted ID for out-of-state guests)" },
        ]}
      />
      <RelatedGuides current={SLUG} extra={[{ href: "/cannabis/illinois/laws", label: "Illinois cannabis laws" }]} />
    </GuideShell>
  );
}
