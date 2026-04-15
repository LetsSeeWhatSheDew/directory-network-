// Single source of truth for brand strings.
// Import from here instead of hardcoding; cascades to titles, OG tags, footer, etc.

export const brand = {
  name: "PuffPrice",
  tagline: "Real deals. Right now. Near you.",
  headline: "Best Bud For Your Buck$ — Low Prices. High Times.",
  domain: "puffprice.com",
  url: "https://puffprice.com",
  supportEmail: "hi@puffprice.com",
  social: {
    twitter: "@puffprice",
  },
  description:
    "Find the best cannabis deals near you in Illinois. Real-time dispensary offers, updated daily.",
} as const;

export type Brand = typeof brand;
