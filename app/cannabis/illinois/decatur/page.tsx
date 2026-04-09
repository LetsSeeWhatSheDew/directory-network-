import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/decatur";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function DecaturPage() {
  const listings = await getCityListings("Decatur");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
