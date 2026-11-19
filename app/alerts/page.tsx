// app/alerts/page.tsx
// Free alerts, the only consumer tier. Pro ($0.99/mo) was dropped on
// 2026-11-19 (Matthew): shoppers never pay; stores can buy a market report.

import Link from "next/link";
import AlertsCalculator from "./AlertsCalculator";
import WeeklySignup from "../components/WeeklySignup";
import { Band } from "../components/gold/Kit";

import { brand } from "@/lib/brand";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hnbjufmtmrhexmdrfubw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmp1Zm10bXJoZXhtZHJmdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzQ3MTksImV4cCI6MjA4MDM1MDcxOX0.-HzY9AayfTnAKAEwKNovWgFCxdYJkwEPptzR7DHj300";

// Social proof count — total active alert subscribers. Runs on the
// server, cached 300s. If the fetch fails we render nothing rather
// than show a misleading zero.
async function getAlertCount(): Promise<number | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/deal_alerts?select=id&is_active=eq.true`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "count=exact",
          "Range-Unit": "items",
          Range: "0-0",
        },
        next: { revalidate: 300, tags: ["alerts"] },
      }
    );
    const range = res.headers.get("content-range");
    if (range) {
      const total = range.split("/")[1];
      const n = Number.parseInt(total, 10);
      if (Number.isFinite(n)) return n;
    }
  } catch {}
  return null;
}

export const revalidate = 300;

const OG_IMAGE = "https://www.puffprice.com/og-image.png";
const OG_DESC =
  "Central Illinois cannabis deal alerts. Free forever, no account needed. One email every Monday with the best deals in your town.";

export const metadata = {
  alternates: { canonical: `${brand.url}/alerts` },
  title: "Get Deal Alerts",
  description: OG_DESC,
  openGraph: {
    title: "Get Deal Alerts | PuffPrice",
    description: OG_DESC,
    url: "https://www.puffprice.com/alerts",
    siteName: "PuffPrice",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
    locale: "en_US",
    type: "website" as const,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Get Deal Alerts | PuffPrice",
    description: OG_DESC,
    images: [OG_IMAGE],
  },
};

const FREE_FEATURES = [
  "Best deal near you right now — always",
  "Browse every Central Illinois dispensary we track — checked every morning",
  "Map view with deal pins",
  "Search by city or dispensary name",
  "Weekly Monday digest (just email + city, no account)",
];

export default async function AlertsPage() {
  const alertCount = await getAlertCount();
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:var(--font-body);color:var(--pp-body);min-height:100vh}

        .hero{background:transparent;color:var(--pp-ink);padding:8px 28px 24px;text-align:center}
        .hero h1{color:var(--pp-ink);font-size:clamp(2.2rem,6vw,3rem);line-height:1.02;margin-bottom:14px;text-wrap:balance}
        .hero h1 em{color:var(--pp-mark);font-style:italic}
        .hero-sub{font-size:clamp(1rem,2.5vw,1.08rem);color:var(--pp-body);font-family:var(--font-body);line-height:1.55;max-width:560px;margin:0 auto}
        .hero-count{margin-top:14px;font-size:.85rem;color:var(--pp-muted);font-family:var(--font-body)}
        .hero-count b{font-family:var(--font-mono);font-weight:500;color:var(--pp-ink)}

        .tiers{max-width:560px;margin:0 auto;padding:48px 20px 24px;display:grid;gap:18px}
        .tier{background:var(--pp-surface);border:1px solid var(--pp-border);border-radius:16px;padding:28px 26px;display:flex;flex-direction:column;gap:14px;position:relative}
        .tier-eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--pp-signal);font-family:var(--font-body)}
        .tier-name{font-size:1.35rem;font-weight:700;letter-spacing:-.02em;font-family:var(--font-body);line-height:1.1}
        .tier-price{display:flex;align-items:baseline;gap:6px}
        .tier-price-big{font-size:2.4rem;font-weight:500;color:var(--pp-signal-ink);letter-spacing:-.04em;line-height:1;font-family:var(--font-mono)}
        .tier-price-period{font-size:.85rem;color:var(--pp-muted);font-family:var(--font-body)}
        .tier-anchor{font-size:.82rem;color:var(--pp-muted);font-family:var(--font-body);line-height:1.5}
        .tier-anchor strong{color:var(--pp-signal);font-weight:700}
        .tier-headline{font-size:.95rem;font-weight:600;color:var(--pp-body);font-family:var(--font-body);line-height:1.5}
        ul.tier-features{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:7px}
        ul.tier-features li{display:flex;gap:8px;align-items:flex-start;font-size:.86rem;color:var(--pp-body);font-family:var(--font-body);line-height:1.5}
        .check{color:var(--pp-signal);font-weight:700;flex-shrink:0}

        .cta{display:inline-block;padding:13px 22px;border-radius:14px;font-family:var(--font-body);font-weight:700;font-size:.95rem;text-decoration:none;text-align:center;transition:transform calc(150ms * var(--pp-pace)), opacity calc(150ms * var(--pp-pace));cursor:pointer;border:none;width:100%}
        .cta-free{background:var(--pp-btn);color:var(--pp-btn-fg);box-shadow:inset 0 0 0 1px var(--pp-btn-border)}
        .cta-free:hover{filter:brightness(.97)}


        .calc{max-width:640px;margin:0 auto;padding:12px 20px 64px}
      `}</style>

      <Band eyebrow="Free alerts" title="Never overpay for weed" italic="again." sub="Check this before you buy. You might be leaving money on the table.">
        {alertCount !== null && alertCount > 0 && (
          <p className="g-band-sub">
            <b>{alertCount.toLocaleString()}</b>{" "}
            {alertCount === 1 ? "person is" : "people are"} already getting deal alerts in Central Illinois.
          </p>
        )}
      </Band>

      <section className="tiers">
        {/* FREE */}
        <article className="tier">
          <div className="tier-eyebrow">Free · no account</div>
          <div className="tier-name">Start here</div>
          <div className="tier-price">
            <span className="tier-price-big">$0</span>
            <span className="tier-price-period">forever</span>
          </div>
          <p className="tier-anchor">No account, no friction, forever. Actually free, not a trial. Nobody pays to see deals, and nobody pays to rank.</p>
          <ul className="tier-features">
            {FREE_FEATURES.map((f) => (
              <li key={f}><span className="check">✓</span>{f}</li>
            ))}
          </ul>
          <div style={{ flex: 1 }} />
          <div style={{ fontWeight: 700, fontSize: ".9rem" }}>Get the Monday report</div>
          <WeeklySignup tone="light" />
          <Link href="/this-week" style={{ fontSize: ".85rem", color: "var(--pp-signal-ink)" }}>See this week&apos;s report →</Link>
        </article>
      </section>

      <section className="calc">
        <AlertsCalculator />
      </section>
    </>
  );
}
