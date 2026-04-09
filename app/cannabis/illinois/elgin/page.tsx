import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/elgin";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function ElginPage() {
  const listings = await getCityListings("Elgin");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
