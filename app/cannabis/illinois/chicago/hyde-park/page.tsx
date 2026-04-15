import type { Metadata } from "next";
import NeighborhoodPage from "@/components/NeighborhoodPage";
import { NEIGHBORHOOD_CONFIG } from "@/config/neighborhoods/chicago/hyde-park";
import { getCityListings } from "../../_helpers";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Dispensaries in Hyde Park, Chicago — Cannabis Guide (${YEAR})`,
  description: `Find cannabis dispensaries in Hyde Park, Chicago, IL. Local info, first-timer tips, and dispensary listings near UChicago — updated for ${YEAR}.`,
  openGraph: {
    title: `Hyde Park Chicago Dispensaries (${YEAR})`,
    description: `Your guide to cannabis dispensaries in Hyde Park, Chicago. Local tips, pricing, and curated listings near the University of Chicago.`,
    siteName: "PuffPrice",
    type: "website",
    locale: "en_US",
  },
};

export default async function HydeParkPage() {
  const listings = await getCityListings("Chicago");
  return <NeighborhoodPage config={NEIGHBORHOOD_CONFIG} listings={listings} />;
}
