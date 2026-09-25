// app/drive-thru/page.tsx — Central Illinois cannabis drive-thru tracker.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import StoreAvatar from "../components/StoreAvatar";
import ZipSignup from "../components/ZipSignup";
import { brand } from "../../lib/brand";
import { storeImageUrl } from "../../lib/storeImage";
import { getRegionStores, getFeatureRows, featuresBySlug } from "../../lib/waysToBuy";

export const revalidate = 3600;
const LAST_CHECKED = "Sept 23, 2026";

export const metadata: Metadata = {
  title: "Drive-Thru Dispensaries in Central Illinois (Peoria, Bloomington, Champaign, Springfield)",
  description:
    "Illinois legalized cannabis drive-thrus on June 12, 2026. Which Central Illinois dispensaries have one, how a dispensary drive-thru works, and where to order ahead and pick up fast today.",
  alternates: { canonical: `${brand.url}/drive-thru` },
};

const FAQ = [
  { q: "Are cannabis drive-thrus legal in Illinois?", a: "Yes. SB 3222, signed June 12, 2026, allows dispensaries to serve customers through a drive-through once IDFPR reviews and approves the store's setup." },
  { q: "Is there a drive-thru dispensary in Peoria, Bloomington-Normal, Champaign-Urbana or Springfield?", a: `Not yet — as of ${LAST_CHECKED}, none of the Central Illinois stores PuffPrice tracks has opened one. This page lists the first one the day it opens.` },
  { q: "How does a dispensary drive-thru work?", a: "At the Illinois drive-thrus open so far, you order online first and pick up at the window, where staff check your ID." },
];

export default async function DriveThruPage() {
  const [stores, rows] = await Promise.all([getRegionStores(), getFeatureRows()]);
  const F = featuresBySlug(rows);
  const open = stores.filter((s) => F.get(s.slug)?.drive_thru?.status === "yes");
  const coming = stores.filter((s) => F.get(s.slug)?.drive_thru?.status === "announced");
  const fast = stores.filter((s) => F.get(s.slug)?.order_ahead?.status === "yes" || F.get(s.slug)?.curbside?.status === "yes");

  return (
    <GuideShell
      crumbs={[{ href: "/ways-to-buy", label: "Ways to buy" }]}
      eyebrow={`Drive-thru tracker · checked ${LAST_CHECKED}`}
      title="Drive-thru dispensaries in Central Illinois"
      lede={
        open.length > 0
          ? <>Illinois made cannabis drive-thrus legal on June 12, 2026. {open.length} Central Illinois {open.length === 1 ? "store has" : "stores have"} one open — listed first below.</>
          : <>Illinois made cannabis drive-thrus legal on June 12, 2026. As of {LAST_CHECKED}, none of the {stores.length} Central Illinois stores we track has opened one yet. The day one does, it goes at the top of this page.</>
      }
      jsonLd={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }}
    >
      {open.length > 0 && (
        <>
          <h2 className="gp-h2">Open now in Central Illinois</h2>
          <div className="gp-list">
            {open.map((s) => (
              <Link key={s.slug} href={`/dispensary/${s.slug}`} className="gp-row">
                <StoreAvatar src={storeImageUrl(s.logo_url, s.slug)} name={s.name} size={40} />
                <span className="gp-row-main"><span className="gp-row-title">{s.name}</span><span className="gp-row-sub">{s.city} · {F.get(s.slug)?.drive_thru?.evidence}</span></span>
                <span className="gp-pill">Drive-thru</span>
              </Link>
            ))}
          </div>
        </>
      )}
      {coming.length > 0 && (
        <>
          <h2 className="gp-h2">Announced</h2>
          <div className="gp-list">
            {coming.map((s) => (
              <Link key={s.slug} href={`/dispensary/${s.slug}`} className="gp-row">
                <StoreAvatar src={storeImageUrl(s.logo_url, s.slug)} name={s.name} size={40} />
                <span className="gp-row-main"><span className="gp-row-title">{s.name}</span><span className="gp-row-sub">{s.city} · {F.get(s.slug)?.drive_thru?.evidence}</span></span>
                <span className="gp-pill muted">Coming</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="gp-cta">
        <b>Be first to know when a drive-thru opens near you</b>
        <ZipSignup source="drive_thru" cta="Tell me first" />
      </div>

      <h2 className="gp-h2">Where Illinois drive-thrus are already open</h2>
      <div className="gp-timeline">
        <div><div className="when">Sept 4, 2026</div>Terrabis in Grayville (near I-64) opened what it called Illinois&apos; first dual-window dispensary drive-thru. <span className="gp-src">— <a href="https://greenwaymagazine.com/2026/09/04/terrabis-opens-illinois-first-dual-window-drive-thru-dispensary-in-grayville/" rel="nofollow noopener" target="_blank">Greenway Magazine</a></span></div>
        <div><div className="when">Sept 2026</div>Terrabis announced a drive-thru at its Woodstock store (McHenry County), set to open by the end of September, and plans one at each of its five Illinois stores by year-end. <span className="gp-src">— <a href="https://www.prnewswire.com/news-releases/terrabis-to-open-mchenry-countys-first-dispensary-drive-thru-in-woodstock-302873322.html" rel="nofollow noopener" target="_blank">Terrabis via PR Newswire</a></span></div>
        <div><div className="when">Sept 13, 2026</div>Dixon&apos;s city council cleared the way for a cannabis drive-thru. <span className="gp-src">— <a href="https://www.shawlocal.com/sauk-valley/2026/09/13/dixon-council-clears-way-for-cannabis-drive-thru/" rel="nofollow noopener" target="_blank">Shaw Local</a></span></div>
        <div><div className="when">July 9, 2026</div>nuEra — which runs stores in East Peoria, Pekin, Champaign and Urbana — said it is preparing drive-thru service at select locations, with no locations or dates announced. <span className="gp-src">— <a href="https://nueracannabis.com/local-guides/illinois-dispensaries-with-drive-through-service-the-future-of-cannabis-shopping-is-here/" rel="nofollow noopener" target="_blank">nuEra</a></span></div>
      </div>

      <h2 className="gp-h2">How a dispensary drive-thru works</h2>
      <p className="gp-p"><b>Order online first.</b> At the Illinois drive-thrus open so far, you place your order ahead and pull up to pick it up. <span className="gp-src">(<a href="https://hoodline.com/2026/09/woodstock-dispensary-opens-one-of-illinois-first-cannabis-drive-thrus/" rel="nofollow noopener" target="_blank">Hoodline</a>)</span></p>
      <p className="gp-p"><b>Have your ID ready.</b> Stores still have to verify you&apos;re 21+ (or a registered medical patient) at the window.</p>
      <p className="gp-p"><b>Every store needs state sign-off.</b> IDFPR has to review and approve a store&apos;s drive-thru or curbside setup before it can open one. <span className="gp-src">(<a href="https://www.marijuanamoment.net/illinois-officials-update-marijuana-dispensaries-on-increased-possession-limits-and-ability-to-add-drive-thru-windows/" rel="nofollow noopener" target="_blank">Marijuana Moment</a>)</span></p>

      <h2 className="gp-h2">Why there&apos;s none in Central Illinois yet</h2>
      <p className="gp-p">The state law opened the door; each store still has four gates to clear, and the first two are slow:</p>
      <ol className="gp-p" style={{ paddingLeft: 20, lineHeight: 1.7 }}>
        <li><b>The city changes its cannabis ordinance.</b> Most local rules were written in 2019–20 and don&apos;t allow a pickup window — Dixon had to amend its ordinance before its store could apply. <span className="gp-src">(<a href="https://www.shawlocal.com/sauk-valley/2026/09/13/dixon-council-clears-way-for-cannabis-drive-thru/" rel="nofollow noopener" target="_blank">Shaw Local</a>)</span></li>
        <li><b>A building permit and a real lane and window.</b> Stores in strip centers or on campus streets may not have room for one.</li>
        <li><b>IDFPR reviews the floor plan, security plan and procedures.</b> <span className="gp-src">(<a href="https://www.shawlocal.com/sauk-valley/2026/09/13/dixon-council-clears-way-for-cannabis-drive-thru/" rel="nofollow noopener" target="_blank">Shaw Local</a>)</span></li>
        <li><b>Time and money.</b> The law is new, and September went to adding medical sales.</li>
      </ol>
      <p className="gp-p"><b>Watching the city councils:</b> as of {LAST_CHECKED} we haven&apos;t seen a drive-thru ordinance on the agenda in Peoria, East Peoria, Peoria Heights, Pekin, Bloomington, Normal, Champaign, Urbana or Springfield. The first one to show up goes here — sign up above and you&apos;ll hear it first.</p>

      <h2 className="gp-h2">Fastest pickup in Central Illinois today</h2>
      <p className="gp-p">No drive-thru yet — but these stores let you order ahead or pick up curbside, which is the closest thing.</p>
      <div className="gp-list">
        {fast.map((s) => {
          const f = F.get(s.slug) || {};
          return (
            <Link key={s.slug} href={`/dispensary/${s.slug}`} className="gp-row">
              <StoreAvatar src={storeImageUrl(s.logo_url, s.slug)} name={s.name} size={40} />
              <span className="gp-row-main"><span className="gp-row-title">{s.name}</span><span className="gp-row-sub">{s.city}</span></span>
              <span style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {f.order_ahead?.status === "yes" && <span className="gp-pill">Order ahead</span>}
                {f.curbside?.status === "yes" && <span className="gp-pill">Curbside</span>}
              </span>
            </Link>
          );
        })}
      </div>

      <h2 className="gp-h2">Questions</h2>
      {FAQ.map((f) => (
        <div key={f.q} style={{ marginBottom: 14 }}>
          <b>{f.q}</b>
          <p className="gp-p" style={{ marginTop: 4 }}>{f.a}</p>
        </div>
      ))}
      <p className="gp-note">Run a Central Illinois dispensary with a drive-thru? <Link href="/claim">Tell us</Link> and we&apos;ll verify it on your site and list it the same day.</p>
    </GuideShell>
  );
}
