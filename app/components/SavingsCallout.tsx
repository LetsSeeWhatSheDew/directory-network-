"use client";

import { useEffect, useState } from "react";

/**
 * Supporting copy under the hero deal card. Reads cl_city from
 * sessionStorage for the city name and listens for
 * cl:top-deal-resolved so the dollar number stays in lockstep with
 * the deal showing in the hero. We say "Best deal in {city} right
 * now saves $X" — a statement of fact about the visible deal, not
 * an aggregate ("buyers save") that overclaims.
 */
export default function SavingsCallout({ initialSavings }: { initialSavings: number | null }) {
  const [city, setCity] = useState<string | null>(null);
  const [savings, setSavings] = useState<number | null>(initialSavings);

  useEffect(() => {
    try {
      const c = sessionStorage.getItem("cl_city");
      if (c) setCity(c);
    } catch {}

    const onLoc = (e: Event) => {
      const detail = (e as CustomEvent).detail as { city?: string } | null;
      if (detail?.city) setCity(detail.city);
    };
    const onDeal = (e: Event) => {
      const detail = (e as CustomEvent).detail as { savings?: number | null } | null;
      if (typeof detail?.savings === "number") setSavings(detail.savings);
      else if (detail && detail.savings === null) setSavings(null);
    };
    window.addEventListener("cl:location-resolved", onLoc);
    window.addEventListener("cl:top-deal-resolved", onDeal);
    return () => {
      window.removeEventListener("cl:location-resolved", onLoc);
      window.removeEventListener("cl:top-deal-resolved", onDeal);
    };
  }, []);

  // If we have no confident dollar number, don't make one up.
  if (savings == null) {
    return (
      <p className="savings-callout">
        {city ? (
          <>Showing the best deal in <strong>{city}</strong> right now.</>
        ) : (
          <>Showing the best active deal in Central Illinois right now.</>
        )}
        {calloutStyles}
      </p>
    );
  }

  return (
    <p className="savings-callout">
      {city ? (
        <>
          Best deal in <strong>{city}</strong> right now saves{" "}
          <strong className="savings-amt">${savings}</strong>.
        </>
      ) : (
        <>
          Best deal in Central Illinois right now saves{" "}
          <strong className="savings-amt">${savings}</strong>.
        </>
      )}
      {calloutStyles}
    </p>
  );
}

const calloutStyles = (
  <style>{`
    .savings-callout{
      margin-top:14px;
      font-size:.82rem;
      font-family:system-ui,sans-serif;
      color:#6b7280;
      line-height:1.5;
      max-width:560px;
    }
    .savings-callout strong{color:#1F3D2B;font-weight:600}
    .savings-callout .savings-amt{color:#7DBA47;font-weight:700}
  `}</style>
);
