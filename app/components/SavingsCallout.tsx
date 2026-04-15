"use client";

import { useEffect, useState } from "react";

/**
 * Supporting copy under the hero deal card.
 * Reads cl_city from sessionStorage and listens for the
 * cl:location-resolved event dispatched by LocationAware so the
 * copy swaps in lock-step with the rest of the location-aware UI.
 */
export default function SavingsCallout() {
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    try {
      const c = sessionStorage.getItem("cl_city");
      if (c) setCity(c);
    } catch {}

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { city?: string } | null;
      if (detail?.city) setCity(detail.city);
    };
    window.addEventListener("cl:location-resolved", handler);
    return () => window.removeEventListener("cl:location-resolved", handler);
  }, []);

  return (
    <p className="savings-callout">
      {city ? (
        <>
          <strong>{city}</strong> buyers save an average of{" "}
          <strong className="savings-amt">$23 per trip</strong> using CleanList
        </>
      ) : (
        <>
          Illinois cannabis buyers save an average of{" "}
          <strong className="savings-amt">$23 per trip</strong> using CleanList
        </>
      )}
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
    </p>
  );
}
