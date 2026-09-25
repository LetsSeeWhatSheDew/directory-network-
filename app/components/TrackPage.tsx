"use client";

// Fires one first-party view event (store_view / deal_view) when the page
// mounts. Renders nothing. See lib/track.ts for what is and isn't sent.
import { useEffect } from "react";
import { track, type TrackType } from "../../lib/track";

export default function TrackPage({
  type,
  slug,
  dealId,
  city,
}: {
  type: TrackType;
  slug?: string | null;
  dealId?: string | null;
  city?: string | null;
}) {
  useEffect(() => {
    track(type, { slug, dealId, city });
  }, [type, slug, dealId, city]);
  return null;
}
