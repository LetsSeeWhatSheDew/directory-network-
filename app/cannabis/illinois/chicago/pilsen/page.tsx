import type { Metadata } from "next";
import NeighborhoodPage from "@/components/NeighborhoodPage";
import { NEIGHBORHOOD_CONFIG } from "@/config/neighborhoods/chicago/pilsen";
import { getCityListings } from "../../_helpers";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Dispensaries in Pilsen, Chicago — Cannabis Guide (${YEAR})`,
  description: `Find cannabis dispensaries in Pilsen, Chicago, IL. Local info, first-timer tips, and dispensary listings on 18th Street — updated for ${YEAR}.`,
  openGraph: {
    title: `Pilsen Chicago Dispensaries (${YEAR})`,
    description: `Your guide to cannabis dispensaries in Pilsen, Chicago. Local tips, pricing, and curated listings on 18th Street in this vibrant arts hub.`,
    siteName: "PuffPrice",
    type: "website",
    locale: "en_US",
  },
};

export default async function PilsenPage() {
  const listings = await getCityListings("Chicago");
  return <NeighborhoodPage config={NEIGHBORHOOD_CONFIG} listings={listings} />;
}
