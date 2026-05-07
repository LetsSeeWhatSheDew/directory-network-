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
      const trimmed = typeof c === "string" ? c.trim() : "";
      if (trimmed) setCity(trimmed);
    } catch {}

    const onLoc = (e: Event) => {
      const detail = (e as CustomEvent).detail as { city?: string } | null;
      const next = typeof detail?.city === "string" ? detail.city.trim() : "";
      if (next) setCity(next);
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

  // Always render a non-empty city label so we never flash
  // "Showing the best deal in <empty> right now." while geolocation
  // is still resolving (or never resolves).
  const cityLabel = city && city.trim() ? city.trim() : "Central Illinois";

  // If we have no confident dollar number, don't make one up.
  if (savings == null) {
    return (
      <p className="savings-callout">
        Showing the best deal in <strong>{cityLabel}</strong> right now.
        {calloutStyles}
      </p>
    );
  }

  return (
    <p className="savings-callout">
      Best deal in <strong>{cityLabel}</strong> right now saves{" "}
      <strong className="savings-amt">${savings}</strong>.
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
      color:rgba(247, 244, 237, 0.78);
      line-height:1.5;
      max-width:560px;
    }
    .savings-callout strong{color:var(--color-cream, #F7F4ED);font-weight:600}
    .savings-callout .savings-amt{color:var(--color-sage-vibrant, #93CB5C);font-weight:700}
  `}</style>
);
