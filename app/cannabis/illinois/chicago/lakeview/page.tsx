import type { Metadata } from "next";
import NeighborhoodPage from "@/components/NeighborhoodPage";
import { NEIGHBORHOOD_CONFIG } from "@/config/neighborhoods/chicago/lakeview";
import { getCityListings } from "../../_helpers";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Dispensaries in Lakeview, Chicago — Cannabis Guide (${YEAR})`,
  description: `Find cannabis dispensaries in Lakeview, Chicago, IL. Local info, first-timer tips, and dispensary listings near Belmont and Clark — updated for ${YEAR}.`,
  openGraph: {
    title: `Lakeview Chicago Dispensaries (${YEAR})`,
    description: `Your guide to cannabis dispensaries in Lakeview, Chicago. Local tips, pricing, and curated listings near the lakefront and Belmont Ave.`,
    siteName: "Project Green",
    type: "website",
    locale: "en_US",
  },
};

export default async function LakeviewPage() {
  const listings = await getCityListings("Chicago");
  return <NeighborhoodPage config={NEIGHBORHOOD_CONFIG} listings={listings} />;
}
