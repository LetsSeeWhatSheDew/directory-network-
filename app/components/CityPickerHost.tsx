"use client";

// app/components/CityPickerHost.tsx
// Top-level host that owns the open/closed state for the CityPickerModal.
// Mounted once in the root layout so any component can ask the picker to
// open by dispatching `cl:open-city-picker`. Also handles the auto-open
// rule:
//   - First page-view of the session AND
//   - Geolocation already declined OR no resolved location after 12s

import { useEffect, useState } from "react";
import CityPickerModal from "./CityPickerModal";

const SESSION_KEYS = {
  declined: "cl_gps_declined",
  pickerSeen: "cl_picker_seen",
  city: "cl_city",
};

export default function CityPickerHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("cl:open-city-picker", handler as EventListener);
    return () => window.removeEventListener("cl:open-city-picker", handler as EventListener);
  }, []);

  // Auto-trigger rule (cleanup PR, 2026-05-04):
  //   1. The user declined GPS → open immediately.
  //   2. Otherwise wait 12s — if LocationAware hasn't resolved a city yet,
  //      open as a safety net so the rest of the page works for a real
  //      person rather than leaving them with statewide content.
  // Skipped if the picker has already been shown this session (the user
  // gets one nudge per session, not nag-on-every-page).
  useEffect(() => {
    let timer: number | null = null;

    const maybeOpen = () => {
      let seen = "0";
      let declined = "0";
      let city = "";
      try {
        seen = sessionStorage.getItem(SESSION_KEYS.pickerSeen) || "0";
        declined = sessionStorage.getItem(SESSION_KEYS.declined) || "0";
        city = sessionStorage.getItem(SESSION_KEYS.city) || "";
      } catch {}
      if (seen === "1") return;
      if (city) return;
      if (declined === "1") {
        setOpen(true);
        return;
      }
      // Otherwise wait — LocationAware races GPS → IP detection and may
      // resolve in <2s. The 12s ceiling keeps a stuck network from
      // leaving the user without a location for the whole visit.
      timer = window.setTimeout(() => {
        let nowCity = "";
        try {
          nowCity = sessionStorage.getItem(SESSION_KEYS.city) || "";
        } catch {}
        if (!nowCity) setOpen(true);
      }, 12_000);
    };

    maybeOpen();

    return () => {
      if (timer != null) window.clearTimeout(timer);
    };
  }, []);

  return <CityPickerModal open={open} onClose={() => setOpen(false)} />;
}
