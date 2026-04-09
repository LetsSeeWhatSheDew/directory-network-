import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/sycamore";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function SycamorePage() {
  const listings = await getCityListings("Sycamore");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
