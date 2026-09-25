// /guides/can-you-use-a-credit-card-at-illinois-dispensaries
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../../components/GuideShell";
import { brand } from "../../../lib/brand";
import { getRegionStores, fmtDay, FACTS_VERIFIED } from "../../../lib/guides";
import { REGION_CITIES } from "../../../lib/waysToBuy";
import { QuickAnswer, FaqBlock, Sources, RelatedGuides, GUIDE_EXTRA_CSS, GUIDE_CRUMBS, guideJsonLd, type Faq } from "../GuideParts";

export const revalidate = 3600;
const SLUG = "can-you-use-a-credit-card-at-illinois-dispensaries";
const TITLE = "Can you use a credit card at an Illinois dispensary?";
const CHECKED = fmtDay(FACTS_VERIFIED);

export const metadata: Metadata = {
  title: "Can You Use a Credit Card at Illinois Dispensaries? Cash, Debit & ATMs (2026)",
  description:
    "No credit cards at Illinois dispensaries: bring cash or a debit card. What nuEra, Beyond Hello and Ascend say they accept in Peoria, Bloomington-Normal, Champaign-Urbana, Pekin and Springfield, and which stores list an ATM.",
  alternates: { canonical: `${brand.url}/guides/${SLUG}` },
};

// What each chain with Central Illinois stores says on its own site.
const CHAINS: { prefix: string; name: string; says: string; href: string }[] = [
  { prefix: "nuera-", name: "nuEra", says: "Cash or debit card; debit carries a $3.50 fee. ATMs on site.", href: "https://nueracannabis.com/faq/" },
  { prefix: "beyond-hello-", name: "Beyond Hello", says: "Cash preferred; all locations take Visa/Mastercard debit, most take CanPay. On-site ATM at each location. No Apple Pay or Google Pay.", href: "https://customercare.beyond-hello.com/hc/en-us/articles/360058636412-What-payment-types-are-accepted" },
  { prefix: "ascend-cannabis-", name: "Ascend", says: "Cash, debit cards and Ascend Pay (bank transfer). ATMs on site. No credit cards.", href: "https://letsascend.com/faq/faq-general/what-payment-methods-are-accepted-at-ascend/" },
];

async function getAtmSlugs(): Promise<Set<string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const inList = `(${REGION_CITIES.map((c) => `"${c}"`).join(",")})`;
  try {
    const r = await fetch(
      `${url}/rest/v1/master_listings?select=slug&project_tag=eq.green&is_active=eq.true&state=eq.IL&atm_onsite=eq.true&city=in.${encodeURIComponent(inList)}`,
      { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, next: { revalidate: 3600 } }
    );
    const rows: { slug: string }[] = r.ok ? await r.json() : [];
    return new Set(rows.map((x) => x.slug));
  } catch {
    return new Set();
  }
}

export default async function CreditCardPage() {
  const [stores, atm] = await Promise.all([getRegionStores(), getAtmSlugs()]);
  const chainRows = CHAINS.map((c) => ({ ...c, stores: stores.filter((s) => s.slug.startsWith(c.prefix)) })).filter((c) => c.stores.length);
  const covered = new Set(chainRows.flatMap((c) => c.stores.map((s) => s.slug)));
  const others = stores.filter((s) => !covered.has(s.slug));

  const quick = "Generally, no. Illinois dispensaries don't take credit cards, because the card networks don't allow cannabis purchases while marijuana is still illegal under federal law. Bring cash or a debit card; the big chains in Central Illinois (nuEra, Beyond Hello, Ascend) say on their own sites that they take debit and have an ATM on site, and some charge a small debit fee.";

  const faqs: Faq[] = [
    { q: "Can I use a credit card at a dispensary in Illinois?", a: quick },
    { q: "Do Illinois dispensaries take debit cards?", a: "Most do. nuEra, Beyond Hello and Ascend all say they take debit cards. nuEra charges a $3.50 debit fee. Some dispensaries have run debit as a 'cashless ATM' withdrawal rounded up to an even amount, with the change back in cash, so check your receipt." },
    { q: "Why can't you use a credit card to buy weed?", a: "Marijuana sold for adult use is still a Schedule I drug under federal law, and card networks follow federal law. In July 2023 Mastercard told banks to stop processing cannabis purchases on its debit cards; Visa moved against cashless ATM setups in 2021. That's why cash, debit and bank-transfer apps are the norm." },
    { q: "Do dispensaries have ATMs?", a: "Usually. nuEra, Beyond Hello and Ascend say their stores have ATMs on site. ATM fees are set by the machine, so taking cash out at your own bank first is usually cheaper." },
    { q: "Can I use Apple Pay or Google Pay at a dispensary?", a: "Generally no. Beyond Hello says plainly that it does not accept Apple Pay or Google Pay. Some chains offer their own bank-transfer app instead (Ascend Pay, CanPay)." },
  ];

  return (
    <GuideShell
      crumbs={GUIDE_CRUMBS}
      eyebrow={`Guide · paying · checked ${CHECKED}`}
      title={TITLE}
      lede={<>Short version: bring cash or a debit card. Here&apos;s what each Central Illinois chain says it takes, in its own words.</>}
      jsonLd={guideJsonLd({ slug: SLUG, title: TITLE, faqs, dateModified: FACTS_VERIFIED })}
    >
      <style>{GUIDE_EXTRA_CSS}</style>
      <QuickAnswer updated={CHECKED}>{quick}</QuickAnswer>

      <h2 className="gp-h2">What each chain says it takes</h2>
      <div className="gp-list">
        {chainRows.map((c) => (
          <a key={c.name} href={c.href} rel="nofollow noopener" target="_blank" className="gp-row">
            <span className="gp-row-main">
              <span className="gp-row-title">{c.name}</span>
              <span className="gp-row-sub">{c.says}</span>
              <span className="gp-row-sub">Central Illinois: {[...new Set(c.stores.map((s) => s.city))].join(", ")}</span>
            </span>
            <span className="gp-pill muted">Their FAQ</span>
          </a>
        ))}
      </div>
      <p className="gp-note">Checked on each chain&apos;s site {CHECKED}. We don&apos;t have a payment policy in writing yet for: {others.map((s) => `${s.name} (${s.city})`).join(", ")}. Expect cash and debit, and call ahead if it matters.</p>

      {atm.size > 0 && (
        <>
          <h2 className="gp-h2">Stores our listings show with an ATM</h2>
          <div className="gp-list">
            {stores.filter((s) => atm.has(s.slug)).map((s) => (
              <Link key={s.slug} href={`/dispensary/${s.slug}`} className="gp-row">
                <span className="gp-row-main"><span className="gp-row-title">{s.name}</span><span className="gp-row-sub">{s.city}{s.address1 ? ` · ${s.address1}` : ""}</span></span>
                <span className="gp-pill">ATM</span>
              </Link>
            ))}
          </div>
          <p className="gp-note">From our store listings. Not every store has been checked, so a store missing here may still have one.</p>
        </>
      )}

      <h2 className="gp-h2">Why it works this way</h2>
      <p className="gp-p">Illinois law lets adults 21 and over buy cannabis, but federal law still treats adult-use marijuana as a Schedule I drug. In April 2026 the DEA moved FDA-approved marijuana products and state-licensed <i>medical</i> marijuana to Schedule III; adult-use marijuana stays in Schedule I while a broader hearing plays out. Card networks follow federal law, which is why Mastercard told banks in July 2023 to stop cannabis purchases on its debit cards, and why stores lean on cash, debit and their own bank-transfer apps.</p>

      <h2 className="gp-h2">Plan the total before you go</h2>
      <p className="gp-p">Taxes add a lot at the register, so bring enough. Our <Link href="/illinois-cannabis-tax-calculator">tax calculator</Link> gives the total for your city, and <Link href="/out-the-door">today&apos;s out-the-door prices</Link> have it worked out already.</p>

      <FaqBlock faqs={faqs} />
      <Sources
        checked={CHECKED}
        items={[
          { href: "https://nueracannabis.com/faq/", label: "nuEra — FAQ (payment, ATMs)" },
          { href: "https://customercare.beyond-hello.com/hc/en-us/articles/360058636412-What-payment-types-are-accepted", label: "Beyond Hello — What payment types are accepted? (updated May 15, 2026)" },
          { href: "https://letsascend.com/faq/faq-general/what-payment-methods-are-accepted-at-ascend/", label: "Ascend — What payment methods are accepted?" },
          { href: "https://www.dea.gov/marijuana-rescheduling-regulatory-actions", label: "DEA — Marijuana rescheduling regulatory actions (April 2026)" },
          { href: "https://themarijuanaherald.com/2026/09/whats-going-on-with-marijuana-rescheduling-where-the-federal-process-stands-and-what-happens-next/", label: "The Marijuana Herald — Where the federal rescheduling process stands (Sept 21, 2026)" },
          { href: "https://www.cannabisbusinesstimes.com/business-issues-benchmarks/finance/news/15687517/mastercard-no-longer-allowing-cannabis-purchases-on-debit-cards", label: "Cannabis Business Times — Mastercard no longer allowing cannabis purchases on debit cards (July 2023)" },
        ]}
      />
      <RelatedGuides current={SLUG} extra={[{ href: "/cannabis/illinois/first-time-guide", label: "First time at a dispensary" }]} />
    </GuideShell>
  );
}
