"use client";

// ArrivalExhale — someone tapped a watch-alert or price-drop email and landed
// here: the deal they came for plays its exhale once, on arrival.
// Triggers on the alert emails' own link params (utm_source=alert, which the
// deal-watch email already sends) or on ?exhale=… — no change to email sending.
// The number itself never moves; the puff rises from behind it.

import { useEffect } from "react";
import { MOTION, dur, releaseExhale } from "../../lib/motion";

export default function ArrivalExhale({ targetId, size = 0.5 }: { targetId: string; size?: number }) {
  useEffect(() => {
    let arrived = false;
    try {
      const q = new URLSearchParams(window.location.search);
      arrived = q.get("utm_source") === "alert" || q.has("exhale");
    } catch {}
    if (!arrived) return;
    const t = setTimeout(() => releaseExhale(document.getElementById(targetId), size, true), dur(MOTION.settle));
    return () => clearTimeout(t);
  }, [targetId, size]);
  return null;
}
