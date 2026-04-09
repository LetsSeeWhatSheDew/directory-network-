import type { Metadata } from "next";
import NeighborhoodPage from "@/components/NeighborhoodPage";
import { NEIGHBORHOOD_CONFIG } from "@/config/neighborhoods/chicago/wrigleyville";
import { getCityListings } from "../../_helpers";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Dispensaries in Wrigleyville, Chicago — Cannabis Guide (${YEAR})`,
  description: `Find cannabis dispensaries in Wrigleyville, Chicago, IL. Local info, first-timer tips, and dispensary listings near Wrigley Field — updated for ${YEAR}.`,
  openGraph: {
    title: `Wrigleyville Chicago Dispensaries (${YEAR})`,
    description: `Your guide to cannabis dispensaries in Wrigleyville, Chicago. Local tips, pricing, and curated listings near Clark Street and Wrigley Field.`,
    siteName: "Project Green",
    type: "website",
    locale: "en_US",
  },
};

export default async function WrigleyvillePage() {
  const listings = await getCityListings("Chicago");
  return <NeighborhoodPage config={NEIGHBORHOOD_CONFIG} listings={listings} />;
}
