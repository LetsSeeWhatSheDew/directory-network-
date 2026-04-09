import type { Metadata } from "next";
import NeighborhoodPage from "@/components/NeighborhoodPage";
import { NEIGHBORHOOD_CONFIG } from "@/config/neighborhoods/chicago/wicker-park";
import { getCityListings } from "../../_helpers";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Dispensaries in Wicker Park, Chicago — Cannabis Guide (${YEAR})`,
  description: `Find cannabis dispensaries in Wicker Park, Chicago, IL. Trendy, artsy neighborhood with craft cannabis and competitive pricing — updated for ${YEAR}.`,
  openGraph: {
    title: `Wicker Park Chicago Dispensaries (${YEAR})`,
    description: `Your guide to cannabis dispensaries in Wicker Park, Chicago. Independent shops, craft products, and vibrant neighborhood vibe.`,
    siteName: "Project Green",
    type: "website",
    locale: "en_US",
  },
};

export default async function WickerParkPage() {
  const listings = await getCityListings("Chicago");
  return <NeighborhoodPage config={NEIGHBORHOOD_CONFIG} listings={listings} />;
}
