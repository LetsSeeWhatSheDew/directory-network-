"use client";

import { useEffect, useState } from "react";

export default function LocationAware() {
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const cached = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("cl_city") : null;
    if (cached) {
      setCity(cached);
      applyPlaceholder(cached);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/location", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data?.city) {
          try {
            sessionStorage.setItem("cl_city", data.city);
            if (data.lat != null) sessionStorage.setItem("cl_lat", String(data.lat));
            if (data.lng != null) sessionStorage.setItem("cl_lng", String(data.lng));
          } catch {}
          setCity(data.city);
          applyPlaceholder(data.city);
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!city) return null;
  return (
    <div
      aria-live="polite"
      style={{
        marginTop: -8,
        marginBottom: 12,
        fontSize: ".75rem",
        fontFamily: "system-ui, sans-serif",
        color: "rgba(255,255,255,.55)",
        letterSpacing: ".02em",
      }}
    >
      📍 Showing deals near <span style={{ color: "#4ade80", fontWeight: 600 }}>{city}</span>
    </div>
  );
}

function applyPlaceholder(city: string) {
  if (typeof document === "undefined") return;
  const inputs = document.querySelectorAll<HTMLInputElement>(
    'input[type="search"][name="q"]'
  );
  inputs.forEach((el) => {
    el.setAttribute("placeholder", `Deals near ${city}, IL`);
  });
}
