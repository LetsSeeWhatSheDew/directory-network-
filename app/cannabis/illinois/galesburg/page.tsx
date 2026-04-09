import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/galesburg";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function GalesbergPage() {
  const listings = await getCityListings("Galesburg");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
