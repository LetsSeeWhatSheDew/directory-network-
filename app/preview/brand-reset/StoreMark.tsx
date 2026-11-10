"use client";
/* eslint-disable @next/next/no-img-element -- store logos come from many hosts; previews only */
// The store's real logo (no referrer: some logo hosts block hotlinks), or its
// initials when there's no logo or it fails to load. Never a stock image.
import { useEffect, useRef, useState } from "react";

export default function StoreMark({ src, name, className, monoClassName }: { src: string | null; name: string; className: string; monoClassName: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- an SSR'd <img> can fail before onError is attached
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);
  if (!src || failed) {
    const initials = name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    return (
      <span className={monoClassName} aria-hidden="true">
        {initials}
      </span>
    );
  }
  return <img ref={ref} src={src} alt="" referrerPolicy="no-referrer" className={className} width={40} height={40} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
