"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LocationAware from "../LocationAware";

/** Finds the visitor (GPS first, then IP) via LocationAware, which writes the
 *  pp_loc cookie. When the town it settles on differs from the one the server
 *  rendered with, re-render so the coupon is the best deal near *them*. */
export default function GoldLocate({ serverCity }: { serverCity: string | null }) {
  const router = useRouter();
  useEffect(() => {
    const onResolved = (e: Event) => {
      const city = (e as CustomEvent<{ city?: string } | null>).detail?.city || null;
      if (city && city !== serverCity) {
        try {
          window.dispatchEvent(new CustomEvent("cl:location-changed"));
        } catch {}
        router.refresh();
      }
    };
    window.addEventListener("cl:location-resolved", onResolved);
    return () => window.removeEventListener("cl:location-resolved", onResolved);
  }, [router, serverCity]);
  return (
    <div className="g-locate">
      <LocationAware />
    </div>
  );
}
