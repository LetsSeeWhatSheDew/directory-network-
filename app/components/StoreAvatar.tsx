"use client";
// Small square store image with a monogram fallback (no broken-image icons).
import { useEffect, useRef, useState } from "react";

export default function StoreAvatar({ src, name, size = 44 }: { src: string | null; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // SSR'd <img> can fail before hydration attaches onError — check once mounted.
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);
  const initials = (name || "?").replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const box: React.CSSProperties = {
    width: size, height: size, flex: `0 0 ${size}px`, borderRadius: 10, overflow: "hidden",
    border: "1px solid var(--pp-border)", background: "var(--pp-canopy)", display: "flex",
    alignItems: "center", justifyContent: "center",
  };
  if (!src || failed) {
    return (
      <span aria-hidden="true" style={{ ...box, color: "var(--pp-paper)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: size * 0.36 }}>
        {initials}
      </span>
    );
  }
  return (
    <span style={{ ...box, background: "#fff" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={ref} src={src} alt="" referrerPolicy="no-referrer" width={size} height={size} loading="lazy" decoding="async" onError={() => setFailed(true)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </span>
  );
}
