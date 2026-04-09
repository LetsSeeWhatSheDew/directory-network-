import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/carbondale";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function CarbondalePage() {
  const listings = await getCityListings("Carbondale");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
