import Link from "next/link";
import Logo from "../../components/Logo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBrand, type Brand } from "../../../lib/brands";
import { brand as site } from "../../../lib/brand";

type Params = { slug: string };

export const revalidate = 300;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

type DealRow = {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  listing_slug: string | null;
  name: string | null;
  city: string | null;
  discount_value: number | null;
  discount_unit: string | null;
  expires_at: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBrand(slug);
  if (!data) {
    return { title: "Brand not found | PuffPrice", robots: { index: false } };
  }
  const title = `${data.name} — Central IL dispensary deals | PuffPrice`;
  const description =
    data.description?.slice(0, 180) ||
    `${data.name} deals at Central Illinois dispensaries, all in one place on PuffPrice.`;
  const url = `${site.url}/brand/${data.slug}`;
  const ogImage = `${site.url}/og-image.png`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "PuffPrice",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

async function getDealsForBrand(b: Brand): Promise<DealRow[]> {
  try {
    // active_deals_with_listings has joined dispensary data. Filter by
    // text match on title OR description against any brand keyword.
    const orParts = b.match_keywords
      .flatMap((kw) => {
        const escaped = kw.replace(/"/g, "");
        return [
          `title.ilike.*${encodeURIComponent(escaped)}*`,
          `description.ilike.*${encodeURIComponent(escaped)}*`,
          `deal_title.ilike.*${encodeURIComponent(escaped)}*`,
          `deal_description.ilike.*${encodeURIComponent(escaped)}*`,
        ];
      })
      .join(",");
    const url = `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=id,deal_id,listing_slug,slug,name,city,title,deal_title,description,deal_description,category,discount_value,discount_unit,expires_at&or=(${orParts})&order=discount_value.desc.nullslast&limit=40`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 300, tags: ["deals"] },
    });
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    const now = Date.now();
    return rows
      .filter((r) => {
        if (!r?.expires_at) return true;
        const t = new Date(r.expires_at).getTime();
        return !Number.isFinite(t) || t > now;
      })
      .map((r) => ({
        id: r.deal_id || r.id,
        title: r.deal_title || r.title,
        description: r.deal_description || r.description,
        category: r.category,
        listing_slug: r.listing_slug || r.slug,
        name: r.name,
        city: r.city,
        discount_value: r.discount_value ?? null,
        discount_unit: r.discount_unit ?? null,
        expires_at: r.expires_at ?? null,
      }))
      .filter((r) => r.id && r.listing_slug);
  } catch {
    return [];
  }
}

function formatDiscount(d: DealRow): string {
  if (d.discount_unit === "percent" && d.discount_value) {
    return `${Math.round(d.discount_value)}% off${d.category ? ` ${d.category}` : ""}`;
  }
  if (d.discount_unit === "dollars" && d.discount_value) {
    return `$${d.discount_value} off`;
  }
  return d.title || "Active deal";
}

export default async function BrandPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const data = await getBrand(slug);
  if (!data) notFound();

  const deals = await getDealsForBrand(data);

  const initials = data.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#fff;border-bottom:1px solid #e8e4da}
        .logo{display:flex;align-items:center;gap:8px;text-decoration:none}
        .logo-text{font-size:1.1rem;font-weight:700;color:#0f1f3d}
        .logo-text span{color:#16a34a}
        .back{font-size:.82rem;color:#6b7280;text-decoration:none;font-family:system-ui,sans-serif}
        .wrap{max-width:780px;margin:0 auto;padding:44px 24px 72px}
        .head{display:flex;align-items:center;gap:18px;margin-bottom:22px}
        .logo-mark{width:72px;height:72px;border-radius:16px;background:#0f1f3d;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.6rem;letter-spacing:.02em;font-family:system-ui,sans-serif;flex-shrink:0}
        .eyebrow{font-family:system-ui,sans-serif;font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#16a34a;margin-bottom:6px}
        h1{font-size:clamp(1.8rem,4.5vw,2.4rem);font-weight:700;letter-spacing:-.04em;line-height:1.1}
        .meta{font-family:system-ui,sans-serif;font-size:.85rem;color:#6b7280;margin-top:4px}
        .meta a{color:#16a34a;text-decoration:none;font-weight:600}
        .meta a:hover{text-decoration:underline}
        .prose{background:#fff;border:1px solid #e8e4da;border-radius:14px;padding:22px 22px;font-family:system-ui,sans-serif;font-size:1rem;line-height:1.65;color:#374151;margin-bottom:32px;max-width:64ch}
        h2{font-size:1.2rem;font-weight:700;color:#0f1f3d;margin-bottom:14px;font-family:Georgia,serif;letter-spacing:-.01em}
        .deal-list{display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:28px}
        .deal-card{background:#fff;border:1px solid #e8e4da;border-left:4px solid #16a34a;border-radius:12px;padding:16px 18px;text-decoration:none;color:inherit;transition:border-color .15s, box-shadow .15s}
        .deal-card:hover{border-color:#16a34a;box-shadow:0 2px 8px rgba(22,163,74,.12)}
        .deal-head{font-family:system-ui,sans-serif;font-size:.68rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#16a34a;margin-bottom:4px}
        .deal-title{font-size:1.02rem;font-weight:700;color:#0f1f3d;line-height:1.25;margin-bottom:4px}
        .deal-sub{font-family:system-ui,sans-serif;font-size:.85rem;color:#6b7280}
        .empty{background:#fff;border:1px solid #e8e4da;border-radius:12px;padding:22px;font-family:system-ui,sans-serif;color:#6b7280;font-size:.95rem;line-height:1.5}
        .cat-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
        .cat-tag{font-family:system-ui,sans-serif;font-size:.72rem;color:#6b7280;background:#f5f4f0;border-radius:100px;padding:3px 10px}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo" aria-label="PuffPrice home">
          <Logo />
        </Link>
        <Link href="/brand" className="back">← All brands</Link>
      </nav>

      <main className="wrap">
        <div className="head">
          <div className="logo-mark" aria-hidden="true">{initials}</div>
          <div>
            <div className="eyebrow">Brand</div>
            <h1>{data.name}</h1>
            {data.website && (
              <div className="meta">
                <a href={data.website} target="_blank" rel="noopener noreferrer">
                  {new URL(data.website).hostname.replace(/^www\./, "")} ↗
                </a>
              </div>
            )}
          </div>
        </div>

        {data.description && (
          <div className="prose">
            <p>{data.description}</p>
            <div className="cat-tags" aria-label="Categories">
              {data.categories.map((c) => (
                <span key={c} className="cat-tag">{c}</span>
              ))}
            </div>
          </div>
        )}

        <h2>Deals featuring {data.name}</h2>
        {deals.length === 0 ? (
          <div className="empty">
            No active deals featuring {data.name} right now. We refresh deals
            daily — check back soon, or{" "}
            <Link href="/deals/all" style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>
              browse every active Illinois deal →
            </Link>
          </div>
        ) : (
          <div className="deal-list">
            {deals.map((d) => (
              <Link key={d.id} href={`/deal/${d.id}`} className="deal-card">
                <div className="deal-head">{formatDiscount(d)}</div>
                <div className="deal-title">
                  {d.name || d.listing_slug}
                  {d.city ? ` — ${d.city}` : ""}
                </div>
                {d.title && d.title !== formatDiscount(d) && (
                  <div className="deal-sub">{d.title}</div>
                )}
              </Link>
            ))}
          </div>
        )}

        <div style={{ marginTop: 18, fontFamily: "system-ui, sans-serif", fontSize: ".85rem", color: "#9ca3af" }}>
          Brand match based on deal title / description keywords —{" "}
          {data.match_keywords.slice(0, 3).join(", ")}
          {data.match_keywords.length > 3 ? ", and more" : ""}. Think we missed one?{" "}
          <a
            href={`mailto:${site.supportEmail}?subject=Brand%20match%20fix%20for%20${encodeURIComponent(data.name)}`}
            style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none" }}
          >
            Let us know
          </a>
          .
        </div>
      </main>
    </>
  );
}
