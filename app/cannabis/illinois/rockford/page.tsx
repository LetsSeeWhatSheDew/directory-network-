import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/rockford";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function RockfordPage() {
  const listings = await getCityListings("Rockford");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
