// lib/brands.ts
// Stub data layer for cannabis brand pages. When Cowork's affiliate
// research drops (Tuesday) a `brands` table will back these. Until
// then `getBrand()` returns null and `getAllBrands()` returns [] so
// consumers render the "coming soon" placeholder instead of crashing.

export type Brand = {
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  affiliate_url: string | null;
  categories: string[];
  states: string[];
};

export async function getBrand(_slug: string): Promise<Brand | null> {
  // Intentionally null until the brands table + content exists.
  return null;
}

export async function getAllBrands(): Promise<Brand[]> {
  return [];
}
