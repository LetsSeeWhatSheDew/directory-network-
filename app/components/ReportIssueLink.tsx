// app/components/ReportIssueLink.tsx
// Lightweight "report an issue" control for deals + listings. Honesty is
// the brand — every deal/listing surface should let a real person flag a
// price that changed, a deal that expired, or a wrong store in one tap.
//
// Renders FeedbackWidget (POST /api/feedback -> deal_reports). The mailto
// below is kept only as the fallback when the POST fails.
// (History: shipped as a mailto first.) The durable
// path — writing to a `deal_reports` table — is scaffolded in
// sql/deal-reports.sql; once Matthew runs that migration, swap this for a
// POST to /api/deals/report without touching any caller. See
// docs/SPRINT-REPORT-JUL26.md.
//
// Server component (plain <a>, no client JS). The page passes the canonical
// URL in since a server component can't read window.location.

import { brand } from "../../lib/brand";
import FeedbackWidget from "./FeedbackWidget";

type Props = {
  /** Short context for the email subject, e.g. `${dealTitle} at ${disp}`. */
  context: string;
  /** Canonical URL of the page the report is about. */
  url: string;
  /** Optional deal id, included in the body for triage. */
  dealId?: string;
  className?: string;
  label?: string;
};

export default function ReportIssueLink({
  context,
  url,
  dealId,
  className,
  label = "Report an issue",
}: Props) {
  const subject = `PuffPrice — issue with: ${context}`.slice(0, 160);
  const body = [
    "I noticed something off here:",
    "",
    "What's wrong (price changed / expired / wrong store / other):",
    "",
    "",
    "— sent from —",
    url,
    dealId ? `deal id: ${dealId}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const href = `mailto:${brand.supportEmail}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  // Durable path: the deal_reports table is live, so render the one-tap
  // widget (POST /api/feedback). The mailto stays as the failure fallback.
  const listingSlug = (() => {
    const m = url.match(/\/dispensary\/([a-z0-9-]+)/);
    return m ? m[1] : undefined;
  })();
  return (
    <div className={className}>
      <FeedbackWidget
        mode={dealId ? "deal" : "page"}
        dealId={dealId}
        listingSlug={listingSlug}
        pageUrl={url}
        mailtoHref={href}
        label={dealId ? undefined : label}
      />
    </div>
  );
}
