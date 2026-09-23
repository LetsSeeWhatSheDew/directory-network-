// app/illinois-hemp-law/page.tsx — Nov 12, 2026: intoxicating hemp leaves gas stations.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import { brand } from "../../lib/brand";
import { getRegionStores, REGION_CITIES } from "../../lib/waysToBuy";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Illinois Delta-8 & Hemp Law: What Changes Nov 12, 2026 — and Where to Buy",
  description:
    "Illinois' new Hemp Act takes effect Nov 12, 2026: delta-8, THC-O, HHC and similar products leave gas stations and smoke shops. What changes, and where to buy regulated products in Central Illinois at the best price.",
  alternates: { canonical: `${brand.url}/illinois-hemp-law` },
};

const FAQ = [
  { q: "Is delta-8 being banned in Illinois?", a: "From Nov 12, 2026, Illinois' Hemp Act caps finished hemp products at 0.4 mg of total THC per container and counts delta-8, delta-10, HHC, THCP and THC-O toward that cap — which takes most intoxicating hemp products off gas-station and smoke-shop shelves." },
  { q: "Where can I buy THC products after Nov 12 in Central Illinois?", a: "At licensed dispensaries. PuffPrice lists every Central Illinois dispensary and today's verified deals so you can compare prices." },
  { q: "Do I have to be 21 to buy hemp THC products in Illinois?", a: "Yes. The 21-and-over rule in the new law took effect immediately when it was signed in June 2026." },
];

export default async function HempPage() {
  const stores = await getRegionStores();
  const byCity = REGION_CITIES.map((c) => ({ city: c, n: stores.filter((s) => s.city === c).length })).filter((x) => x.n > 0);
  return (
    <GuideShell
      crumbs={[{ href: "/cannabis/illinois/laws", label: "Illinois laws" }]}
      eyebrow="Law change · effective Nov 12, 2026"
      title="Delta-8 is leaving Illinois gas stations. Here's where to buy instead."
      lede={<>On <b>Nov 12, 2026</b>, Illinois&apos; new Hemp Act takes effect and most intoxicating hemp products — delta-8 and the rest — come off gas-station and smoke-shop shelves. If that&apos;s where you&apos;ve been buying, here&apos;s what changes and how to find the best regulated price nearby.</>}
      jsonLd={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }}
    >
      <h2 className="gp-h2">What changes</h2>
      <div className="gp-timeline">
        <div><div className="when">Nov 12, 2026</div>The Illinois Hemp Act takes effect. Finished hemp products are capped at <b>0.4 mg total THC per container</b>, and delta-8, delta-10, HHC, HHCP, THCP and THC-O acetate all count toward it. Synthetic and semi-synthetic cannabinoids are prohibited. <span className="gp-src">— <a href="https://www.foxrothschild.com/publications/illinois-overhauls-its-cannabis-and-hemp-regulations" rel="nofollow noopener" target="_blank">Fox Rothschild</a></span></div>
        <div><div className="when">June 12, 2026</div>SB 3222 signed. Intoxicating hemp moves into the regulated system — sold where cannabis is sold — and sales are 21+ effective immediately. <span className="gp-src">— <a href="https://chicago.suntimes.com/politics/2026/06/15/illinois-hemp-delta-8-cannabis-regulation-bill" rel="nofollow noopener" target="_blank">Chicago Sun-Times</a></span></div>
      </div>

      <h2 className="gp-h2">Where to buy in Central Illinois</h2>
      <p className="gp-p">Licensed dispensaries — tested, labeled products, and the deals change daily. Pick your city:</p>
      <div className="gp-grid">
        {byCity.map((c) => (
          <Link key={c.city} href={`/city/${c.city.toLowerCase().replace(/\s+/g, "-")}`} className="gp-card">
            <b>{c.city}</b><span>{c.n} {c.n === 1 ? "dispensary" : "dispensaries"} · today&apos;s deals</span>
          </Link>
        ))}
      </div>
      <div className="gp-grid" style={{ marginTop: 12 }}>
        <Link href="/deals/edibles" className="gp-card gp-hero-card"><b>Edible deals today</b><span>The closest swap for gas-station gummies — compared across every store.</span></Link>
        <Link href="/this-week" className="gp-card"><b>This week&apos;s best discounts</b><span>Every deal we saw in the last 7 days.</span></Link>
      </div>

      <h2 className="gp-h2">Questions</h2>
      {FAQ.map((f) => (
        <div key={f.q} style={{ marginBottom: 14 }}><b>{f.q}</b><p className="gp-p" style={{ marginTop: 4 }}>{f.a}</p></div>
      ))}
      <p className="gp-note">Not legal advice. Summarized from the public reporting linked above.</p>
    </GuideShell>
  );
}
