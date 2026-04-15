"use client";

import { useEffect } from "react";

/**
 * Captures UTM parameters from the incoming URL once per session so
 * social-post traffic (Reddit / Facebook / Nextdoor 4/20 campaigns)
 * can be attributed even if the user navigates internally before
 * converting. No persistence beyond sessionStorage — ephemeral.
 *
 * Params read: utm_source, utm_medium, utm_campaign, utm_content, utm_term
 *
 * Important: this component renders nothing. Its only side effects are
 * a sessionStorage write and a single gtag event. Nothing here should
 * affect page layout or SSR output. Components downstream can read
 * `sessionStorage.getItem("cl_utm_source")` etc. if they want to
 * personalize copy based on the campaign origin.
 */
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export default function UtmCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    let captured: Record<string, string> | null = null;
    try {
      const url = new URL(window.location.href);
      const params: Record<string, string> = {};
      for (const key of UTM_KEYS) {
        const v = url.searchParams.get(key);
        if (v) params[key] = v;
      }
      if (Object.keys(params).length === 0) return;
      captured = params;

      // Persist for the session (overwrites any stale value)
      for (const [k, v] of Object.entries(params)) {
        sessionStorage.setItem(`cl_${k}`, v);
      }
    } catch {
      return;
    }

    // Fire a single analytics event. Safe if gtag isn't defined.
    try {
      const w = window as any;
      if (captured && typeof w.gtag === "function") {
        w.gtag("event", "campaign_landing", captured);
      }
    } catch {}
  }, []);

  return null;
}
