// app/for-dispensaries/page.tsx — what PuffPrice offers stores (free), and the per-store report.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import StoreAvatar from "../components/StoreAvatar";
import { brand } from "../../lib/brand";
import { storeImageUrl } from "../../lib/storeImage";
import { getRegionStores } from "../../lib/waysToBuy";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "For Dispensaries — Free Deal Report | PuffPrice",
  description:
    "Central Illinois dispensaries: see how your deals compare with your city, what shoppers can confirm about your store, and how to get your deals listed accurately. Free. No store pays to rank.",
  alternates: { canonical: `${brand.url}/for-dispensaries` },
};

export default async function ForDispensariesPage() {
  const stores = await getRegionStores();
  return (
    <GuideShell
      eyebrow="For dispensaries"
      title="Your free deal report"
      lede={<>Every day we check your site and log every deal we find. Your report shows what shoppers see: your live deals, how your discounts compare with your city, and which ways to buy (medical, curbside, order ahead, drive-thru) we could confirm on your site. Free — and nobody can pay to rank.</>}
    >
      <div className="gp-grid" style={{ marginTop: 22 }}>
        <div className="gp-card"><b>Accurate, daily</b><span>Pulled from your own site every morning. If it&apos;s wrong on your site, it&apos;s wrong here — fix it once, it&apos;s fixed everywhere.</span></div>
        <div className="gp-card"><b>Compare with your city</b><span>Your deal count and average discount next to the city average, from the <Link href="/deal-index">Deal Index</Link>.</span></div>
        <div className="gp-card"><b>Get credit for what you offer</b><span>Drive-thru, curbside, medical, order ahead — we list it the day we can confirm it on your site.</span></div>
      </div>
      <h2 className="gp-h2">Find your store</h2>
      <div className="gp-list">
        {stores.map((s) => (
          <Link key={s.slug} href={`/for-dispensaries/${s.slug}`} className="gp-row">
            <StoreAvatar src={storeImageUrl(s.logo_url, s.slug)} name={s.name} size={36} />
            <span className="gp-row-main"><span className="gp-row-title">{s.name}</span><span className="gp-row-sub">{s.city}</span></span>
            <span className="gp-src">Report →</span>
          </Link>
        ))}
      </div>
      <div className="gp-cta">
        <b>Something missing or wrong?</b>
        <span>Send us the page on your site that shows it — a new deal, a drive-thru, medical sales — and we&apos;ll verify and update the same day.</span>
        <Link href="/claim" style={{ background: "rgb(255 255 255)", color: "rgb(31 74 50)", fontWeight: 700, padding: "10px 16px", borderRadius: 10, textDecoration: "none", alignSelf: "flex-start" }}>Claim your listing</Link>
      </div>
    </GuideShell>
  );
}
