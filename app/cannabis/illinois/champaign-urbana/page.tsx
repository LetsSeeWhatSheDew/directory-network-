import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/champaign-urbana";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function ChampaignUrbanaPage() {
  const listings = await getCityListings("Champaign-Urbana");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
