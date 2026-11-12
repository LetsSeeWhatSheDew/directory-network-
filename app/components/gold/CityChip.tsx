"use client";

import { useEffect, useState } from "react";

/** The header's town chip. Shows the town LocationAware saved (pp_loc
 *  cookie) and opens the town picker on tap. */
export default function CityChip() {
  const [city, setCity] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      try {
        const m = document.cookie.match(/(?:^|;\s*)pp_loc=([^;]+)/);
        if (!m) return setCity(null);
        const v = JSON.parse(decodeURIComponent(m[1]));
        setCity(typeof v?.city === "string" && v.city.trim() ? v.city : null);
      } catch {
        setCity(null);
      }
    };
    read();
    window.addEventListener("cl:location-changed", read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("cl:location-changed", read);
      window.removeEventListener("focus", read);
    };
  }, []);
  return (
    <button
      type="button"
      className="g-city"
      onClick={() => window.dispatchEvent(new CustomEvent("cl:open-city-picker"))}
      aria-label={`Showing deals near ${city || "Central Illinois"}. Change town`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </svg>
      {city || "Pick town"}
    </button>
  );
}
