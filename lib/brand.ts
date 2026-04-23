// Single source of truth for brand strings.
// Import from here instead of hardcoding; cascades to titles, OG tags, footer, etc.

export const brand = {
  name: "PuffPrice",
  tagline: "Real deals. Right now. Near you.",
  headline: "Best Bud For Your Buck$ — Low Prices. High Times.",
  domain: "www.puffprice.com",
  url: "https://www.puffprice.com",
  supportEmail: "hi@puffprice.com",
  social: {
    twitter: "@puffprice",
  },
  description:
    "Central Illinois cannabis deal finder. Live dispensary deals across Peoria, Bloomington-Normal, Champaign-Urbana, Springfield, and the rest of Central IL — all in one place.",
} as const;

export type Brand = typeof brand;
