// A8 "Best Bud" — calm free home. One answer: the best everyday deal, open or
// not, and one button. Details open in place on tap.
import { getPreviewData } from "../data";
import { BudShell } from "./chrome";
import { BudHero } from "./ui";

export default async function BestBudHome() {
  const data = await getPreviewData();
  const d = data.best;
  return (
    <BudShell>
      <p className="bud-date">{data.dateLabel}. Here&apos;s your best bet:</p>
      {d ? (
        <>
          <BudHero d={d} hist={data.history} />
          <div className="bud-act">
            <a className="bud-btn" href={d.directions} target="_blank" rel="noopener noreferrer">
              Take me there
            </a>
          </div>
        </>
      ) : (
        <p className="bud-say">Nothing checked yet this morning. Try again after 9.</p>
      )}
    </BudShell>
  );
}
