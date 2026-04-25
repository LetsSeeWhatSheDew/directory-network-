// app/components/PuffPriceIndexCard.tsx
// The PuffPrice Index card — statewide price-per-gram benchmark.
// Server component. Consumes { available, sample_size, ... } from
// lib/puffpriceIndex.ts directly (skips the HTTP round-trip during
// SSR). Renders either a "live" state with the price number, or a
// "coming soon" state with a sample-size progress bar.

import Link from "next/link";
import { computeWeeklyIndex, type WeeklyIndexResult } from "../../lib/puffpriceIndex";

const THRESHOLD = 10;

function formatWeek(isoDate: string): string {
  try {
    const d = new Date(isoDate + "T12:00:00Z");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return isoDate;
  }
}

function LiveState({ result }: { result: Extract<WeeklyIndexResult, { available: true }> }) {
  const dollars = Math.floor(result.puffprice_index_per_gram);
  const cents = Math.round((result.puffprice_index_per_gram - dollars) * 100)
    .toString()
    .padStart(2, "0");
  return (
    <div className="ppi-live">
      <div className="ppi-eyebrow">The PuffPrice Index</div>
      <div className="ppi-price-line" aria-label={`${result.puffprice_index_per_gram} dollars per gram`}>
        <span className="ppi-currency">$</span>
        <span className="ppi-dollars">{dollars}</span>
        <span className="ppi-cents">.{cents}</span>
        <span className="ppi-unit">/g</span>
      </div>
      <div className="ppi-subhead">
        Illinois flower average · week of {formatWeek(result.week_of)}
      </div>
      <div className="ppi-meta">
        Based on {result.sample_size} active deals.{" "}
        <Link href="/about/index" className="ppi-link">
          How we calculate this →
        </Link>
      </div>
    </div>
  );
}

function ComingSoonState({ result }: { result: Extract<WeeklyIndexResult, { available: false }> }) {
  const progress = Math.min(100, Math.round((result.sample_size / THRESHOLD) * 100));
  return (
    <div className="ppi-soon">
      <div className="ppi-eyebrow">The PuffPrice Index</div>
      <div className="ppi-teaser-price" aria-hidden="true">
        <span className="ppi-currency">$</span>
        <span className="ppi-dollars">—</span>
        <span className="ppi-cents">.——</span>
        <span className="ppi-unit">/g</span>
      </div>
      <div className="ppi-subhead">
        The Illinois flower average goes live once we track {THRESHOLD} qualifying deals.
      </div>
      <div className="ppi-progress" aria-hidden="true">
        <div className="ppi-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="ppi-meta">
        {result.sample_size} of {THRESHOLD} deals tracked so far ·{" "}
        <Link href="/about/index" className="ppi-link">
          What this will show →
        </Link>
      </div>
    </div>
  );
}

export default async function PuffPriceIndexCard() {
  let result: WeeklyIndexResult;
  try {
    result = await computeWeeklyIndex();
  } catch {
    result = {
      available: false,
      reason: "query_error",
      sample_size: 0,
      week_of: new Date().toISOString().slice(0, 10),
    };
  }

  // Don't show users an empty placeholder. The Index appears once we
  // have ≥THRESHOLD qualifying deals; until then the section is hidden
  // entirely. ComingSoonState is preserved below in case we want to
  // resurface it later.
  if (!result.available) {
    return null;
  }

  return (
    <section className="ppi-card" aria-labelledby="ppi-title">
      <h2 id="ppi-title" className="ppi-sr-only">
        The PuffPrice Index
      </h2>
      <style>{`
        .ppi-card{
          background:#fff;
          border:1px solid #e8e4da;
          border-left:4px solid #16a34a;
          border-radius:14px;
          padding:28px 28px 24px;
          box-shadow:0 4px 16px rgba(15,31,61,.06);
          max-width:1100px;
          margin:24px auto 8px;
          position:relative;
          overflow:hidden;
        }
        .ppi-card::before{
          content:"";
          position:absolute;
          top:-40px;right:-40px;
          width:180px;height:180px;
          border-radius:50%;
          background:radial-gradient(circle at center,rgba(22,163,74,.06),transparent 70%);
          pointer-events:none;
        }
        .ppi-sr-only{
          position:absolute;width:1px;height:1px;padding:0;margin:-1px;
          overflow:hidden;clip:rect(0,0,0,0);border:0;
        }
        .ppi-eyebrow{
          font-family:system-ui,sans-serif;
          font-size:.7rem;font-weight:700;letter-spacing:.14em;
          text-transform:uppercase;color:#16a34a;
          margin-bottom:8px;
        }
        .ppi-price-line,.ppi-teaser-price{
          font-family:Georgia,serif;
          color:#0f1f3d;
          letter-spacing:-.04em;
          line-height:1;
          display:flex;align-items:baseline;gap:0;
          margin-bottom:10px;
        }
        .ppi-currency{
          font-size:clamp(1.6rem,3.4vw,2.1rem);
          font-weight:700;
          color:#16a34a;
          margin-right:2px;
        }
        .ppi-dollars{
          font-size:clamp(2.8rem,8vw,4.2rem);
          font-weight:700;
        }
        .ppi-cents{
          font-size:clamp(1.8rem,4.2vw,2.6rem);
          font-weight:700;
          color:#374151;
        }
        .ppi-teaser-price .ppi-dollars,
        .ppi-teaser-price .ppi-cents{
          color:#d1d5db;
        }
        .ppi-unit{
          font-family:system-ui,sans-serif;
          font-size:clamp(.95rem,1.8vw,1.15rem);
          font-weight:500;
          color:#6b7280;
          margin-left:6px;
          letter-spacing:0;
        }
        .ppi-subhead{
          font-family:Georgia,serif;
          font-size:clamp(.95rem,1.7vw,1.05rem);
          color:#374151;
          margin-bottom:14px;
          line-height:1.4;
          max-width:46ch;
        }
        .ppi-progress{
          height:6px;
          background:#f5f4f0;
          border-radius:100px;
          overflow:hidden;
          margin:4px 0 12px;
          max-width:420px;
        }
        .ppi-progress-fill{
          height:100%;
          background:linear-gradient(90deg,#16a34a,#4ade80);
          border-radius:100px;
          transition:width .4s ease-out;
        }
        .ppi-meta{
          font-family:system-ui,sans-serif;
          font-size:.8rem;
          color:#6b7280;
        }
        .ppi-link{
          color:#16a34a;
          text-decoration:none;
          font-weight:600;
        }
        .ppi-link:hover{
          text-decoration:underline;
        }
        @media(max-width:520px){
          .ppi-card{
            margin:16px;
            padding:22px 20px 20px;
            border-radius:12px;
          }
        }
      `}</style>
      <LiveState result={result} />
      {/* ComingSoonState below is intentionally unreachable today —
          PuffPriceIndexCard returns null when result.available is false.
          Keeping the function in place so we can re-enable the
          placeholder when we want to advertise Index progress. */}
    </section>
  );
}
