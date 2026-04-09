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
  city: "Branson",
  state: "Missouri",
  slug: "branson",

  heroIntro:
    "Branson is an Ozark Mountain tourist destination with 3–4 licensed dispensaries serving millions of annual visitors and a small year-round population of 12,000. Known for Table Rock Lake, live music theaters, and outdoor recreation, Branson's cannabis market caters to tourists seeking legal options during vacation. The city's high visitor traffic creates unique retail dynamics that blend tourist convenience with local resident needs.",

  stats: [
    { label: "Dispensaries", value: "3–4" },
    { label: "Population", value: "~12K" },
    { label: "Visitors/Year", value: "Millions" },
  ],

  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in Branson, including parks, beaches, and public areas around Table Rock Lake. Visitors may consume in private hotel rooms where management permits. Rental cabins and vacation properties vary in cannabis policies—verify with your accommodation before consuming. No cannabis lounges or public consumption venues are authorized.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],

  firstTimerSteps: firstTimerSteps("Branson"),

  priceBlurb:
    "Flower typically ranges from $40–$65 per eighth (3.5g) before tax, reflecting tourist-area pricing. Pre-rolls cost $15–$25 each. Edibles start around $18 for a 100mg package. Concentrates fall in the $50–$80 range. Branson's heavy tourist traffic and limited supply base support higher retail prices compared to urban Missouri centers, though Missouri's low excise tax remains a draw for visitors.",

  faqs: [
    {
      question: "How many dispensaries are in Branson, Missouri?",
      answer:
        "Branson is home to 3–4 licensed dispensaries as of 2026. These retailers cater primarily to the millions of annual tourists visiting for Table Rock Lake, live entertainment, and Ozark outdoor recreation, alongside serving the small year-round local population. Dispensaries are strategically positioned in tourist-accessible areas.",
    },
    statewideOutOfStateFaq("Branson"),
    statewideHoursFaq("Branson"),
    statewideMedicalCardFaq("Branson"),
    {
      question: "Can I buy cannabis as a tourist visiting Branson?",
      answer:
        "Yes. Branson's dispensaries welcome out-of-state visitors with valid photo ID and are 21 or older. Non-residents can purchase up to 3 ounces of flower (or equivalent) per transaction. The purchase limits, tax structure, and rules apply equally to tourists and residents. Remember to consume only in private spaces where permitted by your accommodation.",
    },
    statewideOnlineOrderFaq("Branson"),
  ],

  relatedCities: relatedCities("branson"),
};
