// A8 "Best Bud" — a deal opened in place, plus three more that open on tap.
import Link from "next/link";
import { getPreviewData } from "../../data";
import { BudShell } from "../chrome";
import { BudHero, BudRow } from "../ui";

export default async function BestBudDeal() {
  const data = await getPreviewData();
  const d = data.best;
  return (
    <BudShell>
      <p className="bud-date">{data.dateLabel}. Here&apos;s your best bet:</p>
      {d ? <BudHero d={d} hist={data.history} startOpen /> : null}
      {data.more.length ? (
        <>
          <h2 data-keep-font="" className="bud-h2">If that&apos;s not your thing</h2>
          {data.more.map((m) => (
            <BudRow key={m.id} d={m} />
          ))}
          <p className="bud-cap" style={{ fontSize: 15, color: "var(--muted)", marginTop: 14 }}>
            {data.dealCount} deals at {data.storesWithDeals} of the {data.storeCount} stores we check.{" "}
            <Link href="/deals/all" style={{ fontWeight: 700 }}>
              See every one
            </Link>
          </p>
        </>
      ) : null}
      {d ? (
        <div className="bud-act">
          <a className="bud-btn" href={d.directions} target="_blank" rel="noopener noreferrer">
            Take me there
          </a>
        </div>
      ) : null}
    </BudShell>
  );
}
