// One quiet line on a store page: how right this store's deals turn out to
// be (lib/dealAccuracy.ts). Scored only with enough Yes/No taps; otherwise it
// says so. Renders nothing when the reports can't be read. It never changes
// the order of anything, and nothing about it can be paid for.
import Link from "next/link";
import { MIN_REPORTS, WINDOW_DAYS, FRESH_HOURS, type Accuracy } from "../../lib/dealAccuracy";

const CSS = `
.da{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;margin:8px 0 12px;padding:10px 14px;border-radius:14px;background:var(--pp-surface);border:1px solid var(--pp-border);font-size:.84rem;color:var(--pp-body);line-height:1.45}
.da-l{font-family:var(--font-mono);font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--pp-muted)}
.da-n{font-family:var(--font-mono);font-weight:500;font-size:1.05rem;color:var(--pp-ink)}
.da a{color:var(--pp-muted);font-size:.78rem}
`;

export default function DealAccuracy({ accuracy }: { accuracy: Accuracy | null }) {
  if (!accuracy) return null;
  const how = <Link href="/how-we-rank#accuracy">How this works</Link>;
  if (accuracy.status === "thin") {
    return (
      <div className="da" aria-label="Deal accuracy">
        <style>{CSS}</style>
        <span className="da-l">Deal accuracy</span>
        <span>
          Not enough confirmations yet
          {accuracy.reports > 0 ? ` (${accuracy.reports} of the ${MIN_REPORTS} we need)` : ""}. Tap Yes or No on a deal to help.
        </span>
        {how}
      </div>
    );
  }
  return (
    <div className="da" aria-label={`Deal accuracy ${accuracy.score} out of 100`}>
      <style>{CSS}</style>
      <span className="da-l">Deal accuracy</span>
      <span><b className="da-n">{accuracy.score}</b>/100</span>
      <span>
        {accuracy.yes} of {accuracy.reports} shoppers said the deal matched (last {WINDOW_DAYS} days)
        {accuracy.live > 0 ? ` · ${accuracy.fresh} of ${accuracy.live} live deals re-found on the store's site in the last ${FRESH_HOURS} hours` : ""}
      </span>
      {how}
    </div>
  );
}
