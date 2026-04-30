"use client";

// MapClient — Leaflet map for /map.
//
// 2026-05-01 rewrite: switched from external CDN (cdnjs leaflet.min.js +
// SRI integrity hash + leaflet.min.css) to a bundled npm install. The
// CDN approach worked most of the time, but Matthew's review on May 1
// flagged /map as "broken" — most likely because the SRI integrity
// check or the script-tag race surfaced as a perpetual loading state.
// Bundling removes the entire external-load failure mode.
//
// Implementation notes:
//   - Leaflet's module evaluation touches `window` and `document`, so a
//     plain `import L from "leaflet"` at module top would crash during
//     SSR. The component is "use client", but Next.js still SSRs client
//     components on initial render. So we dynamic-import L *inside*
//     useEffect, which only fires on the client.
//   - The CSS, by contrast, is safe to import statically — Next.js
//     extracts it at build time, no JS evaluation.
//   - We keep the same div ref / state machine as the prior CDN-based
//     implementation; only the script delivery has changed.

import "leaflet/dist/leaflet.css";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Point = {
  slug: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  deal: {
    deal_title: string;
    category: string | null;
    discount_value: number | null;
    discount_unit: string | null;
  } | null;
};

export default function MapClient({ points }: { points: Point[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  // Dynamic-import Leaflet client-side. If the import fails (offline /
  // bundle missing) we fall through to the loadFailed escape route.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("leaflet");
        const L = (mod as any).default ?? mod;
        if (cancelled) return;
        leafletRef.current = L;
        setLeafletReady(true);
      } catch {
        if (cancelled) return;
        setLoadFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function humanize(slug: string) {
    return slug
      .split("-")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  function popupHtml(p: Point) {
    const display = /^[a-z0-9-]+$/.test(p.name) ? humanize(p.slug) : p.name;
    const dealHtml = p.deal
      ? `<div style="margin-top:6px;font-size:.82rem;color:#16a34a;font-weight:600;">
           ${escapeHtml(p.deal.deal_title)}
         </div>`
      : "";
    return `
      <div style="font-family:system-ui,sans-serif;min-width:180px">
        <div style="font-weight:700;font-size:.95rem;color:#0f1f3d;">${escapeHtml(display)}</div>
        <div style="font-size:.75rem;color:#6b7280;margin-top:2px;">${escapeHtml(p.city)}, IL</div>
        ${dealHtml}
        <a href="/dispensary/${encodeURIComponent(p.slug)}" style="display:inline-block;margin-top:10px;background:#0f1f3d;color:#fff;padding:6px 12px;border-radius:6px;font-size:.78rem;text-decoration:none;font-weight:600;">View dispensary →</a>
      </div>`;
  }

  useEffect(() => {
    if (!leafletReady || !mapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { zoomControl: true }).setView(
        [40.4, -89.2],
        7
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(mapInstance.current);
      markersLayer.current = L.layerGroup().addTo(mapInstance.current);
    }

    markersLayer.current.clearLayers();

    const greenIcon = L.divIcon({
      className: "cl-pin cl-pin-deal",
      html: `<div style="background:#16a34a;color:#fff;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;font-weight:800;box-shadow:0 2px 6px rgba(0,0,0,.25);border:2px solid #fff;"><span style="transform:rotate(45deg);font-size:.8rem;">$</span></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    });
    const grayIcon = L.divIcon({
      className: "cl-pin cl-pin-plain",
      html: `<div style="background:#94a3b8;width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.25);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -10],
    });

    const visible: Point[] = [];
    for (const p of points) {
      if (dealsOnly && !p.deal) continue;
      const marker = L.marker([p.lat, p.lng], { icon: p.deal ? greenIcon : grayIcon });
      marker.bindPopup(popupHtml(p));
      marker.addTo(markersLayer.current);
      visible.push(p);
    }

    // Center the view so all visible markers are in frame on first paint.
    if (visible.length > 0) {
      const bounds = L.latLngBounds(visible.map((p) => [p.lat, p.lng] as [number, number]));
      mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }
  }, [leafletReady, points, dealsOnly]);

  const withDeals = points.filter((p) => p.deal).length;

  return (
    <>
      <div ref={mapRef} style={{ width: "100%", height: "100%", position: "relative", zIndex: 2 }} />

      {loadFailed && (
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          background: "#f5f4f0",
          padding: "20px",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f1f3d" }}>
            Map couldn&apos;t load
          </div>
          <div style={{ fontSize: ".9rem", color: "#6b7280", maxWidth: 360 }}>
            We couldn&apos;t initialize the map. You can still browse every Central IL dispensary in a list.
          </div>
          <Link
            href="/dispensaries"
            style={{
              background: "#16a34a",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: ".9rem",
            }}
          >
            Browse dispensaries →
          </Link>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 4px 12px rgba(0,0,0,.18)",
          padding: 6,
          display: "flex",
          gap: 4,
          fontFamily: "system-ui, sans-serif",
          fontSize: ".78rem",
          zIndex: 500,
        }}
      >
        <button
          type="button"
          onClick={() => setDealsOnly(false)}
          style={pillStyle(!dealsOnly)}
        >
          All ({points.length})
        </button>
        <button
          type="button"
          onClick={() => setDealsOnly(true)}
          style={pillStyle(dealsOnly)}
        >
          Deals only ({withDeals})
        </button>
      </div>
    </>
  );
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    borderRadius: 7,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    background: active ? "#0f1f3d" : "transparent",
    color: active ? "#fff" : "#6b7280",
  };
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
  );
}
