import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/springfield";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function SpringfieldPage() {
  const listings = await getCityListings("Springfield");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
