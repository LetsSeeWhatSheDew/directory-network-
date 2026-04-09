import CityPage from "@/components/CityPage";
import { CITY_CONFIG } from "@/config/cities/illinois/schaumburg";
import { buildCityMetadata, getCityListings } from "../_helpers";

export const metadata = buildCityMetadata(CITY_CONFIG);

export default async function SchaumbergPage() {
  const listings = await getCityListings("Schaumburg");
  return <CityPage config={CITY_CONFIG} listings={listings} />;
}
