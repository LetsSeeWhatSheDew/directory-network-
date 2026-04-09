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
  city: "Columbia",
  state: "Missouri",
  slug: "columbia",

  heroIntro:
    "Columbia, home to the University of Missouri, is a college town with approximately 8 licensed dispensaries serving a young, educated consumer base. The city's Mizzou presence and liberal community culture have created a welcoming cannabis retail environment. Columbia offers solid product selection, knowledgeable staff, and a vibrant market that caters to both students and long-term residents seeking quality cannabis options.",

  stats: [
    { label: "Dispensaries", value: "~8" },
    { label: "Population", value: "~125K" },
    { label: "Rec & Medical", value: "Both available" },
  ],

  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in Columbia, including on university property and in public spaces. Private residence use is permitted with property owner consent. Student housing policies may impose stricter restrictions, so verify your lease or housing agreement. Cannabis lounges are not yet available in Columbia.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],

  firstTimerSteps: firstTimerSteps("Columbia"),

  priceBlurb:
    "Flower typically ranges from $35–$55 per eighth (3.5g) before tax. Pre-rolls cost $12–$20 each. Edibles start around $15 for a 100mg package. Concentrates range from $40–$70. Columbia's college-town market remains competitive, with many dispensaries offering student discounts and loyalty programs that help offset costs.",

  faqs: [
    {
      question: "How many dispensaries are in Columbia, Missouri?",
      answer:
        "Columbia is home to approximately 8 licensed dispensaries as of 2026. Both recreational and medical retailers operate throughout the city, with convenient locations near the Mizzou campus and downtown areas. The college-town market is well-established and continues to grow.",
    },
    statewideOutOfStateFaq("Columbia"),
    statewideHoursFaq("Columbia"),
    statewideMedicalCardFaq("Columbia"),
    {
      question: "What's the tax rate on cannabis in Columbia?",
      answer:
        "Recreational cannabis is subject to Missouri's 6% state excise tax plus Columbia's local sales tax. The total effective tax rate remains lower than most surrounding states, keeping Columbia's market accessible for budget-minded consumers, especially students with limited income.",
    },
    statewideOnlineOrderFaq("Columbia"),
  ],

  relatedCities: relatedCities("columbia"),
};
