/**
 * Geographic data for Illinois cities.
 * Provides coordinates and functions to calculate nearby cities using the Haversine formula.
 */

/** Approximate lat/lng coordinates for all 35 Illinois cities */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  chicago: { lat: 41.8781, lng: -87.6298 },
  rockford: { lat: 42.2711, lng: -89.094 },
  springfield: { lat: 39.7817, lng: -89.6501 },
  peoria: { lat: 40.6936, lng: -89.589 },
  naperville: { lat: 41.7358, lng: -88.1517 },
  "champaign-urbana": { lat: 40.1164, lng: -88.2434 },
  "bloomington-normal": { lat: 40.4842, lng: -88.9936 },
  joliet: { lat: 41.5241, lng: -88.0827 },
  aurora: { lat: 41.7605, lng: -88.32 },
  collinsville: { lat: 38.6556, lng: -90.2834 },
  effingham: { lat: 39.5158, lng: -88.5406 },
  quincy: { lat: 39.9387, lng: -91.4048 },
  danville: { lat: 40.1164, lng: -87.6328 },
  "east-peoria": { lat: 40.6638, lng: -89.5356 },
  marion: { lat: 37.7299, lng: -88.9785 },
  sycamore: { lat: 41.973, lng: -88.827 },
  carbondale: { lat: 37.7273, lng: -89.2234 },
  decatur: { lat: 39.8433, lng: -88.9391 },
  elgin: { lat: 42.0379, lng: -88.277 },
  waukegan: { lat: 42.3629, lng: -87.8547 },
  schaumburg: { lat: 42.0339, lng: -88.0841 },
  normal: { lat: 40.4843, lng: -88.9936 },
  champaign: { lat: 40.1164, lng: -88.2434 },
  addison: { lat: 41.9317, lng: -88.0364 },
  "north-aurora": { lat: 41.8095, lng: -88.3179 },
  mundelein: { lat: 42.3024, lng: -87.9333 },
  ottawa: { lat: 41.3431, lng: -88.5467 },
  canton: { lat: 40.555, lng: -89.6159 },
  galesburg: { lat: 40.9517, lng: -90.3681 },
  moline: { lat: 41.4925, lng: -90.5151 },
  "rock-island": { lat: 41.5031, lng: -90.5808 },
  sterling: { lat: 41.7923, lng: -89.7067 },
  morris: { lat: 41.3628, lng: -88.4179 },
  jacksonville: { lat: 39.7398, lng: -90.2277 },
  litchfield: { lat: 39.1816, lng: -89.6548 },
};

/**
 * Calculate the distance between two lat/lng coordinates using the Haversine formula.
 * Returns distance in miles.
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get the N nearest cities to a given city slug.
 * Returns results sorted by distance (nearest first) with distance in miles.
 * Excludes the source city from results.
 */
export function getNearbyCities(
  slug: string,
  count = 5
): { name: string; slug: string; distanceMi: number }[] {
  const sourceCoords = CITY_COORDINATES[slug];
  if (!sourceCoords) {
    return [];
  }

  // Calculate distances to all other cities
  const distances = Object.entries(CITY_COORDINATES)
    .filter(([otherSlug]) => otherSlug !== slug)
    .map(([otherSlug, coords]) => ({
      slug: otherSlug,
      distanceMi: haversineDistance(
        sourceCoords.lat,
        sourceCoords.lng,
        coords.lat,
        coords.lng
      ),
    }));

  // Sort by distance and take top N
  return distances
    .sort((a, b) => a.distanceMi - b.distanceMi)
    .slice(0, count)
    .map((item) => ({
      name: getCityName(item.slug),
      slug: item.slug,
      distanceMi: Math.round(item.distanceMi * 10) / 10, // Round to 1 decimal place
    }));
}

/**
 * Convert slug to display name.
 * Used by getNearbyCities to format results.
 */
function getCityName(slug: string): string {
  const cityNames: Record<string, string> = {
    chicago: "Chicago",
    rockford: "Rockford",
    springfield: "Springfield",
    peoria: "Peoria",
    naperville: "Naperville",
    "champaign-urbana": "Champaign-Urbana",
    "bloomington-normal": "Bloomington-Normal",
    joliet: "Joliet",
    aurora: "Aurora",
    collinsville: "Collinsville",
    effingham: "Effingham",
    quincy: "Quincy",
    danville: "Danville",
    "east-peoria": "East Peoria",
    marion: "Marion",
    sycamore: "Sycamore",
    carbondale: "Carbondale",
    decatur: "Decatur",
    elgin: "Elgin",
    waukegan: "Waukegan",
    schaumburg: "Schaumburg",
    normal: "Normal",
    champaign: "Champaign",
    addison: "Addison",
    "north-aurora": "North Aurora",
    mundelein: "Mundelein",
    ottawa: "Ottawa",
    canton: "Canton",
    galesburg: "Galesburg",
    moline: "Moline",
    "rock-island": "Rock Island",
    sterling: "Sterling",
    morris: "Morris",
    jacksonville: "Jacksonville",
    litchfield: "Litchfield",
  };
  return cityNames[slug] || slug;
}
