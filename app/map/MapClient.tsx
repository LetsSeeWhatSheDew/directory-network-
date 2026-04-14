"use client";

import Script from "next/script";
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

declare global {
  interface Window {
    L?: any;
  }
}

export default function MapClient({ points }: { points: Point[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);

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
        <a href="/l/${encodeURIComponent(p.slug)}" style="display:inline-block;margin-top:10px;background:#0f1f3d;color:#fff;padding:6px 12px;border-radius:6px;font-size:.78rem;text-decoration:none;font-weight:600;">View listing →</a>
      </div>`;
  }

  useEffect(() => {
    if (!leafletReady || !mapRef.current || !window.L) return;
    const L = window.L;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { zoomControl: true }).setView(
        [40.0, -89.0],
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

    for (const p of points) {
      if (dealsOnly && !p.deal) continue;
      const marker = L.marker([p.lat, p.lng], { icon: p.deal ? greenIcon : grayIcon });
      marker.bindPopup(popupHtml(p));
      marker.addTo(markersLayer.current);
    }
  }, [leafletReady, points, dealsOnly]);

  const withDeals = points.filter((p) => p.deal).length;

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        integrity="sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
        integrity="sha512-BB3hKbKWOc9Ez/TAwyWxNXeoV9c1v6FIeYiBieIWkpLjauysF18NzgR1MBNBXf8/KABdlkX68nAhlwcDFLGPCQ=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        strategy="afterInteractive"
        onLoad={() => setLeafletReady(true)}
      />

      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

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
