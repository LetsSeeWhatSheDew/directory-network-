"use client";

import { useCallback, useEffect, useState } from "react";

type Source = "gps" | "manual" | "ip";

type Loc = {
  city: string;
  source: Source;
};

const CITY_KEY = "cl_city";
const SRC_KEY = "cl_city_src";
const LAT_KEY = "cl_lat";
const LNG_KEY = "cl_lng";
const DECLINED_KEY = "cl_gps_declined";

function readCached(): Loc | null {
  try {
    const city = sessionStorage.getItem(CITY_KEY);
    const src = (sessionStorage.getItem(SRC_KEY) as Source) || "ip";
    if (city) return { city, source: src };
  } catch {}
  return null;
}

function save(loc: Loc, lat?: number, lng?: number) {
  try {
    sessionStorage.setItem(CITY_KEY, loc.city);
    sessionStorage.setItem(SRC_KEY, loc.source);
    if (lat != null) sessionStorage.setItem(LAT_KEY, String(lat));
    if (lng != null) sessionStorage.setItem(LNG_KEY, String(lng));
  } catch {}
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

async function ipLookup(): Promise<{ city: string | null }> {
  try {
    const res = await fetch("/api/location", { cache: "no-store" });
    if (!res.ok) return { city: null };
    const data = await res.json();
    return { city: data?.city || null };
  } catch {
    return { city: null };
  }
}

function requestGps(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

export default function LocationAware() {
  const [loc, setLoc] = useState<Loc | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = useCallback((next: Loc, lat?: number, lng?: number) => {
    save(next, lat, lng);
    setLoc(next);
    applyPlaceholder(next.city);
    try {
      const w = window as any;
      if (typeof w.gtag === "function") {
        w.gtag("event", "location_detected", { method: next.source, city: next.city });
      }
    } catch {}
  }, []);

  const useGps = useCallback(async () => {
    setBusy(true);
    try {
      const pos = await requestGps();
      if (!pos) {
        try {
          sessionStorage.setItem(DECLINED_KEY, "1");
        } catch {}
        return false;
      }
      const { latitude, longitude } = pos.coords;
      const city = await reverseGeocode(latitude, longitude);
      if (city) {
        commit({ city, source: "gps" }, latitude, longitude);
        return true;
      }
      return false;
    } finally {
      setBusy(false);
    }
  }, [commit]);

  // Initial detection on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = readCached();
      if (cached) {
        if (!cancelled) {
          setLoc(cached);
          applyPlaceholder(cached.city);
        }
        return;
      }

      // Try GPS unless the user previously declined this session
      let gpsDeclined = false;
      try {
        gpsDeclined = sessionStorage.getItem(DECLINED_KEY) === "1";
      } catch {}

      if (!gpsDeclined) {
        const pos = await requestGps();
        if (cancelled) return;
        if (pos) {
          const { latitude, longitude } = pos.coords;
          const city = await reverseGeocode(latitude, longitude);
          if (cancelled) return;
          if (city) {
            commit({ city, source: "gps" }, latitude, longitude);
            return;
          }
        } else {
          try {
            sessionStorage.setItem(DECLINED_KEY, "1");
          } catch {}
        }
      }

      // Fall back to IP
      const { city } = await ipLookup();
      if (cancelled) return;
      if (city) commit({ city, source: "ip" });
    })();

    return () => {
      cancelled = true;
    };
  }, [commit]);

  // Manual-override shortcut: listen for the hero search submit and treat
  // the typed query as a city if it doesn't look like a dispensary name.
  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>('form[action="/search"]');
    if (!form) return;
    const handler = () => {
      const input = form.querySelector<HTMLInputElement>('input[name="q"]');
      const value = input?.value?.trim();
      if (!value) return;
      // City heuristic: 1-3 words, no digits, <= 40 chars
      if (value.length <= 40 && !/\d/.test(value) && value.split(/\s+/).length <= 3) {
        const cityCase = value
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
        save({ city: cityCase, source: "manual" });
      }
    };
    form.addEventListener("submit", handler);
    return () => form.removeEventListener("submit", handler);
  }, []);

  if (!loc && !busy) return null;

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = draft.trim();
          if (!v) return;
          const cityCase = v
            .split(/\s+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
          commit({ city: cityCase, source: "manual" });
          setEditing(false);
          setDraft("");
        }}
        style={formStyle}
      >
        <input
          type="text"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your city (e.g. Peoria)"
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>Save</button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setDraft("");
          }}
          style={{ ...buttonStyle, background: "transparent", color: "rgba(255,255,255,.55)" }}
        >
          Cancel
        </button>
      </form>
    );
  }

  if (busy && !loc) {
    return <div style={wrapperStyle}>📍 Detecting your location…</div>;
  }

  if (!loc) return null;

  const approximate = loc.source === "ip";

  return (
    <div aria-live="polite" style={wrapperStyle}>
      <span>
        {approximate ? "📍 Location approximate —" : "📍 Showing deals near"}{" "}
        <span style={{ color: "#4ade80", fontWeight: 600 }}>{loc.city}</span>
        {approximate && (
          <>
            {" · "}
            <button
              type="button"
              onClick={useGps}
              disabled={busy}
              style={linkBtn}
            >
              click to update
            </button>
          </>
        )}
      </span>
      {!approximate && (
        <>
          {" "}
          <span aria-hidden="true" style={{ opacity: 0.35 }}>·</span>{" "}
          <button
            type="button"
            onClick={() => {
              setDraft("");
              setEditing(true);
            }}
            style={linkBtn}
          >
            Not in {loc.city}? Change location
          </button>
        </>
      )}
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  marginTop: -8,
  marginBottom: 12,
  fontSize: ".75rem",
  fontFamily: "system-ui, sans-serif",
  color: "rgba(255,255,255,.55)",
  letterSpacing: ".02em",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 4,
};

const linkBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,.75)",
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
  fontFamily: "system-ui, sans-serif",
  fontSize: ".75rem",
};

const formStyle: React.CSSProperties = {
  marginTop: -8,
  marginBottom: 12,
  display: "flex",
  gap: 6,
  justifyContent: "center",
  alignItems: "center",
  flexWrap: "wrap",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,.08)",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 8,
  padding: "6px 10px",
  color: "#fff",
  fontFamily: "system-ui, sans-serif",
  fontSize: ".8rem",
  outline: "none",
  minWidth: 180,
};

const buttonStyle: React.CSSProperties = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "6px 12px",
  fontFamily: "system-ui, sans-serif",
  fontWeight: 700,
  fontSize: ".78rem",
  cursor: "pointer",
};
