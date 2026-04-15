import type { Metadata } from "next";
import NeighborhoodPage from "@/components/NeighborhoodPage";
import { NEIGHBORHOOD_CONFIG } from "@/config/neighborhoods/chicago/west-loop";
import { getCityListings } from "../../_helpers";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Dispensaries in West Loop, Chicago — Cannabis Guide (${YEAR})`,
  description: `Find cannabis dispensaries in West Loop, Chicago, IL. Local info, first-timer tips, and dispensary listings near Restaurant Row — updated for ${YEAR}.`,
  openGraph: {
    title: `West Loop Chicago Dispensaries (${YEAR})`,
    description: `Your guide to cannabis dispensaries in West Loop, Chicago. Local tips, pricing, and curated listings near Randolph Street and Fulton Market.`,
    siteName: "PuffPrice",
    type: "website",
    locale: "en_US",
  },
};

export default async function WestLoopPage() {
  const listings = await getCityListings("Chicago");
  return <NeighborhoodPage config={NEIGHBORHOOD_CONFIG} listings={listings} />;
}
