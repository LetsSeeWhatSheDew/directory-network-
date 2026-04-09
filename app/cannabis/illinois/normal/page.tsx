import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/normal";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function NormalPage() {
  const listings = await getCityListings("Normal");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
