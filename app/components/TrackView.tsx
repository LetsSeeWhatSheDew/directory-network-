"use client";

import { useEffect } from "react";

export default function TrackView({
  event,
  params,
}: {
  event: string;
  params?: Record<string, string | number | boolean | null | undefined>;
}) {
  useEffect(() => {
    try {
      const w = window as any;
      if (typeof w.gtag === "function") {
        w.gtag("event", event, params || {});
      }
    } catch {}
  }, [event, params]);
  return null;
}
