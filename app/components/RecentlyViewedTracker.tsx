"use client";

import { useEffect } from "react";
import { addRecentlyViewed } from "../../lib/recentlyViewed";

// Fires once on mount from the listing page. Zero UI — it exists so the
// server component can hand over slug/name/city without going client.
export default function RecentlyViewedTracker({
  slug,
  name,
  city,
}: {
  slug: string;
  name: string;
  city: string;
}) {
  useEffect(() => {
    addRecentlyViewed(slug, name, city);
  }, [slug, name, city]);

  return null;
}
