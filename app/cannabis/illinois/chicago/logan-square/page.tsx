import type { Metadata } from "next";
import NeighborhoodPage from "@/components/NeighborhoodPage";
import { NEIGHBORHOOD_CONFIG } from "@/config/neighborhoods/chicago/logan-square";
import { getCityListings } from "../../_helpers";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Dispensaries in Logan Square, Chicago — Cannabis Guide (${YEAR})`,
  description: `Find cannabis dispensaries in Logan Square, Chicago, IL. Local info, first-timer tips, and dispensary listings on Milwaukee Ave — updated for ${YEAR}.`,
  openGraph: {
    title: `Logan Square Chicago Dispensaries (${YEAR})`,
    description: `Your guide to cannabis dispensaries in Logan Square, Chicago. Local tips, pricing, and curated listings on Milwaukee Avenue.`,
    siteName: "CleanList",
    type: "website",
    locale: "en_US",
  },
};

export default async function LoganSquarePage() {
  const listings = await getCityListings("Chicago");
  return <NeighborhoodPage config={NEIGHBORHOOD_CONFIG} listings={listings} />;
}
