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
  city: "Lee's Summit",
  state: "Missouri",
  slug: "lees-summit",

  heroIntro:
    "Lee's Summit is an affluent Kansas City suburb with 3–4 licensed dispensaries serving an upscale residential community. Located in Jackson County's southeast quadrant, Lee's Summit attracts professional families and retirees seeking quality cannabis options in a well-maintained retail environment. The market emphasizes premium products and customer service, reflecting the community's demographics and expectations.",

  stats: [
    { label: "Dispensaries", value: "3–4" },
    { label: "Population", value: "~100K" },
    { label: "Rec & Medical", value: "Both available" },
  ],

  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited throughout Lee's Summit and the surrounding area. Use is restricted to private residences with property owner permission. This affluent suburb maintains strict enforcement of consumption restrictions. Cannabis lounges and social consumption venues are not available.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],

  firstTimerSteps: firstTimerSteps("Lee's Summit"),

  priceBlurb:
    "Flower typically ranges from $40–$65 per eighth (3.5g) before tax, reflecting premium product selection and dispensary positioning. Pre-rolls cost $15–$25 each. Edibles start around $18 for a 100mg package. Concentrates range from $50–$80. Lee's Summit's affluent market supports higher-end retail pricing compared to urban areas.",

  faqs: [
    {
      question: "How many dispensaries are in Lee's Summit, Missouri?",
      answer:
        "Lee's Summit is home to 3–4 licensed dispensaries as of 2026. Both recreational and medical retailers operate in this affluent suburb, offering premium product selection and customer service. Dispensaries cater to the community's higher-income demographics and quality expectations.",
    },
    statewideOutOfStateFaq("Lee's Summit"),
    statewideHoursFaq("Lee's Summit"),
    statewideMedicalCardFaq("Lee's Summit"),
    {
      question: "What's the tax rate on cannabis in Lee's Summit?",
      answer:
        "Recreational cannabis is subject to Missouri's 6% state excise tax plus Lee's Summit's local sales tax. While tax rates are consistent across the region, Lee's Summit's retail pricing reflects premium positioning and higher-income consumer preferences in this affluent Kansas City suburb.",
    },
    statewideOnlineOrderFaq("Lee's Summit"),
  ],

  relatedCities: relatedCities("lees-summit"),
};
