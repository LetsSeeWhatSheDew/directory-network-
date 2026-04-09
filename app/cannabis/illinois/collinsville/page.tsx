import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/collinsville";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function CollinsvillePage() {
  const listings = await getCityListings("Collinsville");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
