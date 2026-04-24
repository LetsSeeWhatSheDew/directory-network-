export const revalidate = 86400; // revalidate once per day

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FeaturedDispensary from "../../../components/FeaturedDispensary";
import {
  isInCentralIL,
  isEmptyCentralILCity,
  EMPTY_CENTRAL_IL_CITIES,
  CANNABIS_IL_NON_CITY_SLUGS,
} from "../../../../lib/visibility";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "https://hnbjufmtmrhexmdrfubw.supabase.co");
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300"));

type Listing = {
  id: string;
  name: string | null;
  slug: string | null;
  city: string | null;
  state: string | null;
  address1: string | null;
  phone: string | null;
  website: string | null;
  short_description: string | null;
  logo_url: string | null;
  plan: string | null;
  claimed: boolean | null;
  delivery: boolean | null;
  online_ordering: boolean | null;
  atm_onsite: boolean | null;
  wheelchair_accessible: boolean | null;
  type: string | null;
};

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [] as unknown as T;
  return res.json();
}

function slugToCity(slug: string | undefined | null): string {
  if (!slug) return "";
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

async function getCityListings(city: string): Promise<Listing[]> {
  return fetchJson<Listing[]>(
    `/master_listings?city=ilike.${encodeURIComponent(city)}&state=eq.IL&project_tag=eq.green&is_active=eq.true&select=id,name,slug,city,state,address1,phone,website,short_description,logo_url,plan,claimed,delivery,online_ordering,atm_onsite,wheelchair_accessible,type&order=plan.desc,name.asc&limit=50`
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: citySlug } = await params;
  // Central IL scope gate — non-CIL city pages are hidden publicly.
  if (!CANNABIS_IL_NON_CITY_SLUGS.has(citySlug) && !isInCentralIL(citySlug)) {
    return { robots: { index: false, follow: false } };
  }
  const city = slugToCity(citySlug);
  const canonicalUrl = `https://www.puffprice.com/cannabis/illinois/${citySlug}`;

  const title = `Cannabis Dispensaries in ${city}, Illinois — PuffPrice`;
  const description = `Find licensed cannabis dispensaries in ${city}, IL. Browse hours, directions, and deals for every dispensary in ${city}. Updated regularly.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "PuffPrice",
      type: "website",
    },
    twitter: { card: "summary", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: citySlug } = await params;

  // Exclude known non-city routes — let their static pages handle these.
  if (CANNABIS_IL_NON_CITY_SLUGS.has(citySlug)) {
    notFound();
  }

  // Central IL scope gate — non-CIL slugs never reach this dynamic route
  // once middleware is live, but keep this as defense-in-depth.
  if (!isInCentralIL(citySlug)) {
    notFound();
  }

  const city = slugToCity(citySlug);

  // Empty Central IL cities (Bartonville, Morton, Pekin, Washington):
  // no listings in master_listings, but the city IS in scope. Render a
  // honest empty-state hub pointing to the nearest dispensary city.
  if (isEmptyCentralILCity(citySlug)) {
    const empty = EMPTY_CENTRAL_IL_CITIES[citySlug.toLowerCase()];
    const nearestSlug = empty.nearestCity.toLowerCase().replace(/\s+/g, "-");
    return (
      <>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .ec-root { min-height: 100vh; background: #f7f6f2; font-family: Georgia, serif; }
          .ec-nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; background: #fff; border-bottom: 1px solid #e8e5de; }
          .ec-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
          .ec-nav-dot { width: 10px; height: 10px; border-radius: 50%; background: #16a34a; display: inline-block; }
          .ec-nav-name { font-size: 1.1rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.02em; }
          .ec-nav-accent { color: #16a34a; }
          .ec-bc { padding: 12px 32px; background: #fff; border-bottom: 1px solid #f0ede6; font-size: 0.8rem; font-family: system-ui, sans-serif; color: #6b7280; display: flex; gap: 8px; flex-wrap: wrap; }
          .ec-bc a { color: #6b7280; text-decoration: none; }
          .ec-inner { max-width: 720px; margin: 0 auto; padding: 48px 24px 80px; }
          .ec-label { font-size: 0.72rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #16a34a; margin-bottom: 12px; }
          .ec-h1 { font-size: clamp(1.8rem, 4vw, 2.4rem); font-weight: 700; color: #0f1f3d; letter-spacing: -0.03em; line-height: 1.2; margin-bottom: 14px; }
          .ec-intro { font-size: 1rem; color: #374151; font-family: system-ui, sans-serif; line-height: 1.7; margin-bottom: 28px; }
          .ec-callout { background: #fff; border: 1px solid #e8e5de; border-radius: 14px; padding: 24px; margin-bottom: 24px; }
          .ec-callout-label { font-size: 0.7rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af; margin-bottom: 8px; }
          .ec-callout-title { font-size: 1.1rem; font-weight: 700; color: #0f1f3d; margin-bottom: 6px; font-family: Georgia, serif; }
          .ec-callout-sub { font-size: 0.9rem; color: #6b7280; font-family: system-ui, sans-serif; line-height: 1.6; margin-bottom: 14px; }
          .ec-cta { display: inline-block; background: #16a34a; color: #fff; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-family: system-ui, sans-serif; font-weight: 700; font-size: 0.85rem; }
          .ec-back { display: inline-block; margin-top: 12px; font-size: 0.85rem; color: #6b7280; font-family: system-ui, sans-serif; text-decoration: none; }
        `}</style>
        <div className="ec-root">
          <nav className="ec-nav">
            <Link href="/" className="ec-nav-brand">
              <span className="ec-nav-dot" />
              <span className="ec-nav-name">puff<span className="ec-nav-accent">price</span></span>
            </Link>
          </nav>
          <div className="ec-bc">
            <Link href="/">Home</Link><span>›</span>
            <Link href="/cannabis/illinois">Central Illinois</Link><span>›</span>
            <span style={{ color: "#374151" }}>{empty.name}</span>
          </div>
          <div className="ec-inner">
            <p className="ec-label">Central Illinois Coverage</p>
            <h1 className="ec-h1">No licensed dispensaries in {empty.name} yet</h1>
            <p className="ec-intro">
              {empty.name}, IL doesn&apos;t have a licensed adult-use dispensary today.
              The nearest dispensaries are about {empty.nearestMiles} miles {empty.direction} in {empty.nearestCity}.
              When a dispensary opens here or becomes licensed, we&apos;ll add it.
            </p>
            <div className="ec-callout">
              <p className="ec-callout-label">Nearest dispensaries</p>
              <p className="ec-callout-title">{empty.nearestCity}, IL · {empty.nearestMiles} mi {empty.direction}</p>
              <p className="ec-callout-sub">See every licensed dispensary in {empty.nearestCity} with hours, directions, and current deals.</p>
              <Link href={`/cannabis/illinois/${nearestSlug}`} className="ec-cta">
                View {empty.nearestCity} dispensaries →
              </Link>
            </div>
            <Link href="/cannabis/illinois" className="ec-back">← Back to Central Illinois</Link>
          </div>
        </div>
      </>
    );
  }

  const listings = await getCityListings(city);

  if (listings.length === 0) {
    notFound();
  }

  const featured = listings.find((l) => l.plan === "featured" || l.plan === "boost") ?? null;
  const regular = listings.filter((l) => l.id !== featured?.id);

  const schemaOrg = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Cannabis Dispensaries in ${city}, Illinois`,
    description: `Directory of licensed cannabis dispensaries in ${city}, IL`,
    url: `https://www.puffprice.com/cannabis/illinois/${citySlug}`,
    numberOfItems: listings.length,
    itemListElement: listings.map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.puffprice.com/l/${l.slug}`,
      name: l.name,
    })),
  });

  const faqSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How many dispensaries are in ${city}, Illinois?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `There are ${listings.length} licensed cannabis dispensaries listed in ${city}, IL on PuffPrice.`,
        },
      },
      {
        "@type": "Question",
        name: `Is cannabis legal in ${city}, Illinois?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes. Illinois legalized recreational cannabis in January 2020. Adults 21 and older can purchase cannabis at licensed dispensaries in ${city} and throughout Illinois.`,
        },
      },
      {
        "@type": "Question",
        name: `Do dispensaries in ${city} offer online ordering?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Many dispensaries in ${city} offer online ordering and express pickup. Check individual listings for current availability.`,
        },
      },
      {
        "@type": "Question",
        name: `What do I need to buy cannabis in ${city}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `You must be 21 or older with a valid government-issued photo ID. No medical card is required for recreational purchases. Illinois residents can purchase up to 30 grams of cannabis flower per transaction.`,
        },
      },
    ],
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaOrg }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchema }} />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .city-root { min-height: 100vh; background: #f7f6f2; font-family: Georgia, 'Times New Roman', serif; }
        .city-nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; background: #fff; border-bottom: 1px solid #e8e5de; position: sticky; top: 0; z-index: 50; }
        .city-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .city-nav-dot { width: 10px; height: 10px; border-radius: 50%; background: #16a34a; display: inline-block; }
        .city-nav-name { font-size: 1.1rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.02em; }
        .city-nav-accent { color: #16a34a; }
        .city-nav-back { font-size: 0.85rem; color: #6b7280; text-decoration: none; font-family: system-ui, sans-serif; }
        .city-breadcrumb { padding: 12px 32px; background: #fff; border-bottom: 1px solid #f0ede6; font-size: 0.8rem; font-family: system-ui, sans-serif; color: #6b7280; display: flex; gap: 8px; align-items: center; }
        .city-breadcrumb a { color: #6b7280; text-decoration: none; }
        .city-breadcrumb a:hover { color: #16a34a; }
        .city-inner { max-width: 1100px; margin: 0 auto; padding: 32px 24px 64px; }
        .city-hero { margin-bottom: 32px; }
        .city-hero-label { font-size: 0.72rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #16a34a; margin-bottom: 8px; }
        .city-hero-h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 700; color: #0f1f3d; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 12px; }
        .city-hero-sub { font-size: 1rem; color: #374151; font-family: system-ui, sans-serif; line-height: 1.65; max-width: 600px; margin-bottom: 20px; }
        .city-stats { display: flex; gap: 24px; flex-wrap: wrap; }
        .city-stat { display: flex; flex-direction: column; gap: 2px; }
        .city-stat-num { font-size: 1.5rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.03em; }
        .city-stat-label { font-size: 0.75rem; color: #6b7280; font-family: system-ui, sans-serif; }
        .city-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
        .city-main { display: flex; flex-direction: column; gap: 12px; }
        .city-sidebar { display: flex; flex-direction: column; gap: 20px; }
        .listing-card { background: #fff; border-radius: 14px; border: 1px solid #e8e5de; padding: 20px; display: flex; gap: 16px; align-items: flex-start; text-decoration: none; transition: border-color 0.15s; }
        .listing-card:hover { border-color: #16a34a; }
        .listing-logo { width: 52px; height: 52px; border-radius: 10px; border: 1px solid #e8e5de; background: #f7f6f2; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
        .listing-logo-img { width: 100%; height: 100%; object-fit: contain; padding: 5px; }
        .listing-logo-initial { font-size: 1.3rem; font-weight: 700; color: #16a34a; font-family: Georgia, serif; }
        .listing-info { flex: 1; min-width: 0; }
        .listing-name { font-size: 1rem; font-weight: 700; color: #0f1f3d; letter-spacing: -0.01em; margin-bottom: 3px; font-family: Georgia, serif; }
        .listing-address { font-size: 0.8rem; color: #6b7280; font-family: system-ui, sans-serif; margin-bottom: 6px; }
        .listing-desc { font-size: 0.85rem; color: #374151; font-family: system-ui, sans-serif; line-height: 1.5; margin-bottom: 8px; }
        .listing-tags { display: flex; gap: 6px; flex-wrap: wrap; }
        .listing-tag { font-size: 0.7rem; font-family: system-ui, sans-serif; color: #374151; background: #f7f6f2; border: 1px solid #e8e5de; padding: 2px 8px; border-radius: 100px; }
        .listing-claimed { font-size: 0.7rem; font-family: system-ui, sans-serif; color: #14532d; background: #dcfce7; border: 1px solid #bbf7d0; padding: 2px 8px; border-radius: 100px; }
        .sidebar-card { background: #fff; border-radius: 14px; border: 1px solid #e8e5de; padding: 20px; }
        .sidebar-title { font-size: 0.7rem; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af; margin-bottom: 14px; }
        .faq-item { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f0ede6; }
        .faq-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .faq-q { font-size: 0.875rem; font-weight: 600; color: #0f1f3d; font-family: system-ui, sans-serif; margin-bottom: 6px; line-height: 1.4; }
        .faq-a { font-size: 0.825rem; color: #374151; font-family: system-ui, sans-serif; line-height: 1.6; }
        .cta-card { background: #0f1f3d; border-radius: 14px; padding: 20px; }
        .cta-title { font-size: 0.9rem; font-weight: 700; color: #fff; margin-bottom: 8px; letter-spacing: -0.01em; }
        .cta-body { font-size: 0.8rem; color: #94a3b8; font-family: system-ui, sans-serif; line-height: 1.6; margin-bottom: 14px; }
        .cta-btn { display: block; text-align: center; background: #16a34a; color: #fff; padding: 10px; border-radius: 8px; text-decoration: none; font-family: system-ui, sans-serif; font-weight: 700; font-size: 0.8rem; }
        .nearby-link { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0ede6; text-decoration: none; }
        .nearby-link:last-child { border-bottom: none; }
        .nearby-link-name { font-size: 0.85rem; color: #0f1f3d; font-family: system-ui, sans-serif; font-weight: 500; }
        .nearby-link-arrow { font-size: 0.75rem; color: #16a34a; }
        .city-footer-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e8e5de; flex-wrap: wrap; gap: 12px; }
        .city-footer-link { font-size: 0.85rem; color: #6b7280; text-decoration: none; font-family: system-ui, sans-serif; }
        .city-footer-link-fwd { color: #16a34a; font-weight: 600; }
        .city-footer { background: #0f1f3d; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .city-footer-brand { font-size: 1rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; font-family: Georgia, serif; }
        .city-footer-note { font-size: 0.78rem; color: #475569; font-family: system-ui, sans-serif; }
        @media (max-width: 768px) {
          .city-nav { padding: 14px 20px; }
          .city-breadcrumb { padding: 10px 20px; }
          .city-inner { padding: 20px 16px 48px; }
          .city-grid { grid-template-columns: 1fr; }
          .city-sidebar { order: -1; }
        }
      `}</style>

      <div className="city-root">
        <nav className="city-nav">
          <Link href="/" className="city-nav-brand">
            <span className="city-nav-dot" />
            <span className="city-nav-name">puff<span className="city-nav-accent">price</span></span>
          </Link>
          <Link href="/cannabis/illinois" className="city-nav-back">← Illinois</Link>
        </nav>

        <div className="city-breadcrumb">
          <Link href="/">Home</Link>
          <span>›</span>
          <Link href="/cannabis">Cannabis</Link>
          <span>›</span>
          <Link href="/cannabis/illinois">Illinois</Link>
          <span>›</span>
          <span style={{ color: "#374151" }}>{city}</span>
        </div>

        <div className="city-inner">
          <div className="city-hero">
            <p className="city-hero-label">Illinois Cannabis Directory</p>
            <h1 className="city-hero-h1">Cannabis Dispensaries<br />in {city}, Illinois</h1>
            <p className="city-hero-sub">
              Find licensed recreational and medical cannabis dispensaries in {city}, IL.
              Browse hours, get directions, and discover deals at every dispensary near you.
            </p>
            <div className="city-stats">
              <div className="city-stat">
                <span className="city-stat-num">{listings.length}</span>
                <span className="city-stat-label">Dispensaries listed</span>
              </div>
              <div className="city-stat">
                <span className="city-stat-num">{listings.filter(l => l.claimed).length}</span>
                <span className="city-stat-label">Verified listings</span>
              </div>
              <div className="city-stat">
                <span className="city-stat-num">{listings.filter(l => l.online_ordering).length}</span>
                <span className="city-stat-label">Online ordering</span>
              </div>
            </div>
          </div>

          <FeaturedDispensary listing={featured} city={city} />

          <div className="city-grid">
            <div className="city-main">
              {regular.map((l) => {
                const initial = (l.name ?? "?").charAt(0).toUpperCase();
                const tags = [
                  l.delivery === true && "🚗 Delivery",
                  l.online_ordering === true && "📱 Online ordering",
                  l.atm_onsite === true && "💵 ATM",
                  l.wheelchair_accessible === true && "♿ Accessible",
                ].filter(Boolean) as string[];

                return (
                  <Link key={l.id} href={`/l/${l.slug}`} className="listing-card">
                    <div className="listing-logo">
                      {l.logo_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={l.logo_url} alt={l.name + " logo"} className="listing-logo-img" width={48} height={48} loading="lazy" decoding="async" />
                      ) : (
                        <span className="listing-logo-initial">{initial}</span>
                      )}
                    </div>
                    <div className="listing-info">
                      <p className="listing-name">{l.name}</p>
                      {l.address1 && (
                        <p className="listing-address">{l.address1}, {l.city}, {l.state}</p>
                      )}
                      {l.short_description && (
                        <p className="listing-desc">{l.short_description}</p>
                      )}
                      <div className="listing-tags">
                        {l.claimed && <span className="listing-claimed">✓ Verified</span>}
                        {tags.map((t) => (
                          <span key={t} className="listing-tag">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ color: "#16a34a", fontSize: "1.2rem", flexShrink: 0 }}>→</div>
                  </Link>
                );
              })}
            </div>

            <div className="city-sidebar">
              <div className="sidebar-card">
                <p className="sidebar-title">Illinois Cannabis FAQ</p>
                <div className="faq-item">
                  <p className="faq-q">Is cannabis legal in {city}?</p>
                  <p className="faq-a">Yes. Illinois legalized recreational cannabis in January 2020. Adults 21+ can purchase at any licensed dispensary.</p>
                </div>
                <div className="faq-item">
                  <p className="faq-q">How many dispensaries are in {city}?</p>
                  <p className="faq-a">There are {listings.length} licensed dispensaries listed in {city} on PuffPrice.</p>
                </div>
                <div className="faq-item">
                  <p className="faq-q">What do I need to buy cannabis?</p>
                  <p className="faq-a">A valid government-issued photo ID showing you are 21 or older. No medical card required for recreational purchases.</p>
                </div>
                <div className="faq-item">
                  <p className="faq-q">How much can I buy at once?</p>
                  <p className="faq-a">Illinois residents can purchase up to 30g of flower, 500mg of THC in infused products, or 5g of concentrate per transaction.</p>
                </div>
              </div>

              <div className="cta-card">
                <p className="cta-title">Own a dispensary in {city}?</p>
                <p className="cta-body">
                  Claim your free listing in under a minute — every listing is
                  free, forever.
                </p>
                <Link href="/get-listed" className="cta-btn">
                  Claim your listing →
                </Link>
              </div>

              <div className="sidebar-card">
                <p className="sidebar-title">More Illinois cities</p>
                {["Chicago", "Aurora", "Bloomington", "Champaign", "Collinsville", "Peoria", "Springfield", "Rockford"]
                  .filter((c) => c.toLowerCase() !== city.toLowerCase())
                  .slice(0, 6)
                  .map((c) => (
                    <Link
                      key={c}
                      href={`/cannabis/illinois/${c.toLowerCase()}`}
                      className="nearby-link"
                    >
                      <span className="nearby-link-name">{c}</span>
                      <span className="nearby-link-arrow">→</span>
                    </Link>
                  ))}
              </div>
            </div>
          </div>

          <div className="city-footer-nav">
            <Link href="/cannabis/illinois" className="city-footer-link">← All Illinois cities</Link>
            <Link href="/get-listed" className="city-footer-link city-footer-link-fwd">List your dispensary →</Link>
          </div>
        </div>

        <footer className="city-footer">
          <span className="city-footer-brand">puff<span className="city-nav-accent">price</span></span>
          <span className="city-footer-note">© {new Date().getFullYear()} PuffPrice · Illinois Cannabis Directory</span>
        </footer>
      </div>
    </>
  );
}
