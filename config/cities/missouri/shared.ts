/**
 * Shared data and helpers for Missouri city pages.
 *
 * Purchase-limit copy, ID-requirement copy, and driving/transport copy are
 * identical statewide, so we define them once and spread into each city config.
 *
 * Missouri legalized recreational cannabis via Amendment 3 in February 2023.
 */

import type { CityConfig } from "@/components/CityPage";

/* ------------------------------------------------------------------ */
/*  All Missouri city slugs (for cross-linking)                       */
/* ------------------------------------------------------------------ */

export const ALL_MISSOURI_CITIES: { name: string; slug: string }[] = [
  { name: "St. Louis", slug: "st-louis" },
  { name: "Kansas City", slug: "kansas-city" },
  { name: "Springfield", slug: "springfield" },
  { name: "Columbia", slug: "columbia" },
  { name: "Independence", slug: "independence" },
  { name: "Lee's Summit", slug: "lees-summit" },
  { name: "Joplin", slug: "joplin" },
  { name: "Jefferson City", slug: "jefferson-city" },
  { name: "Cape Girardeau", slug: "cape-girardeau" },
  { name: "Branson", slug: "branson" },
];

/** Return all cities except the one matching `slug` — for footer links. */
export function relatedCities(slug: string) {
  return ALL_MISSOURI_CITIES.filter((c) => c.slug !== slug);
}

/* ------------------------------------------------------------------ */
/*  Statewide law cards                                                */
/* ------------------------------------------------------------------ */

export const PURCHASE_LIMITS_LAW = {
  title: "Purchase Limits",
  body: "Missouri residents and non-residents can purchase up to 3 ounces of dried flower or equivalent per transaction. The equivalent for other product types includes 8 grams of concentrate, 24 ounces of infused edibles, or 6 fluid ounces of infused liquid. Medical patients with a valid Missouri medical marijuana card may purchase higher quantities. You may visit multiple dispensaries in a day, but each transaction is capped independently.",
};

export const ID_REQUIREMENTS_LAW = {
  title: "ID Requirements",
  body: "You must be 21 or older with a valid, unexpired government-issued photo ID. Accepted forms include a driver's license, state ID, passport, or military ID. Medical patients aged 18–20 need a valid Missouri medical marijuana card and valid ID.",
};

export const DRIVING_LAW = {
  title: "Driving & Transport",
  body: "Driving under the influence of cannabis is illegal in Missouri. When transporting purchased cannabis, keep it in a sealed, tamper-evident container in a locked compartment or the trunk—not accessible to the driver. Open containers or consumption while driving are prohibited, with penalties similar to open alcohol violations.",
};

/* ------------------------------------------------------------------ */
/*  Statewide first-timer steps                                        */
/* ------------------------------------------------------------------ */

export function firstTimerSteps(city: string): CityConfig["firstTimerSteps"] {
  return [
    {
      title: "Check In",
      body: `You'll enter a lobby where staff verifies your ID. Once checked, you're admitted to the sales floor. Some ${city} dispensaries use a numbered-ticket system during peak hours—online pre-orders can bypass this wait at many locations.`,
    },
    {
      title: "Browse & Ask",
      body: "Budtenders guide you through the product menu: flower, pre-rolls, edibles, concentrates, topicals, and tinctures. Don't hesitate to ask questions about strains, potency, and effects—staff are trained to help first-time customers find the right product.",
    },
    {
      title: "Pay & Go",
      body: `Most ${city} dispensaries accept cash and debit cards. Credit cards are generally not accepted due to federal banking restrictions. ATMs are available on-site at most locations. Expect to pay Missouri's 6% state excise tax plus local sales taxes on top of the listed price.`,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Statewide FAQ helpers                                              */
/* ------------------------------------------------------------------ */

export function statewideOutOfStateFaq(city: string) {
  return {
    question: `Can out-of-state visitors buy cannabis in ${city}?`,
    answer: `Yes. Missouri allows non-residents to purchase cannabis recreationally. Out-of-state visitors can buy up to 3 ounces of flower (or equivalent in other forms) per transaction with a valid government-issued photo ID proving you are 21 or older. The same purchase limits apply to all visitors regardless of residency.`,
  };
}

export function statewideHoursFaq(city: string) {
  return {
    question: `What are dispensary hours in ${city}?`,
    answer: `Most ${city} dispensaries open between 10:00 AM and 7:00 PM, Monday through Sunday. Some locations have earlier opens or later closes depending on local ordinances. Hours can vary significantly by location, so check ahead—especially on holidays and weekends.`,
  };
}

export function statewideMedicalCardFaq(city: string) {
  return {
    question: `Do I need a medical card to buy cannabis in ${city}?`,
    answer: `No. Missouri allows recreational cannabis sales to anyone 21 and older with a valid photo ID. A medical card is only needed if you want access to higher purchase limits, reduced tax rates, or medical-only products specifically formulated for patient care.`,
  };
}

export function statewideOnlineOrderFaq(city: string) {
  return {
    question: `Can I order cannabis online for pickup in ${city}?`,
    answer: `Many ${city} dispensaries offer online ordering and pre-ordering through their websites or apps. You can browse menus, reserve products, and arrange in-store pickup to skip the wait—but you'll still need to show valid ID and complete the transaction in person. Delivery services are beginning to expand in Missouri but remain limited in most areas.`,
  };
}
