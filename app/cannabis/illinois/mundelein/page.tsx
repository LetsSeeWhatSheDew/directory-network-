import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/mundelein";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function MundeleinPage() {
  const listings = await getCityListings("Mundelein");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
