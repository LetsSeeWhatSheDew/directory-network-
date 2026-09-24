// app/green-wednesday/page.tsx — the Green Wednesday hub (Wed, Nov 25, 2026:
// the day before Thanksgiving). Before the day it helps people plan and
// surfaces any deal a store has already announced for it; on the day it
// becomes the full list, biggest everyday saving first, with out-the-door
// prices where the store posts one. Real deals only, from the live view.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import WeeklySignup from "../components/WeeklySignup";
import OtdLine from "../components/OtdLine";
import { brand } from "../../lib/brand";
import { amountOf, isConditional, needsQuantity, saveLabel, storeName, cleanDealTitle, type ExDeal } from "../../lib/exhale";

export const revalidate = 900;

const DAY = "2026-11-25";
const DAY_LABEL = "Wednesday, November 25, 2026";

export const metadata: Metadata = {
  title: "Green Wednesday 2026 Dispensary Deals in Central Illinois",
  description:
    "Green Wednesday is Wednesday, Nov. 25, 2026, the day before Thanksgiving. Every Peoria, Bloomington-Normal, Champaign-Urbana, Pekin and Springfield dispensary deal on one page, checked on each store's own site.",
  alternates: { canonical: `${brand.url}/green-wednesday` },
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hnbjufmtmrhexmdrfubw.supabase.co";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";
const REGION = ["Peoria", "East Peoria", "Peoria Heights", "Pekin", "Bloomington", "Normal", "Champaign", "Urbana", "Springfield"];

async function getDeals(): Promise<(ExDeal & { deal_id: string })[]> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/active_deals_with_listings?select=deal_id,deal_title,deal_description,category,city,name,slug,listing_slug,discount_value,discount_unit,discount_type&order=discount_value.desc.nullslast&limit=400`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, next: { revalidate: 900 } }
    );
    const rows = r.ok ? await r.json() : [];
    return rows.filter((d: ExDeal) => REGION.includes(String(d.city || "")));
  } catch {
    return [];
  }
}

function daysUntil(): number {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const day = new Date(`${DAY}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((day.getTime() - today.getTime()) / 86400000);
}

export default async function GreenWednesdayPage() {
  const all = await getDeals();
  const n = daysUntil();
  const isDay = n === 0;
  const announced = all.filter((d) => /green\s*wednesday|thanksgiving|black\s*friday|turkey/i.test(`${d.deal_title || ""} ${(d as { deal_description?: string }).deal_description || ""}`));
  const everyday = all
    .filter((d) => amountOf(d) && !isConditional(d))
    .sort((a, b) => (needsQuantity(a) ? 1 : 0) - (needsQuantity(b) ? 1 : 0) || amountOf(b)!.value - amountOf(a)!.value);
  const list = isDay ? everyday : announced;
  const preview = everyday.slice(0, 5);

  const faq = [
    { q: "When is Green Wednesday 2026?", a: `${DAY_LABEL}, the day before Thanksgiving.` },
    {
      q: "Where can I find Green Wednesday dispensary deals near Peoria?",
      a: "On this page. The morning of Green Wednesday we check every Central Illinois dispensary's own website and list every deal we find, biggest saving first, with the price after tax where the store posts a price.",
    },
  ];
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    { "@context": "https://schema.org", "@type": "Event", name: "Green Wednesday 2026 — Central Illinois dispensary deals", startDate: DAY, endDate: DAY, eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled", location: { "@type": "Place", name: "Central Illinois", address: { "@type": "PostalAddress", addressRegion: "IL", addressCountry: "US" } }, organizer: { "@type": "Organization", name: brand.name, url: brand.url }, url: `${brand.url}/green-wednesday` },
  ];

  const Row = ({ d }: { d: ExDeal & { deal_id: string } }) => {
    const title = cleanDealTitle(d.deal_title);
    const pill = saveLabel({ ...d, deal_title: title });
    return (
      <Link href={`/deal/${d.deal_id}`} className="gp-row">
        <span className="gp-row-main">
          <span className="gp-row-title">{storeName(d)}{d.city && !storeName(d).toLowerCase().includes(String(d.city).toLowerCase()) ? ` · ${d.city}` : ""}</span>
          <span className="gp-row-sub">{title}</span>
          <OtdLine deal={{ ...d, deal_title: title }} />
        </span>
        {pill ? <span className="pp-save">{pill}</span> : <span className="gp-pill muted">Deal</span>}
      </Link>
    );
  };

  return (
    <GuideShell
      crumbs={[{ href: "/deals/all", label: "Deals" }]}
      eyebrow={`Green Wednesday · ${isDay ? "today" : n > 0 ? `${n} day${n === 1 ? "" : "s"} away` : "Nov 25, 2026"}`}
      title="Green Wednesday in Central Illinois"
      lede={
        <>
          Green Wednesday is <b>{DAY_LABEL}</b>, the day before Thanksgiving. A lot of dispensaries save their biggest fall sales for it.
          {isDay
            ? " Here's every deal we found on the stores' own sites this morning, biggest saving first."
            : " That morning we'll check every Central Illinois store's own site and put every deal on this page, biggest saving first, with the price after tax where a store posts one. Bookmark it. You won't have to open twenty tabs."}
        </>
      }
      jsonLd={jsonLd}
    >
      <style>{`
        .gw-count{display:flex;align-items:baseline;gap:10px;margin:22px 0 6px}
        .gw-count b{font-family:var(--font-body);font-weight:700;font-size:clamp(64px,16vw,96px);letter-spacing:-.055em;line-height:.9;color:var(--pp-big)}
        .gw-count span{font-size:1.05rem;color:var(--pp-body)}
        .gw-panel{background:var(--pp-haze);border:1px solid var(--pp-haze-border);border-radius:20px;padding:18px;margin:22px 0}
        .gw-panel b.t{display:block;font-family:var(--font-breath);font-weight:400;font-size:1.5rem;line-height:1.1;margin-bottom:8px;color:var(--pp-ink)}
        .gw-panel p{margin:0 0 12px;color:var(--pp-body);font-size:.95rem;line-height:1.5}
        .gw-tips{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin-top:10px}
        .gw-tips a{display:flex;flex-direction:column;gap:4px;padding:16px;border:1px solid var(--pp-border);border-radius:16px;background:var(--pp-surface);color:inherit;text-decoration:none}
        .gw-tips b{font-weight:600}
        .gw-tips span{font-size:.86rem;color:var(--pp-muted);line-height:1.45}
        .gp-row .pp-otd{margin-top:2px}
      `}</style>

      {!isDay && n > 0 && (
        <div className="gw-count" aria-label={`${n} days until Green Wednesday`}>
          <b>{n}</b>
          <span>days to go. Breathe. Nothing to do yet.</span>
        </div>
      )}

      {list.length > 0 ? (
        <>
          <h2 className="gp-h2">{isDay ? `Every deal today · ${list.length}` : "Announced early"}</h2>
          {!isDay && <p className="gp-note">Deals stores have already posted that mention Green Wednesday, Thanksgiving or Black Friday.</p>}
          <div className="gp-list">{list.map((d) => <Row key={d.deal_id} d={d} />)}</div>
        </>
      ) : !isDay ? (
        <p className="gp-note" style={{ marginTop: 18 }}>No store has announced a Green Wednesday deal yet. The first one that does shows up here.</p>
      ) : null}

      <div className="gw-panel">
        <b className="t">Get it in your inbox</b>
        <p>Our free Monday report has the best deals in your city every week, including the week of Green Wednesday. One email, unsubscribe in a click.</p>
        <WeeklySignup tone="light" />
      </div>

      <h2 className="gp-h2">Plan it the calm way</h2>
      <div className="gw-tips">
        <Link href="/out-the-door"><b>Know the real price</b><span>Tax adds about a quarter to almost half of the shelf price. See deals with tax already added.</span></Link>
        <Link href="/ways-to-buy#compare"><b>Order ahead, skip the line</b><span>Which stores take online orders and curbside, side by side.</span></Link>
        <Link href="/open-late"><b>Who&apos;s open latest</b><span>Every store sorted by tonight&apos;s closing time.</span></Link>
        <Link href="/medical"><b>Medical card?</b><span>Patients pay 1% state tax instead of the full rate. Stores that serve patients.</span></Link>
      </div>

      {!isDay && preview.length > 0 && (
        <>
          <h2 className="gp-h2">Can&apos;t wait? The best deals today</h2>
          <div className="gp-list">{preview.map((d) => <Row key={d.deal_id} d={d} />)}</div>
        </>
      )}

      <h2 className="gp-h2">Questions</h2>
      {faq.map((f) => (
        <div key={f.q} style={{ marginTop: 12 }}>
          <h3 style={{ fontSize: "1rem", margin: "0 0 4px" }}>{f.q}</h3>
          <p className="gp-p" style={{ color: "var(--pp-body)" }}>{f.a}</p>
        </div>
      ))}
      <p className="gp-note">Nobody pays us to rank. 21+.</p>
    </GuideShell>
  );
}
