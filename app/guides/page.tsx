// /guides — hub for every question-answer page on PuffPrice.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import { brand } from "../../lib/brand";
import { GUIDES, EXISTING_GUIDES } from "../../lib/guides";

export const metadata: Metadata = {
  title: "Central Illinois Cannabis Guides: Prices, Deals, Law & Medical Cards",
  description:
    "Plain answers to the questions people ask about buying cannabis in Peoria, Bloomington-Normal, Champaign-Urbana, Pekin and Springfield: best day for deals, prices, paying, visitors, medical cards, driving, and discounts.",
  alternates: { canonical: `${brand.url}/guides` },
};

export default function GuidesHub() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Central Illinois cannabis guides",
      url: `${brand.url}/guides`,
      hasPart: GUIDES.map((g) => ({ "@type": "WebPage", name: g.question, url: `${brand.url}/guides/${g.slug}` })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Central Illinois", item: brand.url },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${brand.url}/guides` },
      ],
    },
  ];
  return (
    <GuideShell
      eyebrow="Guides · Central Illinois"
      title="Straight answers"
      lede={<>The questions people ask before they buy, answered in a few sentences, with the source linked. Where it helps, the answer comes from today&apos;s deals at Central Illinois stores. 21 and over.</>}
      jsonLd={jsonLd}
    >
      <h2 className="gp-h2">Questions, answered</h2>
      <div className="gp-grid">
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="gp-card">
            <b>{g.question}</b>
            <span>{g.blurb}</span>
          </Link>
        ))}
      </div>

      <h2 className="gp-h2">More guides and tools</h2>
      <div className="gp-list">
        {EXISTING_GUIDES.map((g) => (
          <Link key={g.href} href={g.href} className="gp-row">
            <span className="gp-row-main"><span className="gp-row-title">{g.title}</span><span className="gp-row-sub">{g.blurb}</span></span>
          </Link>
        ))}
      </div>
      <p className="gp-note">Something missing or out of date? Email {brand.supportEmail}. We fix it and note the date.</p>
    </GuideShell>
  );
}
