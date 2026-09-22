// app/components/ReviewsSection.tsx
// Server component: approved reviews + the leave-a-review form. Renders the
// list only when real approved reviews exist; shows the form only when the
// listing_reviews table is live (migration applied).

import type { Review, ReviewStats } from "../../lib/reviews";
import ReviewForm from "./ReviewForm";

function stars(n: number) {
  const full = Math.round(n);
  return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
}

function when(iso: string) {
  const d = new Date(iso);
  return Number.isFinite(d.getTime())
    ? d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "America/Chicago" })
    : "";
}

export default function ReviewsSection({
  slug,
  name,
  reviews,
  stats,
  enabled,
}: {
  slug: string;
  name: string;
  reviews: Review[];
  stats: ReviewStats | null;
  enabled: boolean;
}) {
  if (!enabled && reviews.length === 0) return null;
  return (
    <section className="rvs" aria-label={`Reviews of ${name}`}>
      <style>{`
        .rvs{margin-top:2.25rem}
        .rvs-h{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;flex-wrap:wrap;margin-bottom:.9rem}
        .rvs-title{font-family:var(--font-mono);font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--pp-muted)}
        .rvs-sum{font-family:var(--font-mono);font-variant-numeric:tabular-nums;color:var(--pp-ink);font-size:.9rem}
        .rvs-sum b{font-size:1.4rem;margin-right:.35rem}
        .rvs-sum .s{color:var(--pp-signal);letter-spacing:.05em}
        .rvs-list{border:1px solid var(--pp-border);border-radius:12px;background:var(--pp-surface);overflow:hidden;margin-bottom:1rem}
        .rv{padding:1rem 1.1rem;border-bottom:1px solid var(--pp-border)}
        .rv:last-child{border-bottom:none}
        .rv-top{display:flex;justify-content:space-between;gap:1rem;font-size:.8rem;color:var(--pp-muted)}
        .rv-stars{color:var(--pp-signal);letter-spacing:.05em;font-size:.95rem}
        .rv-body{margin:.4rem 0 0;font-size:.92rem;line-height:1.55;color:var(--pp-body);white-space:pre-line}
        .rvs-empty{font-size:.9rem;color:var(--pp-body);margin:0 0 .9rem}
      `}</style>
      <div className="rvs-h">
        <span className="rvs-title">Reviews from PuffPrice users</span>
        {stats && (
          <span className="rvs-sum">
            <b>{stats.avg_rating.toFixed(1)}</b>
            <span className="s">{stars(stats.avg_rating)}</span> · {stats.review_count} review
            {stats.review_count === 1 ? "" : "s"}
          </span>
        )}
      </div>
      {reviews.length > 0 ? (
        <div className="rvs-list">
          {reviews.map((r) => (
            <article key={r.id} className="rv">
              <div className="rv-top">
                <span className="rv-stars" aria-label={`${r.rating} out of 5`}>{stars(r.rating)}</span>
                <span>
                  {r.display_name || "PuffPrice user"} · {when(r.created_at)}
                </span>
              </div>
              {r.body && <p className="rv-body">{r.body}</p>}
            </article>
          ))}
        </div>
      ) : (
        <p className="rvs-empty">No reviews yet. Been to {name}? Be the first — it helps the next person in the parking lot.</p>
      )}
      {enabled && <ReviewForm slug={slug} name={name} />}
    </section>
  );
}
