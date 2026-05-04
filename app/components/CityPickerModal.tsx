"use client";

// app/components/CityPickerModal.tsx
// City picker — the explicit fallback when geolocation is denied OR
// the user wants to switch metros. Triggered by:
//   1. <CityPickerTrigger /> button (rendered in LocationAware)
//   2. global window.dispatchEvent(new CustomEvent('cl:open-city-picker'))
//
// Persistence: writes to the same sessionStorage keys + pp_loc cookie
// that LocationAware uses, so the rest of the site (HeroDealCard,
// HomeDealCards, /deals/[category]) sees the change instantly via the
// cl:location-resolved event.

import { useEffect, useState } from "react";
import { MapPin, X, Locate } from "lucide-react";
import { CENTRAL_IL_PUBLIC_CITIES } from "../../lib/constants/regions";

const PRIMARY_CITIES = ["Peoria", "Bloomington", "Champaign", "Springfield"];

const SESSION_KEYS = {
  city: "cl_city",
  src: "cl_city_src",
  ts: "cl_city_ts",
  lat: "cl_lat",
  lng: "cl_lng",
  declined: "cl_gps_declined",
  pickerSeen: "cl_picker_seen",
};

const COOKIE_NAME = "pp_loc";

function persistLocation(city: string, source: "manual" | "gps", lat?: number, lng?: number) {
  try {
    sessionStorage.setItem(SESSION_KEYS.city, city);
    sessionStorage.setItem(SESSION_KEYS.src, source);
    sessionStorage.setItem(SESSION_KEYS.ts, String(Date.now()));
    if (lat != null) sessionStorage.setItem(SESSION_KEYS.lat, String(lat));
    if (lng != null) sessionStorage.setItem(SESSION_KEYS.lng, String(lng));
  } catch {}
  try {
    const payload: Record<string, string | number> = { city, source };
    if (lat != null) payload.lat = lat;
    if (lng != null) payload.lng = lng;
    const value = encodeURIComponent(JSON.stringify(payload));
    const maxAge = 30 * 24 * 60 * 60;
    document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
  } catch {}
  try {
    window.dispatchEvent(
      new CustomEvent("cl:location-resolved", { detail: { city, source } })
    );
  } catch {}
  // Sync URL param so deep-links + page reloads see the picked city.
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("city", city.toLowerCase());
    window.history.replaceState(window.history.state, "", url.toString());
  } catch {}
}

function requestGps(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  });
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=12&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data?.address ?? {};
    return a.city || a.town || a.village || a.hamlet || a.county || null;
  } catch {
    return null;
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called after a city is committed (any source). */
  onPicked?: (city: string) => void;
};

export default function CityPickerModal({ open, onClose, onPicked }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mark the picker "seen" once the user opens it, so the auto-trigger
  // logic in CityPickerHost doesn't pop it again on every page.
  useEffect(() => {
    if (!open) return;
    try {
      sessionStorage.setItem(SESSION_KEYS.pickerSeen, "1");
    } catch {}
    setError(null);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const pick = (city: string) => {
    persistLocation(city, "manual");
    onPicked?.(city);
    onClose();
  };

  const tryGps = async () => {
    setBusy(true);
    setError(null);
    try {
      const pos = await requestGps();
      if (!pos) {
        setError("Location permission was denied. Pick a city below instead.");
        try {
          sessionStorage.setItem(SESSION_KEYS.declined, "1");
        } catch {}
        return;
      }
      const { latitude, longitude } = pos.coords;
      const city = await reverseGeocode(latitude, longitude);
      if (!city) {
        setError("Couldn't read your city — pick one below.");
        return;
      }
      persistLocation(city, "gps", latitude, longitude);
      onPicked?.(city);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const allCities = CENTRAL_IL_PUBLIC_CITIES.map((c) => c.name);

  return (
    <div
      className="pp-citypicker-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pp-citypicker-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pp-citypicker-card">
        <button
          type="button"
          className="pp-citypicker-close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <div className="pp-citypicker-headline">
          <MapPin size={20} strokeWidth={2} aria-hidden="true" />
          <h2 id="pp-citypicker-title">Where are you?</h2>
        </div>
        <p className="pp-citypicker-sub">
          We&rsquo;ll show deals within 15 miles of the city you pick.
        </p>

        <div className="pp-citypicker-primary-row">
          {PRIMARY_CITIES.map((c) => (
            <button
              key={c}
              type="button"
              className="pp-citypicker-primary"
              onClick={() => pick(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="pp-citypicker-toggle"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
        >
          {showAll ? "Hide other cities" : "More Central Illinois cities"}
        </button>

        {showAll && (
          <div className="pp-citypicker-grid">
            {allCities
              .filter((c) => !PRIMARY_CITIES.includes(c))
              .map((c) => (
                <button
                  key={c}
                  type="button"
                  className="pp-citypicker-grid-item"
                  onClick={() => pick(c)}
                >
                  {c}
                </button>
              ))}
          </div>
        )}

        <div className="pp-citypicker-divider" aria-hidden="true" />

        <button
          type="button"
          className="pp-citypicker-gps"
          onClick={tryGps}
          disabled={busy}
        >
          <Locate size={16} strokeWidth={2} aria-hidden="true" />
          {busy ? "Locating…" : "Use my location"}
        </button>

        {error && <p className="pp-citypicker-error">{error}</p>}
      </div>

      <style>{`
        .pp-citypicker-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(15, 24, 19, 0.62);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: pp-citypicker-fade 200ms ease;
        }
        @keyframes pp-citypicker-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .pp-citypicker-card {
          position: relative;
          width: 100%;
          max-width: 460px;
          background: var(--color-cream-pure, #FAFAF7);
          border: 1px solid var(--color-gray-200, #E8E2D5);
          border-radius: 18px;
          box-shadow: 0 24px 48px rgba(15, 24, 19, 0.28);
          padding: 1.75rem 1.5rem 1.5rem;
          animation: pp-citypicker-pop 280ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes pp-citypicker-pop {
          from { transform: translateY(8px) scale(0.98); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        .pp-citypicker-close {
          position: absolute;
          top: 0.875rem;
          right: 0.875rem;
          background: transparent;
          border: none;
          color: var(--color-gray-500, #6B7280);
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
        }
        .pp-citypicker-close:hover {
          background: var(--color-gray-100, #F1EEE7);
          color: var(--color-deep, #1F3D2B);
        }
        .pp-citypicker-headline {
          display: flex; align-items: center; gap: 0.5rem;
          color: var(--color-sage, #7DBA47);
          margin-bottom: 0.5rem;
        }
        .pp-citypicker-headline h2 {
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 800;
          font-size: 1.4rem;
          letter-spacing: -0.025em;
          color: var(--color-deep, #1F3D2B);
          margin: 0;
        }
        .pp-citypicker-sub {
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-size: 0.92rem;
          color: var(--color-gray-600, #4B5563);
          margin: 0 0 1.25rem;
          line-height: 1.45;
        }
        .pp-citypicker-primary-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .pp-citypicker-primary {
          background: var(--color-sage, #7DBA47);
          color: var(--color-deep, #1F3D2B);
          border: 1px solid var(--color-sage, #7DBA47);
          border-radius: 12px;
          padding: 0.875rem 1rem;
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          min-height: 48px;
          transition: background-color 160ms ease, transform 160ms ease;
        }
        .pp-citypicker-primary:hover {
          background: var(--color-sage-vibrant, #93CB5C);
          border-color: var(--color-sage-vibrant, #93CB5C);
        }
        .pp-citypicker-primary:active { transform: translateY(1px); }
        .pp-citypicker-toggle {
          display: block;
          width: 100%;
          background: transparent;
          border: 1px solid var(--color-gray-200, #E8E2D5);
          border-radius: 12px;
          padding: 0.625rem 1rem;
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--color-gray-700, #374151);
          cursor: pointer;
          margin-bottom: 0.5rem;
        }
        .pp-citypicker-toggle:hover {
          border-color: var(--color-gray-300, #D1CABB);
          color: var(--color-deep, #1F3D2B);
        }
        .pp-citypicker-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.375rem;
          margin-bottom: 0.75rem;
        }
        .pp-citypicker-grid-item {
          background: transparent;
          color: var(--color-gray-700, #374151);
          border: 1px solid var(--color-gray-200, #E8E2D5);
          border-radius: 10px;
          padding: 0.625rem 0.75rem;
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          text-align: left;
          min-height: 40px;
        }
        .pp-citypicker-grid-item:hover {
          border-color: var(--color-sage, #7DBA47);
          color: var(--color-deep, #1F3D2B);
        }
        .pp-citypicker-divider {
          height: 1px;
          background: var(--color-gray-200, #E8E2D5);
          margin: 0.875rem 0 0.75rem;
        }
        .pp-citypicker-gps {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: none;
          color: var(--color-sage-deep, #6BA63B);
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 0.5rem 0.25rem;
          cursor: pointer;
        }
        .pp-citypicker-gps:hover { color: var(--color-deep, #1F3D2B); }
        .pp-citypicker-gps:disabled { color: var(--color-gray-400, #9CA3AF); cursor: wait; }
        .pp-citypicker-error {
          font-family: Manrope, system-ui, -apple-system, sans-serif;
          font-size: 0.82rem;
          color: #B91C1C;
          margin: 0.5rem 0 0;
        }
      `}</style>
    </div>
  );
}
