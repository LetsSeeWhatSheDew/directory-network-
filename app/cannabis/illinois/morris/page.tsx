import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/morris";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function MorrisPage() {
  const listings = await getCityListings("Morris");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
