// app/open-late/page.tsx — who's open latest tonight in Central Illinois.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import StoreAvatar from "../components/StoreAvatar";
import { brand } from "../../lib/brand";
import { storeImageUrl } from "../../lib/storeImage";
import { getRegionStores, getClosingTonight } from "../../lib/waysToBuy";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Dispensaries Open Late Tonight in Central Illinois",
  description:
    "Which Peoria, Bloomington-Normal, Champaign-Urbana, Pekin and Springfield dispensaries are open latest tonight, sorted by closing time. Illinois now allows hours until 2 a.m. with city approval.",
  alternates: { canonical: `${brand.url}/open-late` },
};

export default async function OpenLatePage() {
  const stores = await getRegionStores();
  const tonight = await getClosingTonight(stores);
  const listed = tonight.filter((t) => t.closesAt);
  const past10 = listed.filter((t) => t.closesAt && (t.closesAt > "22:00:00" || t.closesAt < "05:00:00"));

  return (
    <GuideShell
      crumbs={[{ href: "/ways-to-buy", label: "Ways to buy" }]}
      eyebrow="Open late · tonight"
      title="Who's open latest tonight"
      lede={<>Every Central Illinois store, sorted by tonight&apos;s closing time. Illinois now lets dispensaries stay open until 2 a.m. with city approval — {past10.length > 0 ? `${past10.length} store${past10.length === 1 ? "" : "s"} here already stay open past 10.` : "none here stay open past 10 p.m. yet. We'll flag the first one."}</>}
    >
      <div className="gp-list" style={{ marginTop: 22 }}>
        {tonight.map(({ store: s, closesLabel, openNow }) => (
          <Link key={s.slug} href={`/dispensary/${s.slug}`} className="gp-row">
            <StoreAvatar src={storeImageUrl(s.logo_url, s.slug)} name={s.name} size={40} />
            <span className="gp-row-main"><span className="gp-row-title">{s.name}</span><span className="gp-row-sub">{s.city}{openNow ? " · open now" : ""}</span></span>
            <span className="gp-row-right" style={{ color: openNow ? "var(--pp-canopy)" : "var(--pp-muted)" }}>{closesLabel.replace("Open until ", "")}</span>
          </Link>
        ))}
      </div>
      <p className="gp-note">Hours come from each store&apos;s listing and can change for holidays — call ahead late at night. Source for the 2 a.m. rule: <a href="https://illinoiscannabis.org/news-07jul2026" rel="nofollow noopener" target="_blank">IllinoisCannabis.org summary of SB 3222</a>.</p>
    </GuideShell>
  );
}
