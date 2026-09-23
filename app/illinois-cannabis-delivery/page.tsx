// app/illinois-cannabis-delivery/page.tsx — delivery law tracker + ZIP waitlist.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import ZipSignup from "../components/ZipSignup";
import { brand } from "../../lib/brand";

export const revalidate = 3600;
const LAST_CHECKED = "Sept 23, 2026";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";

export const metadata: Metadata = {
  title: "Is Cannabis Delivery Legal in Illinois? (2026 Tracker)",
  description:
    "Weed delivery is still not legal in Illinois. Where every delivery bill stands, what you can do instead today (order ahead, curbside, drive-thru), and get told the day delivery reaches your ZIP.",
  alternates: { canonical: `${brand.url}/illinois-cannabis-delivery` },
};

const FAQ = [
  { q: "Is cannabis delivery legal in Illinois?", a: `No. As of ${LAST_CHECKED}, neither recreational nor medical cannabis delivery is legal in Illinois. The main delivery bill (HB2557) died in committee in 2026.` },
  { q: "Can I order cannabis online in Illinois?", a: "Yes — you can order ahead online and pick up in store, curbside, or (where approved) at a drive-thru window. You can't have it delivered to your door." },
  { q: "When will Illinois allow cannabis delivery?", a: "No delivery bill is moving right now. Any change would need a new bill passed by the General Assembly and signed by the Governor, then state rules and licenses." },
];

async function demand(): Promise<Array<{ zip: string; signups: number }>> {
  try {
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const r = await fetch(`${SUPABASE_URL}/rest/v1/delivery_waitlist_by_zip?select=zip,signups&order=signups.desc&limit=10`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` }, next: { revalidate: 3600 },
    });
    return r.ok ? await r.json() : [];
  } catch { return []; }
}

export default async function DeliveryPage() {
  const zips = await demand();
  return (
    <GuideShell
      crumbs={[{ href: "/ways-to-buy", label: "Ways to buy" }, { href: "/cannabis/illinois/laws", label: "Illinois laws" }]}
      eyebrow={`Delivery law tracker · checked ${LAST_CHECKED}`}
      title="Is cannabis delivery legal in Illinois?"
      lede={<><b>Not yet.</b> Recreational and medical delivery are both still illegal in Illinois, and no delivery bill is moving right now. When that changes, this page changes the same day — and PuffPrice will compare the real delivered price, fee and minimum included.</>}
      jsonLd={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }}
    >
      <div className="gp-cta">
        <b>Get told the day delivery reaches your ZIP</b>
        <ZipSignup source="delivery" cta="Notify me" />
      </div>

      <h2 className="gp-h2">Where the bills stand</h2>
      <div className="gp-timeline">
        <div><div className="when">June 12, 2026 · signed</div>SB 3222 — the big 2026 cannabis law — added drive-thru, curbside, 2 a.m. hours and doubled possession limits. <b>It did not include delivery.</b> <span className="gp-src">— <a href="https://www.foxrothschild.com/publications/illinois-overhauls-its-cannabis-and-hemp-regulations" rel="nofollow noopener" target="_blank">Fox Rothschild</a>, <a href="https://illinoiscannabis.org/news-07jul2026" rel="nofollow noopener" target="_blank">IllinoisCannabis.org</a></span></div>
        <div><div className="when">June 1, 2026 · dead</div>HB2557, the Cannabis Delivery License Act (Rep. Sonya Harper) — would have licensed delivery businesses with GPS-tracked vehicles and 21+ drivers — never left the Rules Committee. <span className="gp-src">— <a href="https://www.billtrack50.com/billdetail/1816456" rel="nofollow noopener" target="_blank">BillTrack50</a></span></div>
        <div><div className="when">Feb 6, 2025 · stalled</div>HB3074 (cannabis delivery licenses, Rep. Harper) was referred to the Rules Committee and hasn&apos;t moved. <span className="gp-src">— <a href="https://trackbill.com/bill/illinois-house-bill-3074-cannabis-delivery-licenses/2650982/" rel="nofollow noopener" target="_blank">TrackBill</a></span></div>
        <div><div className="when">Jan 2023 · stalled</div>SB 2404 proposed up to 200 delivery licenses through IDFPR; it was adjourned in the Senate. <span className="gp-src">— <a href="https://illinoiscannabis.org/delivery" rel="nofollow noopener" target="_blank">IllinoisCannabis.org</a></span></div>
      </div>

      <h2 className="gp-h2">What you can do today instead</h2>
      <div className="gp-grid">
        <Link href="/ways-to-buy#compare" className="gp-card"><b>Order ahead</b><span>Pay less time in store — pick up in minutes.</span></Link>
        <Link href="/ways-to-buy#compare" className="gp-card"><b>Curbside</b><span>Pick up without going inside, where the store is approved.</span></Link>
        <Link href="/drive-thru" className="gp-card gp-hero-card"><b>Drive-thru</b><span>Legal since June 12, 2026 — our Central Illinois tracker.</span></Link>
      </div>

      <h2 className="gp-h2">What PuffPrice does the day delivery is legal</h2>
      <p className="gp-p"><b>Compare the delivered price, not the sticker price.</b> Deal + delivery fee + order minimum + wait time, side by side, so the cheapest option is actually the cheapest.</p>
      <p className="gp-p"><b>Show who delivers to your ZIP.</b> Only stores that confirm it on their own site.</p>
      <p className="gp-p"><b>Still no paid placement.</b> Delivery apps sell the top spot. We don&apos;t — <Link href="/how-we-rank">how we rank</Link>.</p>

      {zips.length > 0 && (
        <>
          <h2 className="gp-h2">Where people are waiting</h2>
          <table className="gp-table" style={{ maxWidth: 420 }}>
            <thead><tr><th>ZIP</th><th style={{ textAlign: "right" }}>Waiting</th></tr></thead>
            <tbody>{zips.map((z) => <tr key={z.zip}><td>{z.zip}</td><td className="num">{z.signups}</td></tr>)}</tbody>
          </table>
        </>
      )}

      <h2 className="gp-h2">Questions</h2>
      {FAQ.map((f) => (
        <div key={f.q} style={{ marginBottom: 14 }}><b>{f.q}</b><p className="gp-p" style={{ marginTop: 4 }}>{f.a}</p></div>
      ))}
      <p className="gp-note">Not legal advice. We track public bill status and update this page when anything moves.</p>
    </GuideShell>
  );
}
