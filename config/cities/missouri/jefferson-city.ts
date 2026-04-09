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
  city: "Jefferson City",
  state: "Missouri",
  slug: "jefferson-city",

  heroIntro:
    "Jefferson City, Missouri's state capital, features 4–5 licensed dispensaries serving government workers, residents, and the Capitol campus community. Situated along the Missouri River in the heart of central Missouri, Jefferson City's cannabis market reflects the city's civic character and government presence. Dispensaries operate with professional standards befitting the capital, offering reliable service and competitive products.",

  stats: [
    { label: "Dispensaries", value: "4–5" },
    { label: "Population", value: "~43K" },
    { label: "Rec & Medical", value: "Both available" },
  ],

  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in Jefferson City. Private residence use is permitted with property owner consent. Capitol grounds and government buildings maintain strict no-cannabis policies. Landlords may restrict cannabis in rentals. Cannabis lounges are not currently available in the capital.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],

  firstTimerSteps: firstTimerSteps("Jefferson City"),

  priceBlurb:
    "Flower typically ranges from $35–$55 per eighth (3.5g) before tax. Pre-rolls cost $12–$22 each. Edibles start around $15 for a 100mg package. Concentrates fall in the $40–$70 range. Jefferson City's market reflects moderate competition and Missouri's low excise tax structure, keeping prices competitive and accessible for residents and visitors.",

  faqs: [
    {
      question: "How many dispensaries are in Jefferson City, Missouri?",
      answer:
        "Jefferson City is home to 4–5 licensed dispensaries as of 2026. Both recreational and medical retailers operate throughout the capital, serving state employees, residents, and visitors to Missouri's government center. The market reflects professional standards appropriate to the state capital.",
    },
    statewideOutOfStateFaq("Jefferson City"),
    statewideHoursFaq("Jefferson City"),
    statewideMedicalCardFaq("Jefferson City"),
    {
      question: "What's the tax rate on cannabis in Jefferson City?",
      answer:
        "Recreational cannabis is subject to Missouri's 6% state excise tax plus Jefferson City's local sales tax. The combined effective rate remains among the lowest in the Midwest, making the capital an affordable option for state employees and residents seeking quality cannabis options.",
    },
    statewideOnlineOrderFaq("Jefferson City"),
  ],

  relatedCities: relatedCities("jefferson-city"),
};
