import { brand } from "../lib/brand";
import GoldHome, { GoldFaq } from "./components/gold/GoldHome";
import { getGoldHome } from "../lib/home/goldData";
import { getServerLocation } from "../lib/location";

// Home (Gold Leaf, 2026-11-11): the best deal near you as a coupon, a short
// row of runners-up, the visual category menu, towns, free alerts, and the
// FAQ that backs FAQ_SCHEMA. Header and footer come from app/layout.tsx.

export const metadata = {
  // The layout's "%s | PuffPrice" template doesn't apply to a page in the
  // same segment as the root layout, so the brand goes in by hand here.
  title: { absolute: `Cannabis Deals in Central Illinois | ${brand.name}` },
  description:
    "Live dispensary deals across Peoria, Bloomington-Normal, Champaign-Urbana, Springfield, and the rest of Central Illinois — updated continuously and always free to browse.",
  alternates: { canonical: brand.url },
  // Live link preview: today's longest exhale (app/og/today), refreshed through the day.
  openGraph: {
    title: "Best Bud For Your Buck$ | PuffPrice",
    description: "Central Illinois dispensary deals, checked on the stores' own sites every morning.",
    url: brand.url,
    siteName: brand.name,
    images: [{ url: `${brand.url}/og/today?size=og`, width: 1200, height: 630, alt: "The best cannabis deal near you on PuffPrice" }],
    type: "website",
  },
  twitter: { card: "summary_large_image", images: [`${brand.url}/og/today?size=og`] },
};

export const revalidate = 300;

const FAQ_ENTRIES = [
  {
    q: "How do I find dispensary deals near me in Central Illinois?",
    a: "Allow location access or select your city and you'll see the cheapest active dispensary deals in your area. Every deal is tagged with how much you save and the exact Central Illinois dispensary running it.",
  },
  {
    q: "How often are deals updated?",
    a: "Deals are reviewed and refreshed daily. Expired deals are removed automatically the moment their expiry time passes, so what you see is what's live today.",
  },
  {
    q: "Is PuffPrice free to use?",
    a: "Yes. Browsing deals is always free with no account required. Pro ($0.99 a month, launching soon) adds instant email and browser alerts, a daily digest, price history, and a savings dashboard.",
  },
  {
    q: "Which Central Illinois cities does PuffPrice cover?",
    a: "Peoria and East Peoria, Bloomington-Normal, Champaign-Urbana, Pekin, Peoria Heights, and Springfield — the Central Illinois markets where licensed dispensaries are operating today. If you're in a smaller Central IL town, the nearest licensed dispensary is usually 5–15 minutes from one of those metros.",
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ENTRIES.map((e) => ({
    "@type": "Question",
    name: e.q,
    acceptedAnswer: { "@type": "Answer", text: e.a },
  })),
};

// Organization schema — identifies the brand entity to Google's Knowledge
// Graph and to AI crawlers (Zone 4 goal: be the source cited for IL
// cannabis deals). Every field is real data sourced from lib/brand.ts;
// areaServed is the locked Central Illinois public scope, not a claim of
// statewide coverage. No fabricated ratings, founders, or addresses.
const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${brand.url}/#organization`,
  name: brand.name,
  url: brand.url,
  logo: `${brand.url}/apple-touch-icon.png`,
  description: brand.description,
  email: brand.supportEmail,
  areaServed: { "@type": "AdministrativeArea", name: "Central Illinois" },
  sameAs: [`https://twitter.com/${brand.social.twitter.replace("@", "")}`],
};

// WebSite schema — names the site entity (Google site name, AI entity
// resolution) and declares the real /search?q= endpoint (app/search/page.tsx).
const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${brand.url}/#website`,
  name: brand.name,
  url: brand.url,
  description: brand.description,
  inLanguage: "en-US",
  publisher: { "@id": `${brand.url}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${brand.url}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

// Prefer user-city deals when we know the city; otherwise fall back to the
// statewide list. Haversine scoring would be ideal but only 1 of 61 IL
// dispensaries has lat/lng populated — city-match is the strongest signal
// we have until the Google Places backfill runs.

export default async function HomePage() {
  const [data, loc] = await Promise.all([getGoldHome(), getServerLocation()]);
  const origin = loc ? { city: loc.city, lat: loc.lat ?? null, lng: loc.lng ?? null } : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />
      <GoldHome data={data} origin={origin} faq={<GoldFaq entries={FAQ_ENTRIES} />} />
    </>
  );
}
