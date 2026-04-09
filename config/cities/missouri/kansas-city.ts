import type { CityConfig } from "@/components/CityPage";
import {
  relatedCities,
  PURCHASE_LIMITS_LAW,
  ID_REQUIREMENTS_LAW,
  DRIVING_LAW,
  firstTimerSteps,
  statewideOutOfStateFaq,
  statewideHoursFaq,
  statewideMedicalCardFaq,
  statewideOnlineOrderFaq,
} from "./shared";

export const CITY_CONFIG: CityConfig = {
  city: "Kansas City",
  state: "Missouri",
  slug: "kansas-city",

  heroIntro:
    "Kansas City is Missouri's second-largest cannabis market with 25+ licensed dispensaries serving the metro area. Clusters in the Crossroads Arts District, Westport, and Midtown reflect KC's creative culture and growing cannabis scene. With a population exceeding 500,000 and strong cross-border traffic from Kansas, Kansas City offers solid inventory, competitive pricing, and a laid-back retail environment that reflects the city's blues and barbecue heritage.",

  stats: [
    { label: "Dispensaries", value: "25+" },
    { label: "Population", value: "~500K" },
    { label: "Rec & Medical", value: "Both available" },
  ],

  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in Kansas City. Use is restricted to private residences with owner consent. Landlords retain the right to prohibit cannabis use in rental properties. No consumption lounges or public smoking venues are permitted at this time.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],

  firstTimerSteps: firstTimerSteps("Kansas City"),

  priceBlurb:
    "Flower typically ranges from $35–$60 per eighth (3.5g) before tax. Pre-rolls cost $12–$24 each. Edibles start around $15 for a 100mg package. Concentrates range from $40–$75. Kansas City's competitive market and Missouri's lower excise tax make it one of the Midwest's most affordable major cannabis markets, with total costs typically 20–30% below Illinois pricing.",

  faqs: [
    {
      question: "How many dispensaries are in Kansas City, Missouri?",
      answer:
        "Kansas City and the surrounding metro area home to approximately 25+ licensed dispensaries as of 2026. The market includes both recreational and medical operators, with strong presence in Crossroads, Westport, and suburban areas. The city's central location and cross-border appeal make it a robust regional market.",
    },
    statewideOutOfStateFaq("Kansas City"),
    statewideHoursFaq("Kansas City"),
    statewideMedicalCardFaq("Kansas City"),
    {
      question: "What's the tax rate on cannabis in Kansas City?",
      answer:
        "Recreational cannabis is subject to Missouri's 6% state excise tax plus Kansas City's local sales tax of 8.6% combined (4.225% base state rate). Medical cannabis carries a reduced state excise tax. Kansas City's tax structure remains significantly lower than Illinois, making it an attractive destination for budget-conscious shoppers.",
    },
    statewideOnlineOrderFaq("Kansas City"),
  ],

  relatedCities: relatedCities("kansas-city"),
};
