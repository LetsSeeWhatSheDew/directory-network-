// app/medical/page.tsx — Central IL dispensaries confirmed selling medical.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import StoreAvatar from "../components/StoreAvatar";
import { brand } from "../../lib/brand";
import { storeImageUrl } from "../../lib/storeImage";
import { getRegionStores, getFeatureRows, featuresBySlug } from "../../lib/waysToBuy";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Medical Cannabis Dispensaries in Central Illinois (2026)",
  description:
    "Which Peoria, Bloomington-Normal, Champaign-Urbana, Pekin and Springfield dispensaries now sell medical cannabis — confirmed on each store's own site — plus what changed on Sept 10, 2026.",
  alternates: { canonical: `${brand.url}/medical` },
};

export default async function MedicalPage() {
  const [stores, rows] = await Promise.all([getRegionStores(), getFeatureRows()]);
  const F = featuresBySlug(rows);
  const yes = stores.filter((s) => F.get(s.slug)?.medical?.status === "yes");
  const no = stores.filter((s) => F.get(s.slug)?.medical?.status === "no");
  const unknown = stores.filter((s) => !F.get(s.slug)?.medical);

  return (
    <GuideShell
      crumbs={[{ href: "/ways-to-buy", label: "Ways to buy" }]}
      eyebrow="Medical · Central Illinois"
      title="Medical dispensaries in Central Illinois"
      lede={<>Since Sept 10, 2026, any Illinois dispensary can add medical sales. {yes.length} Central Illinois stores now say on their own site that they sell medical — each one below shows the exact wording we found.</>}
    >
      <h2 className="gp-h2">Confirmed selling medical</h2>
      <div className="gp-list">
        {yes.map((s) => {
          const r = F.get(s.slug)!.medical!;
          return (
            <Link key={s.slug} href={`/dispensary/${s.slug}`} className="gp-row">
              <StoreAvatar src={storeImageUrl(s.logo_url, s.slug)} name={s.name} size={40} />
              <span className="gp-row-main"><span className="gp-row-title">{s.name}</span><span className="gp-row-sub">{s.city} · {r.evidence}</span></span>
              <span className="gp-pill">Medical</span>
            </Link>
          );
        })}
      </div>
      {no.length > 0 && (
        <p className="gp-note">Recreational only, per the store&apos;s own site: {no.map((s) => `${s.name} (${s.city})`).join(", ")}.</p>
      )}
      <p className="gp-note">Not confirmed either way yet: {unknown.map((s) => s.name).join(", ")}. Call ahead if you&apos;re shopping with a card.</p>

      <h2 className="gp-h2">What changed</h2>
      <div className="gp-timeline">
        <div><div className="when">Sept 10, 2026</div>IDFPR issued medical licenses to 37 existing adult-use dispensaries, so one store can now serve both. <span className="gp-src">— <a href="https://idfpr.illinois.gov/news/2026/illinois-expands-access-medical-cannabis-patients-and-dispensaries.html" rel="nofollow noopener" target="_blank">IDFPR</a></span></div>
        <div><div className="when">June 12, 2026</div>SB 3222 let every dispensary apply to sell medical. <span className="gp-src">— <a href="https://chicago.suntimes.com/politics/2026/06/15/illinois-hemp-delta-8-cannabis-regulation-bill" rel="nofollow noopener" target="_blank">Chicago Sun-Times</a></span></div>
      </div>

      <h2 className="gp-h2">Why it matters for price</h2>
      <p className="gp-p">Medical purchases carry a much lower tax than recreational — stores in this list quote a 1% state tax with a valid card (for example <a href="https://letsascend.com/locations/illinois/springfield-adams-street/" rel="nofollow noopener" target="_blank">Ascend Springfield</a> and <a href="https://cookiespeoriaheights.com/" rel="nofollow noopener" target="_blank">Cookies Peoria Heights</a>). See the full math on our <Link href="/illinois-cannabis-tax-calculator">tax calculator</Link>.</p>
    </GuideShell>
  );
}
