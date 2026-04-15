"use client";

import { useEffect, useState } from "react";

/**
 * Supporting copy under the hero deal card. Reads cl_city from
 * sessionStorage for the city name and listens for
 * cl:top-deal-resolved so the "save up to $X per trip" number stays
 * in lockstep with whatever deal is actually showing in the hero
 * card. No hardcoded $23 — the number you see here is always equal
 * to the savings on the best deal surfaced above.
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
          <>
            <strong>{city}</strong> buyers use CleanList to find the best deal
            every trip.
          </>
        ) : (
          <>Illinois cannabis buyers use CleanList to find the best deal every trip.</>
        )}
        {calloutStyles}
      </p>
    );
  }

  return (
    <p className="savings-callout">
      {city ? (
        <>
          <strong>{city}</strong> buyers save up to{" "}
          <strong className="savings-amt">${savings} per trip</strong> using CleanList
        </>
      ) : (
        <>
          Illinois cannabis buyers save up to{" "}
          <strong className="savings-amt">${savings} per trip</strong> using CleanList
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
    .savings-callout strong{color:#0f1f3d;font-weight:600}
    .savings-callout .savings-amt{color:#16a34a;font-weight:700}
  `}</style>
);
