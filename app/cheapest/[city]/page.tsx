// /cheapest/[city] — the same list scoped to stores within NEAR_MILES of one
// of the 12 Central Illinois scope cities. Indexed only when at least two
// stores near the city have fresh menu data.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brand } from "../../../lib/brand";
import { CENTRAL_IL_CITIES } from "../../../lib/constants/regions";
import { getCheapestBoard, cityName, REF_UNITS } from "../../../lib/menuPrices";
import CheapestView, { faqsFor } from "../CheapestView";

export const revalidate = 900;
export const dynamicParams = false;

export function generateStaticParams() {
  return CENTRAL_IL_CITIES.map((c) => ({ city: c.slug }));
}

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const name = cityName(city);
  if (!name) return { robots: { index: false, follow: false } };
  const board = await getCheapestBoard({ nearCity: city });
  return {
    title: `Cheapest Eighth, Cart and Gummies Near ${name}, IL Today (Tax Included)`,
    description: `The lowest price each dispensary near ${name} lists today for an eighth, a 1g vape cart and 100mg of gummies, from the store's own menu, with Illinois and local tax added.`,
    alternates: { canonical: `${brand.url}/cheapest/${city}` },
    // Thin pages stay out of the index until two stores have fresh data.
    ...(board.stores < 2 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CheapestCityPage({ params }: Props) {
  const { city } = await params;
  const name = cityName(city);
  if (!name) notFound();
  const board = await getCheapestBoard({ nearCity: city });
  const where = `near ${name}`;
  const faqs = faqsFor(board, where);
  const url = `${brand.url}/cheapest/${city}`;
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
        { "@type": "ListItem", position: 2, name: "Cheapest today", item: `${brand.url}/cheapest` },
        { "@type": "ListItem", position: 3, name: name, item: url },
      ],
    },
  ];
  return (
    <CheapestView
      board={board}
      title={`Cheapest eighth, cart and gummies near ${name} today`}
      where={where}
      cityLabel={name}
      currentCity={city}
      jsonLd={jsonLd}
      eyebrow={`Menu prices · ${name} · tax included`}
    />
  );
}
