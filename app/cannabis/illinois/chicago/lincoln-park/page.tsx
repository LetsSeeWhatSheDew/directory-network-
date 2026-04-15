import type { Metadata } from "next";
import NeighborhoodPage from "@/components/NeighborhoodPage";
import { NEIGHBORHOOD_CONFIG } from "@/config/neighborhoods/chicago/lincoln-park";
import { getCityListings } from "../../_helpers";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Dispensaries in Lincoln Park, Chicago — Cannabis Guide (${YEAR})`,
  description: `Find cannabis dispensaries in Lincoln Park, Chicago, IL. Local info, first-timer tips, and dispensary listings near Lincoln Park Zoo — updated for ${YEAR}.`,
  openGraph: {
    title: `Lincoln Park Chicago Dispensaries (${YEAR})`,
    description: `Your guide to cannabis dispensaries in Lincoln Park, Chicago. Local tips, pricing, and curated listings near the park and DePaul University.`,
    siteName: "CleanList",
    type: "website",
    locale: "en_US",
  },
};

export default async function LincolnParkPage() {
  const listings = await getCityListings("Chicago");
  return <NeighborhoodPage config={NEIGHBORHOOD_CONFIG} listings={listings} />;
}
