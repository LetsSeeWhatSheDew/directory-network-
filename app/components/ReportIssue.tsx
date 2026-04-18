// Minimal feedback channel — mailto only. No backend required yet.
// Shown muted at the bottom of deal / dispensary / destination pages.

export default function ReportIssue({
  dealId,
  dispensaryName,
  context,
}: {
  dealId?: string;
  dispensaryName: string;
  context?: string;
}) {
  const subject = encodeURIComponent(`Deal issue: ${dispensaryName}`);
  const lines = [
    dealId ? `Deal ID: ${dealId}` : "",
    `Dispensary: ${dispensaryName}`,
    context ? `Page: ${context}` : "",
    "",
    "Issue:",
    "",
  ]
    .filter(Boolean)
    .join("\n");
  const body = encodeURIComponent(lines);
  return (
    <a
      href={`mailto:hi@puffprice.com?subject=${subject}&body=${body}`}
      style={{
        display: "inline-block",
        fontSize: "0.75rem",
        color: "var(--color-text-tertiary, #9ca3af)",
        fontFamily: "system-ui, sans-serif",
        textDecoration: "underline",
        textDecorationColor: "rgba(156,163,175,.5)",
        textUnderlineOffset: 2,
      }}
    >
      Report an issue with this deal
    </a>
  );
}
