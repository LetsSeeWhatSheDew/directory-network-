export const revalidate = 86400;

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

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
  delivery: boolean | null;
  online_ordering: boolean | null;
  drive_thru: boolean | null;
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

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = slugToCity(citySlug);
  const url = `https://cleanlist.co/cannabis/illinois/${citySlug}/best`;
  const title = `Best Cannabis Dispensaries in ${city}, Illinois | Directory Network`;
  const description = `Find the best cannabis dispensaries in ${city}, IL. Compare licensed dispensaries, hours, and services. Updated for ${new Date().getFullYear()}.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Directory Network", type: "website" },
    robots: { index: true, follow: true },
  };
}

export default async function CityBestPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = slugToCity(citySlug);

  const listings = await fetchJson<Listing[]>(
    `/master_listings?city=ilike.${encodeURIComponent(city)}&state=eq.IL&select=id,name,slug,city,state,address1,phone,website,short_description,logo_url,plan,delivery,online_ordering,drive_thru&order=plan.desc,name.asc&limit=50`
  );

  if (listings.length === 0) notFound();

  const faqSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What are the best dispensaries in ${city}, Illinois?`,
        acceptedAnswer: { "@type": "Answer", text: `Directory Network lists ${listings.length} licensed cannabis dispensaries in ${city}, IL. All dispensaries on our directory are state-licensed and verified. Browse the full list above with hours, directions, and services.` },
      },
      {
        "@type": "Question",
        name: `Are dispensaries in ${city} recreational or medical?`,
        acceptedAnswer: { "@type": "Answer", text: `Illinois legalized recreational cannabis in January 2020. Dispensaries in ${city} serve both recreational and medical customers. Adults 21 and older can purchase without a medical card.` },
      },
      {
        "@type": "Question",
        name: `Do ${city} dispensaries offer online ordering?`,
        acceptedAnswer: { "@type": "Answer", text: `Many dispensaries in ${city} offer online ordering and express pickup. Check individual listings for current availability and menu platforms.` },
      },
    ],
  });

  const listSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best Cannabis Dispensaries in ${city}, Illinois`,
    numberOfItems: listings.length,
    itemListElement: listings.map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://cleanlist.co/l/${l.slug}`,
      name: l.name,
    })),
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchema }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: listSchema }} />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .r{min-height:100vh;background:#f7f6f2;font-family:Georgia,serif}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:16px 32px;background:#fff;border-bottom:1px solid #e8e5de;position:sticky;top:0;z-index:50}
        .nb{display:flex;align-items:center;gap:10px;text-decoration:none}
        .nd{width:10px;height:10px;border-radius:50%;background:#16a34a;display:inline-block}
        .nn{font-size:1.1rem;font-weight:700;color:#0f1f3d;letter-spacing:-.02em}
        .na{color:#16a34a}
        .nb2{font-size:.85rem;color:#6b7280;text-decoration:none;font-family:system-ui,sans-serif}
        .bc{padding:12px 32px;background:#fff;border-bottom:1px solid #f0ede6;font-size:.8rem;font-family:system-ui,sans-serif;color:#6b7280;display:flex;gap:8px}
        .bc a{color:#6b7280;text-decoration:none}
        .inner{max-width:900px;margin:0 auto;padding:32px 24px 64px}
        .lbl{font-size:.72rem;font-family:system-ui,sans-serif;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#16a34a;margin-bottom:12px}
        .h1{font-size:clamp(1.6rem,4vw,2.5rem);font-weight:700;color:#0f1f3d;letter-spacing:-.03em;line-height:1.15;margin-bottom:14px}
        .intro{font-size:.95rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.7;margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid #e8e5de}
        .count{font-size:.8rem;font-family:system-ui,sans-serif;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px}
        .card{background:#fff;border-radius:14px;border:1px solid #e8e5de;padding:20px;display:flex;gap:16px;align-items:flex-start;text-decoration:none;margin-bottom:12px;position:relative}
        .card:hover{border-color:#16a34a}
        .featured-card{border:2px solid #16a34a}
        .fbadge{position:absolute;top:-11px;left:16px;background:#16a34a;color:#fff;font-size:.65rem;font-family:system-ui,sans-serif;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 12px;border-radius:100px}
        .num{width:28px;height:28px;border-radius:50%;background:#f7f6f2;border:1px solid #e8e5de;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;color:#6b7280;font-family:system-ui,sans-serif;flex-shrink:0;margin-top:2px}
        .logo{width:52px;height:52px;border-radius:10px;border:1px solid #e8e5de;background:#f7f6f2;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;font-size:1.3rem;font-weight:700;color:#16a34a;font-family:Georgia,serif}
        .li{width:100%;height:100%;object-fit:contain;padding:5px}
        .info{flex:1}
        .nm{font-size:1rem;font-weight:700;color:#0f1f3d;font-family:Georgia,serif;margin-bottom:3px}
        .addr{font-size:.8rem;color:#6b7280;font-family:system-ui,sans-serif;margin-bottom:6px}
        .desc{font-size:.85rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.5;margin-bottom:8px}
        .tgs{display:flex;gap:6px;flex-wrap:wrap}
        .tg{font-size:.7rem;font-family:system-ui,sans-serif;color:#374151;background:#f7f6f2;border:1px solid #e8e5de;padding:3px 10px;border-radius:100px}
        .arr{font-size:1.2rem;color:#16a34a;flex-shrink:0;margin-top:4px}
        .faq{margin-top:48px}
        .faq-title{font-size:1.2rem;font-weight:700;color:#0f1f3d;letter-spacing:-.02em;margin-bottom:20px}
        .faq-item{border-bottom:1px solid #e8e5de;padding:16px 0}
        .faq-q{font-size:.95rem;font-weight:700;color:#0f1f3d;margin-bottom:8px;line-height:1.4}
        .faq-a{font-size:.875rem;color:#374151;font-family:system-ui,sans-serif;line-height:1.7}
        .cta{background:#0f1f3d;border-radius:16px;padding:28px;margin-top:40px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px}
        .ct{font-size:.95rem;font-weight:700;color:#fff}
        .cs{font-size:.8rem;color:#94a3b8;font-family:system-ui,sans-serif;margin-top:4px}
        .cb{background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700;font-size:.85rem;white-space:nowrap}
        .ft{background:#0f1f3d;padding:24px 32px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
        .fb{font-size:1rem;font-weight:700;color:#fff;font-family:Georgia,serif}
        .fn{font-size:.78rem;color:#475569;font-family:system-ui,sans-serif}
        @media(max-width:768px){.nav,.bc{padding:14px 20px}.inner{padding:20px 16px 48px}.cta{flex-direction:column}}
      `}</style>
      <div className="r">
        <nav className="nav">
          <Link href="/" className="nb">
            <span className="nd" /><span className="nn">Directory<span className="na">Network</span></span>
          </Link>
          <Link href={`/cannabis/illinois/${citySlug}`} className="nb2">← {city}</Link>
        </nav>
        <div className="bc">
          <Link href="/">Home</Link><span>›</span>
          <Link href="/cannabis">Cannabis</Link><span>›</span>
          <Link href="/cannabis/illinois">Illinois</Link><span>›</span>
          <Link href={`/cannabis/illinois/${citySlug}`}>{city}</Link><span>›</span>
          <span style={{color:"#374151"}}>Best dispensaries</span>
        </div>
        <div className="inner">
          <p className="lbl">Illinois Cannabis Directory</p>
          <h1 className="h1">Best Cannabis Dispensaries<br />in {city}, Illinois</h1>
          <p className="intro">
            All {listings.length} licensed cannabis dispensaries in {city}, IL — verified, with real hours
            and directions. Illinois recreational cannabis is legal for adults 21+. No medical card required.
          </p>
          <p className="count">{listings.length} dispensaries listed</p>

          {listings.map((l, i) => {
            const isFeatured = l.plan === "boost" || l.plan === "featured";
            const tags = [
              l.delivery && "🚗 Delivery",
              l.online_ordering && "📱 Online ordering",
              l.drive_thru && "🏎 Drive-thru",
            ].filter(Boolean) as string[];
            return (
              <Link key={l.id} href={`/l/${l.slug}`} className={`card${isFeatured ? " featured-card" : ""}`}>
                {isFeatured && <span className="fbadge">★ Featured</span>}
                <span className="num">{i + 1}</span>
                <div className="logo">
                  {l.logo_url ? <img src={l.logo_url} alt={l.name + " logo"} className="li" /> : (l.name ?? "?").charAt(0)}
                </div>
                <div className="info">
                  <p className="nm">{l.name}</p>
                  {l.address1 && <p className="addr">{l.address1}, {l.city}, {l.state}</p>}
                  {l.short_description && <p className="desc">{l.short_description}</p>}
                  {tags.length > 0 && (
                    <div className="tgs">{tags.map(t => <span key={t} className="tg">{t}</span>)}</div>
                  )}
                </div>
                <span className="arr">→</span>
              </Link>
            );
          })}

          <div className="faq">
            <p className="faq-title">Frequently asked questions</p>
            <div className="faq-item">
              <p className="faq-q">What are the best dispensaries in {city}, Illinois?</p>
              <p className="faq-a">Directory Network lists {listings.length} licensed cannabis dispensaries in {city}. All are state-licensed through the Illinois Department of Financial and Professional Regulation. Browse the listings above for hours, directions, and services.</p>
            </div>
            <div className="faq-item">
              <p className="faq-q">Do I need a medical card to buy cannabis in {city}?</p>
              <p className="faq-a">No. Illinois legalized recreational cannabis in January 2020. Adults 21 and older can purchase at any licensed dispensary with a valid government-issued ID. No medical card required.</p>
            </div>
            <div className="faq-item">
              <p className="faq-q">Do {city} dispensaries offer delivery or online ordering?</p>
              <p className="faq-a">Many Illinois dispensaries offer online ordering and curbside pickup. Check individual listing pages for current delivery availability and menu platforms.</p>
            </div>
          </div>

          <div className="cta">
            <div><p className="ct">Own a dispensary in {city}?</p><p className="cs">Claim your free listing or get featured at the top of this page for $49/month.</p></div>
            <Link href="/get-listed" className="cb">Claim your listing →</Link>
          </div>
        </div>
        <footer className="ft">
          <span className="fb">Directory<span className="na">Network</span></span>
          <span className="fn">© {new Date().getFullYear()} Directory Network · Illinois Cannabis Directory</span>
        </footer>
      </div>
    </>
  );
}
