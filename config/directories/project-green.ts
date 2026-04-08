export interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
}

export interface DirectoryConfig {
  niche: string;
  region: string;
  directoryName: string;
  heroHeadline: string;
  heroSubheadline: string;
  accentColor: string;
  stats: { label: string; value: string }[];
  benefits: { title: string; description: string }[];
  pricingTiers: PricingTier[];
  source: string;
}

export const DIRECTORY_CONFIG: DirectoryConfig = {
  niche: "cannabis",
  region: "Illinois",
  directoryName: "Project Green",
  heroHeadline: "Your Dispensary Deserves to Be Found",
  heroSubheadline:
    "The trusted cannabis directory for Illinois — curated listings, zero spam, license-verified operators.",
  accentColor: "#4ade80",
  stats: [
    { label: "Active Listings", value: "120+" },
    { label: "Illinois Cities", value: "40+" },
    { label: "Monthly Searches", value: "8,000+" },
  ],
  benefits: [
    {
      title: "Curated, Not Cluttered",
      description:
        "Every listing is reviewed by a human before going live. No spam, no gray-market operators.",
    },
    {
      title: "Search-Ready Profiles",
      description:
        "Optimized listing pages help local searchers find your dispensary on Google.",
    },
    {
      title: "License-Verified",
      description:
        "We cross-reference state license data so customers know they can trust who they find here.",
    },
    {
      title: "Instant Claim",
      description:
        "Already in the directory? Claim your listing in minutes and start editing your profile.",
    },
  ],
  pricingTiers: [
    {
      name: "Free Claim",
      price: "$0",
      description: "Claim your listing and own your presence.",
      features: [
        "Basic profile page",
        "Hours & location",
        "License badge",
        "Customer reviews",
      ],
      cta: "Claim Free",
    },
    {
      name: "Boost",
      price: "$49/mo",
      description: "Stand out and drive more foot traffic.",
      features: [
        "Featured placement",
        "Photos & menu link",
        "Priority indexing",
        "Monthly analytics report",
      ],
      cta: "Start Boost",
    },
  ],
  source: "grow-landing",
};
