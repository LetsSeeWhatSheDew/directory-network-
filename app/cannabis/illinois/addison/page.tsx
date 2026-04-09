import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/addison";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function AddisonPage() {
  const listings = await getCityListings("Addison");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
