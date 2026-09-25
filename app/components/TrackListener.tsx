"use client";

// One listener for the whole site (mounted once in the root layout).
//
// 1. Taps: any element with data-track="<type>" reports that type when
//    clicked, with optional data-track-slug / -deal / -city / -from.
//    Server components can tag links without becoming client components.
//    Listens in the capture phase so a child's stopPropagation can't hide it.
// 2. QR scans: a page load with utm_source=counter_card reports qr_scan
//    once per browser session per campaign.
import { useEffect } from "react";
import { track, TRACK_TYPES, type TrackType } from "../../lib/track";

const TYPES = new Set<string>(TRACK_TYPES);

export default function TrackListener() {
  useEffect(() => {
    // QR scan on landing.
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("utm_source") === "counter_card") {
        const campaign = url.searchParams.get("utm_campaign") || "general";
        const m = url.pathname.match(/^\/dispensary\/([a-z0-9-]+)/);
        const slug = m ? m[1] : /^[a-z0-9-]+$/.test(campaign) && campaign !== "general" ? campaign : null;
        const flag = `pp_qr_${campaign}`;
        let seen = false;
        try {
          seen = sessionStorage.getItem(flag) === "1";
          sessionStorage.setItem(flag, "1");
        } catch {}
        if (!seen) track("qr_scan", { slug, meta: { from: "counter_card" } });
      }
    } catch {}

    const onClick = (e: MouseEvent) => {
      try {
        const target = e.target as Element | null;
        const el = target && typeof target.closest === "function" ? (target.closest("[data-track]") as HTMLElement | null) : null;
        if (!el) return;
        const type = el.dataset.track || "";
        if (!TYPES.has(type)) return;
        track(type as TrackType, {
          slug: el.dataset.trackSlug || null,
          dealId: el.dataset.trackDeal || null,
          city: el.dataset.trackCity || null,
          meta: el.dataset.trackFrom ? { from: el.dataset.trackFrom } : undefined,
        });
      } catch {}
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
