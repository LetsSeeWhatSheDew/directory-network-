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
  city: "Springfield",
  state: "Missouri",
  slug: "springfield",

  heroIntro:
    "Springfield is Southwest Missouri's cannabis hub with approximately 15 licensed dispensaries serving the metro area and surrounding regions. As the largest city in the Ozark region, Springfield attracts both local consumers and visitors from nearby rural areas. The market reflects strong growth and community acceptance, with dispensaries distributed across the city offering competitive pricing and a growing selection of products for recreational and medical patients.",

  stats: [
    { label: "Dispensaries", value: "~15" },
    { label: "Population", value: "~170K" },
    { label: "Rec & Medical", value: "Both available" },
  ],

  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited throughout Springfield and surrounding areas. Private residence consumption is permitted where the property owner consents. Renters should verify their lease, as landlords may restrict or prohibit cannabis use. Cannabis lounges and venues are not yet authorized in Springfield.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],

  firstTimerSteps: firstTimerSteps("Springfield"),

  priceBlurb:
    "Flower typically costs $35–$55 per eighth (3.5g) before tax. Pre-rolls range from $12–$22 each. Edibles start around $15–$20 for a 100mg package. Concentrates fall in the $40–$70 range. Springfield's growing competition and Missouri's lower excise tax structure keep prices competitive, making it an affordable market in the region.",

  faqs: [
    {
      question: "How many dispensaries are in Springfield, Missouri?",
      answer:
        "Springfield and the greater metro area are home to approximately 15 licensed dispensaries as of 2026. Both recreational and medical retailers operate throughout the city and suburbs, serving Southwest Missouri and the broader Ozark region. Springfield's market continues to grow as consumer demand increases.",
    },
    statewideOutOfStateFaq("Springfield"),
    statewideHoursFaq("Springfield"),
    statewideMedicalCardFaq("Springfield"),
    {
      question: "What's the tax rate on cannabis in Springfield?",
      answer:
        "Recreational cannabis is subject to Missouri's 6% state excise tax plus Springfield's local sales tax. The combined effective tax rate is significantly lower than Illinois and neighboring states, making Springfield an accessible market for price-conscious consumers in the region.",
    },
    statewideOnlineOrderFaq("Springfield"),
  ],

  relatedCities: relatedCities("springfield"),
};
