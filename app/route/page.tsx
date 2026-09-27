// app/route/page.tsx — best deal on your route. Pick a start and an end from
// the 12 Central Illinois cities; the form sends you to /route/<from>-to-<to>.
// Plain GET form: works with no JavaScript. Supersedes /on-the-way.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import GuideShell from "../components/GuideShell";
import { brand } from "../../lib/brand";
import { routeCity, pairSlug, CORRIDOR_MILES } from "../../lib/routeDeals";
import { RoutePicker, CommonPairs, ROUTE_CSS } from "./RouteView";
import { FaqBlock, GUIDE_EXTRA_CSS, type Faq } from "../guides/GuideParts";

export const metadata: Metadata = {
  title: "Best Dispensary Deals on Your Route in Central Illinois",
  description:
    "Driving between Peoria, Pekin, Bloomington-Normal, Champaign-Urbana or Springfield? See the dispensaries with live deals near the way, in the order you reach them, with directions that add the stop.",
  alternates: { canonical: `${brand.url}/route` },
};

const FAQS: Faq[] = [
  {
    q: "How does the route finder work?",
    a: `Pick where you're starting and where you're headed. We list every store within ${CORRIDOR_MILES} miles of the straight line between the two cities that has a deal posted this morning, in the order you reach it, with up to two of its best deals and a Google Maps link that adds it as a stop.`,
  },
  {
    q: "Does it use my location?",
    a: "No. It only uses the two cities you pick and each store's address. Nothing is stored.",
  },
  {
    q: "Can a store pay to show up on my route?",
    a: "No. Nobody pays us to rank, and every store on the way is listed by where it sits, not by who it is.",
  },
];

export default async function RoutePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const from = routeCity(sp.from);
  const to = routeCity(sp.to);
  if (from && to && from.slug !== to.slug) redirect(`/route/${pairSlug(from.slug, to.slug)}`);
  const same = !!from && !!to && from.slug === to.slug;

  return (
    <GuideShell
      crumbs={[{ href: "/ways-to-buy", label: "Ways to buy" }]}
      eyebrow="Best deal on your route"
      title="Driving somewhere? Stop where it's cheapest."
      lede={<>Pick where you&apos;re starting and where you&apos;re headed. We&apos;ll show the stores near the way with a deal posted this morning, in the order you reach them.</>}
      jsonLd={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }}
    >
      <style>{GUIDE_EXTRA_CSS + ROUTE_CSS}</style>
      <RoutePicker from={sp.from} to={sp.to} />
      {same && <p className="gp-note" role="status">Those are the same city. Pick two different ones.</p>}
      <h2 className="gp-h2">Common drives</h2>
      <CommonPairs />
      <FaqBlock faqs={FAQS} />
      <p className="gp-note">Independent. Nobody pays us to rank. 21+.</p>
    </GuideShell>
  );
}
