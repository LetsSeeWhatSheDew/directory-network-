// lib/brands.ts
// Static brand catalogue. Sourced from Cowork's affiliate shortlist
// (`docs/research/affiliate-shortlist-20260421.md`) — the 5 brands below
// are the ones with real IL footprint + marketing-org reachability that
// the outreach sequence targets.
//
// Design decision: keep this a static const rather than build a `brands`
// table yet. When a partnership signs and we need moderator-editable
// content + logos + affiliate URLs, Cowork will scaffold the table
// and we'll switch these helpers to read from Supabase. Until then the
// table's shape isn't load-bearing and an unreviewed migration would
// just bloat the schema.

export type Brand = {
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  affiliate_url: string | null;
  categories: string[];
  states: string[];
  // Loose keyword list used to match deals to this brand via
  // case-insensitive substring search on title/description. Covers the
  // parent brand + sub-brand SKUs that appear in PuffPrice's deal feed.
  match_keywords: string[];
};

// Note: the tasking prompt named Wyld as the 4th brand; Cowork's actual
// shortlist substituted Verano (Savvy/Encore/Swift) because Wyld has
// no IL footprint yet — Cowork's reasoning is captured in the shortlist
// doc. Ship Cowork's 5 so the pages are backed by real content.
const BRANDS: Brand[] = [
  {
    slug: "cresco",
    name: "Cresco Labs",
    description:
      "Chicago-based multistate operator behind the Cresco, High Supply, Mindy's, and Good News brands, plus the Sunnyside dispensary chain. Seven Sunnyside stores anchor the IL footprint; house-brand SKUs land on menus at 20+ non-Sunnyside dispensaries statewide.",
    logo_url: null,
    website: "https://www.crescolabs.com",
    affiliate_url: null,
    categories: ["flower", "vape", "edibles", "concentrate", "pre-roll"],
    states: ["IL"],
    match_keywords: ["cresco", "high supply", "mindy", "good news", "sunnyside"],
  },
  {
    slug: "gti",
    name: "Green Thumb Industries",
    description:
      "Chicago-headquartered MSO operating Rise dispensaries and producing the Rythm, Dogwalkers, and Incredibles brands. Five Illinois Rise stores plus widespread wholesale distribution — Dogwalkers pre-rolls and Rythm vape carts are regulars in the PuffPrice deal feed.",
    logo_url: null,
    website: "https://www.gtigrows.com",
    affiliate_url: null,
    categories: ["flower", "vape", "edibles", "pre-roll"],
    states: ["IL"],
    match_keywords: ["gti", "green thumb", "rythm", "dogwalkers", "incredibles", "rise"],
  },
  {
    slug: "verano",
    name: "Verano",
    description:
      "Chicago-based public MSO (OTC: VRNOF) with two Zen Leaf dispensaries in Illinois and a wide wholesale network. Savvy is one of the most-promo'd house brands in the PuffPrice deal feed, with standing percent-off deals showing up at Ivy Hall and Zen Leaf Naperville.",
    logo_url: null,
    website: "https://verano.com",
    affiliate_url: null,
    categories: ["flower", "vape", "edibles", "concentrate"],
    states: ["IL"],
    match_keywords: ["verano", "savvy", "encore", "swift", "zen leaf"],
  },
  {
    slug: "kiva",
    name: "Kiva Confections",
    description:
      "California-based edibles maker in exclusive IL licensing partnership with C3 Industries. Kiva chocolates, Petra mints, Camino gummies, and Terra bites reach ~40 of the 61 Illinois dispensaries PuffPrice tracks. Edibles-only brand, no flower or hardware SKUs.",
    logo_url: null,
    website: "https://kivaconfections.com",
    affiliate_url: null,
    categories: ["edibles"],
    states: ["IL", "CA", "AZ", "MI", "MA", "OH"],
    match_keywords: ["kiva", "petra", "camino", "terra", "lost farm"],
  },
  {
    slug: "pax",
    name: "PAX Labs",
    description:
      "San Francisco hardware maker — the Pax Mini, Pax Plus, and Pax 3 vaporizers sit on accessory walls at virtually every Illinois dispensary. PAX doesn't sell THC itself; its role in the Illinois market is the device that pairs with whatever flower or cartridge a buyer picks up.",
    logo_url: null,
    website: "https://pax.com",
    affiliate_url: null,
    categories: ["accessories"],
    states: ["IL", "US"],
    match_keywords: ["pax", "pax mini", "pax plus", "pax 3", "pax era"],
  },
];

export async function getBrand(slug: string): Promise<Brand | null> {
  return BRANDS.find((b) => b.slug === slug) || null;
}

export async function getAllBrands(): Promise<Brand[]> {
  return [...BRANDS];
}
