import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/danville";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function DanvillePage() {
  const listings = await getCityListings("Danville");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
