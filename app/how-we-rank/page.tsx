// app/how-we-rank/page.tsx — the public rules. Plain language, no hedging.
import { Band } from "../components/gold/Kit";
import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "../../lib/brand";
import { MIN_REPORTS, WINDOW_DAYS, FRESH_HOURS, PEOPLE_WEIGHT } from "../../lib/dealAccuracy";

export const metadata: Metadata = {
  title: "How We Rank Deals",
  description:
    "How PuffPrice finds, verifies, and ranks Central Illinois dispensary deals. No store pays to rank. Deals come from each dispensary's own site and are re-checked daily.",
  alternates: { canonical: `${brand.url}/how-we-rank` },
};

const RULES: { h: string; p: string; id?: string }[] = [
  {
    h: "No store pays to rank. Ever.",
    p: "Order on PuffPrice comes from the deal itself — how much you save, how recently we confirmed it, and how close it is to you. There's no featured slot, no boosted listing, and no way to buy a higher spot. If that ever changes, it'll be labeled on the page, not hidden.",
  },
  {
    h: "Deals come from the dispensary's own site.",
    p: "We read each store's own website and official posts. We don't copy listings from Weedmaps, Leafly, or other aggregators — if we can't see it at the source, it doesn't go up.",
  },
  {
    h: "Re-checked every day.",
    p: "Every live deal is re-checked daily. A deal we haven't been able to confirm in 72 hours is marked as pending, and after 7 days it comes down automatically. Every card shows when it was last verified.",
  },
  {
    h: "You can tell us when we're wrong.",
    p: "Every deal has a Yes / No check. “No” tells us the price changed, the deal ended, or it's at a different store — and we fix it. We'd rather hear it from you than have the next person drive over for nothing.",
  },
  {
    id: "accuracy",
    h: "Deal accuracy: how right a store's deals turn out to be.",
    p: `Store pages show a deal accuracy score out of 100 once a store has at least ${MIN_REPORTS} Yes / No taps on its deals in the last ${WINDOW_DAYS} days; until then they say "Not enough confirmations yet." The score is ${Math.round(PEOPLE_WEIGHT * 100)}% the share of taps that said Yes (the deal matched) and ${Math.round((1 - PEOPLE_WEIGHT) * 100)}% the share of the store's live deals our daily check re-found on its own site in the last ${FRESH_HOURS} hours. "No" means the price was different, the deal was over, or it was at another store; reports about hours or details don't count. Repeat taps on the same deal from the same kind of browser on the same day count once, so nobody can pile on (that can undercount, never overcount). It never moves a store up or down any list, and it can't be bought: there is no paid rank.`,
  },
  {
    h: "Reviews are real people, read before they post.",
    p: "Dispensary reviews come from PuffPrice users, go live only after a person reads them, and are never edited. No store staff, no promo codes, no incentives.",
  },
  {
    h: "We don't sell your location.",
    p: "If you share your location, we use it to sort deals by distance. We don't sell it or share it with dispensaries or advertisers.",
  },
];

export default function HowWeRankPage() {
  return (
    <>
      <Band
        eyebrow="The rules"
        title="How we find, check"
        italic="and rank deals"
        sub="PuffPrice exists for one person: you, in a parking lot, trying not to overpay. These are the rules we hold ourselves to."
      />
      <main className="pp-container-reading" style={{ padding: "28px 1rem 4rem" }}>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, borderTop: "1px solid var(--pp-border)" }}>
          {RULES.map((r, i) => (
            <li key={r.h} id={r.id} style={{ padding: "18px 0", borderBottom: "1px solid var(--pp-border)", display: "grid", gridTemplateColumns: "2.2rem 1fr", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--pp-signal)", fontSize: ".85rem", paddingTop: 3 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", color: "var(--pp-ink)", margin: "0 0 6px" }}>{r.h}</h2>
                <p style={{ margin: 0, lineHeight: 1.6, color: "var(--pp-body)" }}>{r.p}</p>
              </div>
            </li>
          ))}
        </ol>
        <p style={{ marginTop: 28, fontSize: ".95rem" }}>
          Questions or something looks off? <a href={`mailto:${brand.supportEmail}`} style={{ color: "var(--pp-signal-ink)", fontWeight: 700 }}>{brand.supportEmail}</a> ·{" "}
          <Link href="/deals/all" style={{ color: "var(--pp-signal-ink)", fontWeight: 700 }}>See today&apos;s deals →</Link>
        </p>
      </main>
    </>
  );
}
