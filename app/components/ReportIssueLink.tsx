// app/components/ReportIssueLink.tsx
// Lightweight "report an issue" control for deals + listings. Honesty is
// the brand — every deal/listing surface should let a real person flag a
// price that changed, a deal that expired, or a wrong store in one tap.
//
// Ships as a mailto today (works with zero backend dependency). The durable
// path — writing to a `deal_reports` table — is scaffolded in
// sql/deal-reports.sql; once Matthew runs that migration, swap this for a
// POST to /api/deals/report without touching any caller. See
// docs/SPRINT-REPORT-JUL26.md.
//
// Server component (plain <a>, no client JS). The page passes the canonical
// URL in since a server component can't read window.location.

import { brand } from "../../lib/brand";

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

  return (
    <a
      href={href}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-body)",
        fontSize: "0.75rem",
        fontWeight: 500,
        color: "var(--pp-muted, #6B7268)",
        textDecoration: "none",
        minHeight: 44,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: "0.8rem" }}>⚑</span>
      {label}
    </a>
  );
}
