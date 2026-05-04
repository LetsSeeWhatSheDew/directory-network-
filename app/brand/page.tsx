import Link from "next/link";
import Logo from "../components/Logo";
import type { Metadata } from "next";
import { getAllBrands } from "../../lib/brands";
import { brand as site } from "../../lib/brand";

export const metadata: Metadata = {
  title: "Central Illinois cannabis brands | PuffPrice",
  description:
    "Cannabis brands carried at Central Illinois dispensaries, with live deals pulled from every shop PuffPrice tracks.",
  alternates: { canonical: `${site.url}/brand` },
  openGraph: {
    title: "Central Illinois cannabis brands",
    description: "Cannabis brands carried at Central Illinois dispensaries, with live deals pulled from every shop PuffPrice tracks.",
    url: `${site.url}/brand`,
    siteName: "PuffPrice",
    type: "website",
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Central Illinois cannabis brands",
    description: "Cannabis brands carried at Central Illinois dispensaries, with live deals pulled from every shop PuffPrice tracks.",
    images: [`${site.url}/og-image.png`],
  },
};

export default async function BrandIndex() {
  const brands = await getAllBrands();

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,serif;background:#F7F4ED;color:#1F3D2B;min-height:100vh}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#fff;border-bottom:1px solid #e8e4da}
        .logo{display:flex;align-items:center;gap:8px;text-decoration:none}
        .logo-text{font-size:1.1rem;font-weight:700;color:#1F3D2B}
        .logo-text span{color:#7DBA47}
        .back{font-size:.82rem;color:#6b7280;text-decoration:none;font-family:system-ui,sans-serif}
        .wrap{max-width:720px;margin:0 auto;padding:56px 28px 80px}
        .eyebrow{font-family:system-ui,sans-serif;font-size:.72rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#7DBA47;margin-bottom:14px}
        h1{font-size:clamp(2rem,5vw,2.8rem);font-weight:700;letter-spacing:-.04em;line-height:1.08;margin-bottom:18px}
        .lede{font-family:system-ui,sans-serif;font-size:1.05rem;color:#374151;line-height:1.55;margin-bottom:28px;max-width:58ch}
        .stub-card{background:#fff;border:1px solid #e8e4da;border-left:4px solid #7DBA47;border-radius:14px;padding:28px 28px 24px;box-shadow:0 4px 16px rgba(15,31,61,.06)}
        .stub-title{font-family:Georgia,serif;font-size:1.2rem;font-weight:700;color:#1F3D2B;margin-bottom:8px}
        .stub-body{font-family:system-ui,sans-serif;font-size:.95rem;color:#374151;line-height:1.6;max-width:52ch}
        .stub-foot{margin-top:18px;font-family:system-ui,sans-serif;font-size:.85rem}
        .stub-foot a{color:#7DBA47;text-decoration:none;font-weight:600}
        .stub-foot a:hover{text-decoration:underline}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo" aria-label="PuffPrice home">
          <Logo />
        </Link>
        <Link href="/" className="back">← Home</Link>
      </nav>

      <div className="wrap">
        <div className="eyebrow">Brands</div>
        <h1>Central Illinois cannabis brands</h1>
        <p className="lede">
          We&apos;re building pages for every brand carried at Central
          Illinois dispensaries — so you can see where they&apos;re sold,
          what the price is today, and which shops are running a deal.
        </p>

        {brands.length === 0 ? (
          <div className="stub-card">
            <div className="stub-title">Coming soon</div>
            <p className="stub-body">
              Brand pages are in progress. They&apos;ll land as Cowork&apos;s
              affiliate research lands — we won&apos;t ship a list of brands
              until the list is honest and complete.
            </p>
            <p className="stub-foot">
              Meanwhile:{" "}
              <Link href="/deals/all">browse every active Central IL deal →</Link>
            </p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {brands.map((b) => (
              <li key={b.slug}>
                <Link href={`/brand/${b.slug}`} style={{ display: "block", padding: 14, background: "#fff", border: "1px solid #e8e4da", borderRadius: 10, textDecoration: "none", color: "#1F3D2B", fontFamily: "system-ui, sans-serif", fontWeight: 600 }}>
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
