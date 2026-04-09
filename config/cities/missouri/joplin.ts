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
  city: "Joplin",
  state: "Missouri",
  slug: "joplin",

  heroIntro:
    "Joplin is a southwest Missouri gateway city with 8 licensed dispensaries positioned strategically near the Kansas and Oklahoma borders. The city has rebuilt vibrantly since 2011's devastating tornado, and its cannabis market reflects strong regional demand from cross-border shoppers seeking lower prices than neighboring states. Joplin's location makes it a retail hub for the tri-state region, with competitive pricing and solid product availability.",

  stats: [
    { label: "Dispensaries", value: "~8" },
    { label: "Population", value: "~52K" },
    { label: "Rec & Medical", value: "Both available" },
  ],

  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in Joplin. Use is restricted to private residences with owner consent. Landlords retain rights to restrict cannabis in rental properties. As a recovering community, Joplin maintains substance-use restrictions in certain areas. Cannabis lounges are not currently available.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],

  firstTimerSteps: firstTimerSteps("Joplin"),

  priceBlurb:
    "Flower typically costs $30–$50 per eighth (3.5g) before tax, reflecting Joplin's competitive cross-border pricing. Pre-rolls range from $10–$20 each. Edibles start around $12 for a 100mg package. Concentrates fall in the $35–$65 range. Joplin's tri-state location and cross-border traffic keep pricing aggressively competitive, making it one of the Midwest's most affordable cannabis markets.",

  faqs: [
    {
      question: "How many dispensaries are in Joplin, Missouri?",
      answer:
        "Joplin is home to approximately 8 licensed dispensaries as of 2026. Both recreational and medical retailers operate throughout the city, strategically positioned to serve local residents and cross-border shoppers from Oklahoma and Kansas seeking Missouri's lower prices and greater selection.",
    },
    statewideOutOfStateFaq("Joplin"),
    statewideHoursFaq("Joplin"),
    statewideMedicalCardFaq("Joplin"),
    {
      question: "What's the tax rate on cannabis in Joplin?",
      answer:
        "Recreational cannabis is subject to Missouri's 6% state excise tax plus Joplin's local sales tax. Joplin's combined tax rate is significantly lower than Kansas and Oklahoma, making the city a major destination for cross-border cannabis shoppers seeking better prices and product availability than in neighboring states.",
    },
    statewideOnlineOrderFaq("Joplin"),
  ],

  relatedCities: relatedCities("joplin"),
};
