import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/jacksonville";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function JacksonvillePage() {
  const listings = await getCityListings("Jacksonville");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
