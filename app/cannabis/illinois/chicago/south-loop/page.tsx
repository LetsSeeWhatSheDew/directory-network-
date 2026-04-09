import type { Metadata } from "next";
import NeighborhoodPage from "@/components/NeighborhoodPage";
import { NEIGHBORHOOD_CONFIG } from "@/config/neighborhoods/chicago/south-loop";
import { getCityListings } from "../../_helpers";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Dispensaries in South Loop, Chicago — Cannabis Guide (${YEAR})`,
  description: `Find cannabis dispensaries in South Loop, Chicago, IL. Local info near Museum Campus and McCormick Place, first-timer tips — updated for ${YEAR}.`,
  openGraph: {
    title: `South Loop Chicago Dispensaries (${YEAR})`,
    description: `Your guide to cannabis dispensaries in South Loop, Chicago. Growing neighborhood, convenient access, and competitive pricing.`,
    siteName: "Project Green",
    type: "website",
    locale: "en_US",
  },
};

export default async function SouthLoopPage() {
  const listings = await getCityListings("Chicago");
  return <NeighborhoodPage config={NEIGHBORHOOD_CONFIG} listings={listings} />;
}
