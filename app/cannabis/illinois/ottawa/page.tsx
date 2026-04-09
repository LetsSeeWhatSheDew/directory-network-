import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/ottawa";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function OttawaPage() {
  const listings = await getCityListings("Ottawa");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
