// EmptyBreath — the empty state for a filter, city or store with no deals.
// The orb holds perfectly still, like a held breath, and we say so plainly:
// "Nothing worth exhaling about yet." plus one helpful next step.
// Calm, warm, a little wry. No pot puns. Styles: .pp-held in globals.css.

import Link from "next/link";

type Step = { href: string; label: string };

export default function EmptyBreath({
  title = "Nothing worth exhaling about yet.",
  children,
  steps = [],
  className = "",
}: {
  title?: string;
  children?: React.ReactNode;
  steps?: Step[];
  className?: string;
}) {
  return (
    <div className={`pp-held ${className}`}>
      <span className="pp-held-orb" aria-hidden="true" />
      <p className="pp-held-t">{title}</p>
      {children && <div className="pp-held-s">{children}</div>}
      {steps.length > 0 && (
        <div className="pp-held-acts">
          {steps.map((s) => (
            <Link key={s.href + s.label} href={s.href}>
              {s.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
