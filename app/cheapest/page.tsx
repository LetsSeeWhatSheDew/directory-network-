// /cheapest — cheapest eighth, 1g cart and 100mg gummies in Central Illinois
// today, lowest out-the-door price per store from each store's own menu.
import type { Metadata } from "next";
import { brand } from "../../lib/brand";
import { getCheapestBoard, REF_UNITS } from "../../lib/menuPrices";
import CheapestView, { faqsFor } from "./CheapestView";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Cheapest Eighth, Cart and Gummies in Central Illinois Today (Tax Included)",
  description:
    "The lowest price each Peoria, Springfield, Bloomington-Normal and Champaign-Urbana dispensary lists today for an eighth, a 1g vape cart and 100mg of gummies, read from the store's own menu, with tax added.",
  alternates: { canonical: `${brand.url}/cheapest` },
};

export default async function CheapestPage() {
  const board = await getCheapestBoard();
  const where = "in Central Illinois";
  const faqs = faqsFor(board, where);
  const url = `${brand.url}/cheapest`;
  const hasData = REF_UNITS.some((r) => board.byRef[r].length > 0);
  const jsonLd = [
    ...(hasData
      ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }]
      : []),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Central Illinois", item: brand.url },
        { "@type": "ListItem", position: 2, name: "Cheapest today", item: url },
      ],
    },
  ];
  return (
    <CheapestView
      board={board}
      title="Cheapest eighth, cart and gummies in Central Illinois today"
      where={where}
      cityLabel={null}
      currentCity={null}
      jsonLd={jsonLd}
      eyebrow="Menu prices · tax included"
    />
  );
}
