import Link from "next/link";
import type { Metadata } from "next";
import { getBrand } from "../../../lib/brands";
import { brand as site } from "../../../lib/brand";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBrand(slug);
  const name = data?.name ?? prettySlug(slug);
  const title = `${name} — Illinois dispensary deals | PuffPrice`;
  const description =
    data?.description ??
    `${name} deals at Illinois dispensaries. Coming soon on PuffPrice.`;
  return {
    title,
    description,
    alternates: { canonical: `${site.url}/brand/${slug}` },
    robots: { index: false, follow: true },
  };
}

function prettySlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function BrandPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const data = await getBrand(slug);
  const name = data?.name ?? prettySlug(slug);

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#f5f4f0;color:#0f1f3d;min-height:100vh}
        .top-stripe{height:4px;background:#16a34a}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#fff;border-bottom:1px solid #e8e4da}
        .logo{display:flex;align-items:center;gap:8px;text-decoration:none}
        .logo-text{font-size:1.1rem;font-weight:700;color:#0f1f3d}
        .logo-text span{color:#16a34a}
        .back{font-size:.82rem;color:#6b7280;text-decoration:none;font-family:system-ui,sans-serif}
        .wrap{max-width:720px;margin:0 auto;padding:56px 28px 80px}
        .eyebrow{font-family:system-ui,sans-serif;font-size:.72rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#16a34a;margin-bottom:14px}
        h1{font-size:clamp(2rem,5vw,2.8rem);font-weight:700;letter-spacing:-.04em;line-height:1.08;margin-bottom:18px}
        .stub-card{background:#fff;border:1px solid #e8e4da;border-left:4px solid #16a34a;border-radius:14px;padding:28px 28px 24px;box-shadow:0 4px 16px rgba(15,31,61,.06);margin-top:12px}
        .stub-title{font-family:Georgia,serif;font-size:1.2rem;font-weight:700;color:#0f1f3d;margin-bottom:8px}
        .stub-body{font-family:system-ui,sans-serif;font-size:.95rem;color:#374151;line-height:1.6;max-width:52ch}
        .stub-foot{margin-top:18px;font-family:system-ui,sans-serif;font-size:.85rem}
        .stub-foot a{color:#16a34a;text-decoration:none;font-weight:600}
        .stub-foot a:hover{text-decoration:underline}
      `}</style>

      <div className="top-stripe" aria-hidden="true" />
      <nav className="nav">
        <Link href="/" className="logo">
          <span className="logo-text">puff<span>price</span></span>
        </Link>
        <Link href="/brand" className="back">← All brands</Link>
      </nav>

      <div className="wrap">
        <div className="eyebrow">Brand</div>
        <h1>{name}</h1>

        <div className="stub-card">
          <div className="stub-title">Brand pages are coming soon</div>
          <p className="stub-body">
            We&apos;re building a page for <strong>{name}</strong> that shows
            every Illinois dispensary carrying the brand, live deals on its
            products, and honest notes on quality and value. Check back
            soon.
          </p>
          <p className="stub-foot">
            In the meantime:{" "}
            <Link href="/deals/all">see every active Illinois deal →</Link>
          </p>
        </div>
      </div>
    </>
  );
}
