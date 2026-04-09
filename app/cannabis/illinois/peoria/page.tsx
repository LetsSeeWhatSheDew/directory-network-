import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/peoria";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function PeoriaPage() {
  const listings = await getCityListings("Peoria");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
