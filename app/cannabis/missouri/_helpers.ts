/**
 * Shared metadata builder and listing fetcher for Missouri city pages.
 *
 * Each page.tsx imports these to stay DRY while keeping the thin-wrapper
 * pattern that Next.js App Router expects.
 */

import type { Metadata } from "next";
import type { CityConfig } from "@/components/CityPage";
import { fetchCityListings } from "@/lib/fetchCityListings";

const YEAR = new Date().getFullYear();

export function buildCityMetadata(config: CityConfig): Metadata {
  return {
    title: `Dispensaries in ${config.city}, Missouri — Your Complete Guide (${YEAR})`,
    description: `Find the best cannabis dispensaries in ${config.city}, MO. Recreational & medical options, local laws, first-timer tips, and real dispensary info — updated for ${YEAR}.`,
    openGraph: {
      title: `Dispensaries in ${config.city}, MO | Find Cannabis Near You (${YEAR})`,
      description: `Your guide to licensed dispensaries in ${config.city}, Missouri. Local cannabis laws, first-visit tips, and a curated directory of recreational & medical shops.`,
      siteName: "Project Green",
      type: "website",
      locale: "en_US",
    },
  };
}

export async function getCityListings(city: string) {
  return fetchCityListings(city, "MO");
}
