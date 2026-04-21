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
    "Illinois cannabis deal finder. Find dispensary deals near you, all in one place.",
} as const;

export type Brand = typeof brand;
