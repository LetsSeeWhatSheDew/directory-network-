import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/rock-island";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function RockIslandPage() {
  const listings = await getCityListings("Rock Island");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
