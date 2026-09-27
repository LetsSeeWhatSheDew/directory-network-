// app/route/[pair]/page.tsx — /route/peoria-to-bloomington etc. The four
// common drives (lib/routeDeals COMMON_PAIRS) are pre-rendered and indexed;
// every other pair of the 12 in-scope cities renders on demand, noindex.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuideShell from "../../components/GuideShell";
import { FaqBlock, GUIDE_EXTRA_CSS } from "../../guides/GuideParts";
import { brand } from "../../../lib/brand";
import { COMMON_PAIRS, pairSlug, parsePair, isCommonPair, getRoutePlan, CORRIDOR_MILES } from "../../../lib/routeDeals";
import { storeName } from "../../../lib/exhale";
import { RoutePicker, RouteStops, CommonPairs, routeFaqs, ROUTE_CSS } from "../RouteView";

export const revalidate = 900;

export function generateStaticParams() {
  return COMMON_PAIRS.map(([a, b]) => ({ pair: pairSlug(a, b) }));
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const p = parsePair((await params).pair);
  if (!p) return { title: "Route not found", robots: { index: false, follow: false } };
  const common = isCommonPair(p.from.slug, p.to.slug);
  const title = `Dispensary Deals Between ${p.from.name} and ${p.to.name}, IL`;
  const description = `Driving from ${p.from.name} to ${p.to.name}? Every dispensary within ${CORRIDOR_MILES} miles of the way with a live deal, in the order you reach it, with directions that add the stop. Checked on each store's own site; no store pays to rank.`;
  const url = `${brand.url}/route/${pairSlug(p.from.slug, p.to.slug)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: common ? undefined : { index: false, follow: true },
    openGraph: { title, description, url, type: "website" },
  };
}

export default async function RoutePairPage({ params }: { params: Promise<{ pair: string }> }) {
  const p = parsePair((await params).pair);
  if (!p) notFound();
  const { from, to } = p;
  const { plan } = await getRoutePlan(from, to);
  const faqs = routeFaqs(plan, from.name, to.name);
  const url = `${brand.url}/route/${pairSlug(from.slug, to.slug)}`;

  const jsonLd: object[] = [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Central Illinois", item: brand.url },
        { "@type": "ListItem", position: 2, name: "Best deal on your route", item: `${brand.url}/route` },
        { "@type": "ListItem", position: 3, name: `${from.name} to ${to.name}`, item: url },
      ],
    },
  ];
  if (plan && plan.stops.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Dispensaries with deals between ${from.name} and ${to.name}, IL`,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: plan.stops.length,
      itemListElement: plan.stops.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${brand.url}/dispensary/${s.slug}`,
        name: `${storeName(s.deals[0] || { slug: s.slug, name: s.name })}, ${s.city}`,
      })),
    });
  }

  return (
    <GuideShell
      crumbs={[{ href: "/route", label: "Best deal on your route" }]}
      eyebrow="Best deal on your route"
      title={`${from.name} to ${to.name}`}
      lede={<>The dispensaries near the way with a live deal, in the order you reach them. Tap &ldquo;Add as a stop&rdquo; and Google Maps routes you through.</>}
      jsonLd={jsonLd}
    >
      <style>{GUIDE_EXTRA_CSS + ROUTE_CSS}</style>
      <RoutePicker from={from.slug} to={to.slug} />
      {plan ? (
        <RouteStops plan={plan} />
      ) : (
        <p className="gp-note" role="status">We couldn&apos;t read today&apos;s deals just now. Give it a minute and refresh.</p>
      )}
      <FaqBlock faqs={faqs} />
      <h2 className="gp-h2">Other common drives</h2>
      <CommonPairs except={pairSlug(from.slug, to.slug)} />
      <p className="gp-note">Independent. Nobody pays us to rank. 21+.</p>
    </GuideShell>
  );
}
