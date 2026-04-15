import type { Metadata } from "next";
import NeighborhoodPage from "@/components/NeighborhoodPage";
import { NEIGHBORHOOD_CONFIG } from "@/config/neighborhoods/chicago/river-north";
import { getCityListings } from "../../_helpers";

const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Dispensaries in River North, Chicago — Cannabis Guide (${YEAR})`,
  description: `Find cannabis dispensaries in River North, Chicago, IL. Upscale dispensaries, local info, and first-timer tips — updated for ${YEAR}.`,
  openGraph: {
    title: `River North Chicago Dispensaries (${YEAR})`,
    description: `Your guide to cannabis dispensaries in River North, Chicago. Premium options, curated selections, and upscale retail experience.`,
    siteName: "CleanList",
    type: "website",
    locale: "en_US",
  },
};

export default async function RiverNorthPage() {
  const listings = await getCityListings("Chicago");
  return <NeighborhoodPage config={NEIGHBORHOOD_CONFIG} listings={listings} />;
}
