/**
 * Shared data and helpers for Illinois city pages.
 *
 * Purchase-limit copy, ID-requirement copy, and driving/transport copy are
 * identical statewide, so we define them once and spread into each city config.
 */

import type { CityConfig } from "@/components/CityPage";

/* ------------------------------------------------------------------ */
/*  All Illinois city slugs (for cross-linking)                        */
/* ------------------------------------------------------------------ */

export const ALL_ILLINOIS_CITIES: { name: string; slug: string }[] = [
  { name: "Chicago", slug: "chicago" },
  { name: "Rockford", slug: "rockford" },
  { name: "Springfield", slug: "springfield" },
  { name: "Peoria", slug: "peoria" },
  { name: "Naperville", slug: "naperville" },
  { name: "Champaign-Urbana", slug: "champaign-urbana" },
  { name: "Bloomington-Normal", slug: "bloomington-normal" },
  { name: "Joliet", slug: "joliet" },
  { name: "Aurora", slug: "aurora" },
  { name: "Collinsville", slug: "collinsville" },
  { name: "Effingham", slug: "effingham" },
  { name: "Quincy", slug: "quincy" },
  { name: "Danville", slug: "danville" },
  { name: "East Peoria", slug: "east-peoria" },
  { name: "Marion", slug: "marion" },
  { name: "Sycamore", slug: "sycamore" },
  { name: "Carbondale", slug: "carbondale" },
  { name: "Decatur", slug: "decatur" },
  { name: "Elgin", slug: "elgin" },
  { name: "Waukegan", slug: "waukegan" },
  { name: "Schaumburg", slug: "schaumburg" },
  { name: "Normal", slug: "normal" },
  { name: "Champaign", slug: "champaign" },
  { name: "Addison", slug: "addison" },
  { name: "North Aurora", slug: "north-aurora" },
  { name: "Mundelein", slug: "mundelein" },
  { name: "Ottawa", slug: "ottawa" },
  { name: "Canton", slug: "canton" },
  { name: "Galesburg", slug: "galesburg" },
  { name: "Moline", slug: "moline" },
  { name: "Rock Island", slug: "rock-island" },
  { name: "Sterling", slug: "sterling" },
  { name: "Morris", slug: "morris" },
  { name: "Jacksonville", slug: "jacksonville" },
  { name: "Litchfield", slug: "litchfield" },
];

/** Return all cities except the one matching `slug` — for footer links. */
export function relatedCities(slug: string) {
  return ALL_ILLINOIS_CITIES.filter((c) => c.slug !== slug);
}

/* ------------------------------------------------------------------ */
/*  Statewide law cards                                                */
/* ------------------------------------------------------------------ */

export const PURCHASE_LIMITS_LAW = {
  title: "Purchase Limits",
  body: "Illinois residents can buy up to 30g of cannabis flower, 5g of concentrate, or 500mg of THC in edible form per transaction. Out-of-state visitors receive half those amounts. You may visit multiple dispensaries in a day, but each transaction is capped independently.",
};

export const ID_REQUIREMENTS_LAW = {
  title: "ID Requirements",
  body: "You must be 21 or older with a valid, unexpired government-issued photo ID. Accepted forms include a driver\u2019s license, state ID, passport, or military ID. Medical patients aged 18\u201320 need a valid Illinois medical cannabis card.",
};

export const DRIVING_LAW = {
  title: "Driving & Transport",
  body: "Driving under the influence of cannabis is illegal in Illinois. When transporting purchased cannabis, keep it in a sealed, odor-proof, child-resistant container in your trunk or a locked compartment \u2014 not accessible to the driver. Open containers in vehicles carry the same penalties as open alcohol.",
};

/* ------------------------------------------------------------------ */
/*  Statewide first-timer steps                                        */
/* ------------------------------------------------------------------ */

export function firstTimerSteps(city: string): CityConfig["firstTimerSteps"] {
  return [
    {
      title: "Check In",
      body: `You\u2019ll enter a lobby where a staff member checks your ID. Once verified, you\u2019re admitted to the sales floor. Some locations use a queuing system during peak hours \u2014 online pre-orders can skip this wait at many ${city} shops.`,
    },
    {
      title: "Browse & Ask",
      body: "Budtenders walk you through the product menu: flower, pre-rolls, edibles, concentrates, topicals, and tinctures. Don\u2019t hesitate to ask questions \u2014 staff are trained to help you find the right product for your experience level and desired effects.",
    },
    {
      title: "Pay & Go",
      body: `Most ${city} dispensaries accept cash and debit cards. Credit cards are generally not accepted due to federal banking restrictions. ATMs are available on-site at most locations. Expect to pay Illinois excise tax on top of the listed price \u2014 total tax can add 20\u201335% depending on the product type.`,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Statewide FAQ helpers                                              */
/* ------------------------------------------------------------------ */

export function statewideOutOfStateFaq(city: string) {
  return {
    question: `Can out-of-state visitors buy cannabis in ${city}?`,
    answer: `Yes. Illinois allows non-residents to purchase cannabis recreationally. Out-of-state visitors can buy up to 15 grams of flower, 2.5 grams of concentrate, or 250 mg of THC in edible form \u2014 half the limit for Illinois residents. A valid government-issued photo ID proving you are 21 or older is required.`,
  };
}

export function statewideHoursFaq(city: string) {
  return {
    question: `What are dispensary hours in ${city}?`,
    answer: `Most ${city} dispensaries open between 9:00\u201310:00 AM and close between 7:00\u20139:00 PM, Monday through Saturday. Sunday hours are often shortened. Hours can vary by location, so check ahead \u2014 especially on holidays.`,
  };
}

export function statewideMedicalCardFaq(city: string) {
  return {
    question: `Do I need a medical card to buy cannabis in ${city}?`,
    answer: `No. Since January 1, 2020, Illinois has allowed recreational cannabis sales to anyone 21 and older with a valid photo ID. A medical card is only needed if you want access to medical-only products, higher purchase limits, or reduced tax rates.`,
  };
}

export function statewideOnlineOrderFaq(city: string) {
  return {
    question: `Can I order cannabis online for pickup in ${city}?`,
    answer: `Many ${city} dispensaries offer online ordering for in-store pickup. You can browse menus, reserve products, and skip the wait \u2014 but you\u2019ll still need to show valid ID and complete the transaction in person. Delivery is not yet widely available in the ${city} area.`,
  };
}
